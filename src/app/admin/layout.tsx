import { AdminSidebar } from '@/components/admin/sidebar';
import { AdminHeader } from '@/components/admin/header';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <AdminSidebar />
      <div className="flex-1 flex flex-col h-full md:ml-64 overflow-hidden shadow-[inset_1px_0_0_0_rgba(0,0,0,0.1)]">
        <AdminHeader />
        <main className="flex-1 overflow-auto p-4 md:p-6 min-h-0">
          {children}
        </main>
      </div>
    </div>
  );
}
