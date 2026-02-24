/**
 * Animation Panel
 * Effect selector and timing controls for shape animations
 */

import { useState, useEffect } from 'react'
import type { Editor, TLShapeId } from 'tldraw'
import {
  getShapeAnimation,
  setShapeAnimation,
  removeShapeAnimation,
  getAnimatedShapes,
} from '../lib/animation/animation-metadata-store'
import {
  DEFAULT_ANIMATION,
  ANIMATION_EFFECTS,
  EASING_OPTIONS,
  type AnimationEffect,
  type AnimationPhase,
  type EasingFunction,
  type ShapeAnimation,
} from '../lib/animation/animation-types'
import { previewPageAnimations, stopPreview } from '../lib/animation/animation-engine'

interface AnimationPanelProps {
  editor: Editor
  onClose: () => void
}

export function AnimationPanel({ editor, onClose }: AnimationPanelProps) {
  const [selectedIds, setSelectedIds] = useState<TLShapeId[]>([])
  const [animation, setAnimation] = useState<ShapeAnimation>(DEFAULT_ANIMATION)
  const [isPreviewing, setIsPreviewing] = useState(false)

  // Track selection changes
  useEffect(() => {
    const handleSelectionChange = () => {
      const ids = editor.getSelectedShapeIds()
      setSelectedIds(ids)

      if (ids.length === 1) {
        const existing = getShapeAnimation(editor, ids[0])
        setAnimation(existing || DEFAULT_ANIMATION)
      } else {
        setAnimation(DEFAULT_ANIMATION)
      }
    }

    handleSelectionChange()
    const unsubscribe = editor.store.listen(() => {
      handleSelectionChange()
    })

    return unsubscribe
  }, [editor])

  const handleEffectChange = (effect: AnimationEffect) => {
    setAnimation((prev) => ({ ...prev, effect }))
  }

  const handlePhaseChange = (phase: AnimationPhase) => {
    setAnimation((prev) => ({ ...prev, phase }))
  }

  const handleDurationChange = (duration: number) => {
    setAnimation((prev) => ({ ...prev, duration }))
  }

  const handleDelayChange = (delay: number) => {
    setAnimation((prev) => ({ ...prev, delay }))
  }

  const handleEasingChange = (easing: EasingFunction) => {
    setAnimation((prev) => ({ ...prev, easing }))
  }

  const handleApply = () => {
    if (selectedIds.length === 1) {
      setShapeAnimation(editor, selectedIds[0], animation)
    }
  }

  const handleRemove = () => {
    if (selectedIds.length === 1) {
      removeShapeAnimation(editor, selectedIds[0])
      setAnimation(DEFAULT_ANIMATION)
    }
  }

  const handlePreview = () => {
    const animations = getAnimatedShapes(editor)
    if (animations.length === 0) return

    setIsPreviewing(true)
    previewPageAnimations(editor, animations)

    // Auto-stop after max duration
    const maxDuration = Math.max(...animations.map((a) => a.animation.delay + a.animation.duration))
    setTimeout(() => {
      stopPreview()
      setIsPreviewing(false)
    }, maxDuration * 1000 + 100)
  }

  const hasAnimation = selectedIds.length === 1 && getShapeAnimation(editor, selectedIds[0]) !== null

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>Animation</span>
        <button onClick={onClose} style={closeBtnStyle}>
          ×
        </button>
      </div>

      <div style={{ padding: 12 }}>
        {selectedIds.length === 0 && (
          <div style={{ fontSize: 12, color: '#999', textAlign: 'center', padding: 20 }}>
            Select a shape to add animation
          </div>
        )}

        {selectedIds.length > 1 && (
          <div style={{ fontSize: 12, color: '#999', textAlign: 'center', padding: 20 }}>
            Select a single shape to edit animation
          </div>
        )}

        {selectedIds.length === 1 && (
          <>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Effect</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                {ANIMATION_EFFECTS.map((effect) => (
                  <button
                    key={effect.value}
                    onClick={() => handleEffectChange(effect.value)}
                    style={{
                      ...effectBtnStyle,
                      background: animation.effect === effect.value ? '#333' : '#f5f5f5',
                      color: animation.effect === effect.value ? '#fff' : '#333',
                    }}
                    title={effect.label}
                  >
                    <div style={{ fontSize: 18 }}>{effect.icon}</div>
                    <div style={{ fontSize: 10, marginTop: 2 }}>{effect.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Phase</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => handlePhaseChange('entrance')}
                  style={{
                    ...chipStyle,
                    background: animation.phase === 'entrance' ? '#333' : '#f0f0f0',
                    color: animation.phase === 'entrance' ? '#fff' : '#555',
                  }}
                >
                  Entrance
                </button>
                <button
                  onClick={() => handlePhaseChange('exit')}
                  style={{
                    ...chipStyle,
                    background: animation.phase === 'exit' ? '#333' : '#f0f0f0',
                    color: animation.phase === 'exit' ? '#fff' : '#555',
                  }}
                >
                  Exit
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Duration: {animation.duration.toFixed(1)}s</label>
              <input
                type="range"
                min="0.1"
                max="10"
                step="0.1"
                value={animation.duration}
                onChange={(e) => handleDurationChange(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Delay: {animation.delay.toFixed(1)}s</label>
              <input
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={animation.delay}
                onChange={(e) => handleDelayChange(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Easing</label>
              <select
                value={animation.easing}
                onChange={(e) => handleEasingChange(e.target.value as EasingFunction)}
                style={selectStyle}
              >
                {EASING_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 6, marginTop: 16 }}>
              <button onClick={handleApply} style={applyBtnStyle}>
                Apply
              </button>
              {hasAnimation && (
                <button onClick={handleRemove} style={removeBtnStyle}>
                  Remove
                </button>
              )}
            </div>
          </>
        )}

        <div style={{ borderTop: '1px solid #eee', marginTop: 16, paddingTop: 12 }}>
          <button onClick={handlePreview} disabled={isPreviewing} style={previewBtnStyle}>
            {isPreviewing ? 'Playing...' : 'Preview Page Animations'}
          </button>
        </div>
      </div>
    </div>
  )
}

const panelStyle: React.CSSProperties = {
  position: 'absolute',
  top: 48,
  right: 16,
  zIndex: 300,
  width: 280,
  background: '#fff',
  borderRadius: 10,
  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
  border: '1px solid #e5e5e5',
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 12px',
  borderBottom: '1px solid #eee',
}

const closeBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: 18,
  cursor: 'pointer',
  color: '#999',
  padding: '0 4px',
}

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: '#666',
  marginBottom: 6,
  display: 'block',
}

const effectBtnStyle: React.CSSProperties = {
  padding: '10px 8px',
  fontSize: 12,
  fontWeight: 500,
  borderRadius: 6,
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
}

const chipStyle: React.CSSProperties = {
  flex: 1,
  padding: '6px 12px',
  fontSize: 12,
  fontWeight: 500,
  borderRadius: 6,
  border: 'none',
  cursor: 'pointer',
}

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  fontSize: 12,
  border: '1px solid #e5e5e5',
  borderRadius: 6,
}

const applyBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: '8px 12px',
  fontSize: 12,
  fontWeight: 600,
  borderRadius: 6,
  border: 'none',
  background: '#333',
  color: '#fff',
  cursor: 'pointer',
}

const removeBtnStyle: React.CSSProperties = {
  padding: '8px 12px',
  fontSize: 12,
  fontWeight: 500,
  borderRadius: 6,
  border: '1px solid #e5e5e5',
  background: '#fff',
  color: '#e74c3c',
  cursor: 'pointer',
}

const previewBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  fontSize: 12,
  fontWeight: 500,
  borderRadius: 6,
  border: '1px solid #e5e5e5',
  background: '#f5f5f5',
  color: '#333',
  cursor: 'pointer',
}
