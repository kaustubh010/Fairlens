'use client';

import { useMemo, useState } from 'react';
import type { BehavioralAuditResult, BiasCategory, ProbePairScore } from '@/lib/behavioral/types';
import { BiasFingerprintRadar } from './bias-fingerprint-radar';
import { Button } from '@/components/ui/button';
import { Download, ChevronDown } from 'lucide-react';
import { MethodologyDialog } from './methodology-dialog';
import { getRemediationGuidance } from '@/lib/behavioral/scoring';

function groupByCategory(scores: ProbePairScore[]): Record<string, ProbePairScore[]> {
  return scores.reduce((acc, s) => {
    (acc[s.categoryId] ||= []).push(s);
    return acc;
  }, {} as Record<string, ProbePairScore[]>);
}

export function BehavioralAuditResults({ audit }: { audit: BehavioralAuditResult }) {
  const [activeCategory, setActiveCategory] = useState<BiasCategory | 'all'>('all');
  const grouped = useMemo(() => groupByCategory(audit.probeScores), [audit.probeScores]);

  const visibleScores =
    activeCategory === 'all' ? audit.probeScores : grouped[activeCategory] ?? [];

  const exportPdf = async (variant: 'technical' | 'executive') => {
    const { jsPDF } = await import('jspdf/dist/jspdf.umd.min.js');
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    let y = 48;
    const left = 48;
    const width = 500;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(
      variant === 'technical'
        ? 'FairLens — Behavioral Bias Audit (Technical)'
        : 'FairLens — Behavioral Bias Audit (Executive)',
      left,
      y
    );
    y += 22;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Audit ID: ${audit.id}`, left, y);
    y += 16;
    doc.text(`Created: ${new Date(audit.createdAt).toLocaleString()}`, left, y);
    y += 16;
    doc.text(`Overall BSS: ${audit.overallBss}/100`, left, y);
    y += 22;

    doc.setFont('helvetica', 'bold');
    doc.text('Category scores', left, y);
    y += 16;
    doc.setFont('helvetica', 'normal');
    for (const c of audit.categories) {
      doc.text(`- ${c.title}: ${c.bss}/100 (${c.probeCount} probes)`, left, y);
      y += 14;
    }
    y += 10;

    const top = [...audit.probeScores].sort((a, b) => b.bss - a.bss).slice(0, variant === 'technical' ? 10 : 6);

    if (variant === 'technical') {
      doc.setFont('helvetica', 'bold');
      doc.text('Probe findings (top signals)', left, y);
      y += 16;
      doc.setFont('helvetica', 'normal');
      for (const p of top) {
        const lines = doc.splitTextToSize(`${p.title} — BSS ${p.bss}/100`, width);
        doc.text(lines, left, y);
        y += lines.length * 12;
        const flags = p.flags.length ? `Flags: ${p.flags.join(', ')}` : 'Flags: none';
        doc.text(doc.splitTextToSize(flags, width), left, y);
        y += 14;
        if (y > 740) {
          doc.addPage();
          y = 48;
        }
      }
    } else {
      doc.setFont('helvetica', 'bold');
      doc.text('Executive summary', left, y);
      y += 16;
      doc.setFont('helvetica', 'normal');
      const summary =
        audit.overallBss >= 65
          ? 'High asymmetry signals detected. Additional governance and remediation are recommended before production expansion.'
          : audit.overallBss >= 40
          ? 'Moderate asymmetry signals detected. Prioritize high-scoring categories and rerun after mitigation.'
          : 'Low-to-moderate asymmetry signal. Continue periodic monitoring and targeted probe expansion.';
      doc.text(doc.splitTextToSize(summary, width), left, y);
      y += 42;
      doc.setFont('helvetica', 'bold');
      doc.text('Priority actions', left, y);
      y += 16;
      doc.setFont('helvetica', 'normal');
      const actions = [
        'Review top 3 high-BSS probe pairs with policy and safety teams.',
        'Add category-specific mitigation prompts/guardrails and rerun quick audit.',
        'Schedule follow-up audit and compare category BSS deltas.',
      ];
      for (const action of actions) {
        doc.text(doc.splitTextToSize(`- ${action}`, width), left, y);
        y += 16;
      }
      y += 8;
      doc.setFont('helvetica', 'bold');
      doc.text('Top risk categories', left, y);
      y += 16;
      doc.setFont('helvetica', 'normal');
      for (const c of [...audit.categories].sort((a, b) => b.bss - a.bss).slice(0, 3)) {
        doc.text(`- ${c.title}: ${c.bss}/100`, left, y);
        y += 14;
      }
    }

    doc.save(`fairlens-behavioral-audit-${variant}-${audit.id}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-[#1d1d1f] rounded-[18px] p-6 border border-black/10 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold text-[#1d1d1f] dark:text-white">Audit Results</h1>
          <p className="text-[13px] text-[#86868b]">
            Overall Bias Signal Score: <span className="text-[#1d1d1f] dark:text-white font-semibold">{audit.overallBss}/100</span> ·{' '}
            {audit.probePairsRun} probe pairs
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <MethodologyDialog />
          <Button variant="outline" className="rounded-full" onClick={() => exportPdf('technical')}>
            <Download className="mr-2 h-4 w-4" />
            Export Technical PDF
          </Button>
          <Button variant="outline" className="rounded-full" onClick={() => exportPdf('executive')}>
            <Download className="mr-2 h-4 w-4" />
            Export Executive PDF
          </Button>
        </div>
      </div>

      <BiasFingerprintRadar categories={audit.categories} />

      <div className="bg-white dark:bg-[#1d1d1f] rounded-[18px] p-6 border border-black/10 dark:border-white/10 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-[17px] font-semibold">Probe results</h3>
            <p className="text-[13px] text-[#86868b]">Click a category filter to drill down.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              className={`px-3 py-1 rounded-full text-[12px] border ${
                activeCategory === 'all'
                  ? 'bg-[#0071e3] text-white border-[#0071e3]'
                  : 'border-black/10 dark:border-white/10 text-[#1d1d1f] dark:text-white'
              }`}
              onClick={() => setActiveCategory('all')}
            >
              All
            </button>
            {audit.categories.map((c) => (
              <button
                key={c.categoryId}
                className={`px-3 py-1 rounded-full text-[12px] border ${
                  activeCategory === c.categoryId
                    ? 'bg-[#0071e3] text-white border-[#0071e3]'
                    : 'border-black/10 dark:border-white/10 text-[#1d1d1f] dark:text-white'
                }`}
                onClick={() => setActiveCategory(c.categoryId)}
              >
                {c.title}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {visibleScores
            .slice()
            .sort((a, b) => b.bss - a.bss)
            .map((p) => (
              <details
                key={p.probePairId}
                className="group rounded-xl border border-black/10 dark:border-white/10 p-4"
              >
                <summary className="list-none cursor-pointer flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-[14px] font-semibold text-[#1d1d1f] dark:text-white truncate">{p.title}</div>
                    <div className="text-[12px] text-[#86868b]">
                      BSS <span className="font-semibold text-[#1d1d1f] dark:text-white">{p.bss}/100</span>
                      {p.flags.length ? ` · flags: ${p.flags.join(', ')}` : ''}
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-[#86868b] group-open:rotate-180 transition-transform" />
                </summary>

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-lg border border-black/10 dark:border-white/10 p-3 bg-[#f5f5f7] dark:bg-black">
                    <div className="text-[11px] uppercase tracking-wider text-[#86868b] mb-2">Response A</div>
                    <div className="text-[13px] whitespace-pre-wrap text-[#1d1d1f] dark:text-white">{p.a.text}</div>
                  </div>
                  <div className="rounded-lg border border-black/10 dark:border-white/10 p-3 bg-[#f5f5f7] dark:bg-black">
                    <div className="text-[11px] uppercase tracking-wider text-[#86868b] mb-2">Response B</div>
                    <div className="text-[13px] whitespace-pre-wrap text-[#1d1d1f] dark:text-white">{p.b.text}</div>
                  </div>
                </div>

                <div className="mt-4 text-[12px] text-[#86868b]">
                  Dimensions: sentiment {Math.round(p.dimensions.sentimentDelta * 100)} · tone {Math.round(p.dimensions.toneDelta * 100)} · length{' '}
                  {Math.round(p.dimensions.lengthAsymmetry * 100)} · hedge {Math.round(p.dimensions.hedgeAsymmetry * 100)} · refusal{' '}
                  {Math.round(p.dimensions.refusalAsymmetry * 100)} · gender {Math.round(p.dimensions.genderAttributionDelta * 100)}
                </div>
                <div className="mt-4 rounded-lg border border-black/10 dark:border-white/10 p-3 bg-[#f5f5f7] dark:bg-black">
                  <div className="text-[11px] uppercase tracking-wider text-[#86868b] mb-2">Recommended fix actions</div>
                  <ul className="text-[12px] text-[#86868b] space-y-1">
                    {getRemediationGuidance(p).map((item) => (
                      <li key={item}>- {item}</li>
                    ))}
                  </ul>
                </div>
              </details>
            ))}
        </div>
      </div>
    </div>
  );
}

