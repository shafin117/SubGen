import { NextRequest, NextResponse } from 'next/server'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegStatic from '@ffmpeg-installer/ffmpeg'
import { spawn } from 'child_process'
import os from 'os'
import path from 'path'
import fs from 'fs/promises'
import SrtParser2 from 'srt-parser-2'

ffmpeg.setFfmpegPath(ffmpegStatic.path)

export const runtime = 'nodejs'
export const maxDuration = 300
export const dynamic = 'force-dynamic'

function toSeconds(time: string): number {
  const [hh, mm, rest] = time.split(':')
  const [ss, ms] = rest.split(',')
  return Number(hh) * 3600 + Number(mm) * 60 + Number(ss) + Number(ms) / 1000
}

async function extractAudio(videoUrl: string, wavOut: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    ffmpeg(videoUrl)
      .noVideo()
      .audioCodec('pcm_s16le')
      .audioChannels(1)
      .audioFrequency(16000)
      .format('wav')
      .on('error', (err) => reject(err))
      .on('end', () => resolve())
      .save(wavOut)
  })
}

async function runWhisper(wavPath: string, srtOut: string): Promise<void> {
  const whisperBin = process.env.WHISPER_BIN
  if (!whisperBin) {
    throw new Error('WHISPER_BIN environment variable not set. Please download whisper.cpp and set the path.')
  }
  
  const outBase = path.join(path.dirname(srtOut), path.basename(srtOut, '.srt'))
  
  return new Promise<void>((resolve, reject) => {
    const args = ['-f', wavPath, '-osrt', '-of', outBase]
    const modelPath = process.env.WHISPER_MODEL
    if (modelPath) {
      args.push('-m', modelPath)
    }
    
    const proc = spawn(whisperBin, args)
    let stderr = ''
    
    proc.stderr.on('data', (d) => (stderr += d.toString()))
    proc.on('error', reject)
    proc.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Whisper failed with code ${code}: ${stderr}`))
      }
      resolve()
    })
  })
}

export async function POST(request: NextRequest) {
  console.log('[API] Generate subtitles request received')
  console.log('[API] Platform:', process.platform)
  
  try {
    const body = await request.json()
    const { videoUrl } = body
    console.log('[API] Video URL:', videoUrl)

    if (!videoUrl) {
      console.log('[API] Error: No video URL provided')
      return NextResponse.json(
        { error: 'Video URL is required' },
        { status: 400 }
      )
    }

    // Check if whisper.cpp is configured
    const whisperBin = process.env.WHISPER_BIN
    console.log('[API] WHISPER_BIN:', whisperBin)
    
    if (!whisperBin) {
      console.log('[API] Error: WHISPER_BIN not set')
      return NextResponse.json(
        { error: 'WHISPER_BIN environment variable not set. Please check your .env file or use Whisper API for cloud deployments.' },
        { status: 500 }
      )
    }

    // Check if running on compatible platform
    if (process.platform !== 'win32' && process.platform !== 'linux' && process.platform !== 'darwin') {
      console.log('[API] Warning: Unsupported platform:', process.platform)
      return NextResponse.json(
        { error: `Platform ${process.platform} not supported. Please use OpenAI Whisper API for serverless deployments.` },
        { status: 500 }
      )
    }

    const tmpDir = os.tmpdir()
    const stamp = Date.now().toString()
    const wavPath = path.join(tmpDir, `subgen_${stamp}.wav`)
    const srtPath = path.join(tmpDir, `subgen_${stamp}.srt`)
    
    console.log('[API] Temp WAV path:', wavPath)
    console.log('[API] Temp SRT path:', srtPath)

    try {
      // Extract audio from video URL
      console.log('[API] Starting audio extraction...')
      await extractAudio(videoUrl, wavPath)
      console.log('[API] Audio extraction complete')

      // Run whisper.cpp to generate SRT
      console.log('[API] Starting whisper transcription...')
      await runWhisper(wavPath, srtPath)
      console.log('[API] Whisper transcription complete')

      // Parse SRT file
      console.log('[API] Reading SRT file...')
      const srtContent = await fs.readFile(srtPath, 'utf8')
      console.log('[API] SRT content length:', srtContent.length)
      
      const parser = new SrtParser2()
      const items = parser.fromSrt(srtContent)
      console.log('[API] Parsed segments:', items.length)

      const segments = items.map((it: any) => ({
        start: toSeconds(it.startTime),
        end: toSeconds(it.endTime),
        text: it.text
      }))

      // Cleanup temp files
      try { await fs.unlink(wavPath) } catch {}
      try { await fs.unlink(srtPath) } catch {}

      console.log('[API] Success! Returning', segments.length, 'segments')
      return NextResponse.json({
        language: 'auto',
        duration: segments.length ? segments[segments.length - 1].end : 0,
        segments
      })
    } catch (error: any) {
      console.error('[API] Processing error:', error.message)
      console.error('[API] Stack:', error.stack)
      
      // Cleanup on error
      try { await fs.unlink(wavPath) } catch {}
      try { await fs.unlink(srtPath) } catch {}
      
      return NextResponse.json(
        { error: `Processing failed: ${error.message}` },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('[API] Request error:', error.message)
    console.error('[API] Stack:', error.stack)
    return NextResponse.json(
      { error: error.message || 'Failed to generate subtitles' },
      { status: 500 }
    )
  }
}

/* 
 * PRODUCTION IMPLEMENTATION GUIDE:
 * 
 * To implement real subtitle generation:
 * 
 * 1. Install dependencies:
 *    npm install @ffmpeg-installer/ffmpeg fluent-ffmpeg openai
 *    
 * 2. Extract audio from video:
 *    - Use yt-dlp to download video/audio
 *    - Use ffmpeg to extract audio track
 *    
 * 3. Transcribe with Whisper:
 *    - Use OpenAI Whisper API
 *    - Or use local Whisper model
 *    
 * Example with OpenAI:
 * 
 * import { OpenAI } from 'openai'
 * 
 * const openai = new OpenAI({
 *   apiKey: process.env.OPENAI_API_KEY
 * })
 * 
 * const transcription = await openai.audio.transcriptions.create({
 *   file: audioFile,
 *   model: 'whisper-1',
 *   response_format: 'verbose_json',
 *   timestamp_granularities: ['segment']
 * })
 * 
 * return transcription.segments
 */
