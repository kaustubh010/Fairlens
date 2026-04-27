"use client";

import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ArrowRight, Shield, BookOpenText, ListChecks } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Header />
      <main className="flex-1 bg-black text-white">
        <section className="relative overflow-hidden pt-24 pb-20 border-b border-white/10">
          <div className="absolute inset-0 bg-linear-to-b from-black via-black to-[#111]" />
          <div className="relative z-10 container mx-auto px-4 max-w-[980px] text-center">
            <p className="text-[11px] tracking-[0.2em] uppercase text-[#86868b] mb-4">FairLens · Behavioral Audit</p>
            <h1 className="text-[56px] leading-[1.05] tracking-[-0.02em] font-semibold mb-6">
              Probe the model.
              <br />
              Not the training data.
            </h1>
            <p className="text-[22px] text-[#a1a1a6] leading-[1.35] max-w-[850px] mx-auto mb-10">
              Audit bias by running symmetric prompts, comparing responses, and generating a transparent
              bias fingerprint with formulas, caveats, and remediation guidance.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/behavioral" className="bg-white text-black text-[16px] px-6 py-3 rounded-full hover:bg-white/90 inline-flex items-center">
                Run Gemini Audit <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link href="/prompts" className="border border-white/20 text-white text-[16px] px-6 py-3 rounded-full hover:bg-white/10">
                Prompt Library
              </Link>
              <Link href="/methodology" className="border border-white/20 text-white text-[16px] px-6 py-3 rounded-full hover:bg-white/10">
                Methodology
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-[#f5f5f7] text-[#1d1d1f] py-20">
          <div className="container mx-auto px-4 max-w-[1024px] grid md:grid-cols-3 gap-6">
            <Card icon={<Shield className="h-7 w-7 text-[#0071e3]" />} title="Behavioral-first">
              No CSV uploads. Test any model by probing responses directly.
            </Card>
            <Card icon={<BookOpenText className="h-7 w-7 text-[#0071e3]" />} title="Transparent scoring">
              Full formulas, metric thresholds, caveats, and interpretation dialogs.
            </Card>
            <Card icon={<ListChecks className="h-7 w-7 text-[#0071e3]" />} title="Actionable fixes">
              Category-specific remediation guidance and technical/executive exports.
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function Card({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[18px] p-8 border border-black/10 shadow-[0_5px_30px_rgba(0,0,0,0.04)]">
      <div className="mb-4">{icon}</div>
      <h3 className="text-[20px] font-semibold mb-2">{title}</h3>
      <p className="text-[15px] text-[#666] leading-normal">{children}</p>
    </div>
  );
}
