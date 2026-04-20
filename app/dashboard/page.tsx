'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { SeverityBadge } from '@/components/fairlens/severity-badge';
import { Spinner } from '@/components/ui/spinner';
import { FileText, Calendar, Database, ArrowRight, BarChart3, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth.tsx';

interface AuditSummary {
  id: string;
  datasetId: string;
  datasetName: string;
  auditedAt: string;
  overallSeverity: string;
  overallScore: number;
  metricsCount: number;
  passedCount: number;
}

export default function DashboardPage() {
  const [audits, setAudits] = useState<AuditSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchAudits() {
      if (!user) return;
      try {
        const response = await fetch('/api/audits');
        const data = await response.json();
        if (response.ok) {
          setAudits(data.audits);
          console.log(data.audits)
        }
      } catch (error) {
        console.error('Failed to fetch audits:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAudits();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Header />

      <main className="flex-1 bg-[#f5f5f7] dark:bg-black py-16 w-full">
        <div className="container mx-auto px-4 max-w-[1024px]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <h1 className="text-[40px] leading-[1.1] font-semibold tracking-tight text-[#1d1d1f] dark:text-white mb-2">Audit History</h1>
              <p className="text-[19px] text-[#86868b]">View and manage your past fairness evaluations</p>
            </div>
            <Link 
              href="/?action=upload"
              className="bg-[#0071e3] text-white hover:bg-[#0071e3]/90 text-[15px] font-medium py-[10px] px-[20px] rounded-full transition-all inline-flex items-center w-fit"
            >
              New Audit
            </Link>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#1d1d1f] rounded-[18px] shadow-[0_5px_30px_rgba(0,0,0,0.04)]">
              <Spinner className="h-10 w-10 mb-4 text-[#0071e3]" />
              <p className="text-[#86868b]">Loading your audits...</p>
            </div>
          ) : audits.length > 0 ? (
            <div className="space-y-4">
              {audits.map((audit) => (
                <Link 
                  key={audit.id} 
                  href={`/audits/${audit.id}`}
                  className="block bg-white dark:bg-[#1d1d1f] p-6 rounded-[18px] shadow-[0_5px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_40px_rgba(0,0,0,0.08)] transition-all group"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                      <div className="h-12 w-12 rounded-full bg-[#0071e3]/10 flex items-center justify-center">
                        <FileText className="h-6 w-6 text-[#0071e3]" />
                      </div>
                      <div>
                        <h3 className="text-[20px] font-semibold text-[#1d1d1f] dark:text-white group-hover:text-[#0071e3] transition-colors">{audit.datasetName}</h3>
                        <div className="flex items-center gap-4 mt-1 text-[14px] text-[#86868b]">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {format(new Date(audit.auditedAt), 'MMM d, yyyy')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Database className="h-3.5 w-3.5" />
                            {audit.metricsCount} metrics analyzed
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-8">
                      <div className="text-right hidden sm:block">
                        <p className="text-[13px] text-[#86868b] uppercase tracking-wider font-semibold mb-1">Score</p>
                        <p className="text-[24px] font-semibold text-[#1d1d1f] dark:text-white">{audit.overallScore}%</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <p className="text-[13px] text-[#86868b] uppercase tracking-wider font-semibold mb-2">Severity</p>
                        <SeverityBadge severity={audit.overallSeverity} size="sm" />
                      </div>
                      <ArrowRight className="h-5 w-5 text-[#d2d2d7] group-hover:text-[#0071e3] group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white dark:bg-[#1d1d1f] rounded-[18px] shadow-[0_5px_30px_rgba(0,0,0,0.04)]">
              <div className="h-16 w-16 rounded-full bg-[#f5f5f7] dark:bg-black flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="h-8 w-8 text-[#86868b]" />
              </div>
              <h3 className="text-[24px] font-semibold mb-3">No audits yet</h3>
              <p className="text-[17px] text-[#86868b] max-w-[400px] mx-auto mb-8">
                Run your first fairness audit to see detailed metrics and AI-powered insights here.
              </p>
              <Link 
                href="/?action=upload"
                className="bg-[#0071e3] text-white hover:bg-[#0071e3]/90 text-[17px] font-medium py-[12px] px-[24px] rounded-full transition-all inline-flex items-center"
              >
                Start New Audit
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
