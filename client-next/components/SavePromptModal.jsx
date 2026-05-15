"use client"
import React, { useState } from 'react'

export default function SavePromptModal({ onSave, onDiscard }) {
    const [loading, setLoading] = useState(null) // 'save' | 'discard' | null

    const handleSave = async () => {
        setLoading('save')
        await onSave()
        setLoading(null)
    }

    const handleDiscard = async () => {
        setLoading('discard')
        await onDiscard()
        setLoading(null)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-surface-card rounded-2xl border border-border-subtle shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">

                <div className="text-center mb-5">
                    <div className="text-4xl mb-3">💾</div>
                    <h2 className="font-serif text-xl text-text-primary mb-1">Save your results?</h2>
                    <p className="text-sm text-text-secondary leading-relaxed">
                        Save this conversation and report so you can access it next time you log in, or discard it — your report will still be visible this session.
                    </p>
                </div>

                <div className="bg-surface-raised rounded-xl p-4 mb-5 border border-border-subtle">
                    <div className="flex items-start gap-3 mb-3">
                        <span className="text-lg mt-0.5">✅</span>
                        <div>
                            <p className="text-sm font-medium text-text-primary">Save</p>
                            <p className="text-xs text-text-muted">Conversation + report saved to your account. Accessible from "Previous Essays" on next login.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <span className="text-lg mt-0.5">🗑️</span>
                        <div>
                            <p className="text-sm font-medium text-text-primary">Discard</p>
                            <p className="text-xs text-text-muted">Report stays visible now but won't be saved. Data is removed from our servers.</p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleSave}
                        disabled={loading !== null}
                        className="flex-1 bg-ivy-purple text-white font-medium rounded-xl py-2.5 text-sm hover:bg-ivy-purple-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading === 'save' ? (
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        ) : '✅'} Save results
                    </button>
                    <button
                        onClick={handleDiscard}
                        disabled={loading !== null}
                        className="flex-1 border border-border-subtle text-text-secondary font-medium rounded-xl py-2.5 text-sm hover:bg-surface-raised transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading === 'discard' ? (
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        ) : '🗑️'} Discard
                    </button>
                </div>
            </div>
        </div>
    )
}