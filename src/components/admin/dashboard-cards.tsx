"use client";

import { Card } from "@/components/ui/card";

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

export function DashboardStatsCards({ stats }: DashboardStatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index} className="p-4 border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                {stat.title}
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {stat.value}
              </p>
            </div>
            <div className={`${stat.color} text-white p-3 rounded-lg flex-shrink-0`}>
              {stat.icon}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
