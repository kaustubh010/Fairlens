'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { AuditResultsDashboard } from '@/components/fairlens/audit-results-dashboard';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import type { BiasAuditResult } from '@/lib/fairness/types';
import { useAuth } from '@/hooks/useAuth.tsx';

export default function AuditDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, isLoading: authLoading } = useAuth();
  const [audit, setAudit] = useState<BiasAuditResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingExplanation, setIsGeneratingExplanation] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchAudit() {
      if (!user) return;
      try {
        const response = await fetch(`/api/audits/${id}`);
        const data = await response.json();
        
        if (response.ok && data.audit) {
          // Normalize the data format from DB to the frontend type
          const auditData = data.audit;
          setAudit({
            ...auditData,
            metrics: auditData.metrics as any,
            proxyCorrelations: auditData.proxyCorrelations as any,
            groupBreakdown: auditData.groupBreakdown as any,
            representationAnalysis: (auditData.groupBreakdown as any).representationAnalysis || [],
            aiExplanation: auditData.aiExplanation as any,
            recommendations: auditData.recommendations as any || [],
          });
        } else {
          toast({
            title: "Audit not found",
            description: "The audit report you're looking for could not be found.",
            variant: "destructive"
          });
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Failed to fetch audit:', error);
        toast({
          title: "Error",
          description: "An error occurred while loading the audit report.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchAudit();
  }, [id, router, toast]);

  const handleGenerateExplanation = async (apiKey: string) => {
    if (!audit) return;
    setIsGeneratingExplanation(true);
    try {
      const response = await fetch("/api/audits/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditId: audit.id, geminiApiKey: apiKey }),
      });
      const data = await response.json();
      if (response.ok && data.explanation) {
        setAudit({ ...audit, aiExplanation: data.explanation });
        toast({
          title: "Analysis complete",
          description: "AI-powered insights have been generated for this audit.",
        });
      } else {
        throw new Error(data.error || "Failed to generate explanation");
      }
    } catch (error) {
      console.error("Failed to generate AI explanation", error);
      toast({
        title: "Explanation Failed",
        description: error instanceof Error ? error.message : "Failed to generate AI explanation.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingExplanation(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Header />

      <main className="flex-1 bg-[#f5f5f7] dark:bg-black py-12 w-full">
        <div className="container mx-auto px-4 max-w-[1200px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 bg-white dark:bg-[#1d1d1f] rounded-[18px] shadow-[0_5px_30px_rgba(0,0,0,0.04)]">
              <Spinner className="h-16 w-16 mb-8 text-[#0071e3]" />
              <h2 className="text-[28px] font-semibold mb-4 text-[#1d1d1f] dark:text-white tracking-tight">Loading Report</h2>
              <p className="text-[19px] text-[#86868b]">Retrieving audit results and metrics...</p>
            </div>
          ) : audit ? (
            <AuditResultsDashboard 
              audit={audit} 
              onBack={() => router.push('/dashboard')}
              onGenerateExplanation={handleGenerateExplanation}
              isGeneratingExplanation={isGeneratingExplanation}
            />
          ) : null}
        </div>
      </main>

      <Footer />
    </div>
  );
}
