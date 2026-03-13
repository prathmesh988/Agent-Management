'use client';

import { Button } from '@/components/ui/button';
import { Bell, LogOut, User } from 'lucide-react';

export function AdminHeader() {
  return (
    <header className="sticky top-0 z-20 w-full border-b border-slate-200 bg-white shadow-sm">
      <div className="flex h-16 items-center justify-between px-6 md:ml-64">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-slate-900">Welcome back!</h2>
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-600 hover:text-slate-900"
          >
            <Bell className="h-5 w-5" />
          </Button>

          {/* Profile */}
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-600 hover:text-slate-900"
          >
            <User className="h-5 w-5" />
          </Button>

          {/* Logout */}
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-600 hover:text-slate-900"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
