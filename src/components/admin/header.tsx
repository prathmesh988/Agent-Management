"use client";

import { Button } from "@/components/ui/button";
import { Bell, LogOut, User, Sun, Moon, Monitor, ChevronDown, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export function AdminHeader() {
  const { logout, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();

  // Must be mounted before reading theme — avoids server/client mismatch
  useEffect(() => setMounted(true), []);

  const getPageInfo = () => {
    const pageMap: Record<string, { title: string; subtitle: string }> = {
      "/admin/dashboard": { title: "Dashboard", subtitle: "Welcome back! Here's what's happening with your employees." },
      "/admin/employees": { title: "Employees", subtitle: "Manage your workforce with search, filter, and pagination." },
      "/admin/employees/upload": { title: "Upload Employees", subtitle: "Batch import your employee data from Excel files." },
      "/admin/certificates": { title: "Employee Certificates", subtitle: "Generate and manage certificates of employment." },
      "/admin/admins": { title: "Admin Management", subtitle: "Manage administrator accounts and permissions." },
      "/admin/settings": { title: "Settings", subtitle: "Configure your admin panel preferences and system settings." },
    };
    return pageMap[pathname] || { title: "Admin", subtitle: "" };
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      setProfileOpen(false);
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) setThemeOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const pageInfo = getPageInfo();

  // Before mount, always render Monitor to match server output
  const ThemeIcon = !mounted ? Monitor : theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

  return (
    <header className="sticky top-0 z-20 w-full shrink-0 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
      <div className="flex w-full h-16 md:h-20 items-center justify-between px-4 md:px-6 gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white truncate">{pageInfo.title}</h1>
          {pageInfo.subtitle && (
            <p className="mt-0.5 text-xs md:text-sm text-slate-600 dark:text-slate-400 truncate">{pageInfo.subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800">
            <Bell className="h-5 w-5" />
          </Button>

          {/* Theme picker */}
          <div ref={themeRef} className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setThemeOpen((p) => !p)}
              title="Change theme"
            >
              <ThemeIcon className="h-5 w-5" />
            </Button>
            {themeOpen && (
              <div className="absolute right-0 mt-2 w-40 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg overflow-hidden z-50">
                {([
                  { value: "light", label: "Light", Icon: Sun },
                  { value: "dark", label: "Dark", Icon: Moon },
                  { value: "system", label: "System", Icon: Monitor },
                ] as const).map(({ value, label, Icon }) => (
                  <button
                    key={value}
                    onClick={() => { setTheme(value); setThemeOpen(false); }}
                    className={cn(
                      "flex items-center gap-2.5 w-full px-4 py-2.5 text-sm transition-colors",
                      theme === value
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Profile dropdown */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => setProfileOpen((p) => !p)}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <div className="h-7 w-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {user?.name?.charAt(0)?.toUpperCase() || "A"}
              </div>
              <span className="hidden md:block text-sm font-medium text-slate-700 dark:text-slate-300 max-w-25 truncate">
                {user?.name || "Admin"}
              </span>
              <ChevronDown className={cn("hidden md:block h-3.5 w-3.5 text-slate-400 transition-transform", profileOpen && "rotate-180")} />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg overflow-hidden z-50">
                {/* User info */}
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user?.name || "Admin"}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{user?.email || ""}</p>
                </div>
                {/* Actions */}
                <div className="py-1">
                  <button
                    onClick={() => { setProfileOpen(false); router.push("/admin/settings"); }}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    {isLoggingOut ? "Signing out…" : "Sign out"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
