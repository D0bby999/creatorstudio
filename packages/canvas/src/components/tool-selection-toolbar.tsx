/** Left-side toolbar for switching between canvas tools */
import { useCallback, useState } from 'react'
import type { Editor } from 'tldraw'

interface ToolConfig {
  id: string
  label: string
  shortcut: string
  icon: string
  group: 'core' | 'shape' | 'custom'
}

const CORE_TOOLS: ToolConfig[] = [
  { id: 'select', label: 'Select', shortcut: 'V', icon: '\u25B3', group: 'core' },
  { id: 'hand', label: 'Hand', shortcut: 'H', icon: '\u270B', group: 'core' },
  { id: 'eraser', label: 'Eraser', shortcut: 'E', icon: '\u2716', group: 'core' },
  { id: 'laser', label: 'Laser', shortcut: 'K', icon: '\u2022', group: 'core' },
  { id: 'zoom', label: 'Zoom', shortcut: 'Z', icon: '\uD83D\uDD0D', group: 'core' },
]

const SHAPE_TOOLS: ToolConfig[] = [
  { id: 'draw', label: 'Draw', shortcut: 'D', icon: '\u270E', group: 'shape' },
  { id: 'text', label: 'Text', shortcut: 'T', icon: 'T', group: 'shape' },
  { id: 'geo', label: 'Geo', shortcut: 'R', icon: '\u25A1', group: 'shape' },
  { id: 'note', label: 'Note', shortcut: 'N', icon: '\uD83D\uDDCA', group: 'shape' },
  { id: 'arrow', label: 'Arrow', shortcut: 'A', icon: '\u2192', group: 'shape' },
  { id: 'line', label: 'Line', shortcut: 'L', icon: '\u2015', group: 'shape' },
  { id: 'frame', label: 'Frame', shortcut: 'F', icon: '\u25A2', group: 'shape' },
  { id: 'highlight', label: 'Highlight', shortcut: '\u21E7D', icon: '\uD83D\uDD8D', group: 'shape' },
]

const CUSTOM_TOOLS: ToolConfig[] = [
  { id: 'connector', label: 'Connector', shortcut: 'C', icon: '\u2194', group: 'custom' },
  { id: 'crop', label: 'Crop', shortcut: '', icon: '\u2702', group: 'custom' },
]

const ALL_TOOLS = [...CORE_TOOLS, ...SHAPE_TOOLS, ...CUSTOM_TOOLS]

interface ToolSelectionToolbarProps {
  editor: Editor
  activeTool: string
  onToolChange: (toolId: string) => void
}

export function ToolSelectionToolbar({ editor, activeTool, onToolChange }: ToolSelectionToolbarProps) {
  const [collapsed, setCollapsed] = useState(false)

  const handleToolClick = useCallback((toolId: string) => {
    editor.setCurrentTool(toolId)
    onToolChange(toolId)
  }, [editor, onToolChange])

  const visibleTools = collapsed ? CORE_TOOLS : ALL_TOOLS

  return (
    <div style={containerStyle} role="toolbar" aria-label="Canvas tools">
      {visibleTools.map((tool, i) => {
        const isActive = tool.id === activeTool
        const prevGroup = i > 0 ? visibleTools[i - 1].group : tool.group
        const showDivider = tool.group !== prevGroup

        return (
          <div key={tool.id} style={{ display: 'contents' }}>
            {showDivider && <div style={dividerStyle} />}
            <button
              onClick={() => handleToolClick(tool.id)}
              style={buttonStyle(isActive)}
              title={`${tool.label} (${tool.shortcut})`}
              aria-label={`${tool.label} tool`}
              aria-pressed={isActive}
            >
              <span style={{ fontSize: 16 }} aria-hidden="true">{tool.icon}</span>
              <span style={shortcutStyle} aria-hidden="true">{tool.shortcut}</span>
            </button>
          </div>
        )
      })}
      <div style={dividerStyle} />
      <button
        onClick={() => setCollapsed(v => !v)}
        style={buttonStyle(false)}
        title={collapsed ? 'Show all tools' : 'Show fewer tools'}
        aria-label={collapsed ? 'Expand toolbar' : 'Collapse toolbar'}
      >
        <span style={{ fontSize: 12 }} aria-hidden="true">{collapsed ? '\u25BC' : '\u25B2'}</span>
      </button>
    </div>
  )
}

const containerStyle: React.CSSProperties = {
  position: 'absolute',
  left: 8,
  top: '50%',
  transform: 'translateY(-50%)',
  zIndex: 300,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  background: 'var(--color-background, #fff)',
  borderRadius: 8,
  padding: 4,
  boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
  border: '1px solid var(--color-border, #e5e5e5)',
  maxHeight: 'calc(100vh - 120px)',
  overflowY: 'auto',
}

const dividerStyle: React.CSSProperties = {
  height: 1,
  background: 'var(--color-border, #e0e0e0)',
  margin: '2px 4px',
}

function buttonStyle(active: boolean): React.CSSProperties {
  return {
    width: 36,
    height: 36,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    border: 'none',
    cursor: 'pointer',
    background: active ? '#e0e7ff' : 'transparent',
    color: active ? '#3b5bdb' : '#555',
    position: 'relative',
    padding: 0,
  }
}

const shortcutStyle: React.CSSProperties = {
  fontSize: 8,
  fontWeight: 600,
  opacity: 0.5,
  lineHeight: 1,
  marginTop: 1,
}
