"use client"
import { useState, useRef, useCallback } from 'react'
import { transcribeAudio } from '../api/client'

export function useVoiceRecorder({ onTranscript, onError }) {
    const [isRecording, setIsRecording] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [liveTranscript, setLiveTranscript] = useState('')   // ← NEW: live interim text

    const mediaRecorderRef = useRef(null)
    const chunksRef = useRef([])
    const recognitionRef = useRef(null)
    const finalTranscriptRef = useRef('')

    const hasSpeechRecognition = typeof window !== 'undefined' &&
        ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)

    // ── Browser Web Speech API ─────────────────────────────────────────────────
    const startBrowserSTT = useCallback(() => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition
        const recognition = new SR()
        recognition.continuous = true
        recognition.interimResults = true          // ← FIX: was false — now words show live
        recognition.lang = 'en-US'
        recognition.maxAlternatives = 1
        finalTranscriptRef.current = ''
        setLiveTranscript('')

        recognition.onresult = (e) => {
            let interim = ''
            let final = finalTranscriptRef.current

            for (let i = e.resultIndex; i < e.results.length; i++) {
                const text = e.results[i][0].transcript
                if (e.results[i].isFinal) {
                    final += text + ' '
                } else {
                    interim += text
                }
            }

            finalTranscriptRef.current = final
            setLiveTranscript(final + interim)       // ← FIX: show running transcript in UI
        }

        recognition.onerror = (e) => {
            // ← FIX: surface errors to the user instead of silently failing
            const msg =
                e.error === 'not-allowed'
                    ? 'Microphone access denied — please allow microphone in browser settings'
                    : e.error === 'no-speech'
                        ? 'No speech detected — try speaking louder or closer to the mic'
                        : `Speech recognition error: ${e.error}`
            onError?.(msg)
            setIsRecording(false)
            setLiveTranscript('')
        }

        recognition.onend = () => {
            const transcript = finalTranscriptRef.current.trim()
            setLiveTranscript('')
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

    // ── MediaRecorder → Groq Whisper fallback ─────────────────────────────────
    const startWhisper = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

            // ← FIX: detect supported mime type — Safari doesn't support audio/webm
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : MediaRecorder.isTypeSupported('audio/webm')
                    ? 'audio/webm'
                    : MediaRecorder.isTypeSupported('audio/mp4')
                        ? 'audio/mp4'
                        : ''   // let browser choose

            const options = mimeType ? { mimeType } : {}
            const mediaRecorder = new MediaRecorder(stream, options)
            chunksRef.current = []
            setLiveTranscript('Recording… click stop when done')

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data)
            }

            mediaRecorder.onstop = async () => {
                stream.getTracks().forEach((t) => t.stop())
                setLiveTranscript('Transcribing…')
                const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' })
                setIsProcessing(true)
                try {
                    const transcript = await transcribeAudio(blob)
                    onTranscript(transcript)
                } catch (err) {
                    onError?.(err.message || 'Transcription failed — check your GROQ_API_KEY')
                } finally {
                    setIsProcessing(false)
                    setLiveTranscript('')
                }
            }

            mediaRecorder.start()
            mediaRecorderRef.current = mediaRecorder
            setIsRecording(true)
        } catch (err) {
            const msg =
                err.name === 'NotAllowedError'
                    ? 'Microphone access denied — please allow microphone in browser settings'
                    : err.message || 'Microphone access failed'
            onError?.(msg)
        }
    }, [onTranscript, onError])

    const stopWhisper = useCallback(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
        }
    }, [])

    // ── Public API ─────────────────────────────────────────────────────────────
    const toggleRecording = useCallback(() => {
        if (isRecording) {
            hasSpeechRecognition ? stopBrowserSTT() : stopWhisper()
        } else {
            hasSpeechRecognition ? startBrowserSTT() : startWhisper()
        }
    }, [isRecording, hasSpeechRecognition, startBrowserSTT, stopBrowserSTT, startWhisper, stopWhisper])

    return { isRecording, isProcessing, liveTranscript, toggleRecording }
}