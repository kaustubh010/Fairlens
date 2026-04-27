'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Spinner } from '@/components/ui/spinner';

interface BehavioralAuditSummary {
  id: string;
  createdAt: string;
  overallBss: number;
  probePairsRun: number;
  provider: string;
  model: string | null;
  mode: string;
  categories: Array<{ categoryId: string; title: string; bss: number; probeCount: number }>;
}

export default function BehavioralDashboardPage() {
  const [audits, setAudits] = useState<BehavioralAuditSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/behavioral-audits');
        const data = await res.json();
        if (res.ok) setAudits(data.audits ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Header />
      <main className="flex-1 bg-[#f5f5f7] dark:bg-black py-16 w-full">
        <div className="container mx-auto px-4 max-w-[1024px]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
              <h1 className="text-[40px] leading-[1.1] font-semibold tracking-tight text-[#1d1d1f] dark:text-white mb-2">
                Behavioral Audits
              </h1>
              <p className="text-[19px] text-[#86868b]">Probe-based bias fingerprints and drilldowns</p>
            </div>
            <Link
              href="/behavioral"
              className="bg-[#0071e3] text-white hover:bg-[#0071e3]/90 text-[15px] font-medium py-[10px] px-[20px] rounded-full transition-all inline-flex items-center w-fit"
            >
              New Behavioral Audit
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 bg-white dark:bg-[#1d1d1f] rounded-[18px] border border-black/10 dark:border-white/10">
              <Spinner className="h-10 w-10 text-[#0071e3]" />
            </div>
          ) : audits.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-[#1d1d1f] rounded-[18px] border border-black/10 dark:border-white/10">
              <p className="text-[17px] text-[#86868b] mb-6">No behavioral audits yet.</p>
              <Link href="/behavioral" className="text-[#0066cc] dark:text-[#2997ff] hover:underline">
                Run your first probe suite
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {audits.map((a) => (
                <Link
                  key={a.id}
                  href={`/behavioral-audits/${a.id}`}
                  className="block bg-white dark:bg-[#1d1d1f] p-6 rounded-[18px] border border-black/10 dark:border-white/10 hover:shadow-[0_10px_40px_rgba(0,0,0,0.08)] transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="text-[13px] text-[#86868b]">
                        {new Date(a.createdAt).toLocaleString()} · {a.mode} · {a.model ?? a.provider}
                      </div>
                      <div className="text-[18px] font-semibold text-[#1d1d1f] dark:text-white mt-1">
                        Overall BSS {a.overallBss}/100
                      </div>
                      <div className="text-[13px] text-[#86868b] mt-1">{a.probePairsRun} probe pairs</div>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end">
                      {a.categories.map((c) => (
                        <span
                          key={c.categoryId}
                          className="text-[12px] px-3 py-1 rounded-full border border-black/10 dark:border-white/10 text-[#1d1d1f] dark:text-white"
                        >
                          {c.title}: {c.bss}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

