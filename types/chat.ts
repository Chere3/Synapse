export type Message = {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export type Chat = {
  id: string
  messages: Message[]
  createdAt: string
} 