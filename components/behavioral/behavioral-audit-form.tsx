'use client';

import { useMemo, useState } from 'react';
import type { BiasCategory, BehavioralAuditConfig } from '@/lib/behavioral/types';
import {
  PROBE_CATEGORIES,
  getProbePairsForCategories,
  getQuickAuditProbePairs,
  getFullAuditProbePairs,
} from '@/lib/behavioral/probes';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Copy, Check, ChevronRight, Sparkles, Info } from 'lucide-react';

type Bundle = 'quick' | 'full' | 'custom';

export function BehavioralAuditForm({
  onRun,
  isRunning,
}: {
  onRun: (payload: {
    config: BehavioralAuditConfig;
    inputs: Array<{ probePairId: string; aText: string; bText: string }>;
  }) => Promise<void>;
  isRunning: boolean;
}) {
  const [bundle, setBundle] = useState<Bundle>('quick');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<BiasCategory[]>([
    'gender', 'race_ethnicity', 'religion', 'politics',
  ]);
  const [offlineInputs, setOfflineInputs] = useState<Record<string, { aText: string; bText: string }>>({});

  const probePairs = useMemo(() => {
    if (bundle === 'quick') return getQuickAuditProbePairs();
    if (bundle === 'full') return getFullAuditProbePairs();
    return getProbePairsForCategories(selectedCategories);
  }, [bundle, selectedCategories]);

  const filledPairs = probePairs.filter(
    p => offlineInputs[p.id]?.aText?.trim() || offlineInputs[p.id]?.bText?.trim()
  ).length;

  const canRun = filledPairs > 0;

  const applyBundle = (b: Bundle) => {
    setBundle(b);
    if (b === 'custom') return;
    const pairs = b === 'quick' ? getQuickAuditProbePairs() : getFullAuditProbePairs();
    setSelectedCategories(Array.from(new Set(pairs.map(p => p.categoryId))));
  };

  const toggleCategory = (id: BiasCategory, checked: boolean) => {
    setSelectedCategories(prev => checked ? [...prev, id] : prev.filter(c => c !== id));
  };

  const copyPrompt = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1400);
  };

  const setInput = (pairId: string, side: 'aText' | 'bText', value: string) => {
    setOfflineInputs(prev => ({
      ...prev,
      [pairId]: { aText: prev[pairId]?.aText ?? '', bText: prev[pairId]?.bText ?? '', [side]: value },
    }));
  };

  const run = async () => {
    const config: BehavioralAuditConfig = {
      categories: selectedCategories,
      bundle,
      geminiApiKey: geminiApiKey.trim() || undefined,
    };
    const inputs = probePairs.map(p => ({
      probePairId: p.id,
      aText: offlineInputs[p.id]?.aText ?? '',
      bText: offlineInputs[p.id]?.bText ?? '',
    }));
    await onRun({ config, inputs });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-[28px] font-semibold text-[#1d1d1f] dark:text-white mb-2">
          Behavioral Bias Audit
        </h2>
        <p className="text-[15px] text-[#86868b] leading-relaxed max-w-2xl">
          Copy each prompt pair, run it in the model you want to audit, then paste
          the responses below. FairLens scores asymmetry using real NLP — no API
          key required to score.
        </p>
      </div>

      {/* How it works banner */}
      <div className="rounded-[14px] bg-[#f0f6ff] dark:bg-[#001233] border border-blue-100 dark:border-blue-900/40 p-4 flex gap-3">
        <Info className="h-5 w-5 text-[#0071e3] flex-shrink-0 mt-0.5" />
        <div className="text-[13px] text-[#1d1d1f] dark:text-white space-y-1">
          <p className="font-semibold">How scoring works</p>
          <p className="text-[#86868b]">
            Scoring uses <strong>AFINN-165 sentiment</strong>, <strong>Flesch-Kincaid readability</strong>,{' '}
            <strong>hedge density</strong>, <strong>moral language</strong> (Moral Foundations Theory),{' '}
            <strong>passive-voice agency</strong>, and <strong>pronoun attribution</strong> — all computed
            deterministically on your pasted text. Gemini is used <em>only</em> to explain findings,
            never to score them.
          </p>
        </div>
      </div>

      {/* Bundle selector */}
      <div className="rounded-[18px] border border-black/10 dark:border-white/10 p-6 bg-white dark:bg-[#1d1d1f] space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h3 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white">Probe bundle</h3>
            <p className="text-[12px] text-[#86868b] mt-0.5">
              Quick = 6 high-signal probes · Full = entire library · Custom = pick categories
            </p>
          </div>
          <div className="flex gap-2">
            {(['quick', 'full', 'custom'] as Bundle[]).map(b => (
              <button
                key={b}
                type="button"
                onClick={() => applyBundle(b)}
                className={`px-4 py-1.5 text-[13px] rounded-full border font-medium transition-all ${
                  bundle === b
                    ? 'bg-[#0071e3] text-white border-[#0071e3]'
                    : 'border-black/10 dark:border-white/10 text-[#1d1d1f] dark:text-white hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {b.charAt(0).toUpperCase() + b.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Category checkboxes — only shown in custom mode */}
        {bundle === 'custom' && (
          <div className="grid gap-3 sm:grid-cols-2 pt-2 border-t border-black/5 dark:border-white/5">
            {PROBE_CATEGORIES.map(c => {
              const checked = selectedCategories.includes(c.id);
              return (
                <label
                  key={c.id}
                  className={`flex gap-3 items-start rounded-xl border p-4 cursor-pointer transition-all ${
                    checked
                      ? 'border-[#0071e3] bg-[#f0f6ff] dark:bg-[#001233]'
                      : 'border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={e => toggleCategory(c.id, e.target.checked)}
                    className="mt-0.5 accent-[#0071e3]"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span>{c.emoji}</span>
                      <span className="text-[14px] font-semibold text-[#1d1d1f] dark:text-white">{c.title}</span>
                    </div>
                    <p className="text-[11px] text-[#86868b] mt-0.5">{c.description}</p>
                  </div>
                </label>
              );
            })}
          </div>
        )}

        <p className="text-[12px] text-[#86868b]">
          {probePairs.length} probe pairs selected ·{' '}
          <span className={filledPairs > 0 ? 'text-green-600 font-medium' : ''}>
            {filledPairs} filled
          </span>
        </p>
      </div>

      {/* Probe pair inputs */}
      <div className="rounded-[18px] border border-black/10 dark:border-white/10 p-6 bg-white dark:bg-[#1d1d1f] space-y-6">
        <div>
          <h3 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white">Paste model outputs</h3>
          <p className="text-[13px] text-[#86868b] mt-1">
            Copy each prompt → run it in your model → paste the output below. You can fill all pairs or just some.
          </p>
        </div>

        <div className="space-y-5">
          {probePairs.map((p, idx) => {
            const inp = offlineInputs[p.id] ?? { aText: '', bText: '' };
            const isFilled = inp.aText.trim() || inp.bText.trim();
            return (
              <div
                key={p.id}
                className={`border rounded-xl p-5 space-y-4 transition-colors ${
                  isFilled
                    ? 'border-[#0071e3]/30 bg-[#f0f6ff]/30 dark:bg-[#001233]/20'
                    : 'border-black/10 dark:border-white/10'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-[#86868b] uppercase tracking-wider">
                        {idx + 1}
                      </span>
                      <span className="text-[14px] font-semibold text-[#1d1d1f] dark:text-white">{p.title}</span>
                    </div>
                    <p className="text-[11px] text-[#86868b] mt-1 max-w-xl">{p.rationale}</p>
                  </div>
                  {isFilled && (
                    <span className="flex-shrink-0 text-[11px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">
                      ✓ filled
                    </span>
                  )}
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  {(['a', 'b'] as const).map(side => {
                    const prompt = p[side];
                    const copyKey = `${p.id}:${side}`;
                    const textKey = side === 'a' ? 'aText' : 'bText';
                    return (
                      <div key={side} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#86868b]">
                            {prompt.label}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyPrompt(copyKey, prompt.prompt)}
                            className="inline-flex items-center gap-1 text-[11px] text-[#0071e3] hover:text-[#0066cc]"
                          >
                            {copiedId === copyKey ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            {copiedId === copyKey ? 'Copied' : 'Copy prompt'}
                          </button>
                        </div>
                        <div className="text-[12px] text-[#86868b] bg-black/[0.03] dark:bg-white/[0.04] rounded-lg px-3 py-2 font-mono leading-relaxed">
                          {prompt.prompt}
                        </div>
                        <textarea
                          value={inp[textKey]}
                          onChange={e => setInput(p.id, textKey, e.target.value)}
                          className="w-full min-h-[110px] rounded-lg border border-black/10 dark:border-white/10 px-3 py-2 text-[13px] bg-transparent text-[#1d1d1f] dark:text-white placeholder-[#86868b] focus:outline-none focus:ring-1 focus:ring-[#0071e3] resize-y"
                          placeholder={`Paste model output for "${prompt.label}"…`}
                        />
                        {inp[textKey].trim() && (
                          <div className="text-[11px] text-[#86868b]">
                            {inp[textKey].trim().split(/\s+/).length} words
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Optional Gemini AI explanation */}
      <div className="rounded-[18px] border border-dashed border-black/10 dark:border-white/10 p-6 bg-white dark:bg-[#1d1d1f] space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#0071e3]" />
          <div>
            <h3 className="text-[15px] font-semibold text-[#1d1d1f] dark:text-white">
              AI Explanation <span className="text-[12px] font-normal text-[#86868b] ml-1">optional</span>
            </h3>
            <p className="text-[12px] text-[#86868b]">
              Add a Gemini API key to get a plain-English interpretation of your scored results. Scoring works without it.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowApiKey(v => !v)}
          className="text-[13px] text-[#0071e3] hover:underline inline-flex items-center gap-1"
        >
          {showApiKey ? 'Hide' : 'Add Gemini API key for AI explanation'}
          <ChevronRight className={`h-3.5 w-3.5 transition-transform ${showApiKey ? 'rotate-90' : ''}`} />
        </button>
        {showApiKey && (
          <input
            type="password"
            value={geminiApiKey}
            onChange={e => setGeminiApiKey(e.target.value)}
            placeholder="AIza…"
            className="w-full rounded-lg border border-black/10 dark:border-white/10 px-3 py-2 text-[13px] bg-transparent text-[#1d1d1f] dark:text-white placeholder-[#86868b] focus:outline-none focus:ring-1 focus:ring-[#0071e3]"
          />
        )}
      </div>

      {/* Run button */}
      <Button
        onClick={run}
        disabled={!canRun || isRunning}
        className="w-full h-auto py-4 text-[17px] font-semibold rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white transition-all disabled:opacity-40"
      >
        {isRunning ? (
          <><Spinner className="mr-2 h-5 w-5" /> Scoring responses…</>
        ) : (
          `Run Audit  ·  ${filledPairs} / ${probePairs.length} pairs filled`
        )}
      </Button>
      {!canRun && (
        <p className="text-center text-[12px] text-[#86868b]">
          Paste at least one response pair above to enable scoring.
        </p>
      )}
    </div>
  );
}
