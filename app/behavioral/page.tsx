'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { BehavioralAuditForm } from '@/components/behavioral/behavioral-audit-form';
import { BehavioralAuditResults } from '@/components/behavioral/behavioral-audit-results';
import type { BehavioralAuditConfig, BehavioralAuditResult } from '@/lib/behavioral/types';
import { useToast } from '@/hooks/use-toast';

export default function BehavioralAuditPage() {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [audit, setAudit] = useState<BehavioralAuditResult | null>(null);

  const run = async (payload: { config: BehavioralAuditConfig; inputs?: Array<{ probePairId: string; aText: string; bText: string }> }) => {
    setIsRunning(true);
    setAudit(null);
    try {
      const res = await fetch('/api/behavioral-audits/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          payload.config.mode === 'offline'
            ? { mode: 'offline', config: payload.config, inputs: payload.inputs ?? [] }
            : { mode: 'online', config: payload.config }
        ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Run failed');
      setAudit(data.audit);
      toast({ title: 'Audit complete', description: 'Bias fingerprint generated from probe outputs.' });
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
        <div className="container mx-auto px-4 max-w-[1000px] space-y-10">
          <div className="bg-white dark:bg-[#1d1d1f] p-6 rounded-[18px] border border-black/10 dark:border-white/10">
            <h1 className="text-[28px] font-semibold text-[#1d1d1f] dark:text-white mb-2">FairLens Behavioral Audit</h1>
            <p className="text-[14px] text-[#86868b]">
              Run probes directly with Gemini or copy prompts and paste outputs from any model. Results include
              full formulas, metric explanations, and remediation actions.
            </p>
          </div>
          {!audit ? (
            <div className="bg-white dark:bg-[#1d1d1f] p-8 rounded-[18px] shadow-[0_5px_30px_rgba(0,0,0,0.08)]">
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

