import { NextRequest, NextResponse } from 'next/server'
import PQueue from 'p-queue'

export const runtime = 'nodejs'
export const maxDuration = 300
export const dynamic = 'force-dynamic'

const DEFAULT_LT_URL = 'https://libretranslate.com'
const RATE_LIMIT_DELAY = 1500 // 1.5 seconds between requests
const MAX_CONCURRENT = 1 // Process translations one at a time
const MAX_RETRIES = 3

// Create a persistent queue to handle rate limiting
const translationQueue = new PQueue({
  concurrency: MAX_CONCURRENT,
  interval: RATE_LIMIT_DELAY,
  intervalCap: 1
})

interface TranslationResponse {
  translatedText: string
}

async function translateText(
  text: string,
  target: string,
  baseUrl: string,
  retryCount = 0
): Promise<string> {
  try {
    const res = await fetch(`${baseUrl}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        source: 'auto',
        target,
        format: 'text'
      })
    })

    if (res.status === 429 && retryCount < MAX_RETRIES) {
      // Rate limited - wait longer and retry
      const waitTime = (retryCount + 1) * 3000
      console.log(`Rate limited, waiting ${waitTime}ms before retry ${retryCount + 1}/${MAX_RETRIES}`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
      return translateText(text, target, baseUrl, retryCount + 1)
    }

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`LibreTranslate error ${res.status}: ${errorText}`)
    }

    const data = await res.json() as TranslationResponse
    return data.translatedText
  } catch (error: any) {
    if (retryCount < MAX_RETRIES && error.message.includes('fetch')) {
      // Network error - retry
      const waitTime = (retryCount + 1) * 2000
      console.log(`Network error, retrying in ${waitTime}ms...`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
      return translateText(text, target, baseUrl, retryCount + 1)
    }
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const { subtitles, targetLanguage } = await request.json()

    if (!subtitles || !targetLanguage) {
      return NextResponse.json(
        { error: 'Subtitles and target language are required' },
        { status: 400 }
      )
    }

    const baseUrl = process.env.LIBRETRANSLATE_URL || DEFAULT_LT_URL

    console.log(`Translating ${subtitles.length} segments to ${targetLanguage}...`)

    // Use queue to throttle requests and avoid rate limits
    const translatedSegments = await Promise.all(
      subtitles.map(async (segment: any) => {
        const translatedText = await translationQueue.add(() =>
          translateText(segment.text, targetLanguage, baseUrl)
        )
        return {
          ...segment,
          text: translatedText
        }
      })
    )

    console.log('Translation completed successfully')

    return NextResponse.json({ translatedSegments })
  } catch (error: any) {
    console.error('Error translating subtitles:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to translate subtitles' },
      { status: 500 }
    )
  }
}

/* 
 * PRODUCTION IMPLEMENTATION GUIDE:
 * 
 * To implement real translation:
 * 
 * 1. Using OpenAI GPT-4:
 * 
 * import { OpenAI } from 'openai'
 * 
 * const openai = new OpenAI({
 *   apiKey: process.env.OPENAI_API_KEY
 * })
 * 
 * const translatedSegments = await Promise.all(
 *   subtitles.map(async (segment) => {
 *     const completion = await openai.chat.completions.create({
 *       model: 'gpt-4',
 *       messages: [
 *         {
 *           role: 'system',
 *           content: `Translate the following text to ${targetLanguage}. Preserve timing and formatting.`
 *         },
 *         {
 *           role: 'user',
 *           content: segment.text
 *         }
 *       ]
 *     })
 *     
 *     return {
 *       ...segment,
 *       text: completion.choices[0].message.content
 *     }
 *   })
 * )
 * 
 * 2. Using Google Translate API:
 * 
 * import { Translate } from '@google-cloud/translate'
 * 
 * const translate = new Translate({
 *   key: process.env.GOOGLE_TRANSLATE_API_KEY
 * })
 * 
 * const texts = subtitles.map(s => s.text)
 * const [translations] = await translate.translate(texts, targetLanguage)
 * 
 * const translatedSegments = subtitles.map((segment, i) => ({
 *   ...segment,
 *   text: translations[i]
 * }))
 */
