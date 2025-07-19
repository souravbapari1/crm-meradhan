import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { UserPlus, FileText, BarChart, Mail } from "lucide-react";

const quickActions = [
  {
    title: "Add New Lead",
    description: "Create and track new potential customers",
    icon: UserPlus,
    href: "/leads",
    bgColor: "bg-blue-100 dark:bg-blue-900/20",
    iconColor: "text-primary",
  },
  {
    title: "Submit RFQ",
    description: "Request for Quote on NSE platform",
    icon: FileText,
    href: "/rfq-management",
    bgColor: "bg-green-100 dark:bg-green-900/20",
    iconColor: "text-accent",
  },
  {
    title: "View Reports",
    description: "Analyze performance and trends",
    icon: BarChart,
    href: "/reports",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/20",
    iconColor: "text-warning",
  },
  {
    title: "Email Templates",
    description: "Manage communication templates",
    icon: Mail,
    href: "/email-templates",
    bgColor: "bg-red-100 dark:bg-red-900/20",
    iconColor: "text-destructive",
  },
];

export default function QuickActions() {
  const [, setLocation] = useLocation();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {quickActions.map((action, index) => (
        <Card 
          key={index} 
          className="card-shadow hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => setLocation(action.href)}
        >
          <CardContent className="p-6 text-center">
            <div className={`${action.bgColor} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4`}>
              <action.icon className={`${action.iconColor} h-6 w-6`} />
            </div>
            <h4 className="text-lg font-semibold text-foreground mb-2">{action.title}</h4>
            <p className="text-sm text-muted-foreground">{action.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
