import { useState, useRef, useCallback } from 'react'
import { transcribeAudio } from '../api/client'

/**
 * STT strategy:
 *   1. Try browser Web Speech API (free, no key needed) — Chrome/Edge only
 *   2. If not available, fall back to recording + Whisper via backend
 */
export function useVoiceRecorder({ onTranscript, onError }) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const recognitionRef = useRef(null)
  const finalTranscriptRef = useRef('')

  const hasSpeechRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window

  // ── Browser Web Speech API (free) ──────────────────
  const startBrowserSTT = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SR()
    recognition.continuous = true
    recognition.interimResults = false
    recognition.lang = 'en-US'
    finalTranscriptRef.current = ''

    recognition.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalTranscriptRef.current += e.results[i].transcript + ' '
      }
    }
    recognition.onerror = (e) => {
      onError?.('Speech recognition error: ' + e.error)
      setIsRecording(false)
    }
    recognition.onend = () => {
      const transcript = finalTranscriptRef.current.trim()
      if (transcript) onTranscript(transcript)
      setIsRecording(false)
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsRecording(true)
  }, [onTranscript, onError])

  const stopBrowserSTT = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  // ── MediaRecorder → Whisper fallback ───────────────
  const startWhisper = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setIsProcessing(true)
        try {
          const transcript = await transcribeAudio(blob)
          onTranscript(transcript)
        } catch (err) {
          onError?.(err.message || 'Transcription failed')
        } finally {
          setIsProcessing(false)
        }
      }

      mediaRecorder.start()
      mediaRecorderRef.current = mediaRecorder
      setIsRecording(true)
    } catch (err) {
      onError?.(err.message || 'Microphone access denied')
    }
  }, [onTranscript, onError])

  const stopWhisper = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }, [])

  // ── Public API ──────────────────────────────────────
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      hasSpeechRecognition ? stopBrowserSTT() : stopWhisper()
    } else {
      hasSpeechRecognition ? startBrowserSTT() : startWhisper()
    }
  }, [isRecording, hasSpeechRecognition, startBrowserSTT, stopBrowserSTT, startWhisper, stopWhisper])

  return { isRecording, isProcessing, toggleRecording }
}