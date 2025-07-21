import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Monitor, Smartphone, Tablet, Eye, MousePointer } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

interface SessionData {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  totalPages: number;
  browserName: string;
  deviceType: string;
  endReason: string | null;
  pageViews: Array<{
    pagePath: string;
    pageTitle: string;
    entryTime: string;
    exitTime: string | null;
    duration: number | null;
    scrollDepth: number;
    interactions: number;
  }>;
}

export default function SessionAnalytics() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['/api/session-analytics', startDate, endDate, selectedUserId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (selectedUserId) params.append('userId', selectedUserId);
      
      const response = await fetch(`/api/session-analytics?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch session analytics');
      return await response.json() as SessionData[];
    },
  });

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'tablet': return <Tablet className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  const getEndReasonColor = (reason: string | null) => {
    switch (reason) {
      case 'logout': return 'bg-green-100 text-green-800';
      case 'timeout': return 'bg-yellow-100 text-yellow-800';
      case 'browser_close': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Session Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Detailed session tracking with page browsing history and engagement metrics
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Start Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">End Date</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">User ID</label>
                <Input
                  type="number"
                  placeholder="Filter by user ID"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  setSelectedUserId("");
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sessions Table */}
        <Card>
          <CardHeader>
            <CardTitle>User Sessions</CardTitle>
            <CardDescription>
              Comprehensive session tracking with page navigation history
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-6">Loading session data...</div>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div key={session.id} className="border rounded-lg p-4 space-y-3">
                    {/* Session Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getDeviceIcon(session.deviceType)}
                        <div>
                          <div className="font-medium">{session.userName}</div>
                          <div className="text-sm text-muted-foreground">{session.userEmail}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">
                          {format(new Date(new Date(session.startTime).getTime() + (5.5 * 60 * 60 * 1000)), "MMM dd, yyyy HH:mm")} IST
                        </div>
                        {session.endReason && (
                          <Badge className={getEndReasonColor(session.endReason)}>
                            {session.endReason.replace('_', ' ').toUpperCase()}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Session Stats */}
                    <div className="grid grid-cols-4 gap-4 py-2 border-y">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Duration</div>
                        <div className="font-medium">{formatDuration(session.duration)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Pages Visited</div>
                        <div className="font-medium">{session.totalPages}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Browser</div>
                        <div className="font-medium">{session.browserName}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Device</div>
                        <div className="font-medium capitalize">{session.deviceType}</div>
                      </div>
                    </div>

                    {/* Page Views */}
                    {session.pageViews && session.pageViews.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Page Navigation History
                        </h4>
                        <div className="bg-muted/50 rounded-md p-3">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Page</TableHead>
                                <TableHead>Entry Time</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Scroll %</TableHead>
                                <TableHead>Interactions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {session.pageViews.map((pageView, index) => (
                                <TableRow key={index}>
                                  <TableCell>
                                    <div>
                                      <div className="font-medium">{pageView.pageTitle}</div>
                                      <div className="text-sm text-muted-foreground">{pageView.pagePath}</div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    {format(new Date(new Date(pageView.entryTime).getTime() + (5.5 * 60 * 60 * 1000)), "HH:mm:ss")} IST
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {formatDuration(pageView.duration)}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1">
                                      <div className="w-12 bg-gray-200 rounded-full h-2">
                                        <div 
                                          className="bg-blue-600 h-2 rounded-full" 
                                          style={{ width: `${Math.min(pageView.scrollDepth, 100)}%` }}
                                        ></div>
                                      </div>
                                      <span className="text-sm">{pageView.scrollDepth}%</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1">
                                      <MousePointer className="h-3 w-3" />
                                      {pageView.interactions}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {sessions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No session data found for the selected criteria
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}