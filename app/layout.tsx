import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Alpha Scanner | Trading Signal Dashboard',
  description: 'Multi-Asset Trading Opportunity Scanner — Real-time signals for Gold, Silver, Bitcoin and more.',
  keywords: ['trading', 'signals', 'forex', 'crypto', 'gold', 'scanner'],
  authors: [{ name: 'Alpha Scanner' }],
  openGraph: {
    title: 'Alpha Scanner | Trading Signal Dashboard',
    description: 'Multi-Asset Trading Opportunity Scanner',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-background text-white antialiased">{children}</body>
    </html>
  )
}
