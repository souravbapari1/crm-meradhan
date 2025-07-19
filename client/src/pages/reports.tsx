import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Download, TrendingUp, Users, DollarSign, FileText, Target } from "lucide-react";
import { DashboardKPIs, LeadSource, SalesPerformance, Lead, Customer, RFQ } from "@/types";

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export default function Reports() {
  const { data: kpis } = useQuery<DashboardKPIs>({
    queryKey: ["/api/dashboard/kpis"],
  });

  const { data: leadSources } = useQuery<LeadSource[]>({
    queryKey: ["/api/dashboard/lead-sources"],
  });

  const { data: salesPerformance } = useQuery<SalesPerformance[]>({
    queryKey: ["/api/dashboard/sales-performance"],
  });

  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ["/api/leads"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: rfqs = [] } = useQuery<RFQ[]>({
    queryKey: ["/api/rfqs"],
  });

  // Calculate metrics
  const conversionRate = leads.length > 0 ? (leads.filter(l => l.status === "converted").length / leads.length) * 100 : 0;
  const avgDealSize = customers.length > 0 ? 
    customers.reduce((sum, c) => sum + parseFloat(c.totalInvestment || "0"), 0) / customers.length : 0;

  // Lead status distribution
  const leadStatusData = [
    { name: "New", value: leads.filter(l => l.status === "new").length, color: COLORS[0] },
    { name: "Contacted", value: leads.filter(l => l.status === "contacted").length, color: COLORS[1] },
    { name: "Qualified", value: leads.filter(l => l.status === "qualified").length, color: COLORS[2] },
    { name: "Converted", value: leads.filter(l => l.status === "converted").length, color: COLORS[3] },
    { name: "Lost", value: leads.filter(l => l.status === "lost").length, color: COLORS[4] },
  ];

  // Monthly trends (mock data for demonstration)
  const monthlyTrends = [
    { month: "Jan", leads: 45, customers: 12, rfqs: 8, revenue: 2.5 },
    { month: "Feb", leads: 52, customers: 15, rfqs: 11, revenue: 3.2 },
    { month: "Mar", leads: 48, customers: 18, rfqs: 14, revenue: 4.1 },
    { month: "Apr", leads: 61, customers: 22, rfqs: 16, revenue: 5.3 },
    { month: "May", leads: 55, customers: 25, rfqs: 19, revenue: 6.2 },
    { month: "Jun", leads: 67, customers: 28, rfqs: 21, revenue: 7.1 },
  ];

  // Bond type distribution
  const bondTypeData = [
    { name: "Government", value: rfqs.filter(r => r.bondType === "government").length, color: COLORS[0] },
    { name: "Corporate", value: rfqs.filter(r => r.bondType === "corporate").length, color: COLORS[1] },
    { name: "Municipal", value: rfqs.filter(r => r.bondType === "municipal").length, color: COLORS[2] },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
            <p className="text-muted-foreground">Comprehensive business intelligence and performance metrics</p>
          </div>
          <div className="flex gap-3">
            <Select defaultValue="30days">
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="quarter">This quarter</SelectItem>
                <SelectItem value="year">This year</SelectItem>
              </SelectContent>
            </Select>
            <Button className="gradient-bg">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="card-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                  <p className="text-2xl font-bold text-foreground">{conversionRate.toFixed(1)}%</p>
                  <p className="text-sm text-accent">+2.5% from last month</p>
                </div>
                <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-full">
                  <Target className="h-5 w-5 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Deal Size</p>
                  <p className="text-2xl font-bold text-foreground">₹{(avgDealSize / 100000).toFixed(1)}L</p>
                  <p className="text-sm text-accent">+8.3% from last month</p>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/20 p-3 rounded-full">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Pipeline</p>
                  <p className="text-2xl font-bold text-foreground">₹{(kpis?.totalInvestment ? parseFloat(kpis.totalInvestment) : 0).toFixed(1)}Cr</p>
                  <p className="text-sm text-accent">+15.2% from last month</p>
                </div>
                <div className="bg-yellow-100 dark:bg-yellow-900/20 p-3 rounded-full">
                  <TrendingUp className="h-5 w-5 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="card-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Customer Growth</p>
                  <p className="text-2xl font-bold text-foreground">+{customers.filter(c => 
                    new Date(c.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                  ).length}</p>
                  <p className="text-sm text-accent">This month</p>
                </div>
                <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-full">
                  <Users className="h-5 w-5 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sales">Sales Analysis</TabsTrigger>
            <TabsTrigger value="customer">Customer Insights</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Trends */}
              <Card className="card-shadow">
                <CardHeader>
                  <CardTitle>Monthly Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyTrends}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" className="fill-muted-foreground text-xs" />
                        <YAxis className="fill-muted-foreground text-xs" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))' 
                          }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="leads" stroke={COLORS[0]} strokeWidth={2} name="Leads" />
                        <Line type="monotone" dataKey="customers" stroke={COLORS[1]} strokeWidth={2} name="Customers" />
                        <Line type="monotone" dataKey="rfqs" stroke={COLORS[2]} strokeWidth={2} name="RFQs" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Lead Status Distribution */}
              <Card className="card-shadow">
                <CardHeader>
                  <CardTitle>Lead Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={leadStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {leadStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Lead Sources */}
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle>Lead Source Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={leadSources}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="source" className="fill-muted-foreground text-xs" />
                      <YAxis className="fill-muted-foreground text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))' 
                        }}
                      />
                      <Bar dataKey="count" fill={COLORS[0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sales" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Trends */}
              <Card className="card-shadow">
                <CardHeader>
                  <CardTitle>Revenue Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyTrends}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" className="fill-muted-foreground text-xs" />
                        <YAxis className="fill-muted-foreground text-xs" />
                        <Tooltip 
                          formatter={(value: number) => [`₹${value}Cr`, "Revenue"]}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))' 
                          }}
                        />
                        <Bar dataKey="revenue" fill={COLORS[3]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Bond Type Distribution */}
              <Card className="card-shadow">
                <CardHeader>
                  <CardTitle>Bond Type Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={bondTypeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {bondTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sales Targets */}
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle>Sales Targets vs Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {[
                    { metric: "Monthly Revenue", target: 10, achieved: 7.1, unit: "Cr" },
                    { metric: "New Customers", target: 50, achieved: 35, unit: "" },
                    { metric: "RFQ Volume", target: 100, achieved: 78, unit: "" },
                    { metric: "Conversion Rate", target: 25, achieved: conversionRate, unit: "%" },
                  ].map((item, index) => (
                    <div key={item.metric} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{item.metric}</span>
                        <div className="text-right">
                          <span className="text-sm text-muted-foreground">
                            {item.achieved}{item.unit} / {item.target}{item.unit}
                          </span>
                          <Badge className={`ml-2 ${(item.achieved / item.target) * 100 >= 80 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {((item.achieved / item.target) * 100).toFixed(0)}%
                          </Badge>
                        </div>
                      </div>
                      <Progress value={(item.achieved / item.target) * 100} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customer" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Customer Acquisition */}
              <Card className="card-shadow">
                <CardHeader>
                  <CardTitle>Customer Acquisition</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyTrends}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="month" className="fill-muted-foreground text-xs" />
                        <YAxis className="fill-muted-foreground text-xs" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))' 
                          }}
                        />
                        <Bar dataKey="customers" fill={COLORS[1]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Segments */}
              <Card className="card-shadow">
                <CardHeader>
                  <CardTitle>Customer Segments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { segment: "High Value (>₹1Cr)", count: customers.filter(c => parseFloat(c.totalInvestment || "0") > 10000000).length, percentage: 15 },
                      { segment: "Medium Value (₹50L-₹1Cr)", count: customers.filter(c => {
                        const investment = parseFloat(c.totalInvestment || "0");
                        return investment >= 5000000 && investment <= 10000000;
                      }).length, percentage: 35 },
                      { segment: "Regular (₹10L-₹50L)", count: customers.filter(c => {
                        const investment = parseFloat(c.totalInvestment || "0");
                        return investment >= 1000000 && investment < 5000000;
                      }).length, percentage: 40 },
                      { segment: "New (<₹10L)", count: customers.filter(c => parseFloat(c.totalInvestment || "0") < 1000000).length, percentage: 10 },
                    ].map((segment, index) => (
                      <div key={segment.segment} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">{segment.segment}</span>
                          <span className="text-sm text-muted-foreground">{segment.count} customers</span>
                        </div>
                        <Progress value={segment.percentage} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            {/* Team Performance */}
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle>Team Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { name: "Rajesh Kumar", role: "Senior RM", leads: 45, conversions: 12, revenue: 3.2 },
                    { name: "Priya Sharma", role: "Sales Executive", leads: 38, conversions: 9, revenue: 2.8 },
                    { name: "Amit Patel", role: "Relationship Manager", leads: 42, conversions: 11, revenue: 3.5 },
                  ].map((member, index) => (
                    <div key={member.name} className="p-4 border rounded-lg space-y-3">
                      <div>
                        <h4 className="font-medium">{member.name}</h4>
                        <p className="text-sm text-muted-foreground">{member.role}</p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Leads Generated</span>
                          <span className="font-medium">{member.leads}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Conversions</span>
                          <span className="font-medium">{member.conversions}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Revenue</span>
                          <span className="font-medium">₹{member.revenue}Cr</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Conversion Rate</span>
                          <Badge className="bg-green-100 text-green-800">
                            {((member.conversions / member.leads) * 100).toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
