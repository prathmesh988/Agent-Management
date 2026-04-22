'use client';

import { usePathname, useRouter } from 'next/navigation';
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
  Calendar,
  Clock,
  Banknote,
  Crown,
  Eye,
  UserPlus,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useSidebar } from './sidebar-context';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/components/ui/toast';
import { isProtectedRoute } from '@/lib/route-protection';

// ─── Nav items with optional role restriction ───────────────────────────────
// Uses isProtectedRoute utility to determine requiresAdmin status
const navItems = [
  { title: 'Dashboard',        href: '/admin/dashboard',        icon: LayoutDashboard },
  { title: 'Employees',        href: '/admin/employees',         icon: Users },
  { title: 'Attendance',       href: '/admin/attendance',        icon: Calendar },
  { title: 'Leave',            href: '/admin/leave',             icon: Clock },
  { title: 'Payroll',          href: '/admin/payroll',           icon: Banknote },
  { title: 'Onboarding',       href: '/admin/onboarding',        icon: UserPlus },
  { title: 'Upload Employees', href: '/admin/employees/upload',  icon: Upload },
  { title: 'Certificates',     href: '/admin/certificates',      icon: FileText },
  { title: 'Admins',           href: '/admin/admins',            icon: Shield },
  { title: 'Settings',         href: '/admin/settings',          icon: Settings },
].map((item) => ({
  ...item,
  requiresAdmin: isProtectedRoute(item.href)?.requiresAdmin ?? false,
}));

// ─── Role badge config ───────────────────────────────────────────────────────
const ROLE_CONFIG = {
  admin: {
    label: 'Admin',
    icon: Crown,
    colors: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-400/30',
    dot: 'bg-amber-500',
  },
  viewer: {
    label: 'Viewer  •  Read only',
    icon: Eye,
    colors: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-400/30',
    dot: 'bg-blue-500',
  },
  mvp: {
    label: 'MVP  •  Approved',
    icon: Eye,
    colors: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-400/30',
    dot: 'bg-emerald-500',
  },
  new_user: {
    label: 'Pending Approval',
    icon: Eye,
    colors: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-400/30',
    dot: 'bg-orange-500',
  },
} as const;

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { collapsed, toggle } = useSidebar();
  const { currentUser } = useCurrentUser();
  const { toast } = useToast();

  const isAdmin = currentUser?.role === 'admin';
  const roleKey = (currentUser?.role ?? 'new_user') as keyof typeof ROLE_CONFIG;
  const roleCfg = ROLE_CONFIG[roleKey] ?? ROLE_CONFIG['viewer'];
  const RoleIcon = roleCfg.icon;

  const handleNavClick = (
    e: React.MouseEvent,
    item: (typeof navItems)[number]
  ) => {
    if (item.requiresAdmin && !isAdmin) {
      e.preventDefault();
      toast({
        title: 'Access Denied',
        description: `"${item.title}" requires Admin role. You currently have viewer (read-only) access.`,
        variant: 'error',
      });
      return;
    }
    setMobileOpen(false);
  };

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
          'fixed left-0 top-0 h-screen shadow-lg z-30 flex flex-col',
          'bg-gradient-to-b from-slate-50 to-slate-100 text-slate-700',
          'dark:from-slate-950 dark:to-slate-900 dark:text-slate-200',
          'transform transition-all duration-300 ease-in-out',
          collapsed ? 'md:w-16' : 'md:w-64',
          mobileOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full md:translate-x-0',
          'pt-16 md:pt-0'
        )}
      >
        {/* Logo + collapse button */}
        <div
          className={cn(
            'flex items-center border-b border-slate-200 dark:border-slate-800',
            collapsed ? 'justify-center p-4' : 'justify-between p-4 md:p-6'
          )}
        >
          {!collapsed && (
            <Image
              src="/airvincble.svg"
              alt="Airvincible Logo"
              width={120}
              height={40}
              className="h-8 w-auto dark:invert"
            />
          )}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex h-8 w-8 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 flex-shrink-0"
            onClick={toggle}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft
              className={cn('h-4 w-4 transition-transform duration-300', collapsed && 'rotate-180')}
            />
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex flex-col space-y-1 p-2 md:p-3 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const isLocked = item.requiresAdmin && !isAdmin;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => handleNavClick(e, item)}
                title={collapsed ? item.title : undefined}
                className={cn(
                  'relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                  collapsed ? 'justify-center' : '',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : isLocked
                    ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="truncate flex-1">{item.title}</span>
                )}
                {/* Lock icon badge for restricted items when expanded */}
                {!collapsed && isLocked && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 shrink-0">
                    ADMIN
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* ── Role Indicator (bottom of sidebar) ── */}
        {currentUser && (
          <div
            className={cn(
              'border-t border-slate-200 dark:border-slate-800',
              collapsed ? 'p-3' : 'p-4'
            )}
          >
            {collapsed ? (
              /* Collapsed: just a colored dot with tooltip */
              <div
                className="flex justify-center"
                title={`${currentUser.name} • ${roleCfg.label}`}
              >
                <div className={cn('w-2.5 h-2.5 rounded-full', roleCfg.dot)} />
              </div>
            ) : (
              /* Expanded: full role card */
              <div
                className={cn(
                  'flex items-center gap-2.5 rounded-xl px-3 py-2.5 w-full',
                  roleCfg.colors
                )}
              >
                <RoleIcon className="h-4 w-4 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold leading-tight truncate">
                    {currentUser.name || 'User'}
                  </p>
                  <p className="text-[10px] font-medium opacity-80 mt-0.5 truncate">
                    {roleCfg.label}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
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
