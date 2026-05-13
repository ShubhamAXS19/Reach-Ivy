"use client"
import React from 'react'

const SECTIONS = [
    { key: 'hook', label: 'Hook', color: '#7B6FD4', bg: '#2A2654' },
    { key: 'context', label: 'Context', color: '#2EC4A0', bg: '#1A3832' },
    { key: 'challenge', label: 'Challenge', color: '#E07B54', bg: '#3D2318' },
    { key: 'growth', label: 'Growth', color: '#5B9BD5', bg: '#1A2B40' },
    { key: 'values', label: 'Values', color: '#D47BAA', bg: '#3D1B2E' },
    { key: 'college_fit', label: 'College Fit', color: '#D4A84B', bg: '#3D2E10' },
]

export default function EssayOutput({ structure, onRestart }) {
    if (!structure) return null
    const total = SECTIONS.reduce((sum, s) => sum + (structure[s.key]?.words ?? 0), 0)

    return (
        <div className="border-t border-border-subtle bg-surface-card px-8 py-7">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div>
                    <h3 className="font-serif text-xl text-text-primary">Your personalised essay structure</h3>
                    <p className="text-[13px] text-text-secondary mt-0.5">Built from your conversation · {total} / 350 words allocated</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="bg-ivy-teal-lt text-ivy-teal text-[11px] font-semibold px-3 py-1 rounded-full border border-ivy-teal/20">Ready to write</span>
                    <button onClick={onRestart} className="text-[13px] text-text-secondary border border-border-subtle rounded-lg px-3 py-1.5 hover:bg-surface-raised transition-colors">Start over</button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                {SECTIONS.map(({ key, label, color, bg }, i) => {
                    const sec = structure[key]
                    if (!sec) return null
                    return (
                        <div key={key} className="rounded-2xl border border-border-subtle p-4 hover:-translate-y-0.5 transition-transform" style={{ background: '#181B24', animationDelay: `${i * 0.06}s`, animation: 'fadeUp 0.4s ease both' }}>
                            <div className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color }}>{label}</div>
                            <div className="text-[14px] font-medium text-text-primary mb-1 leading-snug">{sec.title}</div>
                            <div className="text-[12px] font-semibold mb-2 inline-block px-2 py-0.5 rounded-full" style={{ color, background: bg }}>{sec.words} words</div>
                            <div className="text-[12px] text-text-secondary leading-relaxed">{sec.notes}</div>
                        </div>
                    )
                })}
            </div>

            <div className="bg-ivy-purple-lt rounded-2xl p-5 flex items-center justify-between flex-wrap gap-4 border border-ivy-purple-md/20">
                <div>
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-ivy-purple-dk mb-1">Total word budget</div>
                    <div className="font-serif text-4xl text-ivy-purple-dk">{total} <span className="text-2xl opacity-50">/ 350</span></div>
                </div>
                <p className="text-[13px] text-ivy-purple-dk leading-relaxed max-w-xs">
                    Your essay is structured across 6 sections, each grounded in <em>your</em> specific story. Word counts are guides — adjust freely as you draft.
                </p>
            </div>
        </div>
    )
}