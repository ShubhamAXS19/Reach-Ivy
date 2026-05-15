"use client"
import { useState, useEffect } from 'react'

export function useDarkMode() {
    const [darkMode, setDarkMode] = useState(true)

    // Load initial preference from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('darkMode')
        if (saved !== null) {
            const isDark = saved === 'true'
            setDarkMode(isDark)
            applyDarkMode(isDark)
        } else {
            // Check system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
            setDarkMode(prefersDark)
            applyDarkMode(prefersDark)
        }
    }, [])

    const applyDarkMode = (isDark) => {
        const root = document.documentElement
        if (isDark) {
            root.classList.add('dark')
            root.classList.remove('light')
        } else {
            root.classList.add('light')
            root.classList.remove('dark')
        }
    }

    const toggleDarkMode = () => {
        const newValue = !darkMode
        setDarkMode(newValue)
        localStorage.setItem('darkMode', String(newValue))
        applyDarkMode(newValue)
    }

    return { darkMode, toggleDarkMode }
}