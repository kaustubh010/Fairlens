'use client';

import { useCallback, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Upload, FileSpreadsheet, X, CheckCircle } from 'lucide-react';

interface FileUploadProps {
  onUploadComplete: (dataset: {
    id: string;
    name: string;
    rowCount: number;
    columns: Array<{
      name: string;
      type: string;
      uniqueValues: number;
      nullCount: number;
    }>;
  }) => void;
  onError?: (error: string) => void;
}

export function FileUpload({ onUploadComplete, onError }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        await uploadFile(files[0]);
      }
    },
    []
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        await uploadFile(files[0]);
      }
    },
    []
  );

  const uploadFile = async (file: File) => {
    const validTypes = ['text/csv', 'application/json'];
    const validExtensions = ['.csv', '.json'];
    
    const hasValidExtension = validExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );
    
    if (!validTypes.includes(file.type) && !hasValidExtension) {
      onError?.('Please upload a CSV or JSON file');
      return;
    }

    setIsUploading(true);
    setUploadedFile(file.name);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/datasets/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      onUploadComplete(data.dataset);
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Upload failed');
      setUploadedFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  if (uploadedFile && !isUploading) {
    return (
      <div className="bg-[#34c759]/10 rounded-[18px] p-6 border border-[#34c759]/20 flex items-center justify-between shadow-[0_5px_30px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-4">
          <div className="bg-white rounded-full p-2 shadow-sm">
            <CheckCircle className="h-6 w-6 text-[#34c759]" />
          </div>
          <div>
            <p className="font-medium text-[17px] text-[#1d1d1f] dark:text-white">{uploadedFile}</p>
            <p className="text-[14px] text-[#86868b]">Dataset loaded successfully</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setUploadedFile(null)}
          className="text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 rounded-full"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-[18px] transition-all duration-200 ease-in-out ${
          isDragging
            ? 'border-[#0071e3] bg-[#0071e3]/5 scale-[1.02]'
            : 'border-black/10 dark:border-white/10 hover:border-[#0071e3]/50 hover:bg-black/5 dark:hover:bg-white/5'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          {isUploading ? (
            <div className="flex flex-col items-center gap-4">
              <Spinner className="h-10 w-10 text-[#0071e3]" />
              <p className="text-[17px] text-[#86868b]">Processing {uploadedFile}...</p>
            </div>
          ) : (
            <>
              <div className="mb-6 rounded-full bg-[#0071e3]/10 p-4">
                <Upload className="h-8 w-8 text-[#0071e3]" />
              </div>
              <h3 className="mb-2 text-[24px] font-semibold tracking-tight text-[#1d1d1f] dark:text-white">Upload your dataset</h3>
              <p className="mb-8 text-[17px] text-[#86868b] max-w-[300px]">
                Drag and drop a CSV or JSON file, or click to browse
              </p>
              <label>
                <input
                  type="file"
                  accept=".csv,.json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button asChild variant="outline" className="cursor-pointer rounded-full px-6 py-2 border-[#0071e3] text-[#0071e3] hover:bg-[#0071e3]/10 h-auto">
                  <span>
                    <FileSpreadsheet className="mr-2 h-5 w-5" />
                    Select File
                  </span>
                </Button>
              </label>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
