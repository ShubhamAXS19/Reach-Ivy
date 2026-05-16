"use client"
import React, { useState } from 'react'

// ── Writing tips per section ──────────────────────────────────────────────────
const SECTION_TIPS = {
    hook: {
        label: 'Hook',
        color: [123, 111, 212],
        bg: [42, 38, 84],
        tips: [
            'Drop the reader directly into a moment — start mid-action, not with background.',
            'Use sensory detail: what did you see, hear, or feel in that specific moment?',
            'Avoid "I have always been passionate about…" — show, don\'t tell.',
            'Your first sentence should make the reader want to know what happens next.',
        ],
    },
    context: {
        label: 'Context',
        color: [46, 196, 160],
        bg: [26, 56, 50],
        tips: [
            'Briefly explain how you got to that opening moment — keep it to 2-3 sentences.',
            'Name the real thing: the project, the club, the person, the place.',
            'Avoid listing achievements — this section is about journey, not résumé.',
            'Connect your past experience to the hook moment naturally.',
        ],
    },
    challenge: {
        label: 'Challenge',
        color: [224, 123, 84],
        bg: [61, 35, 24],
        tips: [
            'Be honest about what was genuinely hard — admissions officers value authenticity.',
            'The challenge doesn\'t have to be dramatic; internal struggles count too.',
            'Show the tension: what was at stake? What did you risk or lose?',
            'Avoid resolving the challenge too quickly — let the reader feel the weight of it.',
        ],
    },
    growth: {
        label: 'Growth',
        color: [91, 155, 213],
        bg: [26, 43, 64],
        tips: [
            'Name a specific, concrete shift — not just "I grew as a person".',
            'Link the growth directly back to the challenge you described.',
            'Show the before and after: how did your thinking or behaviour change?',
            'One specific realisation beats three vague ones.',
        ],
    },
    values: {
        label: 'Values',
        color: [212, 123, 170],
        bg: [61, 27, 46],
        tips: [
            'Let your values emerge from the story — don\'t state them directly.',
            'Instead of "I value hard work", show a moment where hard work mattered to you.',
            'Pick 1-2 values that feel genuinely earned by your story.',
            'Ask yourself: what would you do differently if this value wasn\'t important to you?',
        ],
    },
    college_fit: {
        label: 'College Fit',
        color: [212, 168, 75],
        bg: [61, 46, 16],
        tips: [
            'Tie your next step back to the opening hook — create a full circle.',
            'Be specific about what you want to explore, not just "I want to make a difference".',
            'Show that you\'ve thought about your future with curiosity, not just ambition.',
            'End with forward momentum — the reader should feel your story is just beginning.',
        ],
    },
}

const SECTION_ORDER = ['hook', 'context', 'challenge', 'growth', 'values', 'college_fit']

const ESSAY_PROMPT = 'How has your life experience contributed to your personal story — your character, values, perspectives, or skills — and what you want to pursue at this college? (350 words)'

// ── jsPDF loader ──────────────────────────────────────────────────────────────
function loadJsPDF() {
    return new Promise((resolve, reject) => {
        if (window.jspdf) { resolve(window.jspdf.jsPDF); return }
        const script = document.createElement('script')
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
        script.onload = () => resolve(window.jspdf.jsPDF)
        script.onerror = () => reject(new Error('Failed to load PDF library'))
        document.head.appendChild(script)
    })
}

// ── Transcript PDF ────────────────────────────────────────────────────────────
function buildTranscriptPDF(jsPDF, report, messages) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()
    const margin = 20
    const contentW = pageW - margin * 2
    let y = 0

    function checkPage(needed = 10) {
        if (y + needed > pageH - 20) { doc.addPage(); y = 20 }
    }
    function drawRect(x, ry, w, h, r, fillColor) {
        doc.setFillColor(...fillColor)
        doc.roundedRect(x, ry, w, h, r, r, 'F')
    }

    // Header
    drawRect(0, 0, pageW, 52, 0, [15, 17, 36])
    doc.setFillColor(123, 111, 212)
    doc.circle(pageW - 18, 10, 28, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(22)
    doc.setTextColor(226, 228, 233)
    doc.text('HelloIvy', margin, 22)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(157, 148, 232)
    doc.text('AI ESSAY BRAINSTORMER  ·  CONVERSATION TRANSCRIPT', margin, 30)
    doc.setFontSize(8)
    doc.setTextColor(86, 91, 112)
    doc.text(`Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, 40)
    y = 64

    // Domain strip
    drawRect(margin, y, contentW, 28, 4, [26, 33, 48])
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(157, 148, 232)
    doc.text('RECOMMENDED DOMAIN', margin + 6, y + 8)
    doc.setFontSize(13)
    doc.setTextColor(226, 228, 233)
    doc.text(report.recommended_domain || '—', margin + 6, y + 18)
    doc.setFontSize(9)
    doc.setTextColor(46, 196, 160)
    doc.text(`Match: ${Math.round((report.domain_confidence || 0) * 100)}%`, pageW - margin - 6, y + 18, { align: 'right' })
    y += 36

    function sectionTitle(title) {
        checkPage(14)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8)
        doc.setTextColor(157, 148, 232)
        doc.text(title.toUpperCase(), margin, y)
        y += 2
        doc.setDrawColor(123, 111, 212)
        doc.setLineWidth(0.4)
        doc.line(margin, y, margin + contentW, y)
        y += 6
    }

    if (report.summary_insight) {
        sectionTitle('Summary Insight')
        const lines = doc.splitTextToSize(`"${report.summary_insight}"`, contentW - 12)
        const h = lines.length * 5.5 + 10
        drawRect(margin, y, contentW, h, 3, [26, 33, 48])
        doc.setFont('helvetica', 'italic')
        doc.setFontSize(9.5)
        doc.setTextColor(200, 202, 212)
        let iy = y + 7
        lines.forEach(line => { doc.text(line, margin + 6, iy); iy += 5.5 })
        y += h + 8
    }

    const transcript = (messages || []).filter(m =>
        !(m.role === 'user' && m.content === 'Start the interview')
    )
    if (transcript.length > 0) {
        sectionTitle('Conversation Transcript')
        transcript.forEach(msg => {
            const isUser = msg.role === 'user'
            const textLines = doc.splitTextToSize(msg.content, contentW - 20)
            const bubbleH = textLines.length * 5 + 14
            checkPage(bubbleH + 6)
            drawRect(margin, y, contentW, bubbleH, 3, isUser ? [42, 38, 84] : [26, 33, 48])
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(7)
            doc.setTextColor(...(isUser ? [157, 148, 232] : [46, 196, 160]))
            doc.text(isUser ? 'YOU' : 'IVY', margin + 6, y + 8)
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(9)
            doc.setTextColor(...(isUser ? [200, 202, 220] : [180, 185, 200]))
            let ty = y + 14
            textLines.forEach(line => { doc.text(line, margin + 6, ty); ty += 5 })
            y += bubbleH + 4
        })
    }

    const totalPages = doc.internal.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        doc.setFillColor(15, 17, 36)
        doc.rect(0, pageH - 12, pageW, 12, 'F')
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7)
        doc.setTextColor(86, 91, 112)
        doc.text('HelloIvy · AI Essay Brainstormer', margin, pageH - 4)
        doc.text(`Page ${i} of ${totalPages}`, pageW - margin, pageH - 4, { align: 'right' })
    }

    doc.save(`HelloIvy_Transcript_${new Date().toISOString().slice(0, 10)}.pdf`)
}

// ── Essay Guide PDF ───────────────────────────────────────────────────────────
function buildEssayPDF(jsPDF, structure) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()
    const margin = 20
    const contentW = pageW - margin * 2
    let y = 0

    function checkPage(needed = 10) {
        if (y + needed > pageH - 20) { doc.addPage(); y = 20 }
    }
    function drawRect(x, ry, w, h, r, fillColor) {
        doc.setFillColor(...fillColor)
        doc.roundedRect(x, ry, w, h, r, r, 'F')
    }
    function drawAccentBar(x, ry, h, color) {
        doc.setFillColor(...color)
        doc.roundedRect(x, ry, 3, h, 1.5, 1.5, 'F')
    }

    // Header
    drawRect(0, 0, pageW, 60, 0, [15, 17, 36])
    doc.setFillColor(123, 111, 212)
    doc.circle(pageW - 18, 8, 32, 'F')
    doc.setFillColor(46, 196, 160)
    doc.circle(12, 56, 20, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(24)
    doc.setTextColor(226, 228, 233)
    doc.text('HelloIvy', margin, 24)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(157, 148, 232)
    doc.text('AI ESSAY BRAINSTORMER  ·  YOUR PERSONALISED ESSAY WRITING GUIDE', margin, 33)
    doc.setFontSize(8)
    doc.setTextColor(86, 91, 112)
    doc.text(`Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, 42)
    y = 72

    // Essay prompt
    const promptLines = doc.splitTextToSize(`"${ESSAY_PROMPT}"`, contentW - 16)
    const promptH = promptLines.length * 5.5 + 14
    drawRect(margin, y, contentW, promptH, 4, [26, 33, 48])
    doc.setDrawColor(123, 111, 212)
    doc.setLineWidth(0.5)
    doc.roundedRect(margin, y, contentW, promptH, 4, 4, 'S')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(157, 148, 232)
    doc.text('YOUR ESSAY PROMPT', margin + 8, y + 7)
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(9.5)
    doc.setTextColor(200, 202, 212)
    let py = y + 13
    promptLines.forEach(line => { doc.text(line, margin + 8, py); py += 5.5 })
    y += promptH + 10

    // How to use
    drawRect(margin, y, contentW, 22, 4, [20, 25, 40])
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(46, 196, 160)
    doc.text('HOW TO USE THIS GUIDE', margin + 6, y + 7)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(160, 165, 180)
    doc.text('Each section below contains your personalised structure + tips from admissions experts.', margin + 6, y + 13)
    doc.text('Write in your own voice — use these as a compass, not a script.', margin + 6, y + 19)
    y += 30

    // Section cards
    SECTION_ORDER.forEach((key) => {
        const sec = structure[key]
        if (!sec) return
        const meta = SECTION_TIPS[key]
        if (!meta) return

        const titleLines = doc.splitTextToSize(sec.title || '', contentW - 24)
        const notesLines = doc.splitTextToSize(sec.notes || '', contentW - 24)
        const tipsHeight = meta.tips.reduce((acc, tip) => {
            return acc + doc.splitTextToSize(`• ${tip}`, contentW - 30).length * 4.5 + 2
        }, 0)
        const cardH = 10 + titleLines.length * 6 + 6 + notesLines.length * 5 + 10 + 6 + tipsHeight + 12

        checkPage(cardH + 8)

        drawRect(margin, y, contentW, cardH, 4, [22, 26, 42])
        drawAccentBar(margin, y, cardH, meta.color)

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(7)
        doc.setTextColor(...meta.color)
        doc.text(meta.label.toUpperCase(), margin + 8, y + 8)

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.setTextColor(226, 228, 233)
        let ty = y + 15
        titleLines.forEach(line => { doc.text(line, margin + 8, ty); ty += 6 })

        ty += 2
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(7)
        doc.setTextColor(120, 125, 145)
        doc.text('YOUR STRUCTURE', margin + 8, ty)
        ty += 5

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(160, 165, 185)
        notesLines.forEach(line => { doc.text(line, margin + 8, ty); ty += 5 })
        ty += 6

        doc.setDrawColor(...meta.color)
        doc.setLineWidth(0.2)
        doc.line(margin + 8, ty, margin + contentW - 8, ty)
        ty += 5

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(7)
        doc.setTextColor(...meta.color)
        doc.text('WRITING TIPS', margin + 8, ty)
        ty += 5

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8.5)
        meta.tips.forEach(tip => {
            const tipLines = doc.splitTextToSize(`• ${tip}`, contentW - 30)
            doc.setTextColor(140, 145, 165)
            tipLines.forEach(line => { doc.text(line, margin + 10, ty); ty += 4.5 })
            ty += 2
        })

        y += cardH + 6
    })

    // Closing encouragement
    checkPage(30)
    drawRect(margin, y, contentW, 28, 4, [26, 33, 48])
    doc.setDrawColor(46, 196, 160)
    doc.setLineWidth(0.4)
    doc.roundedRect(margin, y, contentW, 28, 4, 4, 'S')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(46, 196, 160)
    doc.text("You're ready. Now write your story.", margin + 8, y + 10)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(140, 145, 165)
    doc.text('The most memorable essays are honest and specific. Your story is enough.', margin + 8, y + 18)
    doc.text('Trust what Ivy uncovered — it came from you.', margin + 8, y + 24)

    // Footer
    const totalPages = doc.internal.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        doc.setFillColor(15, 17, 36)
        doc.rect(0, pageH - 12, pageW, 12, 'F')
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7)
        doc.setTextColor(86, 91, 112)
        doc.text('HelloIvy · AI Essay Brainstormer', margin, pageH - 4)
        doc.text(`Page ${i} of ${totalPages}`, pageW - margin, pageH - 4, { align: 'right' })
    }

    doc.save(`HelloIvy_EssayGuide_${new Date().toISOString().slice(0, 10)}.pdf`)
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ReportModal({ report, messages = [], essayStructure = null, onClose }) {
    const confidencePercent = Math.round(report.domain_confidence * 100)
    const [downloadingTranscript, setDownloadingTranscript] = useState(false)
    const [downloadingEssay, setDownloadingEssay] = useState(false)

    const handleTranscriptDownload = async () => {
        setDownloadingTranscript(true)
        try {
            const jsPDF = await loadJsPDF()
            buildTranscriptPDF(jsPDF, report, messages)
        } catch (err) {
            console.error('PDF generation failed:', err)
            alert('Failed to generate PDF. Please try again.')
        } finally {
            setDownloadingTranscript(false)
        }
    }

    const handleEssayDownload = async () => {
        if (!essayStructure) { alert('No essay structure available yet.'); return }
        setDownloadingEssay(true)
        try {
            const jsPDF = await loadJsPDF()
            buildEssayPDF(jsPDF, essayStructure)
        } catch (err) {
            console.error('PDF generation failed:', err)
            alert('Failed to generate PDF. Please try again.')
        } finally {
            setDownloadingEssay(false)
        }
    }

    const DownloadButton = ({ onClick, loading, icon, label, loadingLabel }) => (
        <button
            onClick={onClick}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-ivy-purple-lt border border-ivy-purple-md/30 text-ivy-purple-dk text-[13px] font-medium rounded-xl hover:bg-ivy-purple hover:text-white hover:border-ivy-purple transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {loading ? (
                <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {loadingLabel}
                </>
            ) : (
                <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    </svg>
                    {icon} {label}
                </>
            )}
        </button>
    )

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
            <div className="bg-surface-card rounded-2xl border border-border-subtle shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="sticky top-0 bg-surface-card border-b border-border-subtle px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">📊</span>
                        <h2 className="font-serif text-xl text-text-primary">Your Personal Report</h2>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                        <DownloadButton
                            onClick={handleTranscriptDownload}
                            loading={downloadingTranscript}
                            icon="💬"
                            label="Transcript PDF"
                            loadingLabel="Generating…"
                        />
                        {essayStructure && (
                            <DownloadButton
                                onClick={handleEssayDownload}
                                loading={downloadingEssay}
                                icon="📝"
                                label="Essay Guide PDF"
                                loadingLabel="Generating…"
                            />
                        )}
                        <button onClick={onClose} className="text-text-muted hover:text-text-primary text-2xl leading-none ml-1">
                            ×
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">

                    {report.problem_solving_style && (
                        <div className="bg-ivy-teal-lt rounded-xl p-4 border border-ivy-teal/20">
                            <p className="text-xs font-semibold uppercase tracking-wider text-ivy-teal mb-1">Your Problem-Solving Style</p>
                            <p className="text-sm text-text-primary">{report.problem_solving_style}</p>
                        </div>
                    )}

                    <div className="bg-ivy-purple-lt rounded-xl p-5 border border-ivy-purple-md/20">
                        <div className="text-center">
                            <p className="text-xs font-semibold uppercase tracking-wider text-ivy-purple-dk mb-1">Recommended Domain</p>
                            <h3 className="font-serif text-3xl text-ivy-purple-dk mb-2">{report.recommended_domain}</h3>
                            <div className="inline-flex items-center gap-2 bg-surface-card rounded-full px-3 py-1">
                                <span className="text-sm text-text-secondary">Match Score:</span>
                                <span className="text-sm font-semibold text-ivy-purple">{confidencePercent}%</span>
                                <div className="w-24 h-1.5 bg-surface-raised rounded-full overflow-hidden">
                                    <div className="h-full bg-ivy-purple rounded-full" style={{ width: `${confidencePercent}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-surface-raised rounded-xl p-4 border border-border-subtle">
                        <p className="text-sm italic text-text-secondary leading-relaxed">"{report.summary_insight}"</p>
                    </div>

                    {report.career_pathways && report.career_pathways.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
                                <span>🚀</span> Potential Career Pathways
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {report.career_pathways.map((pathway, i) => (
                                    <span key={i} className="bg-ivy-purple-lt text-ivy-purple-dk text-sm px-3 py-1.5 rounded-full border border-ivy-purple-md/20">{pathway}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <h4 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
                            <span>🎓</span> Recommended Majors
                        </h4>
                        <div className="space-y-2">
                            {report.suggested_majors.map((major, i) => (
                                <div key={i} className="bg-surface-raised rounded-lg p-3 border border-border-subtle">
                                    <p className="text-sm text-text-primary">{major}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
                            <span>💡</span> Key Themes We Identified
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {report.key_themes.map((theme, i) => (
                                <span key={i} className="bg-surface-raised text-text-secondary text-sm px-3 py-1.5 rounded-full border border-border-subtle">{theme}</span>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
                            <span>⭐</span> Your Identified Strengths
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {report.strengths.map((strength, i) => (
                                <span key={i} className="bg-ivy-purple-lt text-ivy-purple-dk text-sm px-3 py-1.5 rounded-full border border-ivy-purple-md/20">{strength}</span>
                            ))}
                        </div>
                    </div>

                    {messages.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
                                <span>💬</span> Conversation Transcript
                                <span className="text-xs text-text-muted font-normal">
                                    ({messages.filter(m => m.role === 'user').length} exchanges · included in Transcript PDF)
                                </span>
                            </h4>
                            <div className="bg-surface-raised rounded-xl border border-border-subtle overflow-hidden max-h-48 overflow-y-auto scrollbar-thin">
                                {messages
                                    .filter(m => !(m.role === 'user' && m.content === 'Start the interview'))
                                    .map((msg, i) => (
                                        <div key={i} className={`px-4 py-2.5 text-xs border-b border-border-subtle last:border-0 ${msg.role === 'assistant' ? 'bg-surface-card' : ''}`}>
                                            <span className={`font-semibold mr-2 ${msg.role === 'assistant' ? 'text-ivy-purple-dk' : 'text-ivy-teal'}`}>
                                                {msg.role === 'assistant' ? 'Ivy' : 'You'}
                                            </span>
                                            <span className="text-text-secondary">{msg.content}</span>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}

                    <div className="border-t border-border-subtle pt-4">
                        <p className="text-xs text-text-muted text-center">
                            This report is generated by AI based on your conversation with Ivy.
                            Use it as a roadmap for your college and career journey.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}