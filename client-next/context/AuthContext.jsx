"use client"
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getMe, loginUser, logoutUser, registerUser, tokenStorage } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)  // true while we check existing session
    const router = useRouter()

    // On mount — restore session from localStorage
    useEffect(() => {
        const restore = async () => {
            const token = tokenStorage.getAccess()
            if (!token) { setLoading(false); return }
            try {
                const me = await getMe()
                setUser(me)
            } catch {
                tokenStorage.clear()   // token invalid / expired with no refresh
            } finally {
                setLoading(false)
            }
        }
        restore()
    }, [])

    const login = useCallback(async (credentials) => {
        const data = await loginUser(credentials)   // throws on error
        setUser(data.user)
        router.push('/')
        return data
    }, [router])

    const signup = useCallback(async (credentials) => {
        return registerUser(credentials)   // doesn't log in — needs email verification
    }, [])

    const logout = useCallback(async () => {
        await logoutUser()
        setUser(null)
        router.push('/login')
    }, [router])

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
    return ctx
}