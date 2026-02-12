import { useState, useRef, useEffect, type CSSProperties, type FormEvent } from 'react'

interface AiChatProps {
  messages: Array<{ role: string; content: string; agentRole?: string }>
  onSendMessage: (message: string) => void
  onChangeAgent: (role: string) => void
  currentAgent: string
  isStreaming: boolean
  onNewSession: () => void
}

const agents = [
  { role: 'researcher', label: 'Researcher', icon: '🔍', description: 'Research trends & insights' },
  { role: 'writer', label: 'Writer', icon: '✍️', description: 'Write social content' },
  { role: 'designer', label: 'Designer', icon: '🎨', description: 'Design suggestions' },
]

export function AiChat({
  messages,
  onSendMessage,
  onChangeAgent,
  currentAgent,
  isStreaming,
  onNewSession,
}: AiChatProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isStreaming) return

    onSendMessage(input)
    setInput('')
  }

  const containerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: '#fff',
  }

  const headerStyle: CSSProperties = {
    borderBottom: '1px solid #e5e7eb',
    padding: '16px',
    backgroundColor: '#fafafa',
  }

  const agentTabsStyle: CSSProperties = {
    display: 'flex',
    gap: '8px',
    marginBottom: '8px',
  }

  const agentTabStyle = (isActive: boolean): CSSProperties => ({
    flex: 1,
    padding: '12px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    backgroundColor: isActive ? '#3b82f6' : '#fff',
    color: isActive ? '#fff' : '#374151',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    textAlign: 'center',
    transition: 'all 0.2s',
  })

  const newSessionButtonStyle: CSSProperties = {
    padding: '8px 16px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    backgroundColor: '#fff',
    color: '#374151',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
  }

  const messagesContainerStyle: CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  }

  const messageBubbleStyle = (isUser: boolean): CSSProperties => ({
    maxWidth: '70%',
    padding: '12px 16px',
    borderRadius: '12px',
    backgroundColor: isUser ? '#3b82f6' : '#f3f4f6',
    color: isUser ? '#fff' : '#1f2937',
    alignSelf: isUser ? 'flex-end' : 'flex-start',
    fontSize: '14px',
    lineHeight: '1.5',
    wordWrap: 'break-word',
  })

  const agentLabelStyle: CSSProperties = {
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '4px',
    fontWeight: 500,
  }

  const inputContainerStyle: CSSProperties = {
    borderTop: '1px solid #e5e7eb',
    padding: '16px',
    backgroundColor: '#fafafa',
  }

  const formStyle: CSSProperties = {
    display: 'flex',
    gap: '8px',
  }

  const inputStyle: CSSProperties = {
    flex: 1,
    padding: '12px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
  }

  const sendButtonStyle: CSSProperties = {
    padding: '12px 24px',
    backgroundColor: isStreaming ? '#9ca3af' : '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: isStreaming ? 'not-allowed' : 'pointer',
  }

  const emptyStateStyle: CSSProperties = {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#9ca3af',
    fontSize: '14px',
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div style={agentTabsStyle}>
          {agents.map(agent => (
            <button
              key={agent.role}
              style={agentTabStyle(currentAgent === agent.role)}
              onClick={() => onChangeAgent(agent.role)}
              disabled={isStreaming}
            >
              <div style={{ fontSize: '20px', marginBottom: '4px' }}>{agent.icon}</div>
              <div style={{ fontWeight: 600 }}>{agent.label}</div>
              <div style={{ fontSize: '11px', marginTop: '2px', opacity: 0.8 }}>
                {agent.description}
              </div>
            </button>
          ))}
        </div>
        <button style={newSessionButtonStyle} onClick={onNewSession}>
          New Session
        </button>
      </div>

      <div style={messagesContainerStyle}>
        {messages.length === 0 ? (
          <div style={emptyStateStyle}>
            Start a conversation with the {currentAgent}
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: message.role === 'user' ? 'flex-end' : 'flex-start' }}>
              {message.role === 'assistant' && message.agentRole && (
                <div style={agentLabelStyle}>
                  {agents.find(a => a.role === message.agentRole)?.label}
                </div>
              )}
              <div style={messageBubbleStyle(message.role === 'user')}>
                {message.content}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={inputContainerStyle}>
        <form onSubmit={handleSubmit} style={formStyle}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask the ${currentAgent}...`}
            disabled={isStreaming}
            style={inputStyle}
          />
          <button type="submit" disabled={isStreaming || !input.trim()} style={sendButtonStyle}>
            {isStreaming ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  )
}
