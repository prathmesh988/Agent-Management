"use client";

import { Card } from "@/components/ui/card";

interface StatCard {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  color?: string;
  bgGradient?: string;
}

interface DashboardStatsCardsProps {
  stats: StatCard[];
}

export function DashboardStatsCards({ stats }: DashboardStatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index} className="p-6 border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {stat.title}
            </h3>
            {stat.icon}
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {stat.value}
            </div>
            {stat.trend && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {stat.trend}
              </p>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
