import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';
import { createDataset } from '@/lib/fairness/store';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    const fileName = file.name;
    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    
    if (!['csv', 'json'].includes(fileExtension || '')) {
      return NextResponse.json(
        { error: 'Unsupported file format. Please upload CSV or JSON.' },
        { status: 400 }
      );
    }
    
    const text = await file.text();
    let rows: Record<string, unknown>[];
    
    if (fileExtension === 'csv') {
      const parsed = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
      });
      
      if (parsed.errors.length > 0) {
        return NextResponse.json(
          { error: 'CSV parsing error', details: parsed.errors },
          { status: 400 }
        );
      }
      
      rows = parsed.data as Record<string, unknown>[];
    } else {
      try {
        const jsonData = JSON.parse(text);
        rows = Array.isArray(jsonData) ? jsonData : [jsonData];
      } catch {
        return NextResponse.json(
          { error: 'Invalid JSON format' },
          { status: 400 }
        );
      }
    }
    
    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Dataset is empty' },
        { status: 400 }
      );
    }
    
    // Process columns using createDataset
    const tempDataset = createDataset(fileName, rows);
    
    // Save to DB
    const dataset = await prisma.dataset.create({
      data: {
        name: tempDataset.name,
        rawData: rows as any,
        columns: tempDataset.columns as any,
        rowCount: tempDataset.rowCount,
      }
    });
    
    return NextResponse.json({
      success: true,
      dataset: {
        id: dataset.id,
        name: dataset.name,
        rowCount: dataset.rowCount,
        columns: dataset.columns,
        uploadedAt: dataset.uploadedAt,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process file', details: String(error) },
      { status: 500 }
    );
  }
}
