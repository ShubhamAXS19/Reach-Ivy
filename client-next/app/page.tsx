"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import VoiceButton from "../components/VoiceButton";
import EssayOutput from "../components/EssayOutput";
import OnboardingTour from "../components/OnboardingTour";
import LandingModal from "../components/LandingModal";
import { useConversation } from "../hooks/useConversation";
import { useVoiceRecorder } from "../hooks/useVoiceRecorder";

export default function App() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  // Show nothing while checking auth
  if (loading || !user) return null;
  const {
    messages,
    essayStructure,
    isLoading,
    isSpeaking,
    error,
    currentStage,
    stages,
    sendMessage,
    startSession,
    stopSpeaking,
  } = useConversation();

  const [text, setText] = useState("");
  const [sessionStarted, setSessionStarted] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }
  }, [darkMode]);

  const { isRecording, isProcessing, liveTranscript, toggleRecording } =
    useVoiceRecorder({
      onTranscript: (t) => {
        if (t.trim()) sendMessage(t);
      },
      onError: (msg) => console.error("STT error:", msg),
    });

  const handleStart = async () => {
    setSessionStarted(true);
    await startSession();
    setTimeout(() => setShowTour(true), 300);
  };

  const handleRestart = async () => {
    setSessionStarted(false);
    setTimeout(async () => {
      setSessionStarted(true);
      await startSession();
    }, 100);
  };

  const handleSendText = () => {
    if (!text.trim() || isLoading) return;
    sendMessage(text.trim());
    setText("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  const DarkModeToggle = () => (
    <button
      onClick={() => setDarkMode((d) => !d)}
      className="w-8 h-8 rounded-full border border-border-subtle flex items-center justify-center text-text-muted hover:bg-surface-raised transition-colors"
      title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      {darkMode ? "☀️" : "🌙"}
    </button>
  );

  if (!sessionStarted) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center px-4">
        {showLanding && (
          <LandingModal onDismiss={() => setShowLanding(false)} />
        )}

        {/* Toggle on landing screen too */}
        <div className="fixed top-4 right-4">
          <DarkModeToggle />
        </div>

        <div className="bg-surface-card rounded-3xl border border-border-subtle shadow-2xl p-10 max-w-md w-full text-center">
          <div className="text-5xl mb-4">🍀</div>
          <h1 className="font-serif text-3xl text-text-primary mb-2">
            HelloIvy
          </h1>
          <p className="text-[13px] text-ivy-purple-dk font-medium mb-4 tracking-wide uppercase">
            AI Essay Brainstormer
          </p>
          <p className="text-[14px] text-text-secondary leading-relaxed mb-8">
            Ivy, your AI coach, will interview you through a voice conversation,
            learn your story, and generate a personalised 350-word essay
            structure — entirely without human intervention.
          </p>
          <div className="bg-ivy-purple-lt rounded-xl p-4 text-[13px] text-ivy-purple-dk italic leading-relaxed mb-8 border border-ivy-purple-md/20">
            "How has your life experience contributed to your personal story —
            your character, values, perspectives, or skills — and what you want
            to pursue at this college?"
          </div>
          <button
            onClick={handleStart}
            className="w-full bg-ivy-purple text-white font-medium rounded-xl py-3.5 text-[15px] hover:bg-ivy-purple-md transition-colors"
          >
            Begin interview →
          </button>
          <p className="text-[12px] text-text-muted mt-4">
            Voice + text supported · Takes ~8 minutes
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-surface-base overflow-hidden">
      {showTour && <OnboardingTour onComplete={() => setShowTour(false)} />}

      {/* Topbar */}
      <header className="bg-surface-card border-b border-border-subtle px-6 py-3.5 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🍀</span>
          <span className="font-serif text-lg text-ivy-purple-dk">
            HelloIvy
          </span>
        </div>
        <div className="flex items-center gap-2">
          <DarkModeToggle />
          <button
            onClick={() => setShowTour(true)}
            className="text-[11px] text-text-muted border border-border-subtle px-2.5 py-1 rounded-full hover:bg-surface-raised transition-colors"
          >
            ? Help
          </button>
          <span className="text-[11px] bg-ivy-purple-lt text-ivy-purple-dk px-2.5 py-1 rounded-full font-medium border border-ivy-purple-md/20">
            Essay Brainstormer · Beta
          </span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          stages={stages}
          currentStage={currentStage}
          essayReady={!!essayStructure}
        />

        <div className="flex flex-col flex-1 overflow-hidden">
          <ChatWindow messages={messages} isLoading={isLoading} />

          {error && (
            <div className="mx-6 mb-2 text-[13px] text-red-400 bg-red-950/40 border border-red-800/40 rounded-xl px-4 py-2">
              ⚠ {error}
            </div>
          )}

          {!essayStructure && (
            <div className="border-t border-border-subtle bg-surface-card px-6 py-4 shrink-0">
              <div className="flex items-end gap-3">
                <div id="tour-mic">
                  <VoiceButton
                    isRecording={isRecording}
                    isProcessing={isProcessing}
                    isSpeaking={isSpeaking}
                    isLoading={isLoading}
                    onToggle={toggleRecording}
                    onStopSpeaking={stopSpeaking}
                    disabled={isLoading || isProcessing}
                  />
                </div>

                <div className="flex flex-col flex-1 gap-2">
                  <div
                    id="tour-transcript"
                    className={`min-h-[36px] px-4 py-2 rounded-xl text-[13px] border flex items-center transition-colors
                      ${
                        isRecording
                          ? "bg-red-950/30 border-red-800/50 text-red-300"
                          : "bg-surface-raised border-border-subtle text-text-muted"
                      }`}
                  >
                    {isRecording && liveTranscript
                      ? liveTranscript
                      : isRecording
                        ? "Listening… speak now"
                        : "Spoken words appear here in real time…"}
                  </div>

                  <div id="tour-textinput" className="flex gap-2">
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Or type your answer and press Enter…"
                      rows={1}
                      disabled={isLoading || isRecording || isProcessing}
                      className="w-full resize-none border border-border-subtle rounded-xl px-4 py-2.5 text-[14px] font-sans bg-surface-raised text-text-primary placeholder-text-muted focus:outline-none focus:border-ivy-purple transition-colors disabled:opacity-50"
                      style={{ minHeight: "44px", maxHeight: "112px" }}
                      onInput={(e) => {
                        e.target.style.height = "auto";
                        e.target.style.height =
                          Math.min(e.target.scrollHeight, 112) + "px";
                      }}
                    />
                    <button
                      onClick={handleSendText}
                      disabled={!text.trim() || isLoading || isRecording}
                      className="w-11 h-11 bg-ivy-purple text-white rounded-xl flex items-center justify-center hover:bg-ivy-purple-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-5 h-5"
                      >
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="overflow-y-auto scrollbar-thin">
            <EssayOutput structure={essayStructure} onRestart={handleRestart} />
          </div>
        </div>
      </div>
    </div>
  );
}
