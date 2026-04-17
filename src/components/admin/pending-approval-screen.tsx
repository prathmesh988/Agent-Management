"use client";

import { useAuth } from "@/hooks/useAuth";
import { Clock, LogOut, Shield, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface PendingApprovalScreenProps {
  userEmail?: string;
  userName?: string;
}

export function PendingApprovalScreen({
  userEmail,
  userName,
}: PendingApprovalScreenProps) {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Background ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl text-center space-y-8">
          {/* Animated clock icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400/20 to-orange-500/20 border border-amber-400/30 flex items-center justify-center animate-pulse">
                <Clock className="w-12 h-12 text-amber-400" />
              </div>
              {/* Orbiting dot */}
              <span className="absolute top-1 right-1 w-3 h-3 bg-amber-400 rounded-full shadow-lg shadow-amber-400/50" />
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-white">
              Awaiting Approval
            </h1>
            {userName && (
              <p className="text-slate-300 text-sm">
                Hi <span className="font-semibold text-white">{userName}</span>,
                welcome aboard!
              </p>
            )}
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm mx-auto">
              Your account has been created successfully. An administrator needs to
              approve your access before you can use the system.
            </p>
          </div>

          {/* Status badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-400/10 border border-amber-400/30 rounded-full text-amber-300 text-sm font-medium">
            <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            Pending Admin Approval
          </div>

          {/* Info cards */}
          <div className="grid grid-cols-1 gap-3 text-left">
            <div className="flex gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
              <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white text-sm font-medium">Secure Access Control</p>
                <p className="text-slate-400 text-xs mt-1">
                  All new accounts must be reviewed by an admin to maintain system security.
                </p>
              </div>
            </div>
            <div className="flex gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
              <Mail className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white text-sm font-medium">What happens next?</p>
                <p className="text-slate-400 text-xs mt-1">
                  Once an admin approves your account you&apos;ll be able to log in
                  and access the dashboard.
                  {userEmail && (
                    <> Your account is linked to <span className="text-slate-300 font-medium">{userEmail}</span>.</>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Logout button */}
          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full border-white/20 text-slate-300 hover:bg-white/10 hover:text-white transition-all duration-200 gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
