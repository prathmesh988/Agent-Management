'use client';

import { Card } from '@/components/ui/card';
import { Users, UserCheck, Shield, TrendingUp } from 'lucide-react';

interface StatCard {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  color: string;
}

interface DashboardStatsCardsProps {
  stats: StatCard[];
}

export function DashboardStatsCards({ stats }: DashboardStatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index} className="p-6 transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-default">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-600">{stat.title}</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{stat.value}</p>
              {stat.trend && (
                <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {stat.trend}
                </p>
              )}
            </div>
            <div className={`rounded-lg p-3 ${stat.color} transition-transform duration-300 group-hover:scale-110`}>
              {stat.icon}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
