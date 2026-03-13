'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface ExcelUploadComponentProps {
  onUpload?: (file: File) => void;
  isLoading?: boolean;
}

export function ExcelUploadComponent({
  onUpload,
  isLoading = false,
}: ExcelUploadComponentProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateFile = (file: File): boolean => {
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
    ];

    if (!validTypes.includes(file.type)) {
      setUploadStatus('error');
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      setUploadStatus('error');
      return false;
    }

    return true;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const droppedFile = files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
        setUploadStatus('idle');
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const selectedFile = files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
        setUploadStatus('idle');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploadProgress(0);
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + Math.random() * 30;
      });
    }, 500);

    // Simulate upload completion
    setTimeout(() => {
      clearInterval(interval);
      setUploadProgress(100);
      setUploadStatus('success');
      onUpload?.(file);
      
      setTimeout(() => {
        setFile(null);
        setUploadProgress(0);
        setUploadStatus('idle');
      }, 2000);
    }, 2000);
  };

  return (
    <Card className="p-8">
      <h2 className="text-lg font-semibold text-slate-900 mb-6">Upload Employees</h2>

      {/* Drag and Drop Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-all duration-300 cursor-pointer ${
          dragActive
            ? 'border-blue-500 bg-blue-50 scale-105 shadow-md'
            : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50 hover:shadow-md hover:scale-101'
        }`}
      >
        <Upload className="mx-auto h-12 w-12 text-slate-400 mb-4" />
        <p className="text-lg font-medium text-slate-900">
          Drag and drop your file here
        </p>
        <p className="text-sm text-slate-600 mt-1">
          or click button below to select
        </p>
        <p className="text-xs text-slate-500 mt-3">
          Supported formats: Excel (.xlsx, .xls), CSV
        </p>
        <p className="text-xs text-slate-500">Maximum file size: 5MB</p>

        {/* Hidden Input */}
        <input
          type="file"
          id="file-input"
          onChange={handleChange}
          accept=".xlsx,.xls,.csv"
          className="hidden"
        />
      </div>

      {/* File Selection Button */}
      <div className="mt-6">
        <label htmlFor="file-input">
          <Button
            type="button"
            variant="outline"
            className="w-full transition-all duration-200 hover:shadow-md hover:scale-105"
            onClick={() => document.getElementById('file-input')?.click()}
          >
            Select File
          </Button>
        </label>
      </div>

      {/* Selected File Info */}
      {file && (
        <div className="mt-6 p-4 bg-slate-50 rounded-lg">
          <p className="text-sm font-medium text-slate-900">Selected file:</p>
          <p className="text-sm text-slate-600 mt-1">{file.name}</p>
          <p className="text-xs text-slate-500">
            Size: {(file.size / 1024).toFixed(2)} KB
          </p>
        </div>
      )}

      {/* Upload Progress */}
      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-900">Uploading...</p>
            <p className="text-sm text-slate-600">{Math.round(uploadProgress)}%</p>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Status Messages */}
      {uploadStatus === 'success' && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div>
            <p className="text-sm font-medium text-green-900">Upload successful!</p>
            <p className="text-sm text-green-700">
              {file?.name} has been imported.
            </p>
          </div>
        </div>
      )}

      {uploadStatus === 'error' && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <div>
            <p className="text-sm font-medium text-red-900">Upload failed</p>
            <p className="text-sm text-red-700">
              Please check file format and size (max 5MB)
            </p>
          </div>
        </div>
      )}

      {/* Upload Button */}
      <div className="mt-6">
        <Button
          onClick={handleUpload}
          disabled={!file || isLoading || uploadStatus === 'success'}
          className="w-full transition-all duration-200 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isLoading || uploadProgress > 0 ? 'Uploading...' : 'Upload File'}
        </Button>
      </div>
    </Card>
  );
}
