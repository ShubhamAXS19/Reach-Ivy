"use client"
import React, { useState, useEffect } from 'react'

const STEPS = [
    { target: null, title: '👋 Welcome to HelloIvy', body: "I'm Ivy, your AI essay coach. I'll interview you through a voice conversation, learn your story, and build a personalised 350-word essay structure — all without any human in the loop.", position: 'center' },
    { target: 'tour-prompt', title: '📝 Your essay prompt', body: "This is the exact college essay question we're working on together. Every question I ask is designed to uncover the best story for this specific prompt.", position: 'right' },
    { target: 'tour-stages', title: '🗺 Interview stages', body: "I'll guide you through 4 stages — life experiences, values, skills, and college goals. Each stage lights up as we progress.", position: 'right' },
    { target: 'tour-mic', title: '🎙 Voice button — your main control', body: 'Click once to start recording. Speak your answer naturally. Click again to stop. Your speech is transcribed instantly.', position: 'top' },
    { target: 'tour-transcript', title: '👁 Live transcript box', body: 'As you speak, your words appear here in real time so you can confirm what was captured before it gets sent.', position: 'top' },
    { target: 'tour-textinput', title: '⌨️ Text input — optional fallback', body: "Prefer typing? Use this instead. Press Enter to send. Mix voice and text freely throughout.", position: 'top' },
    { target: null, title: "✅ You're all set!", body: "Speak honestly — the more specific your answers, the stronger your essay structure. Let's go!", position: 'center' },
]

function Spotlight({ targetId }) {
    const [rect, setRect] = useState(null)
    useEffect(() => {
        if (!targetId) { setRect(null); return }
        const el = document.getElementById(targetId)
        if (!el) { setRect(null); return }
        const r = el.getBoundingClientRect()
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
    }, [targetId])
    if (!rect) return null
    const PAD = 10
    return (
        <div className="fixed pointer-events-none z-[9998]" style={{
            top: rect.top - PAD, left: rect.left - PAD,
            width: rect.width + PAD * 2, height: rect.height + PAD * 2,
            borderRadius: 14,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.75)',
            border: '2px solid #7B6FD4',
            transition: 'all 0.3s ease',
        }} />
    )
}

function CenterCard({ step, stepIndex, total, onNext, onSkip }) {
    const isLast = stepIndex === total - 1
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
            <div className="bg-surface-card border border-border-subtle rounded-2xl shadow-2xl p-8 max-w-md w-full text-center" style={{ animation: 'tourFade 0.3s ease' }}>
                <div className="text-4xl mb-3">{step.title.split(' ')[0]}</div>
                <h3 className="font-serif text-xl text-text-primary mb-3">{step.title.split(' ').slice(1).join(' ')}</h3>
                <p className="text-[14px] text-text-secondary leading-relaxed mb-6">{step.body}</p>
                <div className="flex items-center justify-between">
                    <button onClick={onSkip} className="text-[13px] text-text-muted hover:text-text-secondary">Skip tour</button>
                    <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                            {Array.from({ length: total }).map((_, i) => (
                                <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === stepIndex ? 'bg-ivy-purple' : 'bg-border-strong'}`} />
                            ))}
                        </div>
                        <button onClick={onNext} className="bg-ivy-purple text-white text-[13px] font-medium px-5 py-2 rounded-xl hover:bg-ivy-purple-md transition-colors">
                            {isLast ? "Let's go →" : 'Next →'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

function AnchoredCard({ step, stepIndex, total, onNext, onSkip }) {
    const [pos, setPos] = useState({ top: 0, left: 0 })
    const isLast = stepIndex === total - 1
    useEffect(() => {
        const el = document.getElementById(step.target)
        if (!el) return
        const r = el.getBoundingClientRect()
        const PAD = 20
        let top = r.bottom + PAD, left = r.left
        if (step.position === 'right') { top = r.top; left = r.right + PAD }
        if (step.position === 'top') { top = r.top - 200; left = r.left + r.width / 2 - 160 }
        top = Math.max(12, Math.min(top, window.innerHeight - 220))
        left = Math.max(12, Math.min(left, window.innerWidth - 340))
        setPos({ top, left })
    }, [step])

    return (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
            <div className="pointer-events-auto absolute bg-surface-card border border-border-subtle rounded-2xl shadow-2xl p-5 w-80" style={{ top: pos.top, left: pos.left, animation: 'tourFade 0.3s ease' }}>
                <h3 className="font-medium text-text-primary text-[15px] mb-2">{step.title}</h3>
                <p className="text-[13px] text-text-secondary leading-relaxed mb-4">{step.body}</p>
                <div className="flex items-center justify-between">
                    <button onClick={onSkip} className="text-[12px] text-text-muted hover:text-text-secondary">Skip</button>
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                            {Array.from({ length: total }).map((_, i) => (
                                <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === stepIndex ? 'bg-ivy-purple' : 'bg-border-strong'}`} />
                            ))}
                        </div>
                        <button onClick={onNext} className="bg-ivy-purple text-white text-[12px] font-medium px-4 py-1.5 rounded-lg hover:bg-ivy-purple-md transition-colors">
                            {isLast ? 'Got it ✓' : 'Next →'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function OnboardingTour({ onComplete }) {
    const [step, setStep] = useState(0)
    const current = STEPS[step]
    const next = () => step < STEPS.length - 1 ? setStep(s => s + 1) : onComplete()
    const skip = () => onComplete()
    return (
        <>
            <style>{`@keyframes tourFade { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }`}</style>
            {!current.target && <div className="fixed inset-0 bg-black/70 z-[9997]" />}
            {current.target && <Spotlight targetId={current.target} />}
            {current.position === 'center'
                ? <CenterCard step={current} stepIndex={step} total={STEPS.length} onNext={next} onSkip={skip} />
                : <AnchoredCard step={current} stepIndex={step} total={STEPS.length} onNext={next} onSkip={skip} />
            }
        </>
    )
}