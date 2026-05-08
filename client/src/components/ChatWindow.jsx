import React, { useEffect, useRef } from 'react'

function TypingIndicator() {
  return (
    <div className="flex gap-3 items-start">
      <div className="w-8 h-8 rounded-full bg-ivy-purple-lt border border-ivy-purple-md/30 flex items-center justify-center text-base shrink-0">🍀</div>
      <div className="bg-surface-card border border-border-subtle rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map(i => (
            <span key={i} className="w-2 h-2 rounded-full bg-ivy-purple animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ChatWindow({ messages, isLoading }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin px-8 py-7 flex flex-col gap-5">
      {messages
        .filter(m => !(m.role === 'user' && m.content === 'Hello! Please start the interview.'))
        .map((msg, idx) => (
          <div key={idx} className={`flex gap-3 items-start ${msg.role === 'user' ? 'flex-row-reverse' : ''}`} style={{ animation: 'fadeUp 0.3s ease both' }}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-semibold shrink-0
              ${msg.role === 'assistant' ? 'bg-ivy-purple-lt border border-ivy-purple-md/30 text-base' : 'bg-ivy-teal-lt border border-ivy-teal/20 text-ivy-teal text-[11px]'}
            `}>
              {msg.role === 'assistant' ? '🍀' : 'You'}
            </div>
            <div className={`max-w-[74%] px-4 py-3 rounded-2xl text-[14px] leading-relaxed
              ${msg.role === 'assistant'
                ? 'bg-surface-card border border-border-subtle text-text-primary rounded-tl-sm'
                : 'bg-ivy-purple text-white rounded-tr-sm'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
      {isLoading && <TypingIndicator />}
      <div ref={bottomRef} />
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  )
}