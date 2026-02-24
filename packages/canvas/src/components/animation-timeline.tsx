/**
 * Animation Timeline
 * Visual timeline editor for animations
 */

import { useState, useEffect } from 'react'
import type { Editor, TLShapeId } from 'tldraw'
import { getAnimatedShapes } from '../lib/animation/animation-metadata-store'
import type { ShapeAnimation } from '../lib/animation/animation-types'

interface AnimationTimelineProps {
  editor: Editor
  onShapeSelect?: (shapeId: TLShapeId) => void
}

interface TimelineItem {
  shapeId: TLShapeId
  shapeName: string
  animation: ShapeAnimation
  color: string
}

const COLORS = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22']

export function AnimationTimeline({ editor, onShapeSelect }: AnimationTimelineProps) {
  const [items, setItems] = useState<TimelineItem[]>([])
  const [maxDuration, setMaxDuration] = useState(5)

  useEffect(() => {
    const updateTimeline = () => {
      const animated = getAnimatedShapes(editor)
      const timelineItems: TimelineItem[] = []
      let max = 5

      for (let i = 0; i < animated.length; i++) {
        const { shapeId, animation } = animated[i]
        const shape = editor.getShape(shapeId)
        if (!shape) continue

        const totalTime = animation.delay + animation.duration
        if (totalTime > max) max = totalTime

        timelineItems.push({
          shapeId,
          shapeName: getShapeName(shape),
          animation,
          color: COLORS[i % COLORS.length],
        })
      }

      setItems(timelineItems)
      setMaxDuration(Math.max(5, Math.ceil(max)))
    }

    updateTimeline()
    const unsubscribe = editor.store.listen(() => {
      updateTimeline()
    })

    return unsubscribe
  }, [editor])

  const handleItemClick = (shapeId: TLShapeId) => {
    editor.select(shapeId)
    onShapeSelect?.(shapeId)
  }

  if (items.length === 0) {
    return (
      <div style={emptyStyle}>
        <div style={{ fontSize: 12, color: '#999' }}>No animations yet</div>
        <div style={{ fontSize: 11, color: '#bbb', marginTop: 4 }}>
          Add animations to shapes to see them here
        </div>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <div style={rulerStyle}>
        {Array.from({ length: Math.ceil(maxDuration) + 1 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${(i / maxDuration) * 100}%`,
              top: 0,
              height: '100%',
              borderLeft: '1px solid #ddd',
              fontSize: 10,
              color: '#999',
              paddingLeft: 4,
            }}
          >
            {i}s
          </div>
        ))}
      </div>

      <div style={tracksStyle}>
        {items.map(({ shapeId, shapeName, animation, color }) => {
          const startPercent = (animation.delay / maxDuration) * 100
          const widthPercent = (animation.duration / maxDuration) * 100

          return (
            <div key={shapeId} style={trackStyle}>
              <div style={trackLabelStyle}>{shapeName}</div>
              <div style={trackBarContainerStyle}>
                <div
                  style={{
                    ...trackBarStyle,
                    left: `${startPercent}%`,
                    width: `${widthPercent}%`,
                    background: color,
                  }}
                  onClick={() => handleItemClick(shapeId)}
                  title={`${animation.effect} (${animation.phase})`}
                >
                  <div style={{ fontSize: 9, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {animation.effect}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div style={footerStyle}>
        Total: {maxDuration.toFixed(1)}s
      </div>
    </div>
  )
}

function getShapeName(shape: any): string {
  if (shape.type === 'text') return 'Text'
  if (shape.type === 'geo') return 'Shape'
  if (shape.type === 'image') return 'Image'
  if (shape.type === 'social-card') return 'Social Card'
  if (shape.type === 'quote-card') return 'Quote'
  if (shape.type === 'carousel-slide') return 'Carousel'
  return shape.type
}

const containerStyle: React.CSSProperties = {
  background: '#fafafa',
  border: '1px solid #e5e5e5',
  borderRadius: 8,
  overflow: 'hidden',
}

const emptyStyle: React.CSSProperties = {
  padding: 40,
  textAlign: 'center',
  background: '#fafafa',
  border: '1px solid #e5e5e5',
  borderRadius: 8,
}

const rulerStyle: React.CSSProperties = {
  position: 'relative',
  height: 24,
  background: '#fff',
  borderBottom: '1px solid #e5e5e5',
}

const tracksStyle: React.CSSProperties = {
  padding: '8px 0',
  maxHeight: 200,
  overflowY: 'auto',
}

const trackStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '4px 8px',
  borderBottom: '1px solid #f0f0f0',
}

const trackLabelStyle: React.CSSProperties = {
  width: 80,
  fontSize: 11,
  fontWeight: 500,
  color: '#666',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  flexShrink: 0,
}

const trackBarContainerStyle: React.CSSProperties = {
  position: 'relative',
  flex: 1,
  height: 24,
}

const trackBarStyle: React.CSSProperties = {
  position: 'absolute',
  height: '100%',
  borderRadius: 4,
  color: '#fff',
  padding: '2px 6px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
}

const footerStyle: React.CSSProperties = {
  padding: '6px 12px',
  fontSize: 11,
  color: '#999',
  background: '#fff',
  borderTop: '1px solid #e5e5e5',
  textAlign: 'right',
}
