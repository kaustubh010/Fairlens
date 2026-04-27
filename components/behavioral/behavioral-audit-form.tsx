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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Copy, Check } from 'lucide-react';

export function BehavioralAuditForm({
  onRun,
  isRunning,
}: {
  onRun: (payload: { config: BehavioralAuditConfig; inputs?: Array<{ probePairId: string; aText: string; bText: string }> }) => Promise<void>;
  isRunning: boolean;
}) {
  const [mode, setMode] = useState<'online' | 'offline'>('online');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gemini-1.5-flash');
  const [temperature, setTemperature] = useState(0);
  const [runsPerProbe, setRunsPerProbe] = useState(1);
  const [bundle, setBundle] = useState<'quick' | 'full' | 'custom'>('quick');
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<BiasCategory[]>([
    'gender',
    'race_ethnicity',
    'religion',
    'politics',
  ]);

  const probePairs = useMemo(() => getProbePairsForCategories(selectedCategories), [selectedCategories]);
  const [offlineInputs, setOfflineInputs] = useState<Record<string, { aText: string; bText: string }>>({});

  const toggleCategory = (id: BiasCategory, checked: boolean) => {
    setSelectedCategories((prev) => (checked ? [...prev, id] : prev.filter((c) => c !== id)));
  };

  const canRun = selectedCategories.length > 0 && (mode === 'offline' || (apiKey.trim() && model.trim()));

  const buildConfig = (): BehavioralAuditConfig => ({
    provider: mode === 'offline' ? 'offline' : 'gemini',
    apiKey: mode === 'offline' ? undefined : apiKey,
    model: mode === 'offline' ? undefined : model.trim(),
    temperature,
    runsPerProbe,
    categories: selectedCategories,
    mode,
  });

  const run = async () => {
    const config = buildConfig();
    if (mode === 'offline') {
      const inputs = probePairs.map((p) => ({
        probePairId: p.id,
        aText: offlineInputs[p.id]?.aText ?? '',
        bText: offlineInputs[p.id]?.bText ?? '',
      }));
      await onRun({ config, inputs });
      return;
    }
    await onRun({ config });
  };

  const applyBundle = (target: 'quick' | 'full' | 'custom') => {
    setBundle(target);
    if (target === 'custom') return;
    const pairs = target === 'quick' ? getQuickAuditProbePairs() : getFullAuditProbePairs();
    const categories = Array.from(new Set(pairs.map((p) => p.categoryId)));
    setSelectedCategories(categories);
  };

  const copyPrompt = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedPromptId(id);
    setTimeout(() => setCopiedPromptId(null), 1400);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-[28px] font-semibold text-[#1d1d1f] dark:text-white mb-2">Behavioral Bias Audit</h2>
        <p className="text-[17px] text-[#86868b]">
          Probe a model with symmetric questions and measure output asymmetry. No training data required.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setMode('online')}
          className={`px-4 py-2 rounded-full text-[13px] border ${
            mode === 'online'
              ? 'bg-[#0071e3] text-white border-[#0071e3]'
              : 'bg-transparent text-[#1d1d1f] dark:text-white border-black/10 dark:border-white/10'
          }`}
        >
          Gemini Test (API)
        </button>
        <button
          type="button"
          onClick={() => setMode('offline')}
          className={`px-4 py-2 rounded-full text-[13px] border ${
            mode === 'offline'
              ? 'bg-[#0071e3] text-white border-[#0071e3]'
              : 'bg-transparent text-[#1d1d1f] dark:text-white border-black/10 dark:border-white/10'
          }`}
        >
          Offline (paste outputs)
        </button>
      </div>

      {mode === 'online' ? (
        <div className="grid gap-4 rounded-[18px] border border-black/10 dark:border-white/10 p-6 bg-white dark:bg-[#1d1d1f]">
          <div className="grid gap-2">
            <Label>Gemini model</Label>
            <input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm bg-transparent"
              placeholder="gemini-1.5-flash"
            />
          </div>
          <div className="grid gap-2">
            <Label>Gemini API key</Label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm bg-transparent"
              placeholder="AIza..."
            />
            <p className="text-xs text-[#86868b]">
              Your key is used only for this run and is never persisted in audit records.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Temperature</Label>
              <input
                type="number"
                min={0}
                max={1}
                step={0.1}
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="w-full rounded-md border px-3 py-2 text-sm bg-transparent"
              />
            </div>
            <div className="grid gap-2">
              <Label>Runs per probe</Label>
              <input
                type="number"
                min={1}
                max={5}
                step={1}
                value={runsPerProbe}
                onChange={(e) => setRunsPerProbe(Number(e.target.value))}
                className="w-full rounded-md border px-3 py-2 text-sm bg-transparent"
              />
              <p className="text-xs text-[#86868b]">For MVP, we still score against run #1; multi-run is stored for later stability scoring.</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="rounded-[18px] border border-black/10 dark:border-white/10 p-6 bg-white dark:bg-[#1d1d1f] space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white">Probe bundle</h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => applyBundle('quick')}
              className={`px-3 py-1 text-[12px] rounded-full border ${bundle === 'quick' ? 'bg-[#0071e3] text-white border-[#0071e3]' : 'border-black/10 dark:border-white/10'}`}
            >
              Quick Audit
            </button>
            <button
              type="button"
              onClick={() => applyBundle('full')}
              className={`px-3 py-1 text-[12px] rounded-full border ${bundle === 'full' ? 'bg-[#0071e3] text-white border-[#0071e3]' : 'border-black/10 dark:border-white/10'}`}
            >
              Full Audit
            </button>
            <button
              type="button"
              onClick={() => applyBundle('custom')}
              className={`px-3 py-1 text-[12px] rounded-full border ${bundle === 'custom' ? 'bg-[#0071e3] text-white border-[#0071e3]' : 'border-black/10 dark:border-white/10'}`}
            >
              Custom
            </button>
          </div>
        </div>
        <p className="text-[12px] text-[#86868b]">
          Quick focuses on high-signal probes across all categories. Full runs the whole prompt library.
        </p>
      </div>

      <div className="rounded-[18px] border border-black/10 dark:border-white/10 p-6 bg-white dark:bg-[#1d1d1f] space-y-4">
        <div>
          <h3 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white">Probe categories</h3>
          <p className="text-[13px] text-[#86868b]">Select what bias dimensions to test.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {PROBE_CATEGORIES.map((c) => {
            const checked = selectedCategories.includes(c.id);
            return (
              <label key={c.id} className="flex gap-3 items-start rounded-xl border border-black/10 dark:border-white/10 p-4 cursor-pointer">
                <Checkbox checked={checked} onCheckedChange={(v) => toggleCategory(c.id, Boolean(v))} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[16px]">{c.emoji}</span>
                    <span className="text-[14px] font-semibold">{c.title}</span>
                  </div>
                  <p className="text-[12px] text-[#86868b] mt-1">{c.description}</p>
                </div>
              </label>
            );
          })}
        </div>
        <div className="text-xs text-[#86868b]">
          Selected probes: <span className="text-[#1d1d1f] dark:text-white font-medium">{probePairs.length}</span>
        </div>
      </div>

      {mode === 'offline' ? (
        <div className="rounded-[18px] border border-black/10 dark:border-white/10 p-6 bg-white dark:bg-[#1d1d1f] space-y-6">
          <div>
            <h3 className="text-[17px] font-semibold text-[#1d1d1f] dark:text-white">Prompt-led probing</h3>
            <p className="text-[13px] text-[#86868b]">
              Copy each prompt pair, run it in your own model environment, then paste outputs below.
            </p>
          </div>
          <div className="space-y-6">
            {probePairs.map((p) => (
              <div key={p.id} className="border border-black/10 dark:border-white/10 rounded-xl p-4 space-y-3">
                <div className="text-[13px] font-semibold">{p.title}</div>
                <div className="grid gap-3 lg:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] uppercase tracking-wider text-[#86868b]">{p.a.label}</div>
                      <button
                        type="button"
                        className="text-[11px] text-[#0071e3] inline-flex items-center gap-1"
                        onClick={() => copyPrompt(`${p.id}:a`, p.a.prompt)}
                      >
                        {copiedPromptId === `${p.id}:a` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copiedPromptId === `${p.id}:a` ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <div className="text-[12px] text-[#86868b]">{p.a.prompt}</div>
                    <textarea
                      value={offlineInputs[p.id]?.aText ?? ''}
                      onChange={(e) =>
                        setOfflineInputs((prev) => ({ ...prev, [p.id]: { aText: e.target.value, bText: prev[p.id]?.bText ?? '' } }))
                      }
                      className="w-full min-h-[120px] rounded-md border px-3 py-2 text-sm bg-transparent"
                      placeholder="Paste model output A..."
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] uppercase tracking-wider text-[#86868b]">{p.b.label}</div>
                      <button
                        type="button"
                        className="text-[11px] text-[#0071e3] inline-flex items-center gap-1"
                        onClick={() => copyPrompt(`${p.id}:b`, p.b.prompt)}
                      >
                        {copiedPromptId === `${p.id}:b` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copiedPromptId === `${p.id}:b` ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <div className="text-[12px] text-[#86868b]">{p.b.prompt}</div>
                    <textarea
                      value={offlineInputs[p.id]?.bText ?? ''}
                      onChange={(e) =>
                        setOfflineInputs((prev) => ({ ...prev, [p.id]: { aText: prev[p.id]?.aText ?? '', bText: e.target.value } }))
                      }
                      className="w-full min-h-[120px] rounded-md border px-3 py-2 text-sm bg-transparent"
                      placeholder="Paste model output B..."
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <Button
        onClick={run}
        disabled={!canRun || isRunning}
        className="w-full h-auto py-4 text-[17px] font-medium rounded-xl bg-[#0071e3] hover:bg-[#0071e3]/90 text-white transition-all disabled:opacity-50"
      >
        {isRunning ? (
          <>
            <Spinner className="mr-2 h-5 w-5" /> Running probe suite...
          </>
        ) : (
          'Run Behavioral Audit'
        )}
      </Button>
    </div>
  );
}

