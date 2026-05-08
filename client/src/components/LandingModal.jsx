import { useEffect, useState } from "react";

const AUTO_DISMISS_SECONDS = 7;

const features = [
    { icon: "🎙️", label: "Voice Interview", desc: "Speak naturally — Ivy listens and responds" },
    { icon: "🤖", label: "AI-Powered", desc: "Gemini 2.0 Flash with Claude as fallback" },
    { icon: "📝", label: "Essay Blueprint", desc: "Get a personalised 6-section essay structure" },
];

export default function LandingModal({ onDismiss }) {
    const [visible, setVisible] = useState(false);   // controls fade-in
    const [leaving, setLeaving] = useState(false);   // controls fade-out
    const [countdown, setCountdown] = useState(AUTO_DISMISS_SECONDS);

    // Trigger fade-in on mount
    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 50);
        return () => clearTimeout(t);
    }, []);

    // Countdown timer
    useEffect(() => {
        if (countdown <= 0) { dismiss(); return; }
        const t = setInterval(() => setCountdown(c => c - 1), 1000);
        return () => clearInterval(t);
    }, [countdown]);

    function dismiss() {
        setLeaving(true);
        setTimeout(() => onDismiss(), 500); // wait for fade-out to finish
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{
                background: "rgba(0,0,0,0.75)",
                backdropFilter: "blur(6px)",
                opacity: visible && !leaving ? 1 : 0,
                transition: "opacity 0.5s ease",
            }}
        >
            {/* Card */}
            <div
                style={{
                    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                    border: "1px solid rgba(99,102,241,0.4)",
                    borderRadius: "1.25rem",
                    maxWidth: 480,
                    width: "100%",
                    padding: "2.5rem 2rem",
                    boxShadow: "0 0 60px rgba(99,102,241,0.2), 0 25px 50px rgba(0,0,0,0.5)",
                    transform: visible && !leaving ? "scale(1) translateY(0)" : "scale(0.92) translateY(24px)",
                    transition: "transform 0.5s cubic-bezier(0.34,1.56,0.64,1)",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {/* Decorative glow blob */}
                <div style={{
                    position: "absolute", top: -60, right: -60,
                    width: 200, height: 200, borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)",
                    pointerEvents: "none",
                }} />

                {/* Logo / title */}
                <div className="flex items-center gap-3 mb-2">
                    <span style={{ fontSize: "2rem" }}>🍀</span>
                    <div>
                        <h1 style={{ color: "#e2e8f0", fontSize: "1.5rem", fontWeight: 700, lineHeight: 1.2 }}>
                            HelloIvy
                        </h1>
                        <p style={{ color: "#818cf8", fontSize: "0.8rem", fontWeight: 500, letterSpacing: "0.08em" }}>
                            AI ESSAY BRAINSTORMER
                        </p>
                    </div>
                </div>

                {/* Tagline */}
                <p style={{ color: "#94a3b8", fontSize: "1rem", lineHeight: 1.6, margin: "1rem 0 1.5rem" }}>
                    Your personal AI college counsellor. Answer a few questions by voice
                    and walk away with a <span style={{ color: "#a5b4fc", fontWeight: 600 }}>personalised essay structure</span> — in minutes, not hours.
                </p>

                {/* Feature pills */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "2rem" }}>
                    {features.map(({ icon, label, desc }) => (
                        <div key={label} style={{
                            display: "flex", alignItems: "center", gap: "0.875rem",
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.07)",
                            borderRadius: "0.75rem",
                            padding: "0.75rem 1rem",
                        }}>
                            <span style={{ fontSize: "1.4rem", flexShrink: 0 }}>{icon}</span>
                            <div>
                                <p style={{ color: "#e2e8f0", fontWeight: 600, fontSize: "0.9rem" }}>{label}</p>
                                <p style={{ color: "#64748b", fontSize: "0.8rem" }}>{desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* CTA + countdown */}
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <button
                        onClick={dismiss}
                        style={{
                            flex: 1,
                            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                            color: "#fff",
                            border: "none",
                            borderRadius: "0.75rem",
                            padding: "0.8rem 1.5rem",
                            fontSize: "1rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            boxShadow: "0 4px 20px rgba(99,102,241,0.4)",
                            transition: "transform 0.15s, box-shadow 0.15s",
                        }}
                        onMouseEnter={e => {
                            e.target.style.transform = "translateY(-2px)";
                            e.target.style.boxShadow = "0 8px 28px rgba(99,102,241,0.5)";
                        }}
                        onMouseLeave={e => {
                            e.target.style.transform = "translateY(0)";
                            e.target.style.boxShadow = "0 4px 20px rgba(99,102,241,0.4)";
                        }}
                    >
                        Let's Go 🚀
                    </button>

                    {/* Countdown ring */}
                    <div style={{ position: "relative", width: 48, height: 48, flexShrink: 0 }}>
                        <svg width="48" height="48" style={{ transform: "rotate(-90deg)" }}>
                            {/* Track */}
                            <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                            {/* Progress */}
                            <circle
                                cx="24" cy="24" r="20" fill="none"
                                stroke="#6366f1" strokeWidth="3"
                                strokeDasharray={`${2 * Math.PI * 20}`}
                                strokeDashoffset={`${2 * Math.PI * 20 * (1 - countdown / AUTO_DISMISS_SECONDS)}`}
                                strokeLinecap="round"
                                style={{ transition: "stroke-dashoffset 1s linear" }}
                            />
                        </svg>
                        <span style={{
                            position: "absolute", inset: 0,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "#94a3b8", fontSize: "0.85rem", fontWeight: 600,
                        }}>
                            {countdown}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}