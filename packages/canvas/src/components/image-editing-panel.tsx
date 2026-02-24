/**
 * Image Editing Panel
 * Main UI for image filters, adjustments, and effects
 */

import React, { useState, useEffect } from 'react'
import type { Editor, TLShapeId } from 'tldraw'
import type {
  ImageFilters,
  ImageEffects,
  ImageMeta,
} from '../lib/image-filters/image-adjustment-types'
import { DEFAULT_FILTERS } from '../lib/image-filters/image-adjustment-types'
import type { FilterPreset } from '../lib/image-filters/image-adjustment-types'
import { ImageFilterPreviewGrid } from './image-filter-preview-grid'
import { DEFAULT_SHADOW } from '../lib/image-effects/image-shadow-effect'
import { removeBackground } from '../lib/background-remover-client'

interface ImageEditingPanelProps {
  editor: Editor
  shapeId: TLShapeId
  onClose: () => void
}

type TabType = 'filters' | 'adjust' | 'effects'

export function ImageEditingPanel({
  editor,
  shapeId,
  onClose,
}: ImageEditingPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('filters')
  const [isProcessing, setIsProcessing] = useState(false)

  const shape = editor.getShape(shapeId)
  if (!shape || shape.type !== 'enhanced-image') return null

  const meta = (shape.meta || {}) as ImageMeta
  const currentFilters = { ...DEFAULT_FILTERS, ...(meta.imageFilters || {}) }
  const currentEffects = meta.imageEffects || {}
  const currentPreset = meta.presetName || null

  const updateMeta = (updates: Partial<ImageMeta>) => {
    editor.updateShapes([
      {
        id: shapeId,
        type: 'enhanced-image',
        meta: { ...meta, ...updates } as any,
      },
    ])
  }

  const handlePresetSelect = (preset: FilterPreset) => {
    updateMeta({
      imageFilters: { ...DEFAULT_FILTERS, ...preset.filters },
      presetName: preset.name,
    })
  }

  const handleFilterChange = (key: keyof ImageFilters, value: number) => {
    updateMeta({
      imageFilters: { ...currentFilters, [key]: value },
      presetName: undefined,
    })
  }

  const handleEffectToggle = (effectType: keyof ImageEffects) => {
    const newEffects = { ...currentEffects }
    if (newEffects[effectType]) {
      delete newEffects[effectType]
    } else {
      if (effectType === 'shadow') {
        newEffects.shadow = DEFAULT_SHADOW
      } else if (effectType === 'duotone') {
        newEffects.duotone = { darkColor: '#000000', lightColor: '#ffffff' }
      } else if (effectType === 'pixelate') {
        newEffects.pixelate = { blockSize: 8 }
      }
    }
    updateMeta({ imageEffects: newEffects })
  }

  const handleReset = () => {
    updateMeta({
      imageFilters: DEFAULT_FILTERS,
      imageEffects: {},
      presetName: undefined,
    })
  }

  const handleRemoveBackground = async () => {
    const imgShape = shape as any
    if (!imgShape.props?.src) return

    setIsProcessing(true)
    try {
      const resultUrl = await removeBackground(imgShape.props.src)
      editor.updateShapes([
        {
          id: shapeId as TLShapeId,
          type: 'enhanced-image',
          props: { ...imgShape.props, src: resultUrl },
        },
      ])
    } catch (error) {
      console.error('Failed to remove background:', error)
      alert('Failed to remove background. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 8,
        left: 8,
        width: 280,
        maxHeight: 'calc(100vh - 100px)',
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 300,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>
          Image Editor
        </h3>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '18px',
            color: '#6b7280',
          }}
        >
          ×
        </button>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid #e5e7eb',
          padding: '0 12px',
        }}
      >
        {(['filters', 'adjust', 'effects'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '8px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #3b82f6' : 'none',
              color: activeTab === tab ? '#3b82f6' : '#6b7280',
              fontSize: '12px',
              fontWeight: activeTab === tab ? 600 : 400,
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {activeTab === 'filters' && (
          <ImageFilterPreviewGrid
            src={(shape as any).props.src}
            currentPreset={currentPreset}
            onSelectPreset={handlePresetSelect}
          />
        )}

        {activeTab === 'adjust' && (
          <div style={{ padding: '12px' }}>
            {renderSlider('Brightness', 'brightness', 0, 2, 0.01, currentFilters, handleFilterChange)}
            {renderSlider('Contrast', 'contrast', 0, 3, 0.01, currentFilters, handleFilterChange)}
            {renderSlider('Saturation', 'saturation', 0, 3, 0.01, currentFilters, handleFilterChange)}
            {renderSlider('Hue Rotate', 'hueRotate', 0, 360, 1, currentFilters, handleFilterChange)}
            {renderSlider('Temperature', 'temperature', -100, 100, 1, currentFilters, handleFilterChange)}
            {renderSlider('Blur', 'blur', 0, 20, 0.5, currentFilters, handleFilterChange)}
            {renderSlider('Fade', 'fade', 0, 1, 0.01, currentFilters, handleFilterChange)}
          </div>
        )}

        {activeTab === 'effects' && (
          <div style={{ padding: '12px' }}>
            {renderEffectToggle('shadow', 'Drop Shadow', currentEffects, handleEffectToggle)}
            {renderEffectToggle('duotone', 'Duotone', currentEffects, handleEffectToggle)}
            {renderEffectToggle('pixelate', 'Pixelate', currentEffects, handleEffectToggle)}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '12px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          gap: '8px',
        }}
      >
        <button
          type="button"
          onClick={handleRemoveBackground}
          disabled={isProcessing}
          style={{
            flex: 1,
            padding: '8px',
            background: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: isProcessing ? 'wait' : 'pointer',
            fontSize: '12px',
            fontWeight: 500,
            opacity: isProcessing ? 0.6 : 1,
          }}
        >
          {isProcessing ? 'Processing...' : 'Remove BG'}
        </button>
        <button
          type="button"
          onClick={handleReset}
          style={{
            padding: '8px 12px',
            background: '#f3f4f6',
            color: '#374151',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 500,
          }}
        >
          Reset
        </button>
      </div>
    </div>
  )
}

function renderSlider(
  label: string,
  key: keyof ImageFilters,
  min: number,
  max: number,
  step: number,
  filters: ImageFilters,
  onChange: (key: keyof ImageFilters, value: number) => void
) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <label
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '11px',
          fontWeight: 500,
          marginBottom: '4px',
          color: '#374151',
        }}
      >
        <span>{label}</span>
        <span>{filters[key]}</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={filters[key]}
        onChange={(e) => onChange(key, parseFloat(e.target.value))}
        style={{ width: '100%' }}
      />
    </div>
  )
}

function renderEffectToggle(
  key: keyof ImageEffects,
  label: string,
  effects: ImageEffects,
  onToggle: (key: keyof ImageEffects) => void
) {
  const isActive = !!effects[key]
  return (
    <div style={{ marginBottom: '12px' }}>
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          fontSize: '12px',
          fontWeight: 500,
          color: '#374151',
          cursor: 'pointer',
        }}
      >
        <input
          type="checkbox"
          checked={isActive}
          onChange={() => onToggle(key)}
          style={{ marginRight: '8px' }}
        />
        {label}
      </label>
    </div>
  )
}
