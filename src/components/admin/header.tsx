"use client";

import { Button } from "@/components/ui/button";
import { Bell, LogOut, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

export function AdminHeader() {
  const { logout, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const getPageInfo = () => {
    const pageMap: Record<string, { title: string; subtitle: string }> = {
      "/admin/dashboard": {
        title: "Dashboard",
        subtitle: "Welcome back! Here's what's happening with your employees."
      },
      "/admin/employees": {
        title: "Employees",
        subtitle: "Manage your workforce with search, filter, and pagination."
      },
      "/admin/employees/upload": {
        title: "Upload Employees",
        subtitle: "Batch import your employee data from Excel files."
      },
      "/admin/certificates": {
        title: "Employee Certificates",
        subtitle: "Generate and manage certificates of employment for your employees."
      },
      "/admin/admins": {
        title: "Admin Management",
        subtitle: "Manage administrator accounts and permissions."
      },
      "/admin/settings": {
        title: "Settings",
        subtitle: "Configure your admin panel preferences and system settings."
      },
    };
    
    return pageMap[pathname] || { title: "Admin", subtitle: "" };
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  };

  const pageInfo = getPageInfo();

  return (
    <header className="sticky top-0 z-20 w-full shrink-0 border-b border-slate-200 bg-white shadow-sm">
      <div className="flex w-full h-16 md:h-20 items-center justify-between px-4 md:px-6 gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 truncate">{pageInfo.title}</h1>
          {pageInfo.subtitle && (
            <p className="mt-0.5 md:mt-1 text-xs md:text-sm text-slate-600 truncate">{pageInfo.subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-slate-600 hover:text-slate-900 transition-all duration-200 hover:bg-slate-100"
          >
            <Bell className="h-5 w-5" />
          </Button>

          {/* Profile */}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-slate-600 hover:text-slate-900 transition-all duration-200 hover:bg-slate-100"
          >
            <User className="h-5 w-5" />
          </Button>

          {/* Logout */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="h-10 w-10 text-slate-600 hover:text-red-600 transition-all duration-200 hover:bg-red-50"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
