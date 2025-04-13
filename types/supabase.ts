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
          file_path: string
          file_url: string
          status: 'pending' | 'analyzed' | 'reviewed'
          file_type: string
          file_size: number
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          title: string
          file_path: string
          file_url: string
          status?: 'pending' | 'analyzed' | 'reviewed'
          file_type: string
          file_size: number
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          title?: string
          file_path?: string
          file_url?: string
          status?: 'pending' | 'analyzed' | 'reviewed'
          file_type?: string
          file_size?: number
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