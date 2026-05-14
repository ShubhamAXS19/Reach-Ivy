"use client"
import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '../../../context/AuthContext'

export default function SignupPage() {
    const { signup } = useAuth()
    const [form, setForm] = useState({ email: '', password: '', password2: '' })
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        if (form.password !== form.password2) {
            setError('Passwords do not match.')
            return
        }
        setLoading(true)
        try {
            await signup(form)
            setSuccess(true)
        } catch (err) {
            const data = err.response?.data
            if (data?.email) setError(data.email[0])
            else if (data?.password) setError(data.password[0])
            else setError(data?.detail || 'Sign up failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    if (success) return (
        <div className="min-h-screen bg-surface-base flex items-center justify-center px-4">
            <div className="bg-surface-card rounded-3xl border border-border-subtle shadow-2xl p-10 max-w-md w-full text-center">
                <div className="text-4xl mb-4">📬</div>
                <h2 className="font-serif text-xl text-text-primary mb-2">Check your email</h2>
                <p className="text-text-secondary text-[14px] leading-relaxed">
                    We sent a verification link to <strong className="text-text-primary">{form.email}</strong>.
                    Click it to activate your account, then{' '}
                    <Link href="/login" className="text-ivy-purple-dk hover:underline">sign in</Link>.
                </p>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-surface-base flex items-center justify-center px-4">
            <div className="bg-surface-card rounded-3xl border border-border-subtle shadow-2xl p-10 max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="text-4xl mb-3">🍀</div>
                    <h1 className="font-serif text-2xl text-text-primary">Create your account</h1>
                    <p className="text-text-muted text-sm mt-1">Free to get started</p>
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
                        <label className="block text-[12px] text-text-muted mb-1.5 uppercase tracking-wider font-medium">Password</label>
                        <input
                            type="password"
                            value={form.password}
                            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                            required
                            placeholder="Min. 8 characters"
                            className="w-full bg-surface-raised border border-border-subtle rounded-xl px-4 py-2.5 text-[14px] text-text-primary placeholder-text-muted focus:outline-none focus:border-ivy-purple transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-[12px] text-text-muted mb-1.5 uppercase tracking-wider font-medium">Confirm password</label>
                        <input
                            type="password"
                            value={form.password2}
                            onChange={e => setForm(f => ({ ...f, password2: e.target.value }))}
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
                        {loading ? 'Creating account…' : 'Create account →'}
                    </button>
                </form>

                <p className="text-center text-[13px] text-text-muted mt-6">
                    Already have an account?{' '}
                    <Link href="/login" className="text-ivy-purple-dk hover:underline font-medium">Sign in</Link>
                </p>
            </div>
        </div>
    )
}