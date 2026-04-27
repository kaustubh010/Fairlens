'use client';

import { useMemo, useState } from 'react';
import type { BehavioralAuditResult, BiasCategory, ProbePairScore } from '@/lib/behavioral/types';
import { BiasFingerprintRadar, CategoryBssBar, DimensionBreakdownBar } from './bias-fingerprint-radar';
import { Button } from '@/components/ui/button';
import { Download, ChevronDown, Sparkles, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { MethodologyDialog } from './methodology-dialog';
import { getRemediationGuidance } from '@/lib/behavioral/scoring';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function bssLabel(bss: number): { label: string; color: string; bg: string } {
  if (bss >= 60) return { label: 'High risk', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800' };
  if (bss >= 35) return { label: 'Moderate', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800' };
  return { label: 'Low signal', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' };
}

function flagLabel(flag: string): string {
  const map: Record<string, string> = {
    sentiment_asymmetry: 'Sentiment Δ',
    tone_asymmetry: 'Tone Δ',
    length_asymmetry: 'Length Δ',
    hedge_asymmetry: 'Hedge Δ',
    refusal_asymmetry: 'Refusal',
    gender_attribution: 'Gender attr.',
    moral_language_asymmetry: 'Moral lang.',
    agency_asymmetry: 'Agency Δ',
    qualifier_asymmetry: 'Qualifier Δ',
    readability_asymmetry: 'Readability Δ',
  };
  return map[flag] ?? flag;
}

function groupByCategory(scores: ProbePairScore[]): Record<string, ProbePairScore[]> {
  return scores.reduce((acc, s) => {
    (acc[s.categoryId] ||= []).push(s);
    return acc;
  }, {} as Record<string, ProbePairScore[]>);
}

// ─── Feature stat pill ───────────────────────────────────────────────────────
function FeaturePill({ label, value }: { label: string; value: string | number }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-black/[0.05] dark:bg-white/[0.07] text-[#86868b]">
      <span className="font-medium text-[#1d1d1f] dark:text-[#e5e5ea]">{value}</span> {label}
    </span>
  );
}

// ─── AI Explanation panel ────────────────────────────────────────────────────
function AiExplanationPanel({ audit }: { audit: BehavioralAuditResult }) {
  if (!audit.aiExplanation) return null;
  const { summary, topFindings, remediationSteps, riskLevel } = audit.aiExplanation;
  const riskColor = riskLevel === 'high' ? 'text-red-600' : riskLevel === 'moderate' ? 'text-amber-600' : 'text-green-600';

  return (
    <div className="bg-gradient-to-br from-[#f0f6ff] to-white dark:from-[#001233] dark:to-[#1d1d1f] rounded-[18px] p-6 border border-[#0071e3]/20 space-y-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-[#0071e3]" />
        <h3 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white">AI Interpretation</h3>
        <span className={`text-[12px] font-semibold ml-1 ${riskColor}`}>
          {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} risk
        </span>
      </div>

      <p className="text-[14px] text-[#1d1d1f] dark:text-white leading-relaxed">{summary}</p>

      {topFindings.length > 0 && (
        <div>
          <h4 className="text-[13px] font-semibold text-[#1d1d1f] dark:text-white mb-2">Key findings</h4>
          <ul className="space-y-1.5">
            {topFindings.map((f, i) => (
              <li key={i} className="flex gap-2 text-[13px] text-[#86868b]">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {remediationSteps.length > 0 && (
        <div>
          <h4 className="text-[13px] font-semibold text-[#1d1d1f] dark:text-white mb-2">Recommended actions</h4>
          <ol className="space-y-1.5 list-decimal list-inside">
            {remediationSteps.map((s, i) => (
              <li key={i} className="text-[13px] text-[#86868b]">{s}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

// ─── Individual probe card ───────────────────────────────────────────────────
function ProbeCard({ p }: { p: ProbePairScore }) {
  const [open, setOpen] = useState(false);
  const { label, color, bg } = bssLabel(p.bss);
  const remediation = getRemediationGuidance(p);

  return (
    <div className={`rounded-xl border transition-colors ${open ? 'border-[#0071e3]/30' : 'border-black/10 dark:border-white/10'}`}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-4 p-4 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[14px] font-semibold text-[#1d1d1f] dark:text-white truncate">{p.title}</span>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${bg} ${color}`}>
              {label} · {p.bss}/100
            </span>
          </div>
          {p.flags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mt-1.5">
              {p.flags.map(f => (
                <span key={f} className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  {flagLabel(f)}
                </span>
              ))}
            </div>
          )}
          {p.flags.length === 0 && (
            <div className="flex items-center gap-1 mt-1">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              <span className="text-[11px] text-[#86868b]">No flags triggered</span>
            </div>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 text-[#86868b] flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-4 pb-5 space-y-5 border-t border-black/5 dark:border-white/5 pt-4">
          {/* Dimension bar chart */}
          <div>
            <h4 className="text-[12px] font-semibold text-[#86868b] uppercase tracking-wider mb-3">
              Dimension scores (higher = more asymmetric)
            </h4>
            <DimensionBreakdownBar score={p} />
          </div>

          {/* A/B responses */}
          <div className="grid gap-3 lg:grid-cols-2">
            {(['a', 'b'] as const).map(side => {
              const resp = p[side];
              const f = resp.features;
              return (
                <div key={side} className="rounded-lg border border-black/10 dark:border-white/10 p-3 space-y-2 bg-[#f5f5f7] dark:bg-black">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#86868b]">
                      Response {side.toUpperCase()}
                    </span>
                    <div className="flex gap-1.5 flex-wrap justify-end">
                      <FeaturePill label="words" value={f.wordCount} />
                      <FeaturePill label="FK grade" value={f.fleschKincaidGrade.toFixed(1)} />
                      <FeaturePill label="sentiment" value={f.sentimentScore >= 0 ? `+${f.sentimentScore.toFixed(2)}` : f.sentimentScore.toFixed(2)} />
                    </div>
                  </div>
                  {resp.text ? (
                    <p className="text-[12px] text-[#1d1d1f] dark:text-white whitespace-pre-wrap leading-relaxed">
                      {resp.text}
                    </p>
                  ) : (
                    <p className="text-[12px] text-[#86868b] italic">No response pasted</p>
                  )}
                  {f.topSentimentWords.length > 0 && (
                    <div className="text-[11px] text-[#86868b]">
                      Top sentiment words: {f.topSentimentWords.join(' · ')}
                    </div>
                  )}
                  <div className="flex gap-1.5 flex-wrap">
                    <FeaturePill label="hedges" value={f.hedgeCount} />
                    <FeaturePill label="moral words" value={f.moralWordCount} />
                    <FeaturePill label="qualifiers" value={f.qualifierCount} />
                    <FeaturePill label="passive" value={f.passiveCount} />
                    {f.refusal && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
                        refusal detected
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Remediation */}
          <div className="rounded-lg border border-black/10 dark:border-white/10 p-3 bg-[#f5f5f7] dark:bg-black space-y-1.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#86868b] mb-2">
              Remediation guidance
            </div>
            {remediation.map((item, i) => (
              <div key={i} className="flex gap-2 text-[12px] text-[#86868b]">
                <span className="flex-shrink-0 font-bold text-[#0071e3]">{i + 1}.</span>
                {item}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Overall score ring ──────────────────────────────────────────────────────
function ScoreRing({ bss }: { bss: number }) {
  const { label, color } = bssLabel(bss);
  const radius = 52, stroke = 8;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (bss / 100) * circ;
  const strokeColor = bss >= 60 ? '#ef4444' : bss >= 35 ? '#f59e0b' : '#22c55e';

  return (
    <div className="flex flex-col items-center">
      <svg width={130} height={130} viewBox="0 0 130 130">
        <circle cx={65} cy={65} r={radius} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={stroke} />
        <circle
          cx={65} cy={65} r={radius} fill="none"
          stroke={strokeColor} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 65 65)"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
        <text x={65} y={60} textAnchor="middle" fontSize={26} fontWeight={700} fill={strokeColor}>{bss}</text>
        <text x={65} y={78} textAnchor="middle" fontSize={11} fill="#86868b">/100</text>
      </svg>
      <span className={`text-[13px] font-semibold ${color}`}>{label}</span>
    </div>
  );
}

// ─── Main results component ───────────────────────────────────────────────────
export function BehavioralAuditResults({ audit }: { audit: BehavioralAuditResult }) {
  const [activeCategory, setActiveCategory] = useState<BiasCategory | 'all'>('all');
  const grouped = useMemo(() => groupByCategory(audit.probeScores), [audit.probeScores]);
  const visibleScores = activeCategory === 'all' ? audit.probeScores : (grouped[activeCategory] ?? []);
  const sortedScores = [...visibleScores].sort((a, b) => b.bss - a.bss);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(audit, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `fairlens-${audit.id}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = async () => {
    const { jsPDF } = await import('jspdf/dist/jspdf.umd.min.js');
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    let y = 50; const L = 50; const W = 500;
    const nl = (extra = 0) => { y += extra; if (y > 740) { doc.addPage(); y = 50; } };

    doc.setFont('helvetica', 'bold'); doc.setFontSize(18);
    doc.text('FairLens — Behavioral Bias Audit Report', L, y); nl(28);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    doc.text(`Audit ID: ${audit.id}  ·  ${new Date(audit.createdAt).toLocaleString()}`, L, y); nl(14);
    doc.text(`Probe pairs analyzed: ${audit.probePairsRun}`, L, y); nl(20);

    doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
    doc.text(`Overall BSS: ${audit.overallBss}/100`, L, y); nl(22);

    doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
    doc.text('Category Scores', L, y); nl(16);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    for (const c of audit.categories) {
      doc.text(`  ${c.title}: ${c.bss}/100  (${c.probeCount} probes)`, L, y); nl(13);
    }
    nl(10);

    if (audit.aiExplanation) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
      doc.text('AI Interpretation', L, y); nl(16);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
      doc.text(doc.splitTextToSize(audit.aiExplanation.summary, W), L, y);
      nl(audit.aiExplanation.summary.length / 80 * 12 + 10);
    }

    doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
    doc.text('Top Flagged Probes', L, y); nl(16);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    for (const p of [...audit.probeScores].sort((a, b) => b.bss - a.bss).slice(0, 8)) {
      doc.setFont('helvetica', 'bold');
      doc.text(doc.splitTextToSize(`${p.title}  —  BSS ${p.bss}/100`, W), L, y); nl(14);
      doc.setFont('helvetica', 'normal');
      if (p.flags.length) { doc.text(`Flags: ${p.flags.join(', ')}`, L, y); nl(12); }
      const rem = getRemediationGuidance(p);
      for (const r of rem) { doc.text(doc.splitTextToSize(`  • ${r}`, W), L, y); nl(13); }
      nl(6);
    }
    doc.save(`fairlens-audit-${audit.id}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="bg-white dark:bg-[#1d1d1f] rounded-[18px] p-6 border border-black/10 dark:border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <ScoreRing bss={audit.overallBss} />
          <div className="flex-1 min-w-0">
            <h1 className="text-[22px] font-semibold text-[#1d1d1f] dark:text-white mb-1">Audit Results</h1>
            <p className="text-[13px] text-[#86868b]">
              {audit.probePairsRun} probe pairs · {audit.probeScores.filter(p => p.flags.length > 0).length} flagged ·{' '}
              {audit.createdAt ? new Date(audit.createdAt).toLocaleString() : ''}
            </p>
            <div className="flex gap-1.5 flex-wrap mt-3">
              <MethodologyDialog />
              <Button variant="outline" className="rounded-full text-[13px] h-8" onClick={exportJson}>
                <Download className="mr-1.5 h-3.5 w-3.5" /> JSON
              </Button>
              <Button variant="outline" className="rounded-full text-[13px] h-8" onClick={exportPdf}>
                <Download className="mr-1.5 h-3.5 w-3.5" /> PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* AI explanation (if present) */}
      <AiExplanationPanel audit={audit} />

      {/* Charts row */}
      <div className="grid gap-5 lg:grid-cols-2">
        <BiasFingerprintRadar categories={audit.categories} />
        <CategoryBssBar categories={audit.categories} />
      </div>

      {/* Scoring methodology note */}
      <div className="rounded-[14px] bg-[#f5f5f7] dark:bg-[#111] border border-black/5 dark:border-white/5 p-4 flex gap-2">
        <Info className="h-4 w-4 text-[#86868b] flex-shrink-0 mt-0.5" />
        <p className="text-[12px] text-[#86868b] leading-relaxed">
          Scores are computed using <strong>AFINN-165</strong> sentiment, <strong>Flesch-Kincaid</strong> readability,
          hedge density, Moral Foundations Theory vocabulary, passive-voice agency markers, and pronoun attribution —
          all deterministic NLP. Higher BSS = stronger asymmetry signal; it indicates potential bias, not a legal verdict.
        </p>
      </div>

      {/* Probe results */}
      <div className="bg-white dark:bg-[#1d1d1f] rounded-[18px] p-6 border border-black/10 dark:border-white/10 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-[17px] font-semibold">Probe results</h3>
            <p className="text-[13px] text-[#86868b]">
              Sorted by BSS · click to expand dimension scores, responses, and remediation
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              className={`px-3 py-1 rounded-full text-[12px] border transition-all ${
                activeCategory === 'all'
                  ? 'bg-[#0071e3] text-white border-[#0071e3]'
                  : 'border-black/10 dark:border-white/10 text-[#1d1d1f] dark:text-white hover:bg-black/5'
              }`}
              onClick={() => setActiveCategory('all')}
            >
              All ({audit.probeScores.length})
            </button>
            {audit.categories.map(c => (
              <button
                key={c.categoryId}
                className={`px-3 py-1 rounded-full text-[12px] border transition-all ${
                  activeCategory === c.categoryId
                    ? 'bg-[#0071e3] text-white border-[#0071e3]'
                    : 'border-black/10 dark:border-white/10 text-[#1d1d1f] dark:text-white hover:bg-black/5'
                }`}
                onClick={() => setActiveCategory(c.categoryId)}
              >
                {c.title} ({c.bss})
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {sortedScores.map(p => <ProbeCard key={p.probePairId} p={p} />)}
        </div>
      </div>
    </div>
  );
}
