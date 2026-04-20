'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import type { AIExplanation } from '@/lib/fairness/types';
import { Sparkles, Shield, AlertTriangle, CheckCircle, XCircle, ChevronRight, Key } from 'lucide-react';
import { useState } from 'react';

interface AIExplanationPanelProps {
  explanation?: AIExplanation;
  onGenerateExplanation?: (apiKey: string) => Promise<void>;
  isLoading?: boolean;
}

const complianceStyles = {
  compliant: { icon: CheckCircle, className: 'text-emerald-600 bg-emerald-100' },
  at_risk: { icon: AlertTriangle, className: 'text-yellow-600 bg-yellow-100' },
  non_compliant: { icon: XCircle, className: 'text-red-600 bg-red-100' },
};

const riskStyles = {
  low: 'bg-emerald-100 text-emerald-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

export function AIExplanationPanel({
  explanation,
  onGenerateExplanation,
  isLoading = false,
}: AIExplanationPanelProps) {
  const [apiKey, setApiKey] = useState('');
  const [showApiInput, setShowApiInput] = useState(false);

  const handleGenerate = async () => {
    if (apiKey && onGenerateExplanation) {
      await onGenerateExplanation(apiKey);
    }
  };

  if (!explanation && !onGenerateExplanation) {
    return null;
  }

  if (!explanation) {
    return (
      <div className="bg-white dark:bg-[#1d1d1f] rounded-[18px] p-6 sm:p-8 shadow-[0_5px_30px_rgba(0,0,0,0.04)]">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-full bg-indigo-500/10 p-2 text-indigo-500">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="text-[20px] font-semibold tracking-tight text-[#1d1d1f] dark:text-white">AI-Powered Analysis</h3>
          </div>
          <p className="text-[15px] text-[#86868b]">
            Generate plain-language explanations and legal risk assessment using Gemini AI
          </p>
        </div>
        <div>
          {!showApiInput ? (
            <Button
              onClick={() => setShowApiInput(true)}
              className="w-full bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 border-none rounded-xl h-auto py-3 text-[17px] font-medium"
              variant="outline"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Generate AI Explanation
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-[#86868b]" />
                <span className="text-[14px] text-[#86868b]">
                  Enter your Gemini API key to generate explanation
                </span>
              </div>
              <Input
                type="password"
                placeholder="Gemini API Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="rounded-xl h-auto py-3 text-[17px] border-black/10 dark:border-white/10"
              />
              <div className="flex gap-3">
                <Button
                  onClick={handleGenerate}
                  disabled={!apiKey || isLoading}
                  className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl h-auto py-3 text-[17px] font-medium"
                >
                  {isLoading ? (
                    <>
                      <Spinner className="mr-2 h-5 w-5" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Generate
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowApiInput(false)}
                  disabled={isLoading}
                  className="rounded-xl h-auto py-3 text-[17px] font-medium border-black/10 dark:border-white/10"
                >
                  Cancel
                </Button>
              </div>
              <p className="text-[13px] text-[#86868b]">
                Get a free API key at{' '}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-500 hover:text-indigo-600 hover:underline transition-colors"
                >
                  Google AI Studio
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const EeocIcon = complianceStyles[explanation.riskAssessment.eeocCompliance].icon;
  const EuIcon = complianceStyles[explanation.riskAssessment.euAiActCompliance].icon;

  return (
    <div className="bg-white dark:bg-[#1d1d1f] rounded-[18px] shadow-[0_5px_30px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="p-6 sm:p-8 border-b border-black/5 dark:border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-indigo-500/10 p-2 text-indigo-500">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="text-[20px] font-semibold tracking-tight text-[#1d1d1f] dark:text-white">AI-Powered Analysis</h3>
          </div>
          <span className={`rounded-full px-4 py-1.5 text-[14px] font-semibold tracking-wide ${riskStyles[explanation.riskAssessment.overallRisk]}`}>
            {explanation.riskAssessment.overallRisk.charAt(0).toUpperCase() + 
              explanation.riskAssessment.overallRisk.slice(1)} Risk
          </span>
        </div>
      </div>
      <div className="p-6 sm:p-8 space-y-8">
        {/* Executive Summary */}
        <div>
          <h4 className="mb-3 flex items-center gap-2 text-[17px] font-semibold text-[#1d1d1f] dark:text-white tracking-tight">
            <Shield className="h-5 w-5 text-[#86868b]" />
            Executive Summary
          </h4>
          <p className="text-[15px] text-[#424245] dark:text-[#a1a1a6] leading-relaxed">
            {explanation.executiveSummary}
          </p>
        </div>

        {/* Technical Summary */}
        <div>
          <h4 className="mb-3 text-[17px] font-semibold text-[#1d1d1f] dark:text-white tracking-tight">Technical Summary</h4>
          <p className="text-[15px] text-[#424245] dark:text-[#a1a1a6] leading-relaxed">
            {explanation.technicalSummary}
          </p>
        </div>

        {/* Compliance Assessment */}
        <div className="grid grid-cols-2 gap-4">
          <div className={`rounded-2xl p-4 flex flex-col justify-center ${complianceStyles[explanation.riskAssessment.eeocCompliance].className}`}>
            <div className="flex items-center gap-2">
              <EeocIcon className="h-5 w-5" />
              <span className="text-[15px] font-medium tracking-tight">EEOC Compliance</span>
            </div>
            <p className="mt-2 text-[14px] font-medium opacity-80 capitalize">
              {explanation.riskAssessment.eeocCompliance.replace('_', ' ')}
            </p>
          </div>
          <div className={`rounded-2xl p-4 flex flex-col justify-center ${complianceStyles[explanation.riskAssessment.euAiActCompliance].className}`}>
            <div className="flex items-center gap-2">
              <EuIcon className="h-5 w-5" />
              <span className="text-[15px] font-medium tracking-tight">EU AI Act</span>
            </div>
            <p className="mt-2 text-[14px] font-medium opacity-80 capitalize">
              {explanation.riskAssessment.euAiActCompliance.replace('_', ' ')}
            </p>
          </div>
        </div>

        {/* Key Findings */}
        <div>
          <h4 className="mb-3 text-[17px] font-semibold text-[#1d1d1f] dark:text-white tracking-tight">Key Findings</h4>
          <ul className="space-y-3">
            {explanation.keyFindings.map((finding, i) => (
              <li key={i} className="flex items-start gap-3 text-[15px] text-[#424245] dark:text-[#a1a1a6] leading-relaxed">
                <ChevronRight className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-500" />
                {finding}
              </li>
            ))}
          </ul>
        </div>

        {/* Action Items */}
        {explanation.actionItems.length > 0 && (
          <div>
            <h4 className="mb-3 text-[17px] font-semibold text-[#1d1d1f] dark:text-white tracking-tight">Recommended Actions</h4>
            <ol className="space-y-3">
              {explanation.actionItems.map((action, i) => (
                <li key={i} className="flex items-start gap-3 text-[15px]">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-[13px] font-semibold text-indigo-500">
                    {i + 1}
                  </span>
                  <span className="text-[#424245] dark:text-[#a1a1a6] leading-relaxed mt-0.5">{action}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        <div className="pt-4 border-t border-black/5 dark:border-white/5">
          <p className="text-[13px] text-[#86868b]">
            Generated by Gemini AI at {new Date(explanation.generatedAt).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
