'use client';

import { useState, useEffect } from 'react';
import { Certificate } from '@/hooks/useCertificates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X } from 'lucide-react';

interface EditCertificateModalProps {
  certificate: Certificate | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (certificate: Certificate) => void;
}

const employmentTypes = ['Full-time', 'Part-time', 'Contract', 'Temporary'];

export function EditCertificateModal({
  certificate,
  isOpen,
  onClose,
  onSave,
}: EditCertificateModalProps) {
  const [formData, setFormData] = useState<Certificate>(
    certificate || {
      id: '',
      employeeName: '',
      employeeEmail: '',
      department: '',
      jobTitle: '',
      startDate: '',
      typeOfEmployment: 'Full-time',
      salary: '',
      workHoursPerWeek: '',
      phone: '',
      address: '',
      companyName: '',
      certificateId: '',
      certifierName: '',
      certifierTitle: '',
      contactPhone: '',
      contactEmail: '',
      contactAddressLine1: '',
      contactAddressLine2: '',
    }
  );

  // Autofill form when certificate changes
  useEffect(() => {
    if (certificate) {
      setFormData(certificate);
    }
  }, [certificate]);

  if (!isOpen || !certificate) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (
      !formData.employeeName ||
      !formData.employeeEmail ||
      !formData.department ||
      !formData.jobTitle
    ) {
      alert('Please fill in all required fields');
      return;
    }

    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto">
      <Card className="w-full max-w-2xl mx-4 shadow-xl my-8">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Edit Certificate</h2>
            <button
              onClick={onClose}
              className="text-slate-600 hover:text-slate-900 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Employee Information Section */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-slate-900 mb-3">Employee Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Employee Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Employee Name *
                  </label>
                  <Input
                    type="text"
                    name="employeeName"
                    value={formData.employeeName}
                    onChange={handleChange}
                    placeholder="John Doe"
                    required
                  />
                </div>

                {/* Employee Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email *
                  </label>
                  <Input
                    type="email"
                    name="employeeEmail"
                    value={formData.employeeEmail}
                    onChange={handleChange}
                    placeholder="john@company.com"
                    required
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Department *
                  </label>
                  <Input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    placeholder="Engineering"
                    required
                  />
                </div>

                {/* Job Title */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Job Title *
                  </label>
                  <Input
                    type="text"
                    name="jobTitle"
                    value={formData.jobTitle}
                    onChange={handleChange}
                    placeholder="Senior Developer"
                    required
                  />
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Start Date
                  </label>
                  <Input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                  />
                </div>

                {/* Employment Type */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Employment Type
                  </label>
                  <Select
                    value={formData.typeOfEmployment}
                    onValueChange={(value) =>
                      handleSelectChange('typeOfEmployment', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {employmentTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Salary */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Salary
                  </label>
                  <Input
                    type="text"
                    name="salary"
                    value={formData.salary}
                    onChange={handleChange}
                    placeholder="$95,000 per annum"
                  />
                </div>

                {/* Work Hours */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Work Hours Per Week
                  </label>
                  <Input
                    type="text"
                    name="workHoursPerWeek"
                    value={formData.workHoursPerWeek}
                    onChange={handleChange}
                    placeholder="40 hours"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Phone
                  </label>
                  <Input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1234567890"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Address
                  </label>
                  <Input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="123 Employee Street"
                  />
                </div>
              </div>
            </div>

            {/* Company Information Section */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-slate-900 mb-3">Company Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Company Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Company Name
                  </label>
                  <Input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="Company Name"
                  />
                </div>

                {/* Certificate ID */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Certificate ID
                  </label>
                  <Input
                    type="text"
                    name="certificateId"
                    value={formData.certificateId}
                    onChange={handleChange}
                    placeholder="CERT-001"
                  />
                </div>

                {/* Certifier Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Certifier Name
                  </label>
                  <Input
                    type="text"
                    name="certifierName"
                    value={formData.certifierName}
                    onChange={handleChange}
                    placeholder="John Smith"
                  />
                </div>

                {/* Certifier Title */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Certifier Title
                  </label>
                  <Input
                    type="text"
                    name="certifierTitle"
                    value={formData.certifierTitle}
                    onChange={handleChange}
                    placeholder="HR Manager"
                  />
                </div>

                {/* Contact Phone */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Contact Phone
                  </label>
                  <Input
                    type="tel"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    placeholder="+1234567890"
                  />
                </div>

                {/* Contact Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Contact Email
                  </label>
                  <Input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    placeholder="hr@company.com"
                  />
                </div>

                {/* Contact Address Line 1 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Contact Address Line 1
                  </label>
                  <Input
                    type="text"
                    name="contactAddressLine1"
                    value={formData.contactAddressLine1}
                    onChange={handleChange}
                    placeholder="123 Company Street"
                  />
                </div>

                {/* Contact Address Line 2 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Contact Address Line 2
                  </label>
                  <Input
                    type="text"
                    name="contactAddressLine2"
                    value={formData.contactAddressLine2}
                    onChange={handleChange}
                    placeholder="City, State 12345"
                  />
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
