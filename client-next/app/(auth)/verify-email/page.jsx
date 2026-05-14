"use client"
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { verifyEmail } from '../../../api/client'

export default function VerifyEmailPage() {
    const params = useSearchParams()
    const router = useRouter()
    const token = params.get('token')

    const [status, setStatus] = useState('verifying')  // 'verifying' | 'success' | 'error'
    const [message, setMessage] = useState('')

    useEffect(() => {
        if (!token) { setStatus('error'); setMessage('No verification token found.'); return }
        verifyEmail(token)
            .then(data => { setStatus('success'); setMessage(data.message) })
            .catch(err => { setStatus('error'); setMessage(err.response?.data?.detail || 'Verification failed.') })
    }, [token])

    return (
        <div className="min-h-screen bg-surface-base flex items-center justify-center px-4">
            <div className="bg-surface-card rounded-3xl border border-border-subtle shadow-2xl p-10 max-w-md w-full text-center">
                {status === 'verifying' && (
                    <>
                        <div className="text-4xl mb-4 animate-spin">🍀</div>
                        <p className="text-text-secondary text-[14px]">Verifying your email…</p>
                    </>
                )}
                {status === 'success' && (
                    <>
                        <div className="text-4xl mb-4">✅</div>
                        <h2 className="font-serif text-xl text-text-primary mb-2">Email verified!</h2>
                        <p className="text-text-secondary text-[14px] mb-6">{message}</p>
                        <button onClick={() => router.push('/login')}
                            className="bg-ivy-purple text-white rounded-xl px-6 py-2.5 text-[14px] font-medium hover:bg-ivy-purple-md transition-colors">
                            Sign in →
                        </button>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <div className="text-4xl mb-4">❌</div>
                        <h2 className="font-serif text-xl text-text-primary mb-2">Verification failed</h2>
                        <p className="text-red-400 text-[14px] mb-6">{message}</p>
                        <button onClick={() => router.push('/signup')}
                            className="text-ivy-purple-dk hover:underline text-[13px]">
                            Back to sign up →
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}