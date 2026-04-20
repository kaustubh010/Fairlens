'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Play, Settings, Shield, X } from 'lucide-react';
import type { DatasetColumn } from '@/lib/fairness/types';

interface DatasetInfo {
  id: string;
  name: string;
  rowCount: number;
  columns: DatasetColumn[];
}

interface AuditConfigFormProps {
  dataset: DatasetInfo;
  onRunAudit: (config: AuditConfigData) => Promise<void>;
  isRunning: boolean;
}

export interface AuditConfigData {
  datasetId: string;
  protectedAttributes: Array<{ column: string; referenceGroup?: string }>;
  outcomeColumn: string;
  predictedColumn?: string;
  probabilityColumn?: string;
  positiveOutcomeValue: string | number;
  geminiApiKey?: string;
}

export function AuditConfigForm({ dataset, onRunAudit, isRunning }: AuditConfigFormProps) {
  const [selectedProtected, setSelectedProtected] = useState<string[]>([]);
  const [referenceGroups, setReferenceGroups] = useState<Record<string, string>>({});
  const [outcomeColumn, setOutcomeColumn] = useState<string>('');
  const [predictedColumn, setPredictedColumn] = useState<string>('');
  const [probabilityColumn, setProbabilityColumn] = useState<string>('');
  const [positiveValue, setPositiveValue] = useState<string>('1');
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Auto-detect columns
  const categoricalColumns = dataset.columns.filter(
    (c) => c.type === 'categorical' || c.type === 'boolean' || (c.type === 'string' && c.uniqueValues <= 20)
  );
  
  const numericOrBinaryColumns = dataset.columns.filter(
    (c) => c.type === 'numeric' || c.type === 'boolean' || c.uniqueValues <= 5
  );

  const probabilityColumns = dataset.columns.filter(
    (c) => c.type === 'numeric' && c.name.toLowerCase().includes('prob')
  );

  // Detect likely protected attributes
  const likelyProtectedKeywords = ['gender', 'sex', 'race', 'ethnicity', 'age', 'religion'];
  const suggestedProtected = categoricalColumns.filter((c) =>
    likelyProtectedKeywords.some((k) => c.name.toLowerCase().includes(k))
  );

  // Detect likely outcome columns
  const outcomeKeywords = ['outcome', 'result', 'hired', 'approved', 'label', 'target', 'decision'];
  const suggestedOutcome = numericOrBinaryColumns.filter((c) =>
    outcomeKeywords.some((k) => c.name.toLowerCase().includes(k))
  );

  // Detect likely prediction columns
  const predictionKeywords = ['predicted', 'pred_', 'prediction', 'score'];
  const suggestedPrediction = numericOrBinaryColumns.filter((c) =>
    predictionKeywords.some((k) => c.name.toLowerCase().includes(k))
  );

  const handleProtectedToggle = (column: string, checked: boolean) => {
    if (checked) {
      setSelectedProtected([...selectedProtected, column]);
    } else {
      setSelectedProtected(selectedProtected.filter((c) => c !== column));
      const newRefs = { ...referenceGroups };
      delete newRefs[column];
      setReferenceGroups(newRefs);
    }
  };

  const getColumnDistribution = (columnName: string) => {
    const col = dataset.columns.find((c) => c.name === columnName);
    return col?.distribution || {};
  };

  const handleSubmit = async () => {
    if (selectedProtected.length === 0 || !outcomeColumn) {
      return;
    }

    const config: AuditConfigData = {
      datasetId: dataset.id,
      protectedAttributes: selectedProtected.map((col) => ({
        column: col,
        referenceGroup: referenceGroups[col],
      })),
      outcomeColumn,
      predictedColumn: predictedColumn || undefined,
      probabilityColumn: probabilityColumn || undefined,
      positiveOutcomeValue: isNaN(Number(positiveValue)) ? positiveValue : Number(positiveValue),
      geminiApiKey: geminiApiKey || undefined,
    };

    await onRunAudit(config);
  };

  const isValid = selectedProtected.length > 0 && outcomeColumn;

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-[28px] font-semibold text-[#1d1d1f] dark:text-white mb-2 flex items-center justify-center gap-2">
          <Settings className="h-6 w-6 text-[#0071e3]" />
          Configure Audit
        </h2>
        <p className="text-[17px] text-[#86868b]">
          Select columns for fairness analysis on {dataset.name}
        </p>
        <div className="mt-4 inline-block bg-[#0071e3]/10 text-[#0071e3] px-3 py-1 rounded-full text-sm font-medium">
          {dataset.rowCount.toLocaleString()} rows detected
        </div>
      </div>
      
      <div className="space-y-8">
        {/* Protected Attributes */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Protected Attributes</Label>
          <p className="text-sm text-muted-foreground">
            Select demographic columns to analyze for bias (e.g., gender, race, age)
          </p>
          
          {suggestedProtected.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground">Suggested:</span>
              {suggestedProtected.map((col) => (
                <Badge
                  key={col.name}
                  variant={selectedProtected.includes(col.name) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() =>
                    handleProtectedToggle(col.name, !selectedProtected.includes(col.name))
                  }
                >
                  {col.name}
                </Badge>
              ))}
            </div>
          )}

          <div className="grid gap-2 rounded-lg border p-3">
            {categoricalColumns.map((col) => (
              <div key={col.name} className="flex items-start gap-3">
                <Checkbox
                  id={`protected-${col.name}`}
                  checked={selectedProtected.includes(col.name)}
                  onCheckedChange={(checked) =>
                    handleProtectedToggle(col.name, checked as boolean)
                  }
                />
                <div className="flex-1">
                  <label
                    htmlFor={`protected-${col.name}`}
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    {col.name}
                  </label>
                  <p className="text-xs text-muted-foreground">
                    {col.uniqueValues} unique values
                    {col.sampleValues && ` (${col.sampleValues.slice(0, 3).join(', ')}...)`}
                  </p>
                </div>
                {selectedProtected.includes(col.name) && (
                  <Select
                    value={referenceGroups[col.name] || ''}
                    onValueChange={(v) =>
                      setReferenceGroups({ ...referenceGroups, [col.name]: v })
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Reference" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(getColumnDistribution(col.name)).map((value) => (
                        <SelectItem key={value} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Outcome Column */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Outcome Column</Label>
          <p className="text-sm text-muted-foreground">
            The actual decision or label column (ground truth)
          </p>
          
          {suggestedOutcome.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground">Suggested:</span>
              {suggestedOutcome.map((col) => (
                <Badge
                  key={col.name}
                  variant={outcomeColumn === col.name ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setOutcomeColumn(col.name)}
                >
                  {col.name}
                </Badge>
              ))}
            </div>
          )}

          <Select value={outcomeColumn} onValueChange={setOutcomeColumn}>
            <SelectTrigger>
              <SelectValue placeholder="Select outcome column" />
            </SelectTrigger>
            <SelectContent>
              {numericOrBinaryColumns.map((col) => (
                <SelectItem key={col.name} value={col.name}>
                  {col.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {outcomeColumn && (
            <div className="flex items-center gap-2">
              <Label className="text-sm">Positive outcome value:</Label>
              <Select value={positiveValue} onValueChange={setPositiveValue}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(getColumnDistribution(outcomeColumn)).map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="true">true</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Advanced Options */}
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="mb-2"
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced Options
          </Button>

          {showAdvanced && (
            <div className="space-y-4 rounded-lg border p-4">
              {/* Prediction Column */}
              <div className="space-y-2">
                <Label>Prediction Column (optional)</Label>
                <p className="text-xs text-muted-foreground">
                  Model predictions for additional metrics
                </p>
                {suggestedPrediction.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    <span className="text-xs text-muted-foreground">Suggested:</span>
                    {suggestedPrediction.map((col) => (
                      <Badge
                        key={col.name}
                        variant={predictedColumn === col.name ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => setPredictedColumn(col.name)}
                      >
                        {col.name}
                      </Badge>
                    ))}
                  </div>
                )}
                <Select value={predictedColumn} onValueChange={setPredictedColumn}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select prediction column" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {numericOrBinaryColumns.map((col) => (
                      <SelectItem key={col.name} value={col.name}>
                        {col.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Probability Column */}
              <div className="space-y-2">
                <Label>Probability Column (optional)</Label>
                <p className="text-xs text-muted-foreground">
                  Model probability scores for calibration analysis
                </p>
                <Select value={probabilityColumn} onValueChange={setProbabilityColumn}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select probability column" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {dataset.columns
                      .filter((c) => c.type === 'numeric')
                      .map((col) => (
                        <SelectItem key={col.name} value={col.name}>
                          {col.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Gemini API Key */}
              <div className="space-y-2">
                <Label>Gemini API Key (optional)</Label>
                <p className="text-xs text-muted-foreground">
                  Enable AI-powered explanations and risk assessment
                </p>
                <input
                  type="password"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="Enter Gemini API key"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Run Audit Button */}
        <div className="pt-6 border-t border-black/10 dark:border-white/10 mt-8">
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isRunning}
            className="w-full h-auto py-4 text-[19px] font-normal rounded-xl bg-[#0071e3] hover:bg-[#0071e3]/90 text-white transition-all disabled:opacity-50 disabled:bg-[#0071e3]"
            size="lg"
          >
            {isRunning ? (
              <>
                <Spinner className="mr-2 h-5 w-5" />
                Running Audit...
              </>
            ) : (
              <>
                <Play className="mr-2 h-5 w-5" />
                Run Fairness Audit
              </>
            )}
          </Button>

          {!isValid && (
            <p className="text-center text-[14px] text-[#86868b] mt-4">
              Select at least one protected attribute and an outcome column to run the audit
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
