'use client';

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { MethodologyDialog } from '@/components/behavioral/methodology-dialog';
import { SCORING_FORMULAS } from '@/lib/behavioral/scoring';

export default function MethodologyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Header />
      <main className="flex-1 bg-[#f5f5f7] dark:bg-black py-12">
        <div className="container mx-auto px-4 max-w-[980px] space-y-6">
          <div className="bg-white dark:bg-[#1d1d1f] rounded-[18px] p-8 border border-black/10 dark:border-white/10">
            <h1 className="text-[30px] font-semibold mb-2">FairLens Scoring Methodology</h1>
            <p className="text-[14px] text-[#86868b]">
              This page describes exactly how FairLens computes bias asymmetry from paired outputs.
            </p>
            <div className="mt-4">
              <MethodologyDialog />
            </div>
          </div>

          <div className="bg-white dark:bg-[#1d1d1f] rounded-[18px] p-8 border border-black/10 dark:border-white/10">
            <h2 className="text-[20px] font-semibold mb-3">Formula reference</h2>
            <ul className="space-y-2 text-[14px] text-[#555] dark:text-[#ccc]">
              <li>Sentiment delta: <code>{SCORING_FORMULAS.sentimentDelta}</code></li>
              <li>Tone delta: <code>{SCORING_FORMULAS.toneDelta}</code></li>
              <li>Length asymmetry: <code>{SCORING_FORMULAS.lengthAsymmetry}</code></li>
              <li>Hedge asymmetry: <code>{SCORING_FORMULAS.hedgeAsymmetry}</code></li>
              <li>Refusal asymmetry: <code>{SCORING_FORMULAS.refusalAsymmetry}</code></li>
              <li>Gender attribution delta: <code>{SCORING_FORMULAS.genderAttributionDelta}</code></li>
              <li>Composite BSS: <code>{SCORING_FORMULAS.bss}</code></li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

