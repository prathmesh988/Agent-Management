import React from 'react';
import AirvincibleLogo from "../../../public/airvincble.png";
import Image from 'next/image';

// Interface for the component props, allowing dynamic content insertion.
interface CertificateOfEmploymentProps {
  // Dynamic fields marked with brackets in the image
  date: string;
  employeeName: string;
  startDate: string;
  jobTitle: string;
  departmentName: string;
  typeOfEmployment: string;
  salaryAmount: string;
  workHoursPerWeek: string;
  employeeAddressLine1: string; // Corresponds to [Company Address] placeholder in employee section
  employeePostalCode: string;   // Corresponds to [Postal Code] placeholder in employee section

  // Fields with default values from the image, can be overridden
  companyName?: string;
  certificateId?: string;
  certifierName?: string;
  certifierTitle?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactAddressLine1?: string;
  contactAddressLine2?: string;
}

const CertificateOfEmployment: React.FC<CertificateOfEmploymentProps> = ({
  date,
  employeeName,
  startDate,
  jobTitle,
  departmentName,
  typeOfEmployment,
  salaryAmount,
  workHoursPerWeek,
  employeeAddressLine1,
  employeePostalCode,
  companyName = 'Company Name',
  certificateId = 'XXX XXX XXX',
  certifierName = 'SUTTON CLAIRE',
  certifierTitle = 'Company President',
  contactPhone = '+12 123 456 789',
  contactEmail = 'hr@companyname.com',
  contactAddressLine1 = '123 Street, Country',
  contactAddressLine2 = '',
}) => {
  return (
    // Outer container with a light gray background for contrast
    <div className="min-h-screen bg-gray-100 p-4 flex justify-center items-center font-sans">
      {/* 
        Certificate Paper Container:
        - Fixed maximum width to simulate paper size.
        - White background, shadow, and padding.
        - 'relative' and 'overflow-hidden' are for positioning the top-right corner graphic.
      */}
      <div className="bg-white w-full max-w-[800px] p-8 md:p-12 shadow-xl relative overflow-hidden">
        
        {/* --- Top Right Corner Graphic --- */}
        <div className="absolute top-0 right-0 pointer-events-none">
          {/* 
            Replace this SVG with the actual graphic from image_0.png.
            This is a simplified placeholder recreation.
          */}
          <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M200 0L100 100L200 200V0Z" fill="#3B82F6" fillOpacity="0.8"/> {/* Blue triangle */}
            <path d="M200 0L150 50L200 100V0Z" fill="#1F2937"/> {/* Darker triangle */}
            <rect x="130" y="40" width="30" height="30" transform="rotate(45 130 40)" fill="#1F2937"/> {/* Diamond */}
          </svg>
        </div>

        {/* --- Header Section --- */}
        <div className="mb-16">
          <div className="flex items-center mb-6">
            {/* Logo Icon Placeholder */}
            <div className="w-55 h-35 rounded-lg flex items-center justify-center mr-3">
                {/* Replace with actual logo image */}
                <Image src={AirvincibleLogo} alt="Company Logo" className="w-full h-full " />                                    
            </div>
          </div>
          <p className="text-gray-600">Certificate ID: {certificateId}</p>
        </div>

        {/* --- Main Title --- */}
        {/* Using a serif font for the title to match the image's style */}
        <h2 className="text-3xl md:text-4xl font-serif text-center text-gray-900 mb-12 uppercase tracking-wider">
          Certificate of Employment
        </h2>

        {/* --- Body Content --- */}
        <div className="text-gray-800 leading-relaxed space-y-6">
          
          {/* Date and Employee Address Block */}
          <div className="mb-8">
            <p className="mb-1">{date}</p>
            <p className="mb-1">{employeeAddressLine1}</p>
            <p>{employeePostalCode}</p>
          </div>

          {/* Main Certification Text */}
          <p>
            This letter certifies that {employeeName} is employed by Airvincible.
          </p>
          <p>
            {employeeName} has been working for this organization since {startDate} as a {jobTitle}.
          </p>

          {/* Details Grid */}
          {/* Using CSS Grid for aligned key-value pairs */}
          <div className="mt-8 grid grid-cols-[auto_1fr] gap-x-4 gap-y-3">
            <div className="font-medium text-gray-700">Employee position:</div>
            <div>{jobTitle}</div>

            <div className="font-medium text-gray-700">Department:</div>
            <div>{departmentName}</div>

            <div className="font-medium text-gray-700">Hiring date:</div>
            <div>{startDate}</div>

            <div className="font-medium text-gray-700">Position type:</div>
            <div>{typeOfEmployment}</div>

            <div className="font-medium text-gray-700">Annual salary:</div>
            <div>{salaryAmount}</div>

            <div className="font-medium text-gray-700">Average number of work hours:</div>
            <div>{workHoursPerWeek}</div>
          </div>

          {/* Closing Sentence */}
          <p className="mt-8">
            For any additional information, please contact me.
          </p>
        </div>

        {/* --- Footer Section (Signature & Contact) --- */}
        <div className="flex flex-col md:flex-row justify-between items-end mt-20">
          
          {/* Left Side: Certification & Signature */}
          <div className="mb-10 md:mb-0">
            <p className="text-gray-700 mb-6">Certified by:</p>
            
            {/* Signature Placeholder */}
            <div className="mb-2">
              {/* Replace with an <img> tag linking to the actual signature image */}
              <svg width="200" height="60" viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                 <path d="M10 50C30 20 60 55 90 35C120 15 150 45 180 25" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"/>
                 <path d="M120 30C130 50 150 10 160 30" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
                 <line x1="20" y1="45" x2="180" y2="45" stroke="#3B82F6" strokeWidth="1" opacity="0.3" />
              </svg>
            </div>
            
            {/* Name and Title with top border */}
            <div className="border-t border-gray-300 pt-2 w-64">
              <p className="text-lg font-bold text-gray-900 uppercase">{certifierName}</p>
              <p className="text-gray-600">{certifierTitle}</p>
            </div>
          </div>

          {/* Right Side: Contact Information */}
          <div className="text-gray-700 md:text-right">
            <p className="mb-1">
              <span className="font-medium">Phone:</span> {contactPhone}
            </p>
            <p className="mb-1">
              <span className="font-medium">Email:</span>{' '}
              <a href={`mailto:${contactEmail}`} className="text-blue-600 hover:underline">
                {contactEmail}
              </a>
            </p>
            <p className="mb-1">
              <span className="font-medium">Address:</span> {contactAddressLine1}
            </p>
            {contactAddressLine2 && <p>{contactAddressLine2}</p>}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CertificateOfEmployment;