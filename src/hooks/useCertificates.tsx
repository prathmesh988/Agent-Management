"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { Certificate } from "@/lib/types";
import { getCertificates, updateCertificateAction } from "@/app/(actions)/certificates";

// Re-export Certificate type for backward compatibility
export type { Certificate };

interface CertificateContextType {
  certificates: Certificate[];
  getCertificate: (id: string) => Certificate | undefined;
  updateCertificate: (certificate: Certificate) => void;
  deleteCertificate: (id: string) => void;
  isLoading: boolean;
}

const CertificateContext = createContext<CertificateContextType | undefined>(
  undefined,
);

export function CertificateProvider({ children }: { children: ReactNode }) {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch certificates from database on mount
  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const { certificates: fetchedCertificates } = await getCertificates(
          100,
          0,
        );
        setCertificates(fetchedCertificates);
      } catch (error) {
        console.error("Failed to fetch certificates:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCertificates();
  }, []);

  const getCertificate = (id: string): Certificate | undefined => {
    return certificates.find((c) => c.id === id);
  };

  const updateCertificate = async (updatedCertificate: Certificate) => {
    try {
      // Update in database via server action
      if (updatedCertificate.id) {
        await updateCertificateAction(updatedCertificate.id, updatedCertificate);
      }
      
      // Update local state
      setCertificates((prev) =>
        prev.map((c) =>
          c.id === updatedCertificate.id ? updatedCertificate : c,
        ),
      );
    } catch (error) {
      console.error("Error updating certificate:", error);
      throw error;
    }
  };

  const deleteCertificate = (id: string) => {
    setCertificates((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <CertificateContext.Provider
      value={{
        certificates,
        getCertificate,
        updateCertificate,
        deleteCertificate,
        isLoading,
      }}
    >
      {children}
    </CertificateContext.Provider>
  );
}

export function useCertificates() {
  const context = useContext(CertificateContext);
  if (!context) {
    throw new Error("useCertificates must be used within CertificateProvider");
  }
  return context;
}
