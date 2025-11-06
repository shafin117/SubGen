import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: 'SubGen - AI Subtitle Generator & Translator',
  description: 'Generate and translate subtitles from any video using free AI. Support for 100+ languages with local whisper.cpp transcription.',
  keywords: ['subtitle generator', 'AI transcription', 'video subtitles', 'SRT generator', 'free subtitle tool', 'whisper.cpp', 'subtitle translation'],
  authors: [{ name: 'SubGen' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#00f0ff',
  manifest: '/manifest.json',
  openGraph: {
    title: 'SubGen - AI Subtitle Generator',
    description: 'Generate and translate subtitles from any video with AI',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🎬</text></svg>" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
