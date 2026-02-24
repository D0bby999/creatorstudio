/**
 * Image Filter Preview Grid
 * Grid of thumbnail previews for filter presets
 */

import React from 'react'
import type { FilterPreset } from '../lib/image-filters/image-adjustment-types'
import { FILTER_PRESETS } from '../lib/image-filters/image-filter-presets'
import { buildCssFilterString } from '../lib/image-filters/image-filter-engine'

interface ImageFilterPreviewGridProps {
  src: string
  currentPreset: string | null
  onSelectPreset: (preset: FilterPreset) => void
}

export function ImageFilterPreviewGrid({
  src,
  currentPreset,
  onSelectPreset,
}: ImageFilterPreviewGridProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '8px',
        padding: '8px',
        maxHeight: '400px',
        overflowY: 'auto',
      }}
    >
      {FILTER_PRESETS.map((preset) => {
        const isActive = currentPreset === preset.name
        const filterString = buildCssFilterString(preset.filters)

        return (
          <button
            key={preset.name}
            type="button"
            onClick={() => onSelectPreset(preset)}
            style={{
              padding: '4px',
              border: isActive ? '2px solid #3b82f6' : '1px solid #e5e7eb',
              borderRadius: '4px',
              background: isActive ? '#eff6ff' : '#fff',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textAlign: 'center',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.borderColor = '#3b82f6'
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.borderColor = '#e5e7eb'
              }
            }}
          >
            <div
              style={{
                width: '100%',
                height: '60px',
                overflow: 'hidden',
                borderRadius: '2px',
                marginBottom: '4px',
              }}
            >
              <img
                src={src}
                alt={preset.label}
                draggable={false}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  filter: filterString,
                }}
              />
            </div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? '#3b82f6' : '#374151',
              }}
            >
              {preset.label}
            </div>
          </button>
        )
      })}
    </div>
  )
}
