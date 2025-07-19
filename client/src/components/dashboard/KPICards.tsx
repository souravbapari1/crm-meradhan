import { Card, CardContent } from "@/components/ui/card";
import { Users, UserCheck, TrendingUp, FileText } from "lucide-react";
import { DashboardKPIs } from "@/types";

interface KPICardsProps {
  kpis?: DashboardKPIs;
}

export default function KPICards({ kpis }: KPICardsProps) {
  const cards = [
    {
      title: "Active Leads",
      value: kpis?.activeLeads || 0,
      change: "+12.5% from last month",
      icon: Users,
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
      iconColor: "text-primary",
    },
    {
      title: "Active Customers",
      value: kpis?.activeCustomers || 0,
      change: "+8.2% from last month",
      icon: UserCheck,
      bgColor: "bg-green-100 dark:bg-green-900/20",
      iconColor: "text-accent",
    },
    {
      title: "Total Investment",
      value: `₹${parseFloat(kpis?.totalInvestment || "0").toFixed(2)} Cr`,
      change: "+15.8% from last month",
      icon: TrendingUp,
      bgColor: "bg-yellow-100 dark:bg-yellow-900/20",
      iconColor: "text-warning",
    },
    {
      title: "Pending RFQs",
      value: kpis?.pendingRFQs || 0,
      change: "-2.1% from last month",
      icon: FileText,
      bgColor: "bg-red-100 dark:bg-red-900/20",
      iconColor: "text-destructive",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <Card key={index} className="card-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                <p className="text-2xl font-bold text-foreground">{card.value}</p>
                <p className="text-sm text-accent font-medium mt-1">{card.change}</p>
              </div>
              <div className={`${card.bgColor} p-3 rounded-full`}>
                <card.icon className={`${card.iconColor} h-5 w-5`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
