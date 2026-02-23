/** Left-side toolbar for switching between canvas tools */
import { useCallback } from 'react'
import type { Editor } from 'tldraw'

interface ToolConfig {
  id: string
  label: string
  shortcut: string
  icon: string
}

const TOOLS: ToolConfig[] = [
  { id: 'select', label: 'Select', shortcut: 'V', icon: '\u25B3' },
  { id: 'hand', label: 'Hand', shortcut: 'H', icon: '\u270B' },
  { id: 'eraser', label: 'Eraser', shortcut: 'E', icon: '\u2716' },
  { id: 'laser', label: 'Laser', shortcut: 'K', icon: '\u2022' },
  { id: 'zoom', label: 'Zoom', shortcut: 'Z', icon: '\uD83D\uDD0D' },
  { id: 'connector', label: 'Connector', shortcut: 'C', icon: '\u2194' },
  { id: 'crop', label: 'Crop', shortcut: 'X', icon: '\u2702' },
]

interface ToolSelectionToolbarProps {
  editor: Editor
  activeTool: string
  onToolChange: (toolId: string) => void
}

export function ToolSelectionToolbar({ editor, activeTool, onToolChange }: ToolSelectionToolbarProps) {
  const handleToolClick = useCallback((toolId: string) => {
    editor.setCurrentTool(toolId)
    onToolChange(toolId)
  }, [editor, onToolChange])

  return (
    <div style={containerStyle} role="toolbar" aria-label="Canvas tools">
      {TOOLS.map(tool => {
        const isActive = tool.id === activeTool
        return (
          <button
            key={tool.id}
            onClick={() => handleToolClick(tool.id)}
            style={buttonStyle(isActive)}
            title={`${tool.label} (${tool.shortcut})`}
            aria-label={`${tool.label} tool`}
            aria-pressed={isActive}
          >
            <span style={{ fontSize: 16 }} aria-hidden="true">{tool.icon}</span>
            <span style={shortcutStyle} aria-hidden="true">{tool.shortcut}</span>
          </button>
        )
      })}
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
