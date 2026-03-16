"use client";

import { useState } from "react";
import { useCertificates, Certificate } from "@/hooks/useCertificates";
import { generateMultipleCertificatePDFs, generateCertificatePDF } from "@/lib/pdf-generator";
import { EditCertificateModal } from "@/components/certificate/edit-certificate-modal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, FileText, Award, Edit2, Trash2 } from "lucide-react";
import Link from "next/link";

// Helper function to get initials
function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

// Helper function to get avatar color
function getAvatarColor(index: number) {
  const colors = [
    "bg-blue-500",
    "bg-emerald-500",
    "bg-purple-500",
    "bg-amber-500",
    "bg-rose-500",
  ];
  return colors[index % colors.length];
}

export default function CertificatesPage() {
  const { certificates, updateCertificate, deleteCertificate } = useCertificates();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingCertificate, setEditingCertificate] = useState<Certificate | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Filter certificates
  const filteredCertificates = certificates.filter(
    (cert) =>
      cert.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.employeeEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.id.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleDownloadCertificate = async (certificateId: string, name: string) => {
    try {
      const cert = certificates.find((c) => c.id === certificateId);
      if (!cert) {
        alert('Certificate not found');
        return;
      }
      
      setIsGenerating(true);
      await generateCertificatePDF(cert);
      console.log(`Successfully downloaded certificate for ${name}`);
    } catch (error) {
      console.error('Error downloading certificate:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to generate PDF: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateSelected = async () => {
    try {
      if (selectedIds.size === 0) {
        alert('Please select at least one certificate');
        return;
      }

      const selectedCerts = certificates.filter((c) => selectedIds.has(c.id));
      setIsGenerating(true);
      await generateMultipleCertificatePDFs(selectedCerts);
      console.log(`Successfully generated ${selectedCerts.length} PDFs`);
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Error generating PDFs:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to generate PDFs: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditCertificate = (certificate: Certificate) => {
    setEditingCertificate(certificate);
    setIsModalOpen(true);
  };

  const handleDeleteCertificate = (certificateId: string, name: string) => {
    if (confirm(`Are you sure you want to delete the certificate for ${name}?`)) {
      deleteCertificate(certificateId);
    }
  };

  const handleSaveEdit = (updatedCertificate: Certificate) => {
    updateCertificate(updatedCertificate);
    setIsModalOpen(false);
    setEditingCertificate(null);
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredCertificates.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCertificates.map((c) => c.id)));
    }
  };

  return (
    <div className="space-y-8">
      {/* Search and Filter - Aligned */}
      <div className="flex gap-4 items-end">
        <div className="space-y-2">
          <label className="text-sm font-500 text-slate-700">Search</label>
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-72 transition-all duration-200"
          />
        </div>
        {searchTerm && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSearchTerm("")}
            className="transition-all duration-200"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Certificates Table */}
      <Card className="border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-600 text-slate-900">
              Certificates ({filteredCertificates.length})
            </h2>
            <Button
              onClick={handleGenerateSelected}
              className="gap-2 transition-all duration-200 bg-blue-600 hover:bg-blue-700 text-white font-500"
              disabled={selectedIds.size === 0 || isGenerating}
            >
              <FileText className="h-4 w-4" />
              {isGenerating ? 'Generating...' : `Generate Selected (${selectedIds.size})`}
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-200 bg-slate-50">
                <TableHead className="w-12 py-4 px-6 text-left">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.size === filteredCertificates.length &&
                      filteredCertificates.length > 0
                    }
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 cursor-pointer"
                  />
                </TableHead>
                <TableHead className="py-4 px-6 text-left font-500 text-slate-700 text-sm">
                  Employee
                </TableHead>
                <TableHead className="py-4 px-6 text-left font-500 text-slate-700 text-sm">
                  Department
                </TableHead>
                <TableHead className="py-4 px-6 text-left font-500 text-slate-700 text-sm">
                  Job Title
                </TableHead>
                <TableHead className="py-4 px-6 text-left font-500 text-slate-700 text-sm">
                  Start Date
                </TableHead>
                <TableHead className="py-4 px-6 text-right font-500 text-slate-700 text-sm">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCertificates.map((cert, idx) => (
                <TableRow
                  key={cert.id}
                  className="border-b border-slate-100 transition-colors duration-200 hover:bg-slate-50"
                >
                  <TableCell className="py-4 px-6 text-left">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(cert.id)}
                      onChange={() => toggleSelection(cert.id)}
                      className="rounded border-slate-300 cursor-pointer"
                    />
                  </TableCell>
                  <TableCell className="py-4 px-6 text-left">
                    <div className="flex items-center gap-3">
                      <div
                        className={`shrink-0 h-10 w-10 rounded-full ${getAvatarColor(idx)} flex items-center justify-center text-white text-sm font-700`}
                      >
                        {getInitials(cert.employeeName)}
                      </div>
                      <div>
                        <p className="font-600 text-slate-900 text-sm leading-tight">
                          {cert.employeeName}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {cert.employeeEmail}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-6 text-left text-sm text-slate-700">
                    {cert.department}
                  </TableCell>
                  <TableCell className="py-4 px-6 text-left text-sm text-slate-700">
                    {cert.jobTitle}
                  </TableCell>
                  <TableCell className="py-4 px-6 text-left text-sm text-slate-600">
                    {cert.startDate}
                  </TableCell>
                  <TableCell className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/certificates/${cert.id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200"
                          title="View Certificate"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownloadCertificate(cert.id, cert.employeeName)}
                        disabled={isGenerating}
                        className="h-9 w-9 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors duration-200"
                        title="Download PDF"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditCertificate(cert)}
                        className="h-9 w-9 text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors duration-200"
                        title="Edit Certificate"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          handleDeleteCertificate(cert.id, cert.employeeName)
                        }
                        className="h-9 w-9 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors duration-200"
                        title="Delete Certificate"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredCertificates.length === 0 && (
          <div className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-700 font-500">No certificates found</p>
            <p className="text-sm text-slate-500 mt-1">
              {searchTerm ? "Try a different search term" : "Create certificates for employees"}
            </p>
          </div>
        )}
      </Card>

      {/* Edit Modal */}
      <EditCertificateModal
        certificate={editingCertificate}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCertificate(null);
        }}
        onSave={handleSaveEdit}
      />
    </div>
  );
}
