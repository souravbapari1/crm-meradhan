import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Download, History, User, FileText, Users, ShoppingCart, Ticket, Monitor, Smartphone, Tablet, LogIn, LogOut, Timer, X, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

interface ActivityLog {
  id: number;
  userId: number;
  entityType: string;
  entityId: number;
  action: string;
  details: any;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  userName?: string;
}

interface LoginLog {
  id: number;
  userId: number | null;
  email: string;
  ipAddress: string;
  userAgent: string;
  browserName?: string;
  deviceType?: string;
  operatingSystem?: string;
  sessionType: string;
  success: boolean;
  createdAt: string;
}

export default function AuditLogs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  const { data: logs = [], isLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/activity-logs"],
  });

  const { data: loginLogs = [], isLoading: isLoadingLoginLogs } = useQuery<LoginLog[]>({
    queryKey: ["/api/login-logs"],
  });

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case "user": return <Users className="h-4 w-4" />;
      case "lead": return <User className="h-4 w-4" />;
      case "customer": return <User className="h-4 w-4" />;
      case "rfq": return <ShoppingCart className="h-4 w-4" />;
      case "ticket": return <Ticket className="h-4 w-4" />;
      case "template": return <FileText className="h-4 w-4" />;
      default: return <History className="h-4 w-4" />;
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case "mobile": return <Smartphone className="h-4 w-4" />;
      case "tablet": return <Tablet className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  const getSessionIcon = (sessionType: string) => {
    switch (sessionType) {
      case "login": return <LogIn className="h-4 w-4 text-green-600" />;
      case "logout": return <LogOut className="h-4 w-4 text-blue-600" />;
      case "timeout": return <Timer className="h-4 w-4 text-orange-600" />;
      case "browser_close": return <X className="h-4 w-4 text-red-600" />;
      default: return <History className="h-4 w-4" />;
    }
  };

  const getSessionBadgeColor = (sessionType: string) => {
    switch (sessionType) {
      case "login": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "logout": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "timeout": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "browser_close": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "create": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "update": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "delete": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "login": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "logout": return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      case "auto_logout_timeout": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "auto_logout_browser_close": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "session_end": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.entityType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(log.details).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === "all" || log.entityType === filterType;
    
    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
              <p className="text-muted-foreground">Track all system activities and changes</p>
            </div>
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="text-center">Loading audit logs...</div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
            <p className="text-muted-foreground">Track all system activities and user sessions</p>
          </div>
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => {
              const csvContent = [
                "Timestamp,Entity,Action,Details,User ID,User Full Name,IP Address",
                ...filteredLogs.map(log => 
                  `"${format(new Date(log.createdAt), "MMM dd, yyyy HH:mm")}","${log.entityType}","${log.action}","${JSON.stringify(log.details).replace(/"/g, '""')}","${log.userId}","${log.userName || 'Unknown'}","${log.ipAddress}"`
                )
              ].join('\n');
              
              const blob = new Blob([csvContent], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `audit-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              window.URL.revokeObjectURL(url);
            }}
          >
            <Download className="h-4 w-4" />
            Export Logs
          </Button>
        </div>

        <Tabs defaultValue="activities" className="space-y-4">
          <TabsList>
            <TabsTrigger value="activities">Activity Logs</TabsTrigger>
            <TabsTrigger value="sessions">Session Management</TabsTrigger>
          </TabsList>

          <TabsContent value="activities">
            <Card>
              <CardHeader>
                <CardTitle>Activity History</CardTitle>
                <CardDescription>
                  Complete log of all user actions and system events
                </CardDescription>
              </CardHeader>
              <CardContent>
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="all">All Types</option>
                <option value="user">Users</option>
                <option value="lead">Leads</option>
                <option value="customer">Customers</option>
                <option value="rfq">RFQs</option>
                <option value="ticket">Support Tickets</option>
                <option value="template">Email Templates</option>
              </select>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6">
                        No audit logs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">
                          {format(new Date(log.createdAt), "MMM dd, yyyy HH:mm")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getEntityIcon(log.entityType)}
                            <span className="capitalize">{log.entityType}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getActionColor(log.action)}>
                            {log.action === 'auto_logout_timeout' ? 'AUTO LOGOUT (TIMEOUT)' :
                             log.action === 'auto_logout_browser_close' ? 'AUTO LOGOUT (BROWSER CLOSE)' :
                             log.action.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="text-sm text-muted-foreground space-y-1">
                            {log.action.startsWith('auto_logout') && log.details ? (
                              <div className="space-y-1">
                                <div>Reason: {log.details.reason}</div>
                                {log.details.timestamp && (
                                  <div>Time: {format(new Date(log.details.timestamp), "HH:mm:ss")}</div>
                                )}
                                {log.details.sessionDuration && (
                                  <div>Duration: {Math.floor(log.details.sessionDuration / 1000 / 60)}m {Math.floor((log.details.sessionDuration / 1000) % 60)}s</div>
                                )}
                                <div>Device: {log.details.deviceType} - {log.details.browserName}</div>
                              </div>
                            ) : (
                              <div className="truncate">{JSON.stringify(log.details)}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {log.userName || 'Unknown User'} (#{log.userId})
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {log.ipAddress}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="sessions">
        <Card>
          <CardHeader>
            <CardTitle>Session Management</CardTitle>
            <CardDescription>
              Login history and session termination tracking with browser and device information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Session Type</TableHead>
                    <TableHead>Device & Browser</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loginLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6">
                        No session logs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    loginLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">
                          {format(new Date(log.createdAt), "MMM dd, yyyy HH:mm:ss")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span className="text-sm">{log.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getSessionIcon(log.sessionType)}
                            <Badge className={getSessionBadgeColor(log.sessionType)}>
                              {log.sessionType.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              {getDeviceIcon(log.deviceType || 'desktop')}
                              <span>{log.deviceType || 'Desktop'} - {log.browserName || 'Unknown'}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {log.operatingSystem || 'Unknown OS'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {log.ipAddress}
                        </TableCell>
                        <TableCell>
                          <Badge variant={log.success ? "default" : "destructive"}>
                            {log.success ? "Success" : "Failed"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
      </div>
    </AppLayout>
  );
}