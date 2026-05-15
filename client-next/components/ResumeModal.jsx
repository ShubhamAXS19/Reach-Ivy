"use client"
import React from 'react'

export default function ResumeModal({ conversation, onResume, onStartFresh, onDismiss }) {
    const date = new Date(conversation.updated_at).toLocaleDateString()
    const messageCount = conversation.messages?.length || 0
    const stageNames = ['Life experiences', 'Values & character', 'Skills & strengths', 'College fit', 'Essay structure']
    const currentStageName = stageNames[conversation.current_stage] || 'Started'

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-surface-card rounded-2xl border border-border-subtle shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                <div className="text-center mb-4">
                    <div className="text-5xl mb-3">📝</div>
                    <h2 className="font-serif text-xl text-text-primary">Unfinished essay found</h2>
                    <p className="text-text-secondary text-sm mt-1">
                        You started an essay on {date}
                    </p>
                </div>

                <div className="bg-surface-raised rounded-xl p-4 mb-6">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-text-muted">Progress:</span>
                        <span className="text-ivy-purple-dk font-medium">{currentStageName}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-text-muted">Messages exchanged:</span>
                        <span className="text-text-primary">{messageCount}</span>
                    </div>
                    {conversation.essay_structure && (
                        <div className="flex justify-between text-sm">
                            <span className="text-text-muted">Essay structure:</span>
                            <span className="text-ivy-teal">Ready ✓</span>
                        </div>
                    )}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onResume}
                        className="flex-1 bg-ivy-purple text-white font-medium rounded-xl py-2.5 hover:bg-ivy-purple-md transition-colors"
                    >
                        Resume where I left off
                    </button>
                    <button
                        onClick={onStartFresh}
                        className="flex-1 border border-border-subtle text-text-secondary font-medium rounded-xl py-2.5 hover:bg-surface-raised transition-colors"
                    >
                        Start fresh
                    </button>
                </div>
                <button
                    onClick={onDismiss}
                    className="w-full text-center text-text-muted text-sm mt-4 hover:text-text-secondary transition-colors"
                >
                    Not now
                </button>
            </div>
        </div>
    )
}