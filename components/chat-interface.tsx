'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import { Message } from '@/types/chat'

interface ChatInterfaceProps {
  documentId: string
  analysisText: string
}

export default function ChatInterface({ documentId, analysisText }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const saveChat = useCallback((updatedMessages: Message[]) => {
    const storedChats = localStorage.getItem('chats')
    const chats = storedChats ? JSON.parse(storedChats) : {}
    chats[documentId] = {
      id: documentId,
      messages: updatedMessages,
      createdAt: new Date().toISOString()
    }
    localStorage.setItem('chats', JSON.stringify(chats))
  }, [documentId])

  useEffect(() => {
    // Load chat from localStorage or initialize with analysis context
    const loadChat = () => {
      const storedChats = localStorage.getItem('chats')
      const chats = storedChats ? JSON.parse(storedChats) : {}
      const chat = chats[documentId]

      if (chat) {
        setMessages(chat.messages)
      } else {
        // Initialize with analysis context as a system message
        const initialMessages: Message[] = [
          {
            role: 'system',
            content: `You are a legal document analysis assistant. Here is the analysis context: ${analysisText}`
          }
        ]
        setMessages(initialMessages)
        saveChat(initialMessages)
      }
    }

    loadChat()
  }, [documentId, analysisText, saveChat])

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
        body: JSON.stringify({ messages: updatedMessages, documentId })
      })

      if (!response.ok) throw new Error('Failed to get response')

      const data = await response.json()
      const assistantMessage: Message = { role: 'assistant', content: data.content }
      const finalMessages = [...updatedMessages, assistantMessage]
      setMessages(finalMessages)
      saveChat(finalMessages)
    } catch (error) {
      console.error('Error:', error)
      // Optionally show error message to user
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      {messages.filter(m => m.role !== 'system').length === 0 && (
        <p className="p-2 text-center text-xs text-gray-400">Messages are saved in your device</p>
      )}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages
          .filter(m => m.role !== 'system')
          .map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>
                    {message.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="border-t border-gray-100 p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 rounded-lg bg-gray-50 p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-lg bg-orange-500 px-4 py-2 text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  )
} 