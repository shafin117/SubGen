'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { FiVideo, FiDownload, FiGlobe, FiPlay, FiCopy, FiCheck } from 'react-icons/fi'
import { RiSparklingFill } from 'react-icons/ri'

export default function Home() {
  const [videoUrl, setVideoUrl] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [subtitles, setSubtitles] = useState<any>(null)
  const [targetLanguage, setTargetLanguage] = useState('en')
  const [currentStep, setCurrentStep] = useState<'input' | 'processing' | 'result'>('input')
  const [errorMessage, setErrorMessage] = useState('')

  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleGenerate = async () => {
    if (!videoUrl) return
    
    if (!isValidUrl(videoUrl)) {
      setErrorMessage('Please enter a valid URL')
      return
    }
    
    setErrorMessage('')
    setIsProcessing(true)
    setCurrentStep('processing')
    
    try {
      console.log('Sending request to generate subtitles...')
      const response = await fetch('/api/generate-subtitles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl }),
      })
      
      console.log('Response status:', response.status)
      console.log('Response content-type:', response.headers.get('content-type'))
      
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('Non-JSON response received:', text.substring(0, 500))
        throw new Error('Server error. Please check the server logs.')
      }
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate subtitles')
      }
      
      console.log('Subtitles generated:', data.segments?.length, 'segments')
      setSubtitles(data)
      setCurrentStep('result')
    } catch (error: any) {
      console.error('Error generating subtitles:', error)
      setErrorMessage(error.message || 'Failed to generate subtitles')
      setCurrentStep('input')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleTranslate = async () => {
    if (!subtitles) return
    
    setIsProcessing(true)
    
    try {
      const response = await fetch('/api/translate-subtitles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          subtitles: subtitles.segments, 
          targetLanguage 
        }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to translate subtitles')
      }
      
      const data = await response.json()
      setSubtitles({ ...subtitles, segments: data.translatedSegments })
    } catch (error: any) {
      console.error('Error translating subtitles:', error)
      alert(`Translation Error: ${error.message}\n\nThe free API may be rate-limited. Please wait a moment and try again.`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!subtitles) return
    
    const srtContent = generateSRT(subtitles.segments)
    const blob = new Blob([srtContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'subtitles.srt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const generateSRT = (segments: any[]) => {
    return segments.map((segment, index) => {
      const startTime = formatTime(segment.start)
      const endTime = formatTime(segment.end)
      return `${index + 1}\n${startTime} --> ${endTime}\n${segment.text}\n`
    }).join('\n')
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 1000)
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`
  }

  const resetApp = () => {
    setVideoUrl('')
    setSubtitles(null)
    setCurrentStep('input')
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-cyber-purple/30 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyber-blue/30 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyber-pink/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-4">
            <RiSparklingFill className="text-5xl text-cyber-blue mr-3 animate-glow" />
            <h1 className="text-6xl font-bold bg-gradient-to-r from-cyber-blue via-cyber-purple to-cyber-pink bg-clip-text text-transparent">
              SubGen
            </h1>
          </div>
          <p className="text-xl text-gray-300">
            AI-Powered Subtitle Generation & Translation
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Generate subtitles from any video in any language
          </p>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-4xl mx-auto glass rounded-2xl p-8 shadow-2xl"
        >
          {currentStep === 'input' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center">
                  <FiVideo className="mr-2" />
                  Video URL
                </label>
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="Paste YouTube, Vimeo, or any video URL..."
                  className="w-full px-4 py-3 bg-dark-surface/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyber-blue text-white placeholder-gray-500 transition-all"
                />
              </div>

              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-start space-x-3"
                >
                  <div className="text-red-500 mt-0.5">⚠</div>
                  <div className="flex-1 text-sm text-red-200">{errorMessage}</div>
                  <button
                    onClick={() => setErrorMessage('')}
                    className="text-red-400 hover:text-red-200"
                  >
                    ✕
                  </button>
                </motion.div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGenerate}
                disabled={!videoUrl || isProcessing}
                className="w-full py-4 bg-gradient-to-r from-cyber-blue to-cyber-purple rounded-lg font-semibold text-white shadow-lg hover:shadow-cyber-blue/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <FiPlay />
                <span>Generate Subtitles</span>
              </motion.button>

              {/* Features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                {[
                  { icon: FiVideo, title: 'Any Platform', desc: 'YouTube, Vimeo, and more' },
                  { icon: FiGlobe, title: 'Multi-Language', desc: 'Detect and translate' },
                  { icon: FiDownload, title: 'SRT Export', desc: 'Standard subtitle format' },
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="glass-hover rounded-lg p-4 text-center"
                  >
                    <feature.icon className="text-3xl text-cyber-blue mx-auto mb-2" />
                    <h3 className="font-semibold text-white">{feature.title}</h3>
                    <p className="text-sm text-gray-400">{feature.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 'processing' && (
            <div className="text-center py-12">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-20 h-20 mx-auto mb-6 border-4 border-cyber-blue border-t-transparent rounded-full"
              />
              <h2 className="text-2xl font-semibold text-white mb-2">Processing Video</h2>
              <p className="text-gray-400">Extracting audio and generating subtitles...</p>
            </div>
          )}

          {currentStep === 'result' && subtitles && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-white flex items-center">
                  <FiCheck className="text-green-500 mr-2" />
                  Subtitles Generated
                </h2>
                <button
                  onClick={resetApp}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  New Video
                </button>
              </div>

              {/* Translation controls */}
              <div className="glass rounded-lg p-4 flex items-center space-x-4">
                <FiGlobe className="text-cyber-blue text-2xl" />
                <select
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                  className="flex-1 px-4 py-2 bg-dark-surface border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyber-blue"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="it">Italian</option>
                  <option value="pt">Portuguese</option>
                  <option value="ru">Russian</option>
                  <option value="ja">Japanese</option>
                  <option value="ko">Korean</option>
                  <option value="zh">Chinese</option>
                </select>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleTranslate}
                  disabled={isProcessing}
                  className="px-6 py-2 bg-cyber-purple rounded-lg text-white font-medium hover:bg-cyber-purple/80 transition-colors disabled:opacity-50"
                >
                  Translate
                </motion.button>
              </div>

              {/* Subtitle preview */}
              <div className="glass rounded-lg p-4 max-h-96 overflow-y-auto">
                <h3 className="text-lg font-semibold text-white mb-4">Preview</h3>
                <div className="space-y-3">
                  {subtitles.segments?.slice(0, 10).map((segment: any, index: number) => (
                    <div key={index} className="bg-dark-surface/50 rounded p-3">
                      <div className="text-xs text-gray-500 mb-1">
                        {formatTime(segment.start)} → {formatTime(segment.end)}
                      </div>
                      <div className="text-white">{segment.text}</div>
                    </div>
                  ))}
                  {subtitles.segments?.length > 10 && (
                    <p className="text-center text-sm text-gray-500">
                      ... and {subtitles.segments.length - 10} more segments
                    </p>
                  )}
                </div>
              </div>

              {/* Download button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDownload}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg font-semibold text-white shadow-lg hover:shadow-green-500/50 transition-all flex items-center justify-center space-x-2"
              >
                <FiDownload />
                <span>Download SRT File</span>
              </motion.button>
            </div>
          )}
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-12 text-gray-500 text-sm"
        >
          <p>Powered by AI • Supports 100+ languages</p>
        </motion.div>
      </div>
    </main>
  )
}
