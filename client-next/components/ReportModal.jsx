"use client"
import React, { useState } from 'react'

function generatePDF(report, messages) {
    // Dynamically load jsPDF from CDN
    return new Promise((resolve, reject) => {
        if (window.jspdf) {
            buildPDF(window.jspdf.jsPDF, report, messages)
            resolve()
            return
        }
        const script = document.createElement('script')
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
        script.onload = () => {
            buildPDF(window.jspdf.jsPDF, report, messages)
            resolve()
        }
        script.onerror = () => reject(new Error('Failed to load PDF library'))
        document.head.appendChild(script)
    })
}

function buildPDF(jsPDF, report, messages) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()
    const margin = 20
    const contentW = pageW - margin * 2
    let y = 0

    // ── Helpers ──────────────────────────────────────────────────────────────

    function checkPage(needed = 10) {
        if (y + needed > pageH - 20) {
            doc.addPage()
            y = 20
        }
    }

    function drawRect(x, ry, w, h, r, fillColor) {
        doc.setFillColor(...fillColor)
        doc.roundedRect(x, ry, w, h, r, r, 'F')
    }

    function wrapText(text, x, wy, maxW, lineH, fontSize, color = [100, 105, 120]) {
        doc.setFontSize(fontSize)
        doc.setTextColor(...color)
        const lines = doc.splitTextToSize(String(text), maxW)
        lines.forEach(line => {
            checkPage(lineH + 2)
            doc.text(line, x, wy)
            wy += lineH
        })
        return wy
    }

    // ── Cover header ─────────────────────────────────────────────────────────
    drawRect(0, 0, pageW, 52, 0, [15, 17, 36])
    doc.setFillColor(123, 111, 212)
    doc.circle(pageW - 18, 10, 28, 'F')
    doc.setFillColor(46, 196, 160, 0.3)
    doc.circle(14, 48, 18, 'F')

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

    // ── Report summary strip ──────────────────────────────────────────────────
    drawRect(margin, y, contentW, 28, 4, [26, 33, 48])
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(157, 148, 232)
    doc.text('RECOMMENDED DOMAIN', margin + 6, y + 8)
    doc.setFontSize(13)
    doc.setTextColor(226, 228, 233)
    doc.text(report.recommended_domain || '—', margin + 6, y + 18)

    const matchLabel = `Match: ${Math.round((report.domain_confidence || 0) * 100)}%`
    doc.setFontSize(9)
    doc.setTextColor(46, 196, 160)
    doc.text(matchLabel, pageW - margin - 6, y + 18, { align: 'right' })

    y += 36

    // ── Section title helper ──────────────────────────────────────────────────
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

    // ── Summary insight ───────────────────────────────────────────────────────
    if (report.summary_insight) {
        sectionTitle('Summary Insight')
        drawRect(margin, y, contentW, 1, 3, [26, 33, 48]) // will be overdrawn
        const insightLines = doc.splitTextToSize(`"${report.summary_insight}"`, contentW - 12)
        const insightH = insightLines.length * 5.5 + 10
        drawRect(margin, y, contentW, insightH, 3, [26, 33, 48])
        doc.setFont('helvetica', 'italic')
        doc.setFontSize(9.5)
        doc.setTextColor(200, 202, 212)
        let iy = y + 7
        insightLines.forEach(line => {
            doc.text(line, margin + 6, iy)
            iy += 5.5
        })
        y += insightH + 8
    }

    // ── Conversation transcript ───────────────────────────────────────────────
    const transcript = (messages || []).filter(m =>
        !(m.role === 'user' && m.content === 'Start the interview')
    )

    if (transcript.length > 0) {
        sectionTitle('Conversation Transcript')

        transcript.forEach((msg, idx) => {
            const isUser = msg.role === 'user'
            const label = isUser ? 'YOU' : 'IVY'
            const bubbleColor = isUser ? [42, 38, 84] : [26, 33, 48]
            const labelColor = isUser ? [157, 148, 232] : [46, 196, 160]
            const textColor = isUser ? [200, 202, 220] : [180, 185, 200]

            const textLines = doc.splitTextToSize(msg.content, contentW - 20)
            const bubbleH = textLines.length * 5 + 14
            checkPage(bubbleH + 6)

            drawRect(margin, y, contentW, bubbleH, 3, bubbleColor)

            doc.setFont('helvetica', 'bold')
            doc.setFontSize(7)
            doc.setTextColor(...labelColor)
            doc.text(label, margin + 6, y + 8)

            doc.setFont('helvetica', 'normal')
            doc.setFontSize(9)
            doc.setTextColor(...textColor)
            let ty = y + 14
            textLines.forEach(line => {
                doc.text(line, margin + 6, ty)
                ty += 5
            })

            y += bubbleH + 4
        })
    }

    // ── Footer on every page ──────────────────────────────────────────────────
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

export default function ReportModal({ report, messages = [], onClose }) {
    const confidencePercent = Math.round(report.domain_confidence * 100)
    const [downloading, setDownloading] = useState(false)

    const handleDownload = async () => {
        setDownloading(true)
        try {
            await generatePDF(report, messages)
        } catch (err) {
            console.error('PDF generation failed:', err)
            alert('Failed to generate PDF. Please try again.')
        } finally {
            setDownloading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
            <div className="bg-surface-card rounded-2xl border border-border-subtle shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="sticky top-0 bg-surface-card border-b border-border-subtle px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">📊</span>
                        <h2 className="font-serif text-xl text-text-primary">Your Personal Report</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Download PDF button */}
                        <button
                            onClick={handleDownload}
                            disabled={downloading}
                            className="flex items-center gap-2 px-4 py-2 bg-ivy-purple-lt border border-ivy-purple-md/30 text-ivy-purple-dk text-[13px] font-medium rounded-xl hover:bg-ivy-purple hover:text-white hover:border-ivy-purple transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {downloading ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Generating…
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                                    </svg>
                                    Download PDF
                                </>
                            )}
                        </button>
                        <button onClick={onClose} className="text-text-muted hover:text-text-primary text-2xl leading-none">
                            ×
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">

                    {/* Problem Solving Style */}
                    {report.problem_solving_style && (
                        <div className="bg-ivy-teal-lt rounded-xl p-4 border border-ivy-teal/20">
                            <p className="text-xs font-semibold uppercase tracking-wider text-ivy-teal mb-1">Your Problem-Solving Style</p>
                            <p className="text-sm text-text-primary">{report.problem_solving_style}</p>
                        </div>
                    )}

                    {/* Domain Recommendation */}
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

                    {/* Summary Insight */}
                    <div className="bg-surface-raised rounded-xl p-4 border border-border-subtle">
                        <p className="text-sm italic text-text-secondary leading-relaxed">
                            "{report.summary_insight}"
                        </p>
                    </div>

                    {/* Career Pathways */}
                    {report.career_pathways && report.career_pathways.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
                                <span>🚀</span> Potential Career Pathways
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {report.career_pathways.map((pathway, i) => (
                                    <span key={i} className="bg-ivy-purple-lt text-ivy-purple-dk text-sm px-3 py-1.5 rounded-full border border-ivy-purple-md/20">
                                        {pathway}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Suggested Majors */}
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

                    {/* Key Themes */}
                    <div>
                        <h4 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
                            <span>💡</span> Key Themes We Identified
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {report.key_themes.map((theme, i) => (
                                <span key={i} className="bg-surface-raised text-text-secondary text-sm px-3 py-1.5 rounded-full border border-border-subtle">
                                    {theme}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Strengths */}
                    <div>
                        <h4 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
                            <span>⭐</span> Your Identified Strengths
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {report.strengths.map((strength, i) => (
                                <span key={i} className="bg-ivy-purple-lt text-ivy-purple-dk text-sm px-3 py-1.5 rounded-full border border-ivy-purple-md/20">
                                    {strength}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Conversation transcript preview */}
                    {messages.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
                                <span>💬</span> Conversation Transcript
                                <span className="text-xs text-text-muted font-normal">({messages.filter(m => m.role === 'user').length} exchanges · included in PDF)</span>
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

                    <div className="border-t border-border-subtle pt-4 mt-2">
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