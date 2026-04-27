'use client';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { PROBE_CATEGORIES, PROBE_PAIRS } from '@/lib/behavioral/probes';
import { useMemo, useState } from 'react';
import type { BiasCategory } from '@/lib/behavioral/types';
import { Copy, Check } from 'lucide-react';

export default function PromptsPage() {
  const [category, setCategory] = useState<BiasCategory | 'all'>('all');
  const [copied, setCopied] = useState<string | null>(null);
  const visible = useMemo(
    () => (category === 'all' ? PROBE_PAIRS : PROBE_PAIRS.filter((p) => p.categoryId === category)),
    [category]
  );

  const copy = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1200);
  };

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Header />
      <main className="flex-1 bg-[#f5f5f7] dark:bg-black py-12">
        <div className="container mx-auto px-4 max-w-[1000px] space-y-6">
          <div className="bg-white dark:bg-[#1d1d1f] rounded-[18px] p-6 border border-black/10 dark:border-white/10">
            <h1 className="text-[28px] font-semibold mb-2">Prompt Library</h1>
            <p className="text-[14px] text-[#86868b]">
              Use these symmetric probes directly in your model UI/API, then paste outputs into FairLens for scoring.
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              className={`px-3 py-1 rounded-full border text-[12px] ${category === 'all' ? 'bg-[#0071e3] text-white border-[#0071e3]' : 'border-black/10 dark:border-white/10'}`}
              onClick={() => setCategory('all')}
            >
              All
            </button>
            {PROBE_CATEGORIES.map((c) => (
              <button
                key={c.id}
                className={`px-3 py-1 rounded-full border text-[12px] ${category === c.id ? 'bg-[#0071e3] text-white border-[#0071e3]' : 'border-black/10 dark:border-white/10'}`}
                onClick={() => setCategory(c.id)}
              >
                {c.title}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {visible.map((p) => (
              <div key={p.id} className="bg-white dark:bg-[#1d1d1f] rounded-[18px] p-6 border border-black/10 dark:border-white/10">
                <h3 className="text-[16px] font-semibold">{p.title}</h3>
                <p className="text-[13px] text-[#86868b] mt-1">{p.rationale}</p>
                <div className="grid lg:grid-cols-2 gap-4 mt-4">
                  <PromptBox
                    label={p.a.label}
                    prompt={p.a.prompt}
                    copied={copied === `${p.id}:a`}
                    onCopy={() => copy(`${p.id}:a`, p.a.prompt)}
                  />
                  <PromptBox
                    label={p.b.label}
                    prompt={p.b.prompt}
                    copied={copied === `${p.id}:b`}
                    onCopy={() => copy(`${p.id}:b`, p.b.prompt)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function PromptBox({
  label,
  prompt,
  copied,
  onCopy,
}: {
  label: string;
  prompt: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10 p-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[11px] uppercase tracking-wider text-[#86868b]">{label}</span>
        <button className="text-[12px] text-[#0071e3] inline-flex items-center gap-1" onClick={onCopy}>
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <p className="text-[13px] text-[#1d1d1f] dark:text-white">{prompt}</p>
    </div>
  );
}

