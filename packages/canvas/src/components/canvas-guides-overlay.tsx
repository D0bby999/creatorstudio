import { useState, useEffect, useRef } from 'react'
import type { Editor } from 'tldraw'
import { guideManager, type Guide } from '../lib/ruler-guide/guide-manager'

interface CanvasGuidesOverlayProps {
  editor: Editor
}

const GUIDE_COLOR = '#3b82f6'
const GUIDE_OPACITY = 0.5
const SNAP_THRESHOLD = 8 // pixels

export function CanvasGuidesOverlay({ editor }: CanvasGuidesOverlayProps) {
  const [guides, setGuides] = useState<Guide[]>([])
  const [draggingGuide, setDraggingGuide] = useState<string | null>(null)
  const dragStartRef = useRef<{ x: number; y: number; initialPos: number } | null>(null)

  // Subscribe to guide changes
  useEffect(() => {
    const update = () => setGuides(guideManager.getGuides())
    update()
    return guideManager.subscribe(update)
  }, [])

  const handleMouseDown = (guideId: string, guide: Guide, e: React.MouseEvent) => {
    e.preventDefault()
    setDraggingGuide(guideId)
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialPos: guide.position,
    }
  }

  useEffect(() => {
    if (!draggingGuide || !dragStartRef.current) return

    const guide = guides.find(g => g.id === draggingGuide)
    if (!guide) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return

      const viewport = editor.getViewportPageBounds()
      const camera = editor.getCamera()

      if (guide.orientation === 'horizontal') {
        // Horizontal guide: track Y movement
        const deltaY = e.clientY - dragStartRef.current.y
        const deltaPage = deltaY / camera.z
        const newPos = dragStartRef.current.initialPos + deltaPage

        // Check if dragged to left edge (delete zone)
        if (e.clientX < 30) {
          guideManager.removeGuide(draggingGuide)
        } else {
          guideManager.moveGuide(draggingGuide, newPos)
        }
      } else {
        // Vertical guide: track X movement
        const deltaX = e.clientX - dragStartRef.current.x
        const deltaPage = deltaX / camera.z
        const newPos = dragStartRef.current.initialPos + deltaPage

        // Check if dragged to top edge (delete zone)
        if (e.clientY < 30) {
          guideManager.removeGuide(draggingGuide)
        } else {
          guideManager.moveGuide(draggingGuide, newPos)
        }
      }
    }

    const handleMouseUp = () => {
      setDraggingGuide(null)
      dragStartRef.current = null
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [draggingGuide, guides, editor])

  // Convert page coordinates to screen coordinates
  const pageToScreen = (pageCoord: number, axis: 'x' | 'y'): number => {
    const camera = editor.getCamera()
    const viewport = editor.getViewportPageBounds()
    if (axis === 'x') {
      return (pageCoord - viewport.minX) * camera.z
    } else {
      return (pageCoord - viewport.minY) * camera.z
    }
  }

  return (
    <div style={{ pointerEvents: 'none', position: 'absolute', inset: 0, zIndex: 150 }}>
      {guides.map(guide => {
        if (guide.orientation === 'horizontal') {
          const top = pageToScreen(guide.position, 'y')
          return (
            <div
              key={guide.id}
              onMouseDown={(e) => handleMouseDown(guide.id, guide, e)}
              style={{
                position: 'absolute',
                top: `${top}px`,
                left: 0,
                width: '100%',
                height: 1,
                background: GUIDE_COLOR,
                opacity: GUIDE_OPACITY,
                pointerEvents: 'auto',
                cursor: draggingGuide === guide.id ? 'grabbing' : 'ns-resize',
                padding: '4px 0', // Increase hit area
                marginTop: -4,
              }}
            />
          )
        } else {
          const left = pageToScreen(guide.position, 'x')
          return (
            <div
              key={guide.id}
              onMouseDown={(e) => handleMouseDown(guide.id, guide, e)}
              style={{
                position: 'absolute',
                left: `${left}px`,
                top: 0,
                width: 1,
                height: '100%',
                background: GUIDE_COLOR,
                opacity: GUIDE_OPACITY,
                pointerEvents: 'auto',
                cursor: draggingGuide === guide.id ? 'grabbing' : 'ew-resize',
                padding: '0 4px', // Increase hit area
                marginLeft: -4,
              }}
            />
          )
        }
      })}
    </div>
  )
}
