'use client';

import React, { useState } from 'react';
import { Download, AlertCircle, Check } from 'lucide-react';
import { Button } from './button';
import { generateCertificatePDF } from '@/lib/pdf-generator';
import { Certificate } from '@/hooks/useCertificates';

interface DownloadCertificateBtnProps {
  certificate: Certificate;
  className?: string;
}

export const DownloadCertificateBtn: React.FC<DownloadCertificateBtnProps> = ({
  certificate,
  className,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleDownload = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(false);

      await generateCertificatePDF(certificate);

      setSuccess(true);
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate PDF';
      setError(errorMessage);
      console.error('PDF download failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={className}>
      <Button
        onClick={handleDownload}
        disabled={isLoading}
        className={`flex items-center gap-2 ${
          isLoading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        variant={error ? 'destructive' : success ? 'default' : 'default'}
      >
        {isLoading ? (
          <>
            <span className="animate-spin">⏳</span>
            Generating...
          </>
        ) : success ? (
          <>
            <Check className="w-4 h-4" />
            Downloaded
          </>
        ) : error ? (
          <>
            <AlertCircle className="w-4 h-4" />
            Error
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Download PDF
          </>
        )}
      </Button>

      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-700">
            <p className="font-medium">Failed to download PDF</p>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};
