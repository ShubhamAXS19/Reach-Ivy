import React from 'react'

const MicIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm0 2a2 2 0 0 0-2 2v6a2 2 0 1 0 4 0V5a2 2 0 0 0-2-2zm-7 8a1 1 0 0 1 1 1 6 6 0 0 0 12 0 1 1 0 1 1 2 0 8 8 0 0 1-7 7.938V21h2a1 1 0 1 1 0 2H9a1 1 0 1 1 0-2h2v-2.062A8.001 8.001 0 0 1 4 12a1 1 0 0 1 1-1z" /></svg>
const StopIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
const SpeakerIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" /></svg>
const SpinnerIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6 animate-spin"><circle cx="12" cy="12" r="10" strokeOpacity="0.2" /><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" /></svg>

export default function VoiceButton({ isRecording, isProcessing, isSpeaking, isLoading, onToggle, onStopSpeaking, disabled }) {
  const handleClick = () => {
    if (isSpeaking) { onStopSpeaking(); return }
    if (!isLoading && !isProcessing) onToggle()
  }

  let icon, label, cls
  if (isProcessing || isLoading) {
    icon = <SpinnerIcon />; label = isProcessing ? 'Transcribing…' : 'Ivy is thinking…'
    cls = 'bg-surface-raised text-ivy-purple border-border-strong'
  } else if (isRecording) {
    icon = <StopIcon />; label = 'Recording — click to stop'
    cls = 'bg-red-950/50 text-red-400 border-red-800/50 animate-pulse'
  } else if (isSpeaking) {
    icon = <SpeakerIcon />; label = 'Ivy is speaking…'
    cls = 'bg-ivy-teal-lt text-ivy-teal border-ivy-teal/30'
  } else {
    icon = <MicIcon />; label = 'Click to speak'
    cls = 'bg-ivy-purple-lt text-ivy-purple-dk border-ivy-purple-md/30 hover:bg-ivy-purple hover:text-white hover:border-ivy-purple'
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        onClick={handleClick}
        disabled={disabled || isProcessing || isLoading}
        className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-200 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${cls}`}
      >
        {icon}
      </button>
      <span className="text-[11px] text-text-muted whitespace-nowrap">{label}</span>
    </div>
  )
}