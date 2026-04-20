"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { FileUpload } from "@/components/fairlens/file-upload";
import { AuditConfigForm, AuditConfigData } from "@/components/fairlens/audit-config-form";
import { AuditResultsDashboard } from "@/components/fairlens/audit-results-dashboard";
import { Spinner } from "@/components/ui/spinner";
import {
  ArrowRight,
  BarChart3,
  Shield,
  Sparkles,
  Upload,
  Play,
  Scale,
  FileCheck,
  AlertTriangle,
} from "lucide-react";
import type { BiasAuditResult, DatasetColumn } from "@/lib/fairness/types";
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';

type ViewState = "landing" | "upload" | "config" | "analyzing" | "results";

interface DatasetInfo {
  id: string;
  name: string;
  rowCount: number;
  columns: DatasetColumn[];
}

export default function Home() {
  const [view, setView] = useState<ViewState>("landing");
  const [dataset, setDataset] = useState<DatasetInfo | null>(null);
  const [auditResult, setAuditResult] = useState<BiasAuditResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingExplanation, setIsGeneratingExplanation] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get("action") === "upload") {
        setView("upload");
      }
    }
  }, []);

  const handleUploadComplete = (datasetInfo: DatasetInfo) => {
    setDataset(datasetInfo);
    setView("config");
  };

  const handleRunAudit = async (config: AuditConfigData) => {
    setIsLoading(true);
    setView("analyzing");

    try {
      const response = await fetch("/api/audits/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Audit failed");
      }

      if (data.audit) {
        setAuditResult(data.audit);
        setView("results");
      }
    } catch (error) {
      console.error("Audit failed:", error);
      toast({
        title: "Audit Failed",
        description: error instanceof Error ? error.message : "Failed to run audit",
        variant: "destructive"
      });
      setView("config");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateExplanation = async (apiKey: string) => {
    if (!auditResult) return;
    setIsGeneratingExplanation(true);
    try {
      const response = await fetch("/api/audits/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditId: auditResult.id, geminiApiKey: apiKey }),
      });
      const data = await response.json();
      if (response.ok && data.explanation) {
        setAuditResult({ ...auditResult, aiExplanation: data.explanation });
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

  const resetToLanding = () => {
    setView("landing");
    setAuditResult(null);
    setDataset(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Header onReset={resetToLanding} />

      {view === "landing" && (
        <main className="flex-1 bg-black text-white w-full">
          {/* Hero Section */}
          <section className="relative overflow-hidden w-full flex flex-col items-center justify-center min-h-[90vh] bg-black text-center pt-24 pb-12">
            <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-[#111] pointer-events-none" />
            <div className="relative z-10 container mx-auto px-4 max-w-[980px]">
              <h1 className="text-[56px] leading-[1.07] tracking-[-0.015em] font-semibold mb-4 text-balance">
                See the bias before <br /> it sees people.
              </h1>
              <p className="text-[24px] leading-[1.16667] font-normal tracking-[0.009em] text-[#a1a1a6] mb-12 max-w-[800px] mx-auto text-pretty">
                Detect, measure, and remediate algorithmic discrimination. <br className="hidden md:block"/>
                Advanced statistical fairness metrics and AI-powered explanations, beautifully simplified.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <button
                  onClick={() => setView("upload")}
                  className="bg-[#ffffff] text-black hover:bg-white/90 text-[17px] font-normal py-[14px] px-[28px] rounded-full transition-all"
                >
                  Start your audit
                </button>
                <Link href="#" className="group flex items-center text-[19px] text-[#2997ff] hover:underline">
                  Learn more <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              
              <div className="mt-24 max-w-4xl mx-auto rounded-xl overflow-hidden shadow-[0_10px_60px_rgba(255,255,255,0.05)] border border-white/10 relative h-[400px] bg-[#1d1d1f] flex items-center justify-center">
                <div className="text-center p-8">
                  <Shield className="h-16 w-16 text-[#2997ff] mx-auto mb-4 opacity-80" />
                  <p className="text-white/60 text-lg font-medium">Enterprise-Grade Fairness Dashboard</p>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
              </div>
            </div>
          </section>

          {/* Features Grid - Light Section */}
          <section className="py-32 bg-[#f5f5f7] text-[#1d1d1f] w-full border-t border-[#d2d2d7]">
            <div className="container mx-auto px-4 max-w-[1024px]">
              <div className="text-center mb-20">
                <h2 className="text-[48px] leading-[1.08] tracking-[-0.015em] font-semibold mb-6">
                  Comprehensive auditing. <br/> Radically simple.
                </h2>
                <p className="text-[21px] leading-[1.38] text-[#86868b] max-w-[600px] mx-auto">
                  Industry-standard fairness metrics with clear visualizations and actionable insights.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FeatureCard
                  icon={<BarChart3 className="h-8 w-8 text-[#0071e3]" />}
                  title="Fairness Metrics."
                  description="Disparate impact ratio, statistical parity, equalized odds, and more."
                />
                <FeatureCard
                  icon={<Sparkles className="h-8 w-8 text-[#0071e3]" />}
                  title="AI Explanations."
                  description="Gemini-powered analysis provides clear explanations and recommendations."
                />
                <FeatureCard
                  icon={<Scale className="h-8 w-8 text-[#0071e3]" />}
                  title="Legal Context."
                  description="Aligned with EEOC guidelines, EU AI Act, and industry regulations."
                />
                <FeatureCard
                  icon={<FileCheck className="h-8 w-8 text-[#0071e3]" />}
                  title="Audit Reports."
                  description="Generate comprehensive PDF reports for compliance documentation."
                />
                <FeatureCard
                  icon={<AlertTriangle className="h-8 w-8 text-[#0071e3]" />}
                  title="Risk Assessment."
                  description="Clear pass/fail indicators with severity levels to prioritize efforts."
                />
                <FeatureCard
                  icon={<Shield className="h-8 w-8 text-[#0071e3]" />}
                  title="Privacy First."
                  description="Your data stays securely processed without persistent retention."
                />
              </div>
            </div>
          </section>

          {/* How It Works - Dark Section */}
          <section className="py-32 bg-black text-white w-full border-t border-[#333]">
            <div className="container mx-auto px-4 max-w-[980px]">
              <div className="text-center mb-20">
                <h2 className="text-[48px] leading-[1.08] tracking-[-0.015em] font-semibold mb-6">
                  Three steps to fairness.
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <StepCard
                  step={1}
                  title="Upload Dataset"
                  description="Drop your CSV with model predictions and demographic attributes."
                />
                <StepCard
                  step={2}
                  title="Configure"
                  description="Select the protected attributes and outcome columns you want to audit."
                />
                <StepCard
                  step={3}
                  title="Get Insights"
                  description="Instantly view metrics, AI explanations, and remediation steps."
                />
              </div>
            </div>
          </section>

          {/* CTA Section - Light Section */}
          <section className="py-32 bg-[#f5f5f7] text-[#1d1d1f] w-full border-t border-[#d2d2d7]">
            <div className="container mx-auto px-4 max-w-[800px] text-center">
              <h2 className="text-[48px] leading-[1.08] tracking-[-0.015em] font-semibold mb-8">
                Ready to audit your AI?
              </h2>
              <button 
                onClick={() => setView("upload")} 
                className="bg-[#0071e3] text-white hover:bg-[#0071e3]/90 text-[17px] font-normal py-[14px] px-[28px] rounded-full transition-all inline-flex items-center"
              >
                Start Free Analysis
              </button>
            </div>
          </section>
        </main>
      )}

      {view === "upload" && (
        <main className="flex-1 bg-[#f5f5f7] dark:bg-black py-16 w-full">
          <div className="container mx-auto px-4 max-w-[800px]">
            <button
              onClick={resetToLanding}
              className="text-[#0066cc] dark:text-[#2997ff] text-[17px] flex items-center mb-8 hover:underline"
            >
              <ArrowRight className="h-4 w-4 rotate-180 mr-1" />
              Back
            </button>
            <div className="bg-white dark:bg-[#1d1d1f] p-10 rounded-[18px] shadow-[0_5px_30px_rgba(0,0,0,0.08)]">
              <h2 className="text-[28px] font-semibold text-center mb-8 text-[#1d1d1f] dark:text-white">Upload Dataset</h2>
              <FileUpload onUploadComplete={handleUploadComplete} onError={(err) => toast({ title: "Upload Failed", description: err, variant: "destructive" })} />
            </div>
          </div>
        </main>
      )}

      {view === "config" && dataset && (
        <main className="flex-1 bg-[#f5f5f7] dark:bg-black py-16 w-full">
          <div className="container mx-auto px-4 max-w-[900px]">
            <button
              onClick={() => setView("upload")}
              className="text-[#0066cc] dark:text-[#2997ff] text-[17px] flex items-center mb-8 hover:underline"
            >
              <ArrowRight className="h-4 w-4 rotate-180 mr-1" />
              Back to Upload
            </button>
            <div className="bg-white dark:bg-[#1d1d1f] p-8 md:p-12 rounded-[18px] shadow-[0_5px_30px_rgba(0,0,0,0.08)]">
              <AuditConfigForm
                dataset={dataset}
                onRunAudit={handleRunAudit}
                isRunning={isLoading}
              />
            </div>
          </div>
        </main>
      )}

      {view === "analyzing" && (
        <main className="flex-1 bg-[#f5f5f7] dark:bg-black py-32 w-full flex items-center justify-center">
          <div className="text-center">
            <Spinner className="h-16 w-16 mx-auto mb-8 text-[#0071e3]" />
            <h2 className="text-[28px] font-semibold mb-4 text-[#1d1d1f] dark:text-white">Analyzing Dataset</h2>
            <p className="text-[19px] text-[#86868b]">
              Computing fairness metrics across demographic groups...
            </p>
          </div>
        </main>
      )}

      {view === "results" && auditResult && (
        <main className="flex-1 bg-[#f5f5f7] dark:bg-black py-12 w-full">
          <div className="container mx-auto px-4 max-w-[1200px]">
            <AuditResultsDashboard 
              audit={auditResult} 
              onBack={() => setView("config")}
              onGenerateExplanation={handleGenerateExplanation}
              isGeneratingExplanation={isGeneratingExplanation}
            />
          </div>
        </main>
      )}
      
      {view === "landing" && <Footer />}
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white dark:bg-[#1d1d1f] rounded-[18px] p-8 shadow-[0_5px_30px_rgba(0,0,0,0.04)] border border-transparent hover:shadow-[0_10px_40px_rgba(0,0,0,0.08)] transition-all">
      <div className="mb-6">
        {icon}
      </div>
      <h3 className="text-[21px] font-semibold mb-3">{title}</h3>
      <p className="text-[17px] leading-[1.47] text-[#86868b]">{description}</p>
    </div>
  );
}

function StepCard({
  step,
  title,
  description,
}: {
  step: number;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="text-[#86868b] text-[17px] font-semibold tracking-widest uppercase mb-4">
        Step {step}
      </div>
      <h3 className="text-[28px] font-semibold mb-4 text-white">{title}</h3>
      <p className="text-[17px] leading-[1.47] text-[#a1a1a6]">{description}</p>
    </div>
  );
}
