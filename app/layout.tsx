import { Domine, Inter } from 'next/font/google'
import './globals.css'
import { Database } from '@/types/supabase'
import { SupabaseProvider } from '@/components/providers/supabase-provider'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Synapse - Legal Document Analysis',
  description: 'Upload your contracts and get a risk score',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SupabaseProvider>
          {children}
          <ToastContainer position="bottom-right" />
        </SupabaseProvider>
      </body>
    </html>
  )
}
