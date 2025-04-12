import { Inter } from 'next/font/google'
import './globals.css'
import { Database } from '@/types/supabase'
import { SupabaseProvider } from '@/components/providers/supabase-provider'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Synapse Legal - Legal Document Analysis',
  description: 'AI-powered legal document analysis platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        
      </body>
    </html>
  )
}
