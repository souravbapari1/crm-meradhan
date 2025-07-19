import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Lead, Customer } from "@/types";
import { Users, UserCheck, TrendingUp, Target, Eye, ArrowRight } from "lucide-react";

export default function SalesPipeline() {
  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  // Calculate pipeline stages
  const newLeads = leads.filter(lead => lead.status === "new").length;
  const contactedLeads = leads.filter(lead => lead.status === "contacted").length;
  const qualifiedLeads = leads.filter(lead => lead.status === "qualified").length;
  const convertedLeads = leads.filter(lead => lead.status === "converted").length;

  const totalLeads = leads.length;
  const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

  const pipelineStages = [
    {
      stage: "New Leads",
      count: newLeads,
      percentage: totalLeads > 0 ? (newLeads / totalLeads) * 100 : 0,
      color: "bg-blue-500",
      icon: Users,
    },
    {
      stage: "Contacted",
      count: contactedLeads,
      percentage: totalLeads > 0 ? (contactedLeads / totalLeads) * 100 : 0,
      color: "bg-yellow-500",
      icon: Target,
    },
    {
      stage: "Qualified",
      count: qualifiedLeads,
      percentage: totalLeads > 0 ? (qualifiedLeads / totalLeads) * 100 : 0,
      color: "bg-orange-500",
      icon: TrendingUp,
    },
    {
      stage: "Converted",
      count: convertedLeads,
      percentage: totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0,
      color: "bg-green-500",
      icon: UserCheck,
    },
  ];

  const recentConversions = customers
    .filter(customer => customer.leadId)
    .slice(0, 5);

  const topPerformers = [
    { name: "Rajesh Kumar", conversions: 12, target: 15, percentage: 80 },
    { name: "Priya Sharma", conversions: 8, target: 10, percentage: 80 },
    { name: "Amit Patel", conversions: 15, target: 20, percentage: 75 },
    { name: "Sunita Singh", conversions: 6, target: 10, percentage: 60 },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Sales Pipeline</h1>
            <p className="text-muted-foreground">Track lead progression and conversion rates</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Eye className="mr-2 h-4 w-4" />
              View Reports
            </Button>
            <Button className="gradient-bg">
              <TrendingUp className="mr-2 h-4 w-4" />
              Analyze Trends
            </Button>
          </div>
        </div>

        {/* Pipeline Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pipelineStages.map((stage, index) => (
            <Card key={stage.stage} className="card-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stage.stage}</p>
                    <p className="text-2xl font-bold text-foreground">{stage.count}</p>
                  </div>
                  <div className="bg-muted p-3 rounded-full">
                    <stage.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Pipeline %</span>
                    <span>{stage.percentage.toFixed(1)}%</span>
                  </div>
                  <Progress value={stage.percentage} className="h-2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Conversion Funnel */}
        <Card className="card-shadow">
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pipelineStages.map((stage, index) => (
                <div key={stage.stage} className="flex items-center gap-4">
                  <div className="w-32 text-sm font-medium">{stage.stage}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted rounded-full h-8 relative overflow-hidden">
                        <div 
                          className={`${stage.color} h-full transition-all duration-500 rounded-full flex items-center justify-end pr-2`}
                          style={{ width: `${stage.percentage}%` }}
                        >
                          <span className="text-white text-xs font-medium">
                            {stage.count}
                          </span>
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground w-12">
                        {stage.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  {index < pipelineStages.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Conversion Rate</span>
                <Badge className="bg-green-100 text-green-800">
                  {conversionRate.toFixed(1)}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Conversions */}
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle>Recent Conversions</CardTitle>
            </CardHeader>
            <CardContent>
              {recentConversions.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  No recent conversions
                </div>
              ) : (
                <div className="space-y-4">
                  {recentConversions.map((customer) => (
                    <div key={customer.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-sm text-muted-foreground">{customer.email}</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        Converted
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Performers */}
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topPerformers.map((performer, index) => (
                  <div key={performer.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">#{index + 1}</span>
                        <span className="font-medium">{performer.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {performer.conversions}/{performer.target}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <Progress value={performer.percentage} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{performer.percentage}% of target</span>
                        <span>{performer.target - performer.conversions} remaining</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
