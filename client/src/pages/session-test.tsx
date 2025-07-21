import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Timer, Monitor, Eye, EyeOff, LogOut, AlertTriangle } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/use-auth";

export default function SessionTest() {
  const { logout, user } = useAuth();
  const [inactivityTime, setInactivityTime] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [sessionEvents, setSessionEvents] = useState<string[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (user) {
      interval = setInterval(() => {
        setInactivityTime(prev => prev + 1);
      }, 1000);

      // Listen for user activity
      const handleActivity = () => {
        setInactivityTime(0);
        addEvent('User activity detected - timer reset');
      };

      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
      events.forEach(event => {
        document.addEventListener(event, handleActivity, true);
      });

      // Listen for visibility changes
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
          setIsVisible(false);
          addEvent('Tab/window hidden - logout timer started (5 seconds)');
        } else {
          setIsVisible(true);
          addEvent('Tab/window visible again');
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      // Listen for beforeunload
      const handleBeforeUnload = () => {
        addEvent('Browser/tab closing detected');
      };

      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        clearInterval(interval);
        events.forEach(event => {
          document.removeEventListener(event, handleActivity, true);
        });
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [user]);

  const addEvent = (event: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setSessionEvents(prev => [`[${timestamp}] ${event}`, ...prev.slice(0, 9)]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getInactivityStatus = () => {
    if (inactivityTime < 300) return { color: "bg-green-100 text-green-800", text: "Active" };
    if (inactivityTime < 600) return { color: "bg-yellow-100 text-yellow-800", text: "Idle" };
    if (inactivityTime < 900) return { color: "bg-orange-100 text-orange-800", text: "Warning" };
    return { color: "bg-red-100 text-red-800", text: "Critical" };
  };

  const testTabClose = () => {
    addEvent('Simulating tab close test...');
    // This will trigger the visibility change handler
    Object.defineProperty(document, 'visibilityState', {
      writable: true,
      value: 'hidden'
    });
    document.dispatchEvent(new Event('visibilitychange'));
    
    setTimeout(() => {
      Object.defineProperty(document, 'visibilityState', {
        writable: true,
        value: 'visible'
      });
      document.dispatchEvent(new Event('visibilitychange'));
    }, 6000); // Show visible again after 6 seconds
  };

  if (!user) {
    return (
      <AppLayout>
        <div className="p-6">
          <Card>
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Please Login First</h2>
              <p className="text-muted-foreground">You need to be logged in to test session management.</p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const status = getInactivityStatus();

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Session Management Test</h1>
          <p className="text-muted-foreground">Test automatic session termination functionality</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Inactivity Timer */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5" />
                Inactivity Timer
              </CardTitle>
              <CardDescription>
                Session will terminate after 15 minutes (900 seconds) of inactivity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <div className="text-4xl font-mono font-bold">
                  {formatTime(inactivityTime)}
                </div>
                <Badge className={status.color}>
                  {status.text}
                </Badge>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min((inactivityTime / 900) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Auto-logout at: {formatTime(900)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tab Visibility */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {isVisible ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                Tab Visibility
              </CardTitle>
              <CardDescription>
                Session ends 5 seconds after tab becomes hidden
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <Badge variant={isVisible ? "default" : "destructive"}>
                  {isVisible ? "Visible" : "Hidden"}
                </Badge>
                <Button 
                  onClick={testTabClose}
                  variant="outline"
                  className="w-full"
                >
                  Test Tab Close
                </Button>
                <p className="text-sm text-muted-foreground">
                  Try switching tabs or minimizing the window
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Manual Logout */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LogOut className="h-5 w-5" />
                Manual Actions
              </CardTitle>
              <CardDescription>
                Test manual session termination
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button 
                  onClick={logout}
                  variant="destructive"
                  className="w-full"
                >
                  Manual Logout
                </Button>
                <Button 
                  onClick={() => window.close()}
                  variant="outline"
                  className="w-full"
                >
                  Close Browser Tab
                </Button>
                <p className="text-sm text-muted-foreground">
                  These actions will trigger session end logging
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Event Log */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Session Events Log
            </CardTitle>
            <CardDescription>
              Real-time tracking of session management events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {sessionEvents.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No events yet. Interact with the page to see activity tracking.
                </p>
              ) : (
                sessionEvents.map((event, index) => (
                  <div 
                    key={index} 
                    className="text-sm p-2 bg-muted rounded font-mono"
                  >
                    {event}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Test Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">To test tab close detection:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Open the browser's developer console (F12) to see detailed logs</li>
                  <li>Switch to another tab or minimize the window</li>
                  <li>Wait 5 seconds while the tab remains hidden</li>
                  <li>Check the Session Management tab in Audit Logs for the session end record</li>
                </ol>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">To test browser close detection:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Click the "Close Browser Tab" button or use Ctrl+W</li>
                  <li>The beforeunload event will trigger session end logging</li>
                  <li>Check the audit logs after logging back in</li>
                </ol>
              </div>

              <div>
                <h4 className="font-semibold mb-2">To test inactivity timeout:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Stop all mouse movement and keyboard activity</li>
                  <li>Watch the inactivity timer count up to 15 minutes (900 seconds)</li>
                  <li>The session will automatically terminate and redirect to login</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}