import { Domine, DM_Sans } from 'next/font/google'
import './globals.css'
import { SupabaseProvider } from '@/components/providers/supabase-provider'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const domine = Domine({ subsets: ['latin'], display: 'swap', variable: '--font-domine' })
const dmSans = DM_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-dm-sans' })

export const metadata = {
  title: {
    default: 'Synapse — AI Contract Analysis for Legal Professionals',
    template: '%s | Synapse',
  },
  description:
    'Upload any contract and get instant AI-powered risk analysis, clause extraction, and plain-language summaries. Trusted by 2,400+ legal professionals.',
  metadataBase: new URL('https://synapse.legal'),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${domine.variable} ${dmSans.variable}`}>
      <body style={{ fontFamily: 'var(--font-dm-sans, DM Sans, system-ui, sans-serif)' }}>
        <SupabaseProvider>
          {children}
          <ToastContainer position="bottom-right" />
        </SupabaseProvider>
      </body>
    </html>
  )
}
