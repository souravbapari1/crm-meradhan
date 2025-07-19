import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import AppLayout from "@/components/layout/AppLayout";
import KPICards from "@/components/dashboard/KPICards";
import SalesChart from "@/components/dashboard/SalesChart";
import LeadSourceChart from "@/components/dashboard/LeadSourceChart";
import RecentActivityTable from "@/components/dashboard/RecentActivityTable";
import QuickActions from "@/components/dashboard/QuickActions";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download } from "lucide-react";
import { DashboardKPIs, LeadSource, SalesPerformance, Activity } from "@/types";

export default function Dashboard() {
  const { data: kpis } = useQuery<DashboardKPIs>({
    queryKey: ["/api/dashboard/kpis"],
  });

  const { data: leadSources } = useQuery<LeadSource[]>({
    queryKey: ["/api/dashboard/lead-sources"],
  });

  const { data: salesPerformance } = useQuery<SalesPerformance[]>({
    queryKey: ["/api/dashboard/sales-performance"],
  });

  const { data: recentActivities } = useQuery<Activity[]>({
    queryKey: ["/api/dashboard/recent-activities"],
  });

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard Overview</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Here's what's happening with your bond platform today.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select defaultValue="30days">
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="month">This month</SelectItem>
                <SelectItem value="quarter">This quarter</SelectItem>
              </SelectContent>
            </Select>
            <Button className="gradient-bg">
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <KPICards kpis={kpis} />

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <SalesChart data={salesPerformance} />
          <LeadSourceChart data={leadSources} />
        </div>

        {/* Recent Activities */}
        <RecentActivityTable activities={recentActivities} />

        {/* Quick Actions */}
        <QuickActions />
      </div>
    </AppLayout>
  );
}
