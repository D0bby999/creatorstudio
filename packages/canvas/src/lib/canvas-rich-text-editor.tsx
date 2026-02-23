/**
 * Rich text editor wrapper for canvas text shapes.
 * Uses contentEditable with execCommand for formatting (B/I/U, alignment).
 * No external rich text library — keeps bundle small.
 */
import { useState, useRef, useCallback, useEffect } from 'react'

export interface RichTextFormatState {
  bold: boolean
  italic: boolean
  underline: boolean
  align: 'left' | 'center' | 'right'
}

interface CanvasRichTextEditorProps {
  text: string
  fontSize: number
  fontFamily: string
  fontWeight: number
  textColor: string
  textAlign: string
  lineHeight: number
  letterSpacing: number
  onChange: (text: string) => void
  onFormatChange?: (format: Partial<RichTextFormatState>) => void
}

export function CanvasRichTextEditor({
  text,
  fontSize,
  fontFamily,
  fontWeight,
  textColor,
  textAlign,
  lineHeight,
  letterSpacing,
  onChange,
  onFormatChange,
}: CanvasRichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [format, setFormat] = useState<RichTextFormatState>({
    bold: fontWeight >= 700,
    italic: false,
    underline: false,
    align: (textAlign as RichTextFormatState['align']) || 'center',
  })

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerText !== text) {
      editorRef.current.innerText = text
    }
  }, [text])

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerText)
    }
  }, [onChange])

  const execFormat = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()

    const newFormat = {
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      align: format.align,
    }
    setFormat(newFormat)
    onFormatChange?.(newFormat)
  }, [format.align, onFormatChange])

  const setAlign = useCallback((align: RichTextFormatState['align']) => {
    setFormat(prev => ({ ...prev, align }))
    onFormatChange?.({ align })
  }, [onFormatChange])

  return (
    <div style={{ width: '100%' }}>
      {/* Formatting toolbar */}
      <div style={toolbarStyle}>
        <FormatBtn active={format.bold} onClick={() => execFormat('bold')} title="Bold">B</FormatBtn>
        <FormatBtn active={format.italic} onClick={() => execFormat('italic')} title="Italic"><em>I</em></FormatBtn>
        <FormatBtn active={format.underline} onClick={() => execFormat('underline')} title="Underline"><u>U</u></FormatBtn>
        <div style={dividerStyle} />
        <FormatBtn active={format.align === 'left'} onClick={() => setAlign('left')} title="Align left">L</FormatBtn>
        <FormatBtn active={format.align === 'center'} onClick={() => setAlign('center')} title="Align center">C</FormatBtn>
        <FormatBtn active={format.align === 'right'} onClick={() => setAlign('right')} title="Align right">R</FormatBtn>
      </div>

      {/* Editable content */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        style={{
          fontSize,
          fontFamily,
          fontWeight,
          color: textColor,
          textAlign: format.align,
          lineHeight,
          letterSpacing,
          outline: 'none',
          minHeight: 24,
          cursor: 'text',
          wordBreak: 'break-word',
        }}
      />
    </div>
  )
}

function FormatBtn({
  children, active, onClick, title,
}: {
  children: React.ReactNode; active: boolean; onClick: () => void; title: string
}) {
  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick() }}
      title={title}
      style={{
        padding: '2px 6px',
        fontSize: 11,
        fontWeight: active ? 700 : 400,
        background: active ? '#e0e0e0' : 'transparent',
        border: 'none',
        borderRadius: 3,
        cursor: 'pointer',
        color: '#333',
        lineHeight: 1.2,
      }}
    >
      {children}
    </button>
  )
}

const toolbarStyle: React.CSSProperties = {
  display: 'flex',
  gap: 2,
  padding: '4px 0',
  marginBottom: 4,
  borderBottom: '1px solid rgba(0,0,0,0.1)',
}

const dividerStyle: React.CSSProperties = {
  width: 1,
  background: 'rgba(0,0,0,0.15)',
  margin: '0 4px',
}
