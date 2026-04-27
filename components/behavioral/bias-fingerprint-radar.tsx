'use client';

import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell,
} from 'recharts';
import type { CategoryScore, ProbePairScore } from '@/lib/behavioral/types';

function bssColor(bss: number) {
  if (bss >= 60) return '#ef4444';   // red  – high
  if (bss >= 35) return '#f59e0b';   // amber – moderate
  return '#22c55e';                   // green – low
}

/** Radar of per-category BSS */
export function BiasFingerprintRadar({ categories }: { categories: CategoryScore[] }) {
  const data = categories.map(c => ({ category: c.title.replace(' ', '\n'), bss: c.bss }));
  return (
    <div className="bg-white dark:bg-[#1d1d1f] rounded-[18px] p-6 border border-black/10 dark:border-white/10">
      <h3 className="text-[17px] font-semibold mb-1">Bias fingerprint radar</h3>
      <p className="text-[12px] text-[#86868b] mb-4">
        Per-category BSS · higher = more asymmetric signal · scored 0–100
      </p>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
            <PolarGrid stroke="rgba(0,0,0,0.1)" />
            <PolarAngleAxis dataKey="category" tick={{ fontSize: 11, fill: '#86868b' }} />
            <Tooltip
              formatter={(v: number) => [`${v}/100`, 'BSS']}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Radar dataKey="bss" stroke="#0071e3" fill="#0071e3" fillOpacity={0.18}
              dot={{ r: 3, fill: '#0071e3', strokeWidth: 0 }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Horizontal bar of category scores */
export function CategoryBssBar({ categories }: { categories: CategoryScore[] }) {
  const sorted = [...categories].sort((a, b) => b.bss - a.bss);
  return (
    <div className="bg-white dark:bg-[#1d1d1f] rounded-[18px] p-6 border border-black/10 dark:border-white/10">
      <h3 className="text-[17px] font-semibold mb-1">Category breakdown</h3>
      <p className="text-[12px] text-[#86868b] mb-5">Sorted by severity · green &lt;35 · amber 35–59 · red ≥60</p>
      <div className="space-y-3">
        {sorted.map(c => (
          <div key={c.categoryId}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[13px] font-medium text-[#1d1d1f] dark:text-white">{c.title}</span>
              <span className="text-[13px] font-bold" style={{ color: bssColor(c.bss) }}>
                {c.bss}/100
              </span>
            </div>
            <div className="h-2 rounded-full bg-black/[0.06] dark:bg-white/[0.08] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${c.bss}%`, backgroundColor: bssColor(c.bss) }}
              />
            </div>
            <div className="text-[11px] text-[#86868b] mt-0.5">{c.probeCount} probe{c.probeCount !== 1 ? 's' : ''}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const DIM_LABELS: Record<string, string> = {
  sentimentDelta: 'Sentiment',
  toneDelta: 'Tone',
  lengthAsymmetry: 'Length',
  hedgeDensityDelta: 'Hedging',
  refusalAsymmetry: 'Refusal',
  genderAttributionDelta: 'Gender',
  moralLanguageDelta: 'Moral lang.',
  agencyDelta: 'Agency',
  qualifierDelta: 'Qualifiers',
  readabilityDelta: 'Readability',
};

/** Dimension breakdown bar chart for a single probe pair */
export function DimensionBreakdownBar({ score }: { score: ProbePairScore }) {
  const data = (Object.keys(DIM_LABELS) as (keyof typeof DIM_LABELS)[]).map(k => ({
    dim: DIM_LABELS[k],
    value: Math.round((score.dimensions as any)[k] * 100),
    flagged: score.flags.some(f => f.startsWith(k.replace('Delta', '').replace('Asymmetry', '').replace('Attribution', ''))),
  }));

  return (
    <div className="h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, bottom: 0, left: 80 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.06)" />
          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} tickLine={false} />
          <YAxis type="category" dataKey="dim" tick={{ fontSize: 11, fill: '#86868b' }} width={78} />
          <Tooltip
            formatter={(v: number) => [`${v}/100`, 'Asymmetry']}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={14}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.value >= 60 ? '#ef4444' : entry.value >= 35 ? '#f59e0b' : '#22c55e'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
