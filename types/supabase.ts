export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      documents: {
        Row: {
          id: string
          created_at: string
          user_id: string
          title: string
          content: string
          status: 'pending' | 'analyzed' | 'reviewed'
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          title: string
          content: string
          status?: 'pending' | 'analyzed' | 'reviewed'
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          title?: string
          content?: string
          status?: 'pending' | 'analyzed' | 'reviewed'
        }
      }
      analysis: {
        Row: {
          id: string
          created_at: string
          document_id: string
          user_id: string
          analysis: Json
          status: 'pending' | 'completed' | 'failed'
        }
        Insert: {
          id?: string
          created_at?: string
          document_id: string
          user_id: string
          analysis: Json
          status?: 'pending' | 'completed' | 'failed'
        }
        Update: {
          id?: string
          created_at?: string
          document_id?: string
          user_id?: string
          analysis?: Json
          status?: 'pending' | 'completed' | 'failed'
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 