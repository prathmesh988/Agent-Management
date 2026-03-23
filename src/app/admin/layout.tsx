"use client";

import { AdminSidebar } from '@/components/admin/sidebar';
import { AdminHeader } from '@/components/admin/header';
import { SidebarProvider, useSidebar } from '@/components/admin/sidebar-context';
import { cn } from '@/lib/utils';

function AdminContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  return (
    <div
      className={cn(
        'flex-1 flex flex-col h-full overflow-hidden shadow-[inset_1px_0_0_0_rgba(0,0,0,0.1)] transition-all duration-300',
        collapsed ? 'md:ml-16' : 'md:ml-64'
      )}
    >
      <AdminHeader />
      <main className="flex-1 overflow-auto p-4 md:p-6 min-h-0 bg-slate-50 dark:bg-slate-950">
        {children}
      </main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
        <AdminSidebar />
        <AdminContent>{children}</AdminContent>
      </div>
    </SidebarProvider>
  );
}
