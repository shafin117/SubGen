# SubGen - AI Subtitle Generator

A modern web application for generating and translating subtitles from videos using AI.

## Features

- 🎥 Generate subtitles from any video URL (YouTube, Vimeo, etc.)
- 🌐 Multi-language support and translation
- 📝 SRT file export
- ✨ Modern, futuristic UI with glass morphism effects
- ⚡ Fast processing with AI-powered transcription

## Getting Started

### Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## Deployment

### Cloud Platforms (Vercel/Netlify)

⚠️ **Important**: Local whisper.cpp requires a server environment. For serverless deployments:

1. **Option 1**: Use OpenAI Whisper API
   - Add `OPENAI_API_KEY` to environment variables
   - Update API route to use OpenAI instead of local whisper.cpp

2. **Option 2**: Deploy to a VPS/server
   - Install whisper.cpp on the server
   - Set `WHISPER_BIN` environment variable

### Local Server

1. Install whisper.cpp: https://github.com/ggerganov/whisper.cpp
2. Set environment variables in `.env`:
   ```
   WHISPER_BIN=C:\tools\whisper\main.exe
   WHISPER_MODEL=C:\tools\whisper\ggml-base.en.bin
   LIBRETRANSLATE_URL=https://libretranslate.com
   ```
3. Run: `npm run build && npm start`

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: React Icons
- **Language**: TypeScript

## License

MIT
