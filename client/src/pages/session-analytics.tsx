import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Monitor, Smartphone, Tablet, Clock, Eye, MousePointer, ChevronDown, ChevronRight, User, Calendar, Timer, LogIn, LogOut } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format } from "date-fns";

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
  const [expandedSessions, setExpandedSessions] = useState<Record<number, boolean>>({});

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

  // Auto-expand the first session on load
  if (sessions.length > 0 && Object.keys(expandedSessions).length === 0) {
    setExpandedSessions({ [sessions[0].id]: true });
  }

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
      case 'logout': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'timeout': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'browser_close': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const toggleSession = (sessionId: number) => {
    setExpandedSessions(prev => ({
      ...prev,
      [sessionId]: !prev[sessionId]
    }));
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
            </div>
          </CardContent>
        </Card>

        {/* Session List with Toggle View */}
        <div className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">Loading sessions...</div>
              </CardContent>
            </Card>
          ) : sessions.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">No sessions found</div>
              </CardContent>
            </Card>
          ) : (
            sessions.map((session) => (
              <Card key={session.id} className="overflow-hidden">
                <Collapsible 
                  open={expandedSessions[session.id]} 
                  onOpenChange={() => toggleSession(session.id)}
                >
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            {expandedSessions[session.id] ? 
                              <ChevronDown className="h-4 w-4" /> : 
                              <ChevronRight className="h-4 w-4" />
                            }
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          
                          <div className="text-left">
                            <div className="font-semibold">{session.userName}</div>
                            <div className="text-sm text-muted-foreground">{session.userEmail}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 text-sm">
                          {/* Login Time */}
                          <div className="flex items-center gap-2">
                            <LogIn className="h-4 w-4 text-green-600" />
                            <div className="text-right">
                              <div className="font-medium">Login</div>
                              <div className="text-muted-foreground">
                                {format(new Date(session.startTime + 'Z'), "MMM dd, HH:mm")} IST
                              </div>
                            </div>
                          </div>

                          {/* Logout Time */}
                          <div className="flex items-center gap-2">
                            <LogOut className="h-4 w-4 text-red-600" />
                            <div className="text-right">
                              <div className="font-medium">Logout</div>
                              <div className="text-muted-foreground">
                                {session.endTime ? 
                                  format(new Date(session.endTime + 'Z'), "MMM dd, HH:mm") + " IST" :
                                  "Active"
                                }
                              </div>
                            </div>
                          </div>

                          {/* Duration */}
                          <div className="flex items-center gap-2">
                            <Timer className="h-4 w-4 text-purple-600" />
                            <div className="text-right">
                              <div className="font-medium">Duration</div>
                              <div className="text-muted-foreground">
                                {formatDuration(session.duration)}
                              </div>
                            </div>
                          </div>

                          {/* Device & Browser */}
                          <div className="flex items-center gap-2">
                            {getDeviceIcon(session.deviceType)}
                            <div className="text-right">
                              <div className="font-medium">Device</div>
                              <div className="text-muted-foreground">
                                {session.deviceType} - {session.browserName}
                              </div>
                            </div>
                          </div>

                          {/* Pages Count */}
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4 text-orange-600" />
                            <div className="text-right">
                              <div className="font-medium">Pages</div>
                              <div className="text-muted-foreground">
                                {session.totalPages} visited
                              </div>
                            </div>
                          </div>

                          {/* End Reason */}
                          {session.endReason && (
                            <Badge className={getEndReasonColor(session.endReason)}>
                              {session.endReason === 'logout' ? 'Manual Logout' :
                               session.endReason === 'timeout' ? 'Auto Timeout' :
                               session.endReason === 'browser_close' ? 'Browser Close' :
                               session.endReason}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="border-t pt-4">
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Page Navigation History
                          </h4>
                          
                          {session.pageViews && session.pageViews.length > 0 ? (
                            <div className="rounded-md border">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Page</TableHead>
                                    <TableHead>Entry Time</TableHead>
                                    <TableHead>Exit Time</TableHead>
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
                                        {format(new Date(pageView.entryTime), "HH:mm:ss")} IST
                                      </TableCell>
                                      <TableCell className="text-sm">
                                        {pageView.exitTime ? 
                                          format(new Date(pageView.exitTime), "HH:mm:ss") + " IST" :
                                          "Active"
                                        }
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          {formatDuration(pageView.duration)}
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex items-center gap-1">
                                          <Eye className="h-3 w-3" />
                                          {pageView.scrollDepth}%
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
                          ) : (
                            <div className="text-center py-8 text-muted-foreground">
                              No page views recorded for this session
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}