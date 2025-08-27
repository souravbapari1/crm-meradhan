import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  BarChart3,
  Users,
  UserCheck,
  TrendingUp,
  FileText,
  Headphones,
  Mail,
  PieChart,
  Settings,
  History,
  Activity,
  Timer,
  X,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

const mainNavItems = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Leads Management", href: "/leads", icon: Users },
  { name: "Customers", href: "/customers", icon: UserCheck },
  { name: "Sales Pipeline", href: "/sales-pipeline", icon: TrendingUp },
  { name: "RFQ Management", href: "/rfq-management", icon: FileText },
  { name: "Support Tickets", href: "/support-tickets", icon: Headphones },
  { name: "Email Templates", href: "/email-templates", icon: Mail },
  { name: "Reports", href: "/reports", icon: PieChart },
];

const adminNavItems = [
  { name: "User Management", href: "/user-management", icon: Settings },
  { name: "Audit Logs", href: "/audit-logs", icon: History },
  { name: "Session Analytics", href: "/session-analytics", icon: Activity },
  { name: "Session Test", href: "/session-test", icon: Timer },
];

export default function Sidebar({ isOpen, onClose, isMobile }: SidebarProps) {
  const { user, hasRole } = useAuth();
  const [location, setLocation] = useLocation();

  const handleNavigate = (href: string) => {
    setLocation(href);
    if (isMobile) {
      onClose();
    }
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] pt-5 w-64 transform bg-sidebar-background border-r border-sidebar-border transition-transform duration-300 ease-in-out",
        isOpen || !isMobile ? "translate-x-0" : "-translate-x-full",
        !isMobile && "lg:translate-x-0"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Mobile close button */}
        {isMobile && (
          <div className="flex items-center justify-between p-4">
            <h2 className="text-lg font-semibold">Navigation</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-2">
            {mainNavItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Button
                  key={item.href}
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    isActive && "sidebar-active"
                  )}
                  onClick={() => handleNavigate(item.href)}
                >
                  <item.icon className="mr-3 h-4 w-4" />
                  {item.name}
                </Button>
              );
            })}
          </nav>

          {/* Admin section */}
          {hasRole(['admin']) && (
            <>
              <Separator className="my-4" />
              <div className="px-3 py-2">
                <h3 className="mb-2 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Administration
                </h3>
                <nav className="space-y-2">
                  {adminNavItems.map((item) => {
                    const isActive = location === item.href;
                    return (
                      <Button
                        key={item.href}
                        variant={isActive ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start",
                          isActive && "sidebar-active"
                        )}
                        onClick={() => handleNavigate(item.href)}
                      >
                        <item.icon className="mr-3 h-4 w-4" />
                        {item.name}
                      </Button>
                    );
                  })}
                </nav>
              </div>
            </>
          )}
        </ScrollArea>
      </div>
    </aside>
  );
}
