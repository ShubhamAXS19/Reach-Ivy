"use client"
import { useState, useRef, useCallback } from 'react'
import { sendChat, textToSpeech } from '../api/client'

export const STAGES = [
    'Life experiences',
    'Values & character',
    'Skills & strengths',
    'College fit & goals',
    'Essay structure',
]

function getStageIndex(userMessageCount) {
    if (userMessageCount <= 2) return 0
    if (userMessageCount <= 4) return 1
    if (userMessageCount <= 6) return 2
    if (userMessageCount <= 8) return 3
    return 4
}

function browserSpeak(text) {
    return new Promise((resolve) => {
        window.speechSynthesis.cancel()
        const utt = new SpeechSynthesisUtterance(text.slice(0, 500))
        utt.rate = 1.0
        utt.pitch = 1.05
        const voices = window.speechSynthesis.getVoices()
        const pref = voices.find(v =>
            v.name.includes('Samantha') || v.name.includes('Karen') ||
            (v.lang === 'en-US' && v.localService)
        )
        if (pref) utt.voice = pref
        utt.onend = resolve
        utt.onerror = resolve
        window.speechSynthesis.speak(utt)
    })
}

export function useConversation() {
    const [messages, setMessages] = useState([])
    const [userCount, setUserCount] = useState(0)
    const apiHistoryRef = useRef([])
    const [essayStructure, setEssayStructure] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isSpeaking, setIsSpeaking] = useState(false)
    const [error, setError] = useState(null)
    const audioRef = useRef(null)
    const objectUrlRef = useRef(null)

    const currentStage = getStageIndex(userCount)

    const playTTS = useCallback(async (text) => {
        setIsSpeaking(true)
        try {
            const result = await textToSpeech(text)
            if (result === null) {
                await browserSpeak(text)
            } else {
                if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
                objectUrlRef.current = result
                const audio = new Audio(result)
                audioRef.current = audio
                await new Promise((resolve) => {
                    audio.onended = resolve
                    audio.onerror = resolve
                    audio.play().catch(resolve)
                })
            }
        } catch (err) {
            console.warn('TTS skipped:', err.message)
        } finally {
            setIsSpeaking(false)
        }
    }, [])

    const stopSpeaking = useCallback(() => {
        window.speechSynthesis.cancel()
        if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0 }
        setIsSpeaking(false)
    }, [])

    const callAPI = useCallback(async (apiMessages, displayMessages) => {
        setIsLoading(true)
        setError(null)
        try {
            const { message, essay_structure } = await sendChat(apiMessages)
            apiHistoryRef.current = [...apiMessages, { role: 'assistant', content: message }]
            setMessages([...displayMessages, { role: 'assistant', content: message }])
            if (essay_structure) setEssayStructure(essay_structure)
            setIsLoading(false)
            await playTTS(message)
        } catch (err) {
            setError(err.response?.data?.detail || err.message || 'Something went wrong')
            setIsLoading(false)
        }
    }, [playTTS])

    const startSession = useCallback(async () => {
        stopSpeaking()
        setMessages([])
        setEssayStructure(null)
        setError(null)
        setUserCount(0)
        apiHistoryRef.current = []
        await callAPI([{ role: 'user', content: 'Hello! Please start the interview.' }], [])
    }, [callAPI, stopSpeaking])

    const sendMessage = useCallback(async (userText) => {
        if (!userText.trim() || isLoading) return
        stopSpeaking()
        const newUserMsg = { role: 'user', content: userText }
        const newApiHistory = [...apiHistoryRef.current, newUserMsg]
        const newDisplay = [...messages, newUserMsg]
        apiHistoryRef.current = newApiHistory
        setMessages(newDisplay)
        setUserCount(c => c + 1)
        await callAPI(newApiHistory, newDisplay)
    }, [messages, isLoading, callAPI, stopSpeaking])

    return {
        messages, essayStructure, isLoading, isSpeaking, error,
        currentStage, stages: STAGES, sendMessage, startSession, stopSpeaking,
    }
}