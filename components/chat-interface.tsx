'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import { Message } from '@/types/chat'
import { Send, Bot, User } from 'lucide-react'

interface ChatInterfaceProps {
  documentId: string
  analysisText: string
}

export default function ChatInterface({ documentId, analysisText }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => { scrollToBottom() }, [messages])

  const saveChat = useCallback((updatedMessages: Message[]) => {
    const storedChats = localStorage.getItem('chats')
    const chats = storedChats ? JSON.parse(storedChats) : {}
    chats[documentId] = {
      id: documentId,
      messages: updatedMessages,
      createdAt: new Date().toISOString(),
    }
    localStorage.setItem('chats', JSON.stringify(chats))
  }, [documentId])

  useEffect(() => {
    const storedChats = localStorage.getItem('chats')
    const chats = storedChats ? JSON.parse(storedChats) : {}
    const chat = chats[documentId]
    if (chat?.messages) {
      setMessages(chat.messages)
    } else {
      setMessages([])
      saveChat([])
    }
  }, [documentId, saveChat])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: 'user', content: input }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages, analysisText, documentId }),
      })

      if (!response.ok) throw new Error('Failed to get response')

      const data = await response.json()
      const assistantMessage: Message = { role: 'assistant', content: data.content }
      const finalMessages = [...updatedMessages, assistantMessage]
      setMessages(finalMessages)
      saveChat(finalMessages)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  return (
    <div className="flex h-full flex-col bg-md-surface">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-3 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-md-full bg-md-primary-container">
              <Bot className="h-7 w-7 text-md-primary" />
            </div>
            <div>
              <p className="text-title-sm text-md-on-surface">Ask about this document</p>
              <p className="mt-1 text-body-sm text-md-on-surface-variant">
                Conversations are saved in your device
              </p>
            </div>
            {/* Starter prompts */}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {[
                'Summarize the key terms',
                'What are the highest risks?',
                'Explain the termination clause',
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => {
                    setInput(prompt)
                    inputRef.current?.focus()
                  }}
                  className="md-chip text-label-sm"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex items-end gap-2 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar */}
            <div
              className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${
                message.role === 'user'
                  ? 'bg-md-primary'
                  : 'bg-md-surface-variant'
              }`}
            >
              {message.role === 'user' ? (
                <User className="h-4 w-4 text-md-on-primary" />
              ) : (
                <Bot className="h-4 w-4 text-md-on-surface-variant" />
              )}
            </div>

            {/* Bubble */}
            <div
              className={[
                'max-w-[80%] rounded-md-lg px-4 py-3',
                message.role === 'user'
                  ? 'rounded-br-md-xs bg-md-primary text-md-on-primary'
                  : 'rounded-bl-md-xs bg-md-surface-variant text-md-on-surface',
              ].join(' ')}
            >
              <div className="prose prose-sm max-w-none [&_p]:my-0 [&_p+p]:mt-2">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex items-end gap-2">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-md-surface-variant">
              <Bot className="h-4 w-4 text-md-on-surface-variant" />
            </div>
            <div className="rounded-md-lg rounded-bl-md-xs bg-md-surface-variant px-4 py-3">
              <div className="flex gap-1.5 items-center h-4">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-2 w-2 rounded-full bg-md-on-surface-variant animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-md-outline-variant p-4">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about this document…"
            disabled={isLoading}
            aria-label="Chat message"
            className={[
              'flex-1 rounded-md-full px-5 py-2.5',
              'bg-md-surface-variant text-md-on-surface placeholder:text-md-on-surface-variant',
              'border border-transparent focus:border-md-primary focus:outline-none',
              'text-body-md transition-colors duration-short4',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            ].join(' ')}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            aria-label="Send message"
            className="md-btn-filled flex h-10 w-10 items-center justify-center rounded-md-full p-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  )
}
