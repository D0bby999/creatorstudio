/// <reference path="../tldraw-custom-shapes.d.ts" />
import {
  type TLBaseShape,
  ShapeUtil,
  type RecordProps,
  T,
  HTMLContainer,
  Rectangle2d,
  type Geometry2d,
} from 'tldraw'

export interface ConnectorProps {
  w: number
  h: number
  startX: number
  startY: number
  endX: number
  endY: number
  style: string
  stroke: string
  strokeWidth: number
  showArrow: boolean
}

export type ConnectorShape = TLBaseShape<'connector', ConnectorProps>

export class ConnectorShapeUtil extends ShapeUtil<ConnectorShape> {
  static override type = 'connector' as const

  static override props: RecordProps<ConnectorShape> = {
    w: T.number,
    h: T.number,
    startX: T.number,
    startY: T.number,
    endX: T.number,
    endY: T.number,
    style: T.string,
    stroke: T.string,
    strokeWidth: T.number,
    showArrow: T.boolean,
  }

  getDefaultProps(): ConnectorShape['props'] {
    return {
      w: 200,
      h: 100,
      startX: 0,
      startY: 50,
      endX: 200,
      endY: 50,
      style: 'solid',
      stroke: '#333333',
      strokeWidth: 2,
      showArrow: true,
    }
  }

  override canResize() { return true }
  override isAspectRatioLocked() { return false }

  getGeometry(shape: ConnectorShape): Geometry2d {
    return new Rectangle2d({ width: shape.props.w, height: shape.props.h, isFilled: false })
  }

  component(shape: ConnectorShape) {
    const { startX, startY, endX, endY, style, stroke, strokeWidth, showArrow } = shape.props
    const dashArray = style === 'dashed' ? '8,4' : style === 'dotted' ? '2,4' : 'none'
    const markerId = `arrow-${shape.id}`

    return (
      <HTMLContainer style={{ width: '100%', height: '100%', pointerEvents: 'all' }}>
        <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
          {showArrow && (
            <defs>
              <marker
                id={markerId}
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill={stroke} />
              </marker>
            </defs>
          )}
          <line
            x1={startX}
            y1={startY}
            x2={endX}
            y2={endY}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
            markerEnd={showArrow ? `url(#${markerId})` : undefined}
          />
        </svg>
      </HTMLContainer>
    )
  }

  indicator(shape: ConnectorShape) {
    const { startX, startY, endX, endY } = shape.props
    return <line x1={startX} y1={startY} x2={endX} y2={endY} />
  }

  override toSvg(shape: ConnectorShape) {
    const { startX, startY, endX, endY, style, stroke, strokeWidth, showArrow } = shape.props
    const dashArray = style === 'dashed' ? '8,4' : style === 'dotted' ? '2,4' : undefined
    const markerId = `arrow-svg-${shape.id}`

    return (
      <g>
        {showArrow && (
          <defs>
            <marker id={markerId} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill={stroke} />
            </marker>
          </defs>
        )}
        <line
          x1={startX} y1={startY} x2={endX} y2={endY}
          stroke={stroke} strokeWidth={strokeWidth}
          strokeDasharray={dashArray}
          markerEnd={showArrow ? `url(#${markerId})` : undefined}
        />
      </g>
    )
  }
}
