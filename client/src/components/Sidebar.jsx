import React, { useState, useCallback, useRef } from 'react'

const ESSAY_PROMPT = '"How has your life experience contributed to your personal story — your character, values, perspectives, or skills — and what you want to pursue at this college?" (350 words)'

const MIN_WIDTH = 48    // collapsed — just icons
const MAX_WIDTH = 480
const DEFAULT_WIDTH = 288

export default function Sidebar({ stages, currentStage, essayReady }) {
  const [width, setWidth] = useState(DEFAULT_WIDTH)
  const [collapsed, setCollapsed] = useState(false)
  const draggingRef = useRef(false)
  const startXRef = useRef(0)
  const startWidthRef = useRef(0)

  const isCollapsed = collapsed || width <= MIN_WIDTH + 10

  // ── Drag logic ──────────────────────────────────────
  const onMouseDown = useCallback((e) => {
    e.preventDefault()
    draggingRef.current = true
    startXRef.current = e.clientX
    startWidthRef.current = width

    const onMouseMove = (e) => {
      if (!draggingRef.current) return
      const delta = e.clientX - startXRef.current
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidthRef.current + delta))
      setWidth(newWidth)
      setCollapsed(newWidth <= MIN_WIDTH + 10)
    }

    const onMouseUp = () => {
      draggingRef.current = false
      // Snap: if dragged below 120px, fully collapse
      setWidth(w => {
        if (w < 120) { setCollapsed(true); return MIN_WIDTH }
        setCollapsed(false)
        return w
      })
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [width])

  const toggleCollapse = () => {
    if (isCollapsed) {
      setCollapsed(false)
      setWidth(DEFAULT_WIDTH)
    } else {
      setCollapsed(true)
      setWidth(MIN_WIDTH)
    }
  }

  return (
    <aside
      className="relative bg-surface-card border-r border-border-subtle flex flex-col overflow-hidden select-none transition-none"
      style={{ width, minWidth: width, maxWidth: MAX_WIDTH }}
    >
      {/* ── Collapsed icon strip ─────────────────────── */}
      {isCollapsed && (
        <div className="flex flex-col items-center gap-4 py-5 w-full">
          <button
            onClick={toggleCollapse}
            className="w-8 h-8 rounded-lg bg-surface-raised border border-border-subtle flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
            title="Expand sidebar"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Mini stage dots */}
          <div className="flex flex-col gap-2 items-center mt-2">
            {stages.map((_, i) => {
              const isDone = essayReady || i < currentStage
              const isActive = !essayReady && i === currentStage
              return (
                <div
                  key={i}
                  title={stages[i]}
                  className={`w-2 h-2 rounded-full transition-all ${isActive ? 'bg-ivy-purple scale-125' :
                    isDone ? 'bg-ivy-teal' :
                      'bg-border-strong'
                    }`}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* ── Full sidebar content ─────────────────────── */}
      {!isCollapsed && (
        <div className="flex flex-col gap-6 p-6 overflow-y-auto flex-1 scrollbar-thin">

          {/* Collapse button */}
          <button
            onClick={toggleCollapse}
            className="absolute top-4 right-10 w-7 h-7 rounded-lg bg-surface-raised border border-border-subtle flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors z-10"
            title="Collapse sidebar"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Prompt */}
          <div id="tour-prompt">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-3">Essay Prompt</p>
            <div className="bg-ivy-purple-lt border border-ivy-purple-md/20 rounded-xl p-4 text-[13px] leading-relaxed text-ivy-purple-dk italic">
              {ESSAY_PROMPT}
            </div>
            <span className="mt-2 inline-block bg-ivy-purple text-white text-[11px] font-semibold px-3 py-1 rounded-full">
              350 words
            </span>
          </div>

          {/* Stages */}
          <div id="tour-stages">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-3">Interview Stages</p>
            <ol className="flex flex-col gap-1">
              {stages.map((label, i) => {
                const isDone = essayReady || i < currentStage
                const isActive = !essayReady && i === currentStage
                return (
                  <li key={i} className={`flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] transition-all
                    ${isActive ? 'bg-ivy-purple-lt text-ivy-purple-dk font-medium' : ''}
                    ${isDone && !isActive ? 'text-ivy-teal' : ''}
                    ${!isActive && !isDone ? 'text-text-muted' : ''}
                  `}>
                    <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[11px] font-bold shrink-0
                      ${isActive ? 'border-ivy-purple bg-ivy-purple text-white' : ''}
                      ${isDone && !isActive ? 'border-ivy-teal bg-ivy-teal text-surface-base' : ''}
                      ${!isActive && !isDone ? 'border-border-strong text-text-muted' : ''}
                    `}>
                      {isDone && !isActive ? '✓' : i + 1}
                    </span>
                    {label}
                  </li>
                )
              })}
            </ol>
          </div>

          {/* Tech stack */}
          <div className="mt-auto bg-surface-raised rounded-xl p-4 border border-border-subtle">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-2">Tech Stack</p>
            <ul className="text-[12px] text-text-secondary leading-relaxed space-y-1">
              <li><span className="font-medium text-text-primary">LLM</span> · Gemini 2.0 Flash → Claude</li>
              <li><span className="font-medium text-text-primary">STT</span> · Web Speech API → Whisper</li>
              <li><span className="font-medium text-text-primary">TTS</span> · Browser Speech Synthesis</li>
              <li><span className="font-medium text-text-primary">Backend</span> · FastAPI (Python)</li>
              <li><span className="font-medium text-text-primary">Frontend</span> · React + Vite + Tailwind</li>
            </ul>
          </div>
        </div>
      )}

      {/* ── Drag handle ─────────────────────────────── */}
      <div
        onMouseDown={onMouseDown}
        className="absolute top-0 right-0 h-full w-1 cursor-col-resize group z-20"
      >
        {/* Visual indicator on hover */}
        <div className="absolute top-1/2 -translate-y-1/2 right-0 w-1 h-16 rounded-full bg-border-subtle group-hover:bg-ivy-purple transition-colors duration-150" />
      </div>
    </aside>
  )
}