'use client';

import { useEffect, useState, use } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Spinner } from '@/components/ui/spinner';
import type { BehavioralAuditResult } from '@/lib/behavioral/types';
import { BehavioralAuditResults } from '@/components/behavioral/behavioral-audit-results';
import Link from 'next/link';

export default function BehavioralAuditDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [audit, setAudit] = useState<BehavioralAuditResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/behavioral-audits/${id}`);
        const data = await res.json();
        if (res.ok) setAudit(data.audit);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Header />
      <main className="flex-1 bg-[#f5f5f7] dark:bg-black py-12 w-full">
        <div className="container mx-auto px-4 max-w-[1000px] space-y-6">
          <Link href="/behavioral-dashboard" className="text-[#0066cc] dark:text-[#2997ff] hover:underline text-[14px]">
            Back to Behavioral Dashboard
          </Link>
          {loading ? (
            <div className="flex items-center justify-center py-20 bg-white dark:bg-[#1d1d1f] rounded-[18px] border border-black/10 dark:border-white/10">
              <Spinner className="h-12 w-12 text-[#0071e3]" />
            </div>
          ) : audit ? (
            <BehavioralAuditResults audit={audit} />
          ) : (
            <div className="bg-white dark:bg-[#1d1d1f] rounded-[18px] p-8 border border-black/10 dark:border-white/10">
              <h2 className="text-[20px] font-semibold">Audit not found</h2>
              <p className="text-[14px] text-[#86868b] mt-2">
                This MVP stores behavioral audits in memory. If the server restarted, history is cleared.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

