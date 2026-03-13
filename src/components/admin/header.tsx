'use client';

import { Button } from '@/components/ui/button';
import { Bell, LogOut, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function AdminHeader() {
  const { logout, user } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-20 w-full border-b border-slate-200 bg-white shadow-sm">
      <div className="flex h-16 items-center justify-between px-6 md:ml-64">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-slate-900">
            Welcome back, {user?.name || 'Admin'}!
          </h2>
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-600 hover:text-slate-900 transition-all duration-200 hover:scale-110 hover:bg-slate-100"
          >
            <Bell className="h-5 w-5" />
          </Button>

          {/* Profile */}
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-600 hover:text-slate-900 transition-all duration-200 hover:scale-110 hover:bg-slate-100"
          >
            <User className="h-5 w-5" />
          </Button>

          {/* Logout */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="text-slate-600 hover:text-red-600 transition-all duration-200 hover:scale-110 hover:bg-red-50"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
