import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Employee Onboarding | HRMS',
  description: 'Complete your onboarding by filling in your personal, bank, and address details.',
};

export default function OnboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
