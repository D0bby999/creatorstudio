import { useState, useCallback, type CSSProperties } from 'react'
import { AiChat } from '@creator-studio/ai/components/ai-chat'
import { type AgentRole } from '@creator-studio/ai/types/ai-types'

export default function AI() {
  const [messages, setMessages] = useState<Array<{ role: string; content: string; agentRole?: string }>>([])
  const [currentAgent, setCurrentAgent] = useState<AgentRole>('researcher')
  const [sessionId] = useState(() => crypto.randomUUID())
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSend = useCallback(async (message: string) => {
    setMessages(prev => [...prev, { role: 'user', content: message }])
    setIsStreaming(true)
    setError(null)

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message, agentRole: currentAgent }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'AI service error')
        setIsStreaming(false)
        return
      }

      // Read streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantMessage = ''

      // Add placeholder for assistant message
      setMessages(prev => [...prev, { role: 'assistant', content: '', agentRole: currentAgent }])

      if (reader) {
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })

          // Parse Vercel AI data stream format - text chunks prefixed with "0:"
          const lines = chunk.split('\n')
          for (const line of lines) {
            if (line.startsWith('0:')) {
              try {
                const text = JSON.parse(line.slice(2))
                assistantMessage += text
                setMessages(prev => {
                  const updated = [...prev]
                  updated[updated.length - 1] = {
                    role: 'assistant',
                    content: assistantMessage,
                    agentRole: currentAgent
                  }
                  return updated
                })
              } catch (e) {
                // Ignore parse errors for incomplete chunks
              }
            }
          }
        }
      }
    } catch (e) {
      setError(`Network error: ${String(e)}`)
    } finally {
      setIsStreaming(false)
    }
  }, [sessionId, currentAgent])

  const handleNewSession = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  const handleChangeAgent = useCallback((role: string) => {
    setCurrentAgent(role as AgentRole)
  }, [])

  const containerStyle: CSSProperties = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#fff',
  }

  const errorBannerStyle: CSSProperties = {
    padding: '16px',
    backgroundColor: '#fef2f2',
    borderBottom: '1px solid #fecaca',
    color: '#991b1b',
  }

  const errorTitleStyle: CSSProperties = {
    fontWeight: 600,
    marginBottom: '4px',
  }

  const errorTextStyle: CSSProperties = {
    fontSize: '14px',
  }

  const codeStyle: CSSProperties = {
    backgroundColor: '#fee2e2',
    padding: '2px 6px',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '13px',
  }

  const chatContainerStyle: CSSProperties = {
    flex: 1,
    overflow: 'hidden',
  }

  return (
    <div style={containerStyle}>
      {error && (
        <div style={errorBannerStyle}>
          <div style={errorTitleStyle}>Error</div>
          <div style={errorTextStyle}>{error}</div>
          {error.includes('OPENAI_API_KEY') && (
            <div style={{ ...errorTextStyle, marginTop: '8px' }}>
              To enable AI features, set your OpenAI API key:
              <br />
              <code style={codeStyle}>export OPENAI_API_KEY=your-key-here</code>
            </div>
          )}
        </div>
      )}

      <div style={chatContainerStyle}>
        <AiChat
          messages={messages}
          onSendMessage={handleSend}
          onChangeAgent={handleChangeAgent}
          currentAgent={currentAgent}
          isStreaming={isStreaming}
          onNewSession={handleNewSession}
        />
      </div>
    </div>
  )
}
