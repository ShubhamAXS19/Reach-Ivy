"use client"
import React, { useState, useEffect } from 'react'
import { getPreviousConversations } from '../api/client'

export default function PreviousEssays({ onLoadEssay, currentConversationId, refreshTrigger }) {
    const [conversations, setConversations] = useState([])
    const [expanded, setExpanded] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchPreviousConversations()
    }, [refreshTrigger]) // Re-fetch when refreshTrigger changes

    const fetchPreviousConversations = async () => {
        try {
            const data = await getPreviousConversations()
            // Filter out current active conversation and only show completed ones with essay structure
            const completed = data.filter(c =>
                c.id !== currentConversationId &&
                c.completed === true &&
                c.essay_structure !== null
            )
            setConversations(completed)
        } catch (err) {
            console.error('Failed to fetch previous essays:', err)
        } finally {
            setLoading(false)
        }
    }

    if (conversations.length === 0 && !expanded) return null

    return (
        <>
            {/* Toggle button - fixed bottom left */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="fixed bottom-6 left-6 z-30 bg-surface-card border border-border-subtle rounded-full px-4 py-2.5 shadow-lg hover:bg-surface-raised transition-all duration-200 flex items-center gap-2 group"
            >
                <span className="text-lg">📚</span>
                <span className="text-sm font-medium text-text-primary hidden sm:inline">
                    {/* Previous Essays */}
                </span>
                <span className="text-xs text-ivy-purple-dk bg-ivy-purple-lt px-2 py-0.5 rounded-full">
                    {conversations.length}
                </span>
                <svg
                    className={`w-4 h-4 text-text-muted transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Expanded panel */}
            {expanded && (
                <>
                    <div
                        className="fixed inset-0 z-20 bg-black/50"
                        onClick={() => setExpanded(false)}
                    />
                    <div className="fixed bottom-20 left-6 z-30 w-80 max-h-[60vh] bg-surface-card border border-border-subtle rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
                        <div className="p-4 border-b border-border-subtle bg-surface-raised">
                            <h3 className="font-semibold text-text-primary">Previous Essays</h3>
                            <p className="text-xs text-text-muted">Your past essay structures and reports</p>
                        </div>
                        <div className="overflow-y-auto max-h-[calc(60vh-70px)]">
                            {loading ? (
                                <div className="p-8 text-center text-text-muted">Loading...</div>
                            ) : conversations.length === 0 ? (
                                <div className="p-8 text-center text-text-muted">
                                    <span className="text-3xl mb-2 block">📭</span>
                                    <p className="text-sm">No previous essays yet</p>
                                    <p className="text-xs mt-1">Complete an essay to see it here</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border-subtle">
                                    {conversations.map((conv) => (
                                        <button
                                            key={conv.id}
                                            onClick={() => {
                                                onLoadEssay(conv)
                                                setExpanded(false)
                                            }}
                                            className="w-full p-4 text-left hover:bg-surface-raised transition-colors group"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-sm font-medium text-text-primary">
                                                            {new Date(conv.created_at).toLocaleDateString()}
                                                        </span>
                                                        {conv.report && (
                                                            <span className="text-[10px] bg-ivy-purple-lt text-ivy-purple-dk px-1.5 py-0.5 rounded">
                                                                Report ready ✓
                                                            </span>
                                                        )}
                                                        {!conv.report && conv.essay_structure && (
                                                            <span className="text-[10px] bg-ivy-teal-lt text-ivy-teal px-1.5 py-0.5 rounded">
                                                                Essay only
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-text-secondary line-clamp-2">
                                                        {conv.essay_structure?.hook?.title || 'Essay structure'}
                                                    </p>
                                                    <div className="flex gap-2 mt-2">
                                                        <span className="text-[10px] text-ivy-teal bg-ivy-teal-lt px-2 py-0.5 rounded-full">
                                                            {conv.essay_structure?.hook?.words || 0} words
                                                        </span>
                                                        {conv.report?.recommended_domain && (
                                                            <span className="text-[10px] text-ivy-purple bg-ivy-purple-lt px-2 py-0.5 rounded-full">
                                                                {conv.report.recommended_domain}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <svg className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </>
    )
}