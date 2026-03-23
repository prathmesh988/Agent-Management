'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import {
  LayoutDashboard,
  Users,
  Upload,
  Shield,
  Settings,
  Menu,
  X,
  FileText,
  ChevronLeft,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useSidebar } from './sidebar-context';

const navItems = [
  { title: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { title: 'Employees', href: '/admin/employees', icon: Users },
  { title: 'Upload Employees', href: '/admin/employees/upload', icon: Upload },
  { title: 'Certificates', href: '/admin/certificates', icon: FileText },
  { title: 'Admins', href: '/admin/admins', icon: Shield },
  { title: 'Settings', href: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { collapsed, toggle } = useSidebar();

  return (
    <>
      {/* Mobile hamburger */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden fixed top-4 left-4 z-40"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X /> : <Menu />}
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen bg-gradient-to-b from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 text-white shadow-lg z-30',
          'transform transition-all duration-300 ease-in-out',
          // Desktop: obey collapsed state
          collapsed ? 'md:w-16' : 'md:w-64',
          // Mobile: slide in/out
          mobileOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full md:translate-x-0',
          'pt-16 md:pt-0'
        )}
      >
        {/* Logo + collapse button */}
        <div className={cn('flex items-center border-b border-slate-700 dark:border-slate-800', collapsed ? 'justify-center p-4' : 'justify-between p-4 md:p-6')}>
          {!collapsed && (
            <Image
              src="/airvincble.svg"
              alt="Airvincible Logo"
              width={120}
              height={40}
              className="h-8 w-auto"
            />
          )}
          {/* Desktop collapse toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-700 flex-shrink-0"
            onClick={toggle}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft
              className={cn('h-4 w-4 transition-transform duration-300', collapsed && 'rotate-180')}
            />
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex flex-col space-y-1 p-2 md:p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? item.title : undefined}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                  collapsed ? 'justify-center' : '',
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span className="truncate">{item.title}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-20"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}
