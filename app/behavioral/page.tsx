'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { BehavioralAuditForm } from '@/components/behavioral/behavioral-audit-form';
import { BehavioralAuditResults } from '@/components/behavioral/behavioral-audit-results';
import type { BehavioralAuditConfig, BehavioralAuditResult } from '@/lib/behavioral/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

export default function BehavioralAuditPage() {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [audit, setAudit] = useState<BehavioralAuditResult | null>(null);

  const run = async (payload: {
    config: BehavioralAuditConfig;
    inputs: Array<{ probePairId: string; aText: string; bText: string }>;
  }) => {
    setIsRunning(true);
    setAudit(null);
    try {
      const res = await fetch('/api/behavioral-audits/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: payload.config, inputs: payload.inputs }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Run failed');
      setAudit(data.audit);
      toast({
        title: 'Audit complete',
        description: `Overall BSS: ${data.audit.overallBss}/100 · ${data.audit.probeScores.filter((p: any) => p.flags.length > 0).length} probes flagged`,
      });
    } catch (e) {
      toast({
        title: 'Audit failed',
        description: e instanceof Error ? e.message : 'Failed to run behavioral audit',
        variant: 'destructive',
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Header />
      <main className="flex-1 bg-[#f5f5f7] dark:bg-black py-12 w-full">
        <div className="container mx-auto px-4 max-w-[1000px] space-y-8">

          {/* Page header */}
          <div className="bg-white dark:bg-[#1d1d1f] p-6 rounded-[18px] border border-black/10 dark:border-white/10 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-[24px] font-semibold text-[#1d1d1f] dark:text-white">
                FairLens Behavioral Audit
              </h1>
              <p className="text-[13px] text-[#86868b] mt-0.5">
                Paste model outputs → score with real NLP → interpret with AI
              </p>
            </div>
            {audit && (
              <Button
                variant="outline"
                className="rounded-full text-[13px] flex-shrink-0"
                onClick={() => setAudit(null)}
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> New audit
              </Button>
            )}
          </div>

          {/* Form or Results */}
          {!audit ? (
            <div className="bg-white dark:bg-[#1d1d1f] p-8 rounded-[18px] shadow-[0_5px_30px_rgba(0,0,0,0.06)]">
              <BehavioralAuditForm onRun={run} isRunning={isRunning} />
            </div>
          ) : (
            <BehavioralAuditResults audit={audit} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
