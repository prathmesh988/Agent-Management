"use client";

import { Card } from "@/components/ui/card";
import { Users, UserCheck, Shield, TrendingUp } from "lucide-react";

interface StatCard {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  color: string;
  bgGradient: string;
}

interface DashboardStatsCardsProps {
  stats: StatCard[];
}

// Simple Sparkline component
function SimpleSparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * 100;
      const y = 100 - ((val - min) / range) * 80 - 10;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox="0 0 100 30"
      className="w-full h-8 mt-2"
      preserveAspectRatio="none"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function DashboardStatsCards({ stats }: DashboardStatsCardsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => {
        // Generate mock sparkline data (30-day trend)
        const sparklineData = Array.from({ length: 30 }, () =>
          Math.floor(Math.random() * 100 + 50),
        );

        return (
          <Card
            key={index}
            className={`p-6 transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-default bg-gradient-to-br ${stat.bgGradient} overflow-hidden relative`}
          >
            {/* Animated background accent */}
            <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full opacity-5"></div>

            <div className="relative z-10 flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-600">
                  {stat.title}
                </p>
                <p className="mt-2 text-4xl font-800 text-slate-900">
                  {stat.value}
                </p>

                {/* Sparkline */}
                <div className="text-emerald-500 opacity-70">
                  <SimpleSparkline data={sparklineData} />
                </div>

                {stat.trend && (
                  <p className="mt-2 text-xs text-slate-600 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                    <span className="font-medium">{stat.trend}</span>
                  </p>
                )}
              </div>

              <div
                className={`rounded-xl p-4 ${stat.color} text-white transition-transform duration-300 hover:scale-110 flex-shrink-0 ml-4`}
              >
                {stat.icon}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
