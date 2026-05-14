"use client"
import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { resetPassword } from '../../../api/client'

export default function ResetPasswordPage() {
    const params = useSearchParams()
    const router = useRouter()
    const uid = params.get('uid')
    const token = params.get('token')

    const [form, setForm] = useState({ password: '', password2: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [done, setDone] = useState(false)

    if (!uid || !token) return (
        <div className="min-h-screen bg-surface-base flex items-center justify-center px-4">
            <div className="bg-surface-card rounded-3xl border border-border-subtle p-10 max-w-md w-full text-center">
                <p className="text-red-400 text-[14px] mb-4">Invalid or missing reset link.</p>
                <Link href="/forgot-password" className="text-ivy-purple-dk hover:underline text-[13px]">Request a new one →</Link>
            </div>
        </div>
    )

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        if (form.password !== form.password2) { setError('Passwords do not match.'); return }
        setLoading(true)
        try {
            await resetPassword({ uid, token, password: form.password })
            setDone(true)
        } catch (err) {
            setError(err.response?.data?.detail || 'Reset failed. The link may have expired.')
        } finally {
            setLoading(false)
        }
    }

    if (done) return (
        <div className="min-h-screen bg-surface-base flex items-center justify-center px-4">
            <div className="bg-surface-card rounded-3xl border border-border-subtle p-10 max-w-md w-full text-center">
                <div className="text-4xl mb-4">✅</div>
                <h2 className="font-serif text-xl text-text-primary mb-2">Password updated</h2>
                <p className="text-text-secondary text-[14px] mb-6">You can now sign in with your new password.</p>
                <button onClick={() => router.push('/login')} className="bg-ivy-purple text-white rounded-xl px-6 py-2.5 text-[14px] font-medium hover:bg-ivy-purple-md transition-colors">
                    Go to sign in →
                </button>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-surface-base flex items-center justify-center px-4">
            <div className="bg-surface-card rounded-3xl border border-border-subtle shadow-2xl p-10 max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="text-4xl mb-3">🔒</div>
                    <h1 className="font-serif text-2xl text-text-primary">Choose a new password</h1>
                </div>
                {error && (
                    <div className="mb-5 text-[13px] text-red-400 bg-red-950/40 border border-red-800/40 rounded-xl px-4 py-2.5">{error}</div>
                )}
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-[12px] text-text-muted mb-1.5 uppercase tracking-wider font-medium">New password</label>
                        <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required placeholder="Min. 8 characters"
                            className="w-full bg-surface-raised border border-border-subtle rounded-xl px-4 py-2.5 text-[14px] text-text-primary placeholder-text-muted focus:outline-none focus:border-ivy-purple transition-colors" />
                    </div>
                    <div>
                        <label className="block text-[12px] text-text-muted mb-1.5 uppercase tracking-wider font-medium">Confirm password</label>
                        <input type="password" value={form.password2} onChange={e => setForm(f => ({ ...f, password2: e.target.value }))} required placeholder="••••••••"
                            className="w-full bg-surface-raised border border-border-subtle rounded-xl px-4 py-2.5 text-[14px] text-text-primary placeholder-text-muted focus:outline-none focus:border-ivy-purple transition-colors" />
                    </div>
                    <button type="submit" disabled={loading}
                        className="w-full bg-ivy-purple text-white font-medium rounded-xl py-3 text-[15px] hover:bg-ivy-purple-md transition-colors disabled:opacity-50 mt-1">
                        {loading ? 'Updating…' : 'Update password →'}
                    </button>
                </form>
            </div>
        </div>
    )
}