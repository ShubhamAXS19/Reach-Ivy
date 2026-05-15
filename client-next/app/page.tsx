"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { useDarkMode } from "../hooks/useDarkMode";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import VoiceButton from "../components/VoiceButton";
import EssayOutput from "../components/EssayOutput";
import OnboardingTour from "../components/OnboardingTour";
import LandingModal from "../components/LandingModal";
import ResumeModal from "../components/ResumeModal";
import ReportModal from "../components/ReportModal";
import SavePromptModal from "../components/SavePromptModal";
import PreviousEssays from "../components/PreviousEssays";
import { useConversation } from "../hooks/useConversation";
import { useVoiceRecorder } from "../hooks/useVoiceRecorder";
import { generateReport, deleteConversation } from "../api/client";

export default function App() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const { darkMode, toggleDarkMode } = useDarkMode();

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
    loadConversation,
    resetAndStartFresh,
    hasLoaded,
    conversationId,
  } = useConversation();

  const [text, setText] = useState("");
  const [sessionStarted, setSessionStarted] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [savedConversation, setSavedConversation] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [refreshEssays, setRefreshEssays] = useState(false);

  const { isRecording, isProcessing, liveTranscript, toggleRecording } =
    useVoiceRecorder({
      onTranscript: (t) => {
        if (t.trim()) sendMessage(t);
      },
      onError: (msg) => console.error("STT error:", msg),
    });

  // Check for existing conversation on auth load
  useEffect(() => {
    if (!loading && user) {
      loadConversation().then((hasExisting) => {
        if (hasExisting) {
          setShowResumeModal(true);
        }
      });
    }
  }, [user, loading, loadConversation]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  const handleStartFresh = async () => {
    setShowResumeModal(false);
    await resetAndStartFresh();
    setSessionStarted(true);
    setTimeout(() => setShowTour(true), 300);
  };

  const handleResume = async () => {
    setShowResumeModal(false);
    setSessionStarted(true);
    const hasSeenTour = localStorage.getItem("hasSeenTour");
    if (!hasSeenTour) {
      setTimeout(() => setShowTour(true), 300);
      localStorage.setItem("hasSeenTour", "true");
    }
  };

  const handleStart = async () => {
    setSessionStarted(true);
    await startSession();
    setTimeout(() => setShowTour(true), 300);
  };

  const handleRestart = async () => {
    setSessionStarted(false);
    await resetAndStartFresh();
    setSessionStarted(true);
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

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      const report = await generateReport();
      setReportData(report);
      // Store the conversation id at time of report generation
      setActiveConversationId(conversationId || report.conversation_id || null);
      setShowReportModal(true);
    } catch (err) {
      console.error("Failed to generate report:", err);
      alert(
        err.response?.data?.detail ||
          "Failed to generate report. Please try again.",
      );
    } finally {
      setGeneratingReport(false);
    }
  };

  // Called when user closes the report modal — show save prompt
  const handleReportClose = () => {
    setShowReportModal(false);
    setShowSavePrompt(true);
  };

  // User chose to save — keep data as-is, trigger essay list refresh
  const handleSave = async () => {
    setShowSavePrompt(false);
    setRefreshEssays((prev) => !prev);
  };

  // User chose to discard — delete conversation from backend
  const handleDiscard = async () => {
    if (activeConversationId) {
      try {
        await deleteConversation(activeConversationId);
      } catch (err) {
        console.error("Failed to delete conversation:", err);
      }
    }
    setShowSavePrompt(false);
    // Report stays visible in state for this session — don't clear reportData
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const handleLoadPreviousEssay = (conversation) => {
    if (conversation.report) {
      setReportData(conversation.report);
      setShowReportModal(true);
    } else {
      alert("This essay doesn't have a generated report yet.");
    }
  };

  const DarkModeToggle = () => (
    <button
      onClick={toggleDarkMode}
      className="w-8 h-8 rounded-full border border-border-subtle flex items-center justify-center text-text-muted hover:bg-surface-raised transition-colors"
      title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      {darkMode ? "☀️" : "🌙"}
    </button>
  );

  if (loading || !user || !hasLoaded) return null;

  if (showResumeModal && !sessionStarted) {
    return (
      <>
        {showLanding && (
          <LandingModal onDismiss={() => setShowLanding(false)} />
        )}
        <div className="fixed top-4 right-4 z-50 flex gap-2">
          <DarkModeToggle />
          <button
            onClick={handleLogout}
            className="w-8 h-8 rounded-full border border-border-subtle flex items-center justify-center text-text-muted hover:bg-surface-raised transition-colors"
            title="Logout"
          >
            🚪
          </button>
        </div>
        <ResumeModal
          conversation={savedConversation || {}}
          onResume={handleResume}
          onStartFresh={handleStartFresh}
          onDismiss={() => {
            setShowResumeModal(false);
            handleStartFresh();
          }}
        />
      </>
    );
  }

  if (!sessionStarted) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center px-4">
        {showLanding && (
          <LandingModal onDismiss={() => setShowLanding(false)} />
        )}
        <div className="fixed top-4 right-4 flex gap-2">
          <DarkModeToggle />
          <button
            onClick={handleLogout}
            className="w-8 h-8 rounded-full border border-border-subtle flex items-center justify-center text-text-muted hover:bg-surface-raised transition-colors"
            title="Logout"
          >
            🚪
          </button>
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
            structure.
          </p>
          <div className="bg-ivy-purple-lt rounded-xl p-4 text-[13px] text-ivy-purple-dk italic leading-relaxed mb-8 border border-ivy-purple-md/20">
            "How has your life experience contributed to your personal story?"
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

      {showReportModal && reportData && (
        <ReportModal
          report={reportData}
          messages={messages}
          onClose={handleReportClose}
        />
      )}

      {showSavePrompt && (
        <SavePromptModal onSave={handleSave} onDiscard={handleDiscard} />
      )}

      <header className="bg-surface-card border-b border-border-subtle px-6 py-3.5 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🍀</span>
          <span className="font-serif text-lg text-ivy-purple-dk">
            HelloIvy
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border-subtle bg-surface-raised hover:bg-surface-hover transition-colors"
            >
              <span className="text-sm text-text-secondary">
                {user?.email?.split("@")[0]}
              </span>
              <svg
                className="w-4 h-4 text-text-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-surface-card border border-border-subtle rounded-xl shadow-2xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-border-subtle">
                    <p className="text-xs text-text-muted">Signed in as</p>
                    <p className="text-sm text-text-primary font-medium truncate">
                      {user?.email}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-surface-raised transition-colors flex items-center gap-2"
                  >
                    <span>🚪</span> Sign out
                  </button>
                </div>
              </>
            )}
          </div>
          <DarkModeToggle />
          <button
            onClick={() => setShowTour(true)}
            className="text-[11px] text-text-muted border border-border-subtle px-2.5 py-1 rounded-full hover:bg-surface-raised transition-colors"
            title="Help"
          >
            ?
          </button>
          <span className="text-[11px] bg-ivy-purple-lt text-ivy-purple-dk px-2.5 py-1 rounded-full font-medium border border-ivy-purple-md/20">
            Beta
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
                    className={`min-h-[36px] px-4 py-2 rounded-xl text-[13px] border flex items-center transition-colors ${
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

            {(essayStructure ||
              messages.filter((m) => m.role === "user").length >= 10) && (
              <div className="px-8 pb-7 pt-4">
                <button
                  onClick={handleGenerateReport}
                  disabled={generatingReport}
                  className="w-full bg-gradient-to-r from-ivy-purple to-ivy-purple-md text-white font-medium rounded-xl py-3.5 text-[15px] hover:opacity-90 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {generatingReport ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Generating your report...
                    </>
                  ) : (
                    <>📊 Generate Your Personal Report</>
                  )}
                </button>
                <p className="text-[11px] text-text-muted text-center mt-3">
                  Get AI-powered insights about your academic strengths,
                  recommended majors, and personalized domain fit
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <PreviousEssays
        onLoadEssay={handleLoadPreviousEssay}
        currentConversationId={conversationId}
        refreshTrigger={refreshEssays}
      />
    </div>
  );
}
