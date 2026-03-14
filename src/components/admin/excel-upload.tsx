"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, CheckCircle, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

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
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateFile = (file: File): boolean => {
    const validTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
    ];

    if (!validTypes.includes(file.type)) {
      setUploadStatus("error");
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      setUploadStatus("error");
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
        setUploadStatus("idle");
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const selectedFile = files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
        setUploadStatus("idle");
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
      setUploadStatus("success");
      onUpload?.(file);

      setTimeout(() => {
        setFile(null);
        setUploadProgress(0);
        setUploadStatus("idle");
      }, 2000);
    }, 2000);
  };

  return (
    <Card className="p-8 bg-gradient-to-b from-slate-50 to-white">
      {/* Drag and Drop Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-16 text-center transition-all duration-300 cursor-pointer ${
          dragActive
            ? "border-blue-500 bg-blue-50 shadow-lg scale-105"
            : "border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50 hover:shadow-md"
        }`}
      >
        <div className="relative inline-block mb-6">
          <div className="absolute inset-0 bg-blue-100 rounded-full opacity-20 blur-xl"></div>
          <Upload className="relative h-16 w-16 text-blue-600" />
        </div>

        <h3 className="text-xl font-bold text-slate-900 mb-2">
          Drag and drop your file here
        </h3>
        <p className="text-sm text-slate-600 mb-1">
          or click the button below to select from your computer
        </p>
        <p className="text-xs text-slate-500 mt-4">
          Supported formats: CSV, Excel (.xlsx, .xls) • Max size: 5MB
        </p>

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
      <div className="mt-8 flex gap-3">
        <label htmlFor="file-input" className="flex-1">
          <Button
            type="button"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all duration-200 hover:shadow-lg hover:scale-105"
            onClick={() => document.getElementById("file-input")?.click()}
          >
            Select File from Computer
          </Button>
        </label>
      </div>

      {/* Selected File Info */}
      {file && (
        <div className="mt-8 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-900">
                File selected
              </p>
              <p className="text-sm text-emerald-700 mt-1">{file.name}</p>
              <p className="text-xs text-emerald-600">
                Size: {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>
            <CheckCircle className="h-6 w-6 text-emerald-600" />
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-900">
              Uploading in progress...
            </p>
            <p className="text-sm font-medium text-blue-600">
              {Math.round(uploadProgress)}%
            </p>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-600 to-emerald-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Status Messages */}
      {uploadStatus === "success" && (
        <div className="mt-8 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-4">
          <CheckCircle className="h-6 w-6 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-900">
              Upload successful! 🎉
            </p>
            <p className="text-sm text-emerald-700 mt-1">
              {file?.name} has been imported successfully.
            </p>
          </div>
        </div>
      )}

      {uploadStatus === "error" && (
        <div className="mt-8 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-4">
          <AlertCircle className="h-6 w-6 text-rose-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-rose-900">Invalid file</p>
            <p className="text-sm text-rose-700 mt-1">
              Please check file format and size. Maximum file size is 5MB
            </p>
          </div>
        </div>
      )}

      {/* Upload Button */}
      <div className="mt-8">
        <Button
          onClick={handleUpload}
          disabled={!file || isLoading || uploadStatus === "success"}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-all duration-200 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isLoading || uploadProgress > 0 ? "Uploading..." : "Upload File"}
        </Button>
      </div>
    </Card>
  );
}
