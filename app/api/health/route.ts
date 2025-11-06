import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    whisper: {
      configured: !!process.env.WHISPER_BIN,
      path: process.env.WHISPER_BIN || 'not set'
    }
  })
}
