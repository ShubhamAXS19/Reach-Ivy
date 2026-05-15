"use client"
import { useState, useRef, useCallback, useEffect } from 'react'
import { sendChat, textToSpeech, syncConversation, getActiveConversation, startNewConversation } from '../api/client'

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

// Debounce helper for auto-save
function useDebounce(callback, delay) {
    const timeoutRef = useRef(null)
    return useCallback((...args) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        timeoutRef.current = setTimeout(() => callback(...args), delay)
    }, [callback, delay])
}

export function useConversation() {
    const [messages, setMessages] = useState([])
    const [userCount, setUserCount] = useState(0)
    const apiHistoryRef = useRef([])
    const [essayStructure, setEssayStructure] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isSpeaking, setIsSpeaking] = useState(false)
    const [error, setError] = useState(null)
    const [hasLoadedFromBackend, setHasLoadedFromBackend] = useState(false)
    const [conversationId, setConversationId] = useState(null)
    const audioRef = useRef(null)
    const objectUrlRef = useRef(null)

    const currentStage = getStageIndex(userCount)

    // Auto-save to backend
    const saveToBackend = useCallback(async () => {
        if (!hasLoadedFromBackend) return
        if (messages.length === 0) return

        try {
            await syncConversation({
                messages: messages.map(m => ({ role: m.role, content: m.content })),
                essay_structure: essayStructure,
                current_stage: currentStage,
                user_message_count: userCount,
            })
            console.log('Auto-saved conversation')
        } catch (err) {
            console.error('Auto-save failed:', err)
        }
    }, [messages, essayStructure, currentStage, userCount, hasLoadedFromBackend])

    const debouncedSave = useDebounce(saveToBackend, 1000)

    useEffect(() => {
        if (hasLoadedFromBackend && messages.length > 0) {
            debouncedSave()
        }
    }, [messages, essayStructure, currentStage, userCount, hasLoadedFromBackend, debouncedSave])

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

        // Count user messages
        const userMessageCount = apiMessages.filter(m => m.role === 'user').length

        try {
            const { message, essay_structure } = await sendChat(apiMessages)
            apiHistoryRef.current = [...apiMessages, { role: 'assistant', content: message }]
            const newMessages = [...displayMessages, { role: 'assistant', content: message }]
            setMessages(newMessages)

            // If essay structure came from API, set it
            if (essay_structure) {
                console.log("🎉 Essay structure received from API!")
                setEssayStructure(essay_structure)
            }

            // If user has answered 10+ questions and no essay structure yet, create one
            if (userMessageCount >= 10 && !essay_structure) {
                console.log("⚠️ 10+ messages but no essay structure - creating default")
                // Create a basic structure based on conversation
                const defaultStructure = {
                    ready: true,
                    hook: { title: "My journey begins", words: 40, notes: "An opening moment that shaped my perspective" },
                    context: { title: "What made me curious", words: 55, notes: "How I discovered what I care about" },
                    challenge: { title: "The problem I want to solve", words: 80, notes: "A challenge that drives my curiosity" },
                    growth: { title: "What I've learned", words: 80, notes: "Skills and insights I've gained" },
                    values: { title: "What matters to me", words: 45, notes: "The values that guide my decisions" },
                    college_fit: { title: "Where I want to grow", words: 50, notes: "What I hope to learn and experience" }
                }
                setEssayStructure(defaultStructure)
                setError("✅ Interview completed! Click 'Generate Report' to see your personalized recommendations.")
            } else if (userMessageCount >= 10 && essay_structure) {
                setError("✅ Interview completed! Click 'Generate Report' to see your personalized recommendations.")
            }

            setIsLoading(false)
            await playTTS(message)
        } catch (err) {
            console.error("API Error:", err)
            setError(err.response?.data?.detail || err.message || 'Something went wrong')
            setIsLoading(false)
        }
    }, [playTTS])

    const sendMessage = useCallback(async (userText) => {
        if (!userText.trim() || isLoading) return

        // If already at 10+ messages and essay structure exists, don't send more
        const currentUserCount = messages.filter(m => m.role === 'user').length
        if (currentUserCount >= 10 && essayStructure) {
            setError("✅ You've completed the interview! Click 'Generate Report' to see your results.")
            return
        }

        stopSpeaking()
        const newUserMsg = { role: 'user', content: userText }
        const newApiHistory = [...apiHistoryRef.current, newUserMsg]
        const newDisplay = [...messages, newUserMsg]
        apiHistoryRef.current = newApiHistory
        setMessages(newDisplay)
        setUserCount(c => c + 1)
        await callAPI(newApiHistory, newDisplay)
    }, [messages, isLoading, essayStructure, callAPI, stopSpeaking])

    const startSession = useCallback(async () => {
        stopSpeaking()
        setMessages([])
        setEssayStructure(null)
        setError(null)
        setUserCount(0)
        apiHistoryRef.current = []
        await callAPI([{ role: 'user', content: 'Start the interview' }], [])
    }, [callAPI, stopSpeaking])

    const loadConversation = useCallback(async () => {
        try {
            const data = await getActiveConversation()
            if (data.has_active === false) {
                setHasLoadedFromBackend(true)
                return false
            }

            if (data.id && data.messages && data.messages.length > 0) {
                const restoredMessages = data.messages.map(m => ({ role: m.role, content: m.content }))
                setMessages(restoredMessages)
                setUserCount(data.user_message_count)
                setEssayStructure(data.essay_structure)
                setConversationId(data.id)
                apiHistoryRef.current = restoredMessages.map(m => ({ role: m.role, content: m.content }))

                // If loaded conversation has essay structure, show completion message
                if (data.essay_structure) {
                    setError("✅ Welcome back! Your essay structure is ready. Click 'Generate Report' to see your recommendations.")
                }

                setHasLoadedFromBackend(true)
                return true
            }
            setHasLoadedFromBackend(true)
            return false
        } catch (err) {
            console.error('Failed to load conversation:', err)
            setHasLoadedFromBackend(true)
            return false
        }
    }, [])

    const resetAndStartFresh = useCallback(async () => {
        await startNewConversation()
        setMessages([])
        setEssayStructure(null)
        setError(null)
        setUserCount(0)
        setConversationId(null)
        apiHistoryRef.current = []
        await startSession()
    }, [startSession])

    return {
        messages,
        essayStructure,
        isLoading,
        isSpeaking,
        error,
        currentStage,
        stages: STAGES,
        sendMessage,
        startSession,
        stopSpeaking,
        loadConversation,
        resetAndStartFresh,
        hasLoaded: hasLoadedFromBackend,
        conversationId,
    }
}