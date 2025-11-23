import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Talk to Jules',
  description: 'Voice to prompt running in Jules',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
