"use client"
import { useState } from 'react'
import Link from 'next/link'
import { forgotPassword } from '../../../api/client'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [sent, setSent] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            await forgotPassword(email)
            setSent(true)
        } catch {
            setError('Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-surface-base flex items-center justify-center px-4">
            <div className="bg-surface-card rounded-3xl border border-border-subtle shadow-2xl p-10 max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="text-4xl mb-3">🔑</div>
                    <h1 className="font-serif text-2xl text-text-primary">Reset your password</h1>
                    <p className="text-text-muted text-sm mt-1">We'll email you a secure reset link</p>
                </div>

                {sent ? (
                    <div className="text-center">
                        <p className="text-text-secondary text-[14px] leading-relaxed mb-6">
                            If <strong className="text-text-primary">{email}</strong> is registered, a reset link is on its way. Check your inbox (and spam folder).
                        </p>
                        <Link href="/login" className="text-ivy-purple-dk hover:underline text-[13px]">
                            ← Back to sign in
                        </Link>
                    </div>
                ) : (
                    <>
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
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                    placeholder="you@example.com"
                                    className="w-full bg-surface-raised border border-border-subtle rounded-xl px-4 py-2.5 text-[14px] text-text-primary placeholder-text-muted focus:outline-none focus:border-ivy-purple transition-colors"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-ivy-purple text-white font-medium rounded-xl py-3 text-[15px] hover:bg-ivy-purple-md transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Sending…' : 'Send reset link →'}
                            </button>
                        </form>
                        <p className="text-center text-[13px] text-text-muted mt-6">
                            <Link href="/login" className="text-ivy-purple-dk hover:underline">← Back to sign in</Link>
                        </p>
                    </>
                )}
            </div>
        </div>
    )
}