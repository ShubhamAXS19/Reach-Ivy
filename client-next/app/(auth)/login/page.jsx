"use client"
import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '../../../context/AuthContext'

export default function LoginPage() {
    const { login } = useAuth()
    const [form, setForm] = useState({ email: '', password: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            await login(form)
        } catch (err) {
            setError(err.response?.data?.detail || 'Login failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-surface-base flex items-center justify-center px-4">
            <div className="bg-surface-card rounded-3xl border border-border-subtle shadow-2xl p-10 max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="text-4xl mb-3">🍀</div>
                    <h1 className="font-serif text-2xl text-text-primary">Welcome back</h1>
                    <p className="text-text-muted text-sm mt-1">Sign in to continue to HelloIvy</p>
                </div>

                {error && (
                    <div className="mb-5 text-[13px] text-red-400 bg-red-950/40 border border-red-800/40 rounded-xl px-4 py-2.5">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-[12px] text-text-muted mb-1.5 uppercase tracking-wider font-medium">Email</label>
                        <input
                            type="email"
                            value={form.email}
                            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                            required
                            placeholder="you@example.com"
                            className="w-full bg-surface-raised border border-border-subtle rounded-xl px-4 py-2.5 text-[14px] text-text-primary placeholder-text-muted focus:outline-none focus:border-ivy-purple transition-colors"
                        />
                    </div>
                    <div>
                        <div className="flex justify-between mb-1.5">
                            <label className="text-[12px] text-text-muted uppercase tracking-wider font-medium">Password</label>
                            <Link href="/forgot-password" className="text-[12px] text-ivy-purple-dk hover:underline">
                                Forgot password?
                            </Link>
                        </div>
                        <input
                            type="password"
                            value={form.password}
                            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                            required
                            placeholder="••••••••"
                            className="w-full bg-surface-raised border border-border-subtle rounded-xl px-4 py-2.5 text-[14px] text-text-primary placeholder-text-muted focus:outline-none focus:border-ivy-purple transition-colors"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-ivy-purple text-white font-medium rounded-xl py-3 text-[15px] hover:bg-ivy-purple-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1"
                    >
                        {loading ? 'Signing in…' : 'Sign in →'}
                    </button>
                </form>

                <p className="text-center text-[13px] text-text-muted mt-6">
                    Don't have an account?{' '}
                    <Link href="/signup" className="text-ivy-purple-dk hover:underline font-medium">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    )
}