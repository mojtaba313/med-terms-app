import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '../components/auth-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Medical Terminology Assistant',
  description: 'Your personal assistant for managing medical terminology',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}