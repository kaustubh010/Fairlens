"use client";

import { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp, AlertTriangle, Lightbulb, Scale } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { AuditResult, AIExplanation } from "@/lib/types";

interface AIExplanationProps {
  auditResult: AuditResult;
  explanation: AIExplanation | null;
  onRequestExplanation: () => void;
  loading: boolean;
}

export function AIExplanationPanel({
  auditResult,
  explanation,
  onRequestExplanation,
  loading,
}: AIExplanationProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    summary: true,
    findings: true,
    legal: false,
    recommendations: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  if (!explanation && !loading) {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI-Powered Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary/50" />
            <h3 className="text-lg font-medium mb-2">Get AI Explanations</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
              Let our AI analyze your fairness metrics and provide detailed explanations,
              legal context, and actionable recommendations.
            </p>
            <Button onClick={onRequestExplanation} className="gap-2">
              <Sparkles className="h-4 w-4" />
              Generate AI Analysis
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI-Powered Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Spinner className="h-8 w-8 mx-auto mb-4 text-primary" />
            <p className="text-sm text-muted-foreground">
              Analyzing fairness metrics with Gemini AI...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI-Powered Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Section */}
        <div className="border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection("summary")}
            className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
          >
            <span className="font-medium">Executive Summary</span>
            {expandedSections.summary ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {expandedSections.summary && (
            <div className="px-4 pb-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {explanation?.summary}
              </p>
            </div>
          )}
        </div>

        {/* Key Findings Section */}
        <div className="border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection("findings")}
            className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
          >
            <span className="font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Key Findings
            </span>
            {expandedSections.findings ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {expandedSections.findings && (
            <div className="px-4 pb-4 space-y-3">
              {explanation?.keyFindings.map((finding, index) => (
                <div
                  key={index}
                  className="flex gap-3 p-3 bg-secondary/30 rounded-lg"
                >
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-medium">
                    {index + 1}
                  </span>
                  <p className="text-sm text-foreground">{finding}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Legal Context Section */}
        <div className="border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection("legal")}
            className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
          >
            <span className="font-medium flex items-center gap-2">
              <Scale className="h-4 w-4 text-primary" />
              Legal & Regulatory Context
            </span>
            {expandedSections.legal ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {expandedSections.legal && (
            <div className="px-4 pb-4">
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {explanation?.legalContext}
              </p>
            </div>
          )}
        </div>

        {/* Recommendations Section */}
        <div className="border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection("recommendations")}
            className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
          >
            <span className="font-medium flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-success" />
              Recommendations
            </span>
            {expandedSections.recommendations ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {expandedSections.recommendations && (
            <div className="px-4 pb-4 space-y-3">
              {explanation?.recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="flex gap-3 p-3 bg-success/5 border border-success/20 rounded-lg"
                >
                  <Lightbulb className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground">{rec}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Technical Details */}
        {explanation?.technicalDetails && (
          <div className="p-4 bg-secondary/30 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Technical Details</h4>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {explanation.technicalDetails}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
