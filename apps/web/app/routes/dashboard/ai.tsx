import { useState, useCallback } from 'react'
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

          assistantMessage += chunk
          setMessages(prev => {
            const updated = [...prev]
            updated[updated.length - 1] = {
              role: 'assistant',
              content: assistantMessage,
              agentRole: currentAgent
            }
            return updated
          })
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

  return (
    <div className="flex h-full flex-col bg-background">
      {error && (
        <div className="border-b border-destructive/20 bg-destructive/10 p-4 text-destructive">
          <div className="mb-1 font-semibold">Error</div>
          <div className="text-sm">{error}</div>
          {error.includes('OPENAI_API_KEY') && (
            <div className="mt-2 text-sm">
              To enable AI features, set your OpenAI API key:
              <br />
              <code className="rounded bg-destructive/20 px-1.5 py-0.5 font-mono text-[13px]">
                export OPENAI_API_KEY=your-key-here
              </code>
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-hidden">
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
