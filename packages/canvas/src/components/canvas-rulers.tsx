import { useEffect, useRef, useState } from 'react'
import type { Editor } from 'tldraw'
import { calculateTicks } from '../lib/ruler-guide/ruler-calculation'
import { guideManager } from '../lib/ruler-guide/guide-manager'

interface CanvasRulersProps {
  editor: Editor
  onCreateGuide?: (orientation: 'horizontal' | 'vertical', position: number) => void
}

const RULER_SIZE = 24
const TICK_COLOR = '#999'
const MAJOR_TICK_COLOR = '#666'
const TEXT_COLOR = '#555'
const BG_COLOR = '#f5f5f5'

export function CanvasRulers({ editor, onCreateGuide }: CanvasRulersProps) {
  const horizontalRef = useRef<HTMLCanvasElement>(null)
  const verticalRef = useRef<HTMLCanvasElement>(null)
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null)
  const frameRef = useRef<number | undefined>(undefined)

  // Track cursor position in page coordinates
  useEffect(() => {
    const container = editor.getContainer()
    const handlePointerMove = (e: PointerEvent) => {
      const pagePoint = editor.screenToPage({ x: e.clientX, y: e.clientY })
      setCursorPos({ x: pagePoint.x, y: pagePoint.y })
    }
    container.addEventListener('pointermove', handlePointerMove)
    return () => container.removeEventListener('pointermove', handlePointerMove)
  }, [editor])

  // Render rulers on camera changes
  useEffect(() => {
    const render = () => {
      const camera = editor.getCamera()
      const viewport = editor.getViewportPageBounds()

      if (horizontalRef.current && verticalRef.current) {
        renderHorizontalRuler(horizontalRef.current, viewport.minX, viewport.maxX, camera.z, cursorPos?.x)
        renderVerticalRuler(verticalRef.current, viewport.minY, viewport.maxY, camera.z, cursorPos?.y)
      }

      frameRef.current = requestAnimationFrame(render)
    }

    frameRef.current = requestAnimationFrame(render)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [editor, cursorPos])

  // Double-click to create guide
  const handleHorizontalDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const screenX = e.clientX - rect.left
    const pagePoint = editor.screenToPage({ x: screenX, y: 0 })
    guideManager.addGuide('vertical', pagePoint.x)
    onCreateGuide?.('vertical', pagePoint.x)
  }

  const handleVerticalDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const screenY = e.clientY - rect.top
    const pagePoint = editor.screenToPage({ x: 0, y: screenY })
    guideManager.addGuide('horizontal', pagePoint.y)
    onCreateGuide?.('horizontal', pagePoint.y)
  }

  return (
    <>
      {/* Horizontal ruler (top) */}
      <canvas
        ref={horizontalRef}
        width={window.innerWidth}
        height={RULER_SIZE}
        onDoubleClick={handleHorizontalDoubleClick}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: RULER_SIZE,
          zIndex: 200,
          cursor: 'ns-resize',
        }}
      />

      {/* Vertical ruler (left) */}
      <canvas
        ref={verticalRef}
        width={RULER_SIZE}
        height={window.innerHeight}
        onDoubleClick={handleVerticalDoubleClick}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: RULER_SIZE,
          height: '100%',
          zIndex: 200,
          cursor: 'ew-resize',
        }}
      />

      {/* Corner square */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: RULER_SIZE,
          height: RULER_SIZE,
          background: BG_COLOR,
          zIndex: 201,
          borderRight: '1px solid #ddd',
          borderBottom: '1px solid #ddd',
        }}
      />
    </>
  )
}

function renderHorizontalRuler(
  canvas: HTMLCanvasElement,
  viewportStart: number,
  viewportEnd: number,
  zoom: number,
  cursorX?: number,
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const width = canvas.width
  const height = canvas.height

  // Clear and fill background
  ctx.fillStyle = BG_COLOR
  ctx.fillRect(0, 0, width, height)

  // Border
  ctx.strokeStyle = '#ddd'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, height - 0.5)
  ctx.lineTo(width, height - 0.5)
  ctx.stroke()

  const ticks = calculateTicks(viewportStart, viewportEnd, zoom)
  const pixelsPerUnit = zoom

  ticks.forEach(tick => {
    const screenX = (tick.position - viewportStart) * pixelsPerUnit
    if (screenX < 0 || screenX > width) return

    // Draw tick
    ctx.strokeStyle = tick.isMajor ? MAJOR_TICK_COLOR : TICK_COLOR
    ctx.lineWidth = 1
    const tickHeight = tick.isMajor ? 8 : 4
    ctx.beginPath()
    ctx.moveTo(screenX, height - tickHeight)
    ctx.lineTo(screenX, height)
    ctx.stroke()

    // Draw label for major ticks
    if (tick.isMajor && tick.label) {
      ctx.fillStyle = TEXT_COLOR
      ctx.font = '9px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(tick.label, screenX, height - 11)
    }
  })

  // Highlight cursor position
  if (cursorX !== undefined) {
    const cursorScreenX = (cursorX - viewportStart) * pixelsPerUnit
    if (cursorScreenX >= 0 && cursorScreenX <= width) {
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(cursorScreenX, 0)
      ctx.lineTo(cursorScreenX, height)
      ctx.stroke()
    }
  }
}

function renderVerticalRuler(
  canvas: HTMLCanvasElement,
  viewportStart: number,
  viewportEnd: number,
  zoom: number,
  cursorY?: number,
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const width = canvas.width
  const height = canvas.height

  // Clear and fill background
  ctx.fillStyle = BG_COLOR
  ctx.fillRect(0, 0, width, height)

  // Border
  ctx.strokeStyle = '#ddd'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(width - 0.5, 0)
  ctx.lineTo(width - 0.5, height)
  ctx.stroke()

  const ticks = calculateTicks(viewportStart, viewportEnd, zoom)
  const pixelsPerUnit = zoom

  ticks.forEach(tick => {
    const screenY = (tick.position - viewportStart) * pixelsPerUnit
    if (screenY < 0 || screenY > height) return

    // Draw tick
    ctx.strokeStyle = tick.isMajor ? MAJOR_TICK_COLOR : TICK_COLOR
    ctx.lineWidth = 1
    const tickWidth = tick.isMajor ? 8 : 4
    ctx.beginPath()
    ctx.moveTo(width - tickWidth, screenY)
    ctx.lineTo(width, screenY)
    ctx.stroke()

    // Draw label for major ticks (rotated)
    if (tick.isMajor && tick.label) {
      ctx.save()
      ctx.translate(6, screenY)
      ctx.rotate(-Math.PI / 2)
      ctx.fillStyle = TEXT_COLOR
      ctx.font = '9px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(tick.label, 0, 0)
      ctx.restore()
    }
  })

  // Highlight cursor position
  if (cursorY !== undefined) {
    const cursorScreenY = (cursorY - viewportStart) * pixelsPerUnit
    if (cursorScreenY >= 0 && cursorScreenY <= height) {
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, cursorScreenY)
      ctx.lineTo(width, cursorScreenY)
      ctx.stroke()
    }
  }
}
