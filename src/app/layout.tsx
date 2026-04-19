import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import { AuthProvider } from "@/hooks/useAuth";
import { EmployeeProvider } from "@/hooks/useEmployees";
import { CertificateProvider } from "@/hooks/useCertificates";
import { Providers } from "@/components/providers";
import { RouteProtectionWrapper } from "@/components/route-protection-wrapper";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Agent Management",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${poppins.variable} antialiased`} suppressHydrationWarning>
        <Providers>
          <AuthProvider>
            <RouteProtectionWrapper>
              <EmployeeProvider>
                <CertificateProvider>{children}</CertificateProvider>
              </EmployeeProvider>
            </RouteProtectionWrapper>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
