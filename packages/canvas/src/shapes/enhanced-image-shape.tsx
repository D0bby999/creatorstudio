/// <reference path="../tldraw-custom-shapes.d.ts" />
/**
 * Enhanced Image Shape
 * Image shape with filters, effects, and adjustments
 */

import {
  type TLBaseShape,
  ShapeUtil,
  type RecordProps,
  T,
  HTMLContainer,
  Rectangle2d,
  type Geometry2d,
} from 'tldraw'
import type { ImageMeta } from '../lib/image-filters/image-adjustment-types'
import { buildCssFilterString } from '../lib/image-filters/image-filter-engine'
import { buildImageShadowStyle } from '../lib/image-effects/image-shadow-effect'

export type EnhancedImageShape = TLBaseShape<
  'enhanced-image',
  {
    w: number
    h: number
    src: string
    assetId: string
  }
>

export class EnhancedImageShapeUtil extends ShapeUtil<EnhancedImageShape> {
  static override type = 'enhanced-image' as const

  static override props: RecordProps<EnhancedImageShape> = {
    w: T.number,
    h: T.number,
    src: T.string,
    assetId: T.string,
  }

  getDefaultProps(): EnhancedImageShape['props'] {
    return {
      w: 400,
      h: 300,
      src: '',
      assetId: '',
    }
  }

  override canResize() {
    return true
  }

  getGeometry(shape: EnhancedImageShape): Geometry2d {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    })
  }

  component(shape: EnhancedImageShape) {
    const { w, h, src } = shape.props
    const meta = (shape.meta || {}) as ImageMeta

    // Build filter style
    const filterString = meta.imageFilters
      ? buildCssFilterString(meta.imageFilters)
      : undefined

    // Build shadow style
    const shadowStyle = meta.imageEffects?.shadow
      ? buildImageShadowStyle(meta.imageEffects.shadow)
      : {}

    // Build duotone overlay (simplified CSS approach)
    const duotoneOverlay = meta.imageEffects?.duotone ? (
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: `linear-gradient(135deg, ${meta.imageEffects.duotone.darkColor}, ${meta.imageEffects.duotone.lightColor})`,
          mixBlendMode: 'multiply',
          pointerEvents: 'none',
        }}
      />
    ) : null

    // Pixelate effect (CSS approximation)
    const pixelateStyle = meta.imageEffects?.pixelate
      ? {
          imageRendering: 'pixelated' as const,
          filter: `blur(${Math.max(0, meta.imageEffects.pixelate.blockSize - 2)}px)`,
        }
      : {}

    return (
      <HTMLContainer>
        <div
          style={{
            width: w,
            height: h,
            position: 'relative',
            overflow: 'hidden',
            ...shadowStyle,
          }}
        >
          <img
            src={src}
            alt="Enhanced image"
            draggable={false}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: filterString,
              ...pixelateStyle,
            }}
          />
          {meta.imageEffects?.duotone && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                filter: 'grayscale(1)',
                pointerEvents: 'none',
              }}
            />
          )}
          {duotoneOverlay}
        </div>
      </HTMLContainer>
    )
  }

  indicator(shape: EnhancedImageShape) {
    return <rect width={shape.props.w} height={shape.props.h} />
  }
}
