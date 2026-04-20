// In-memory data store for demo purposes
import { Dataset, BiasAuditResult, DatasetColumn } from './types';

// Global in-memory stores
const datasets = new Map<string, Dataset>();
const audits = new Map<string, BiasAuditResult>();

// Dataset operations
export function storeDataset(dataset: Dataset): void {
  datasets.set(dataset.id, dataset);
}

export function getDataset(id: string): Dataset | undefined {
  return datasets.get(id);
}

export function getAllDatasets(): Dataset[] {
  return Array.from(datasets.values());
}

export function deleteDataset(id: string): boolean {
  return datasets.delete(id);
}

// Audit operations
export function storeAudit(audit: BiasAuditResult): void {
  audits.set(audit.id, audit);
}

export function getAudit(id: string): BiasAuditResult | undefined {
  return audits.get(id);
}

export function getAllAudits(): BiasAuditResult[] {
  return Array.from(audits.values());
}

export function getAuditsForDataset(datasetId: string): BiasAuditResult[] {
  return Array.from(audits.values()).filter(a => a.datasetId === datasetId);
}

export function deleteAudit(id: string): boolean {
  return audits.delete(id);
}

// Profile a dataset column
export function profileColumn(name: string, values: unknown[]): DatasetColumn {
  const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
  const nullCount = values.length - nonNullValues.length;
  
  // Determine type
  let type: DatasetColumn['type'] = 'string';
  const sampleNonNull = nonNullValues.slice(0, 100);
  
  const allNumeric = sampleNonNull.every(v => !isNaN(Number(v)));
  const allBoolean = sampleNonNull.every(v => 
    typeof v === 'boolean' || 
    ['true', 'false', '0', '1', 'yes', 'no'].includes(String(v).toLowerCase())
  );
  
  if (allBoolean && sampleNonNull.length > 0) {
    type = 'boolean';
  } else if (allNumeric && sampleNonNull.length > 0) {
    type = 'numeric';
  } else {
    // Check if categorical (limited unique values)
    const uniqueSet = new Set(nonNullValues.map(v => String(v)));
    if (uniqueSet.size <= 50 || uniqueSet.size / nonNullValues.length < 0.05) {
      type = 'categorical';
    }
  }
  
  // Calculate unique values
  const uniqueSet = new Set(nonNullValues.map(v => String(v)));
  const uniqueValues = uniqueSet.size;
  
  // Get sample values
  const sampleValues = Array.from(uniqueSet).slice(0, 10);
  
  // Calculate distribution for categorical columns
  let distribution: Record<string, number> | undefined;
  if (type === 'categorical' || type === 'boolean') {
    distribution = {};
    for (const v of nonNullValues) {
      const key = String(v);
      distribution[key] = (distribution[key] || 0) + 1;
    }
  }
  
  // Calculate stats for numeric columns
  let stats: DatasetColumn['stats'];
  if (type === 'numeric') {
    const numericValues = nonNullValues.map(v => Number(v)).filter(v => !isNaN(v));
    if (numericValues.length > 0) {
      const sorted = [...numericValues].sort((a, b) => a - b);
      const sum = numericValues.reduce((a, b) => a + b, 0);
      const mean = sum / numericValues.length;
      const variance = numericValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / numericValues.length;
      
      stats = {
        min: sorted[0],
        max: sorted[sorted.length - 1],
        mean,
        median: sorted[Math.floor(sorted.length / 2)],
        stdDev: Math.sqrt(variance),
      };
    }
  }
  
  return {
    name,
    type,
    nullCount,
    uniqueValues,
    sampleValues,
    distribution,
    stats,
  };
}

// Create a dataset from parsed rows
export function createDataset(
  name: string,
  rows: Record<string, unknown>[]
): Dataset {
  if (rows.length === 0) {
    throw new Error('Dataset is empty');
  }
  
  const columnNames = Object.keys(rows[0]);
  const columns = columnNames.map(colName => {
    const values = rows.map(row => row[colName]);
    return profileColumn(colName, values);
  });
  
  return {
    id: `dataset-${Date.now()}`,
    name,
    rows,
    columns,
    rowCount: rows.length,
    uploadedAt: new Date(),
  };
}

// Demo dataset generator
export function generateDemoDataset(): Dataset {
  const rows: Record<string, unknown>[] = [];
  const genders = ['Male', 'Female', 'Non-binary'];
  const races = ['White', 'Black', 'Asian', 'Hispanic', 'Other'];
  const departments = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance'];
  const educationLevels = ['High School', 'Bachelor', 'Master', 'PhD'];
  
  // Generate 1000 synthetic hiring decisions with built-in bias
  for (let i = 0; i < 1000; i++) {
    const gender = genders[Math.floor(Math.random() * genders.length)];
    const race = races[Math.floor(Math.random() * races.length)];
    const department = departments[Math.floor(Math.random() * departments.length)];
    const education = educationLevels[Math.floor(Math.random() * educationLevels.length)];
    const yearsExperience = Math.floor(Math.random() * 20) + 1;
    const interviewScore = Math.floor(Math.random() * 40) + 60; // 60-100
    
    // Inject bias: Male candidates have higher hire rate
    let baseProbability = 0.5;
    if (gender === 'Male') baseProbability += 0.15;
    if (gender === 'Female') baseProbability -= 0.10;
    
    // Inject racial bias
    if (race === 'White') baseProbability += 0.10;
    if (race === 'Black') baseProbability -= 0.15;
    if (race === 'Hispanic') baseProbability -= 0.08;
    
    // Education matters
    if (education === 'PhD') baseProbability += 0.15;
    if (education === 'Master') baseProbability += 0.10;
    if (education === 'Bachelor') baseProbability += 0.05;
    
    // Experience matters
    baseProbability += yearsExperience * 0.01;
    
    // Interview score matters
    baseProbability += (interviewScore - 80) * 0.01;
    
    // Clamp probability
    baseProbability = Math.max(0.1, Math.min(0.9, baseProbability));
    
    const hired = Math.random() < baseProbability ? 1 : 0;
    
    // Model prediction (slightly biased version of actual decision)
    let predProb = baseProbability + (Math.random() - 0.5) * 0.2;
    predProb = Math.max(0, Math.min(1, predProb));
    const predicted = predProb > 0.5 ? 1 : 0;
    
    rows.push({
      candidate_id: `C${String(i + 1).padStart(4, '0')}`,
      gender,
      race,
      department,
      education,
      years_experience: yearsExperience,
      interview_score: interviewScore,
      hired,
      predicted_hired: predicted,
      hire_probability: Number(predProb.toFixed(3)),
    });
  }
  
  return createDataset('Demo Hiring Dataset', rows);
}
