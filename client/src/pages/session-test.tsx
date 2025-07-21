import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Timer, LogOut, X, Eye, EyeOff } from "lucide-react";

export default function SessionTest() {
  const { user, logout } = useAuth();
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number>(15 * 60); // 15 minutes in seconds
  const [isTabHidden, setIsTabHidden] = useState(false);

  useEffect(() => {
    // Get current session info
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setSessionInfo({
          userId: payload.userId,
          email: payload.email,
          sessionToken: payload.sessionToken,
          exp: new Date(payload.exp * 1000).toLocaleString()
        });
      } catch (e) {
        console.log('Could not parse token');
      }
    }

    // Update countdown timer
    const interval = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    // Track visibility changes
    const handleVisibilityChange = () => {
      setIsTabHidden(document.visibilityState === 'hidden');
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const testManualLogout = () => {
    console.log('🧪 Testing Manual Logout...');
    logout();
  };

  const testBrowserClose = () => {
    console.log('🧪 Testing Browser Close...');
    // Simulate beforeunload event
    window.dispatchEvent(new Event('beforeunload'));
    window.close();
  };

  const testTabHide = () => {
    console.log('🧪 Testing Tab Hide (switch to another tab for 15+ minutes)');
    alert('Switch to another tab for 15+ minutes to test tab hide timeout. Check console for logs.');
  };

  const resetTimer = () => {
    console.log('🔄 Simulating user activity to reset timer');
    document.dispatchEvent(new Event('mousemove'));
    setTimeLeft(15 * 60);
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Session Logout Testing</h1>
          <p className="text-muted-foreground mt-2">
            Test all logout scenarios and session management
          </p>
        </div>

        {/* Current Session Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5" />
              Current Session Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sessionInfo ? (
              <div className="space-y-2">
                <p><strong>User ID:</strong> {sessionInfo.userId}</p>
                <p><strong>Email:</strong> {sessionInfo.email}</p>
                <p><strong>Session Token:</strong> <code className="text-sm bg-muted px-2 py-1 rounded">{sessionInfo.sessionToken}</code></p>
                <p><strong>Token Expires:</strong> {sessionInfo.exp}</p>
                <div className="flex items-center gap-2">
                  <strong>Tab Status:</strong>
                  {isTabHidden ? (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <EyeOff className="h-3 w-3" />
                      Hidden
                    </Badge>
                  ) : (
                    <Badge variant="default" className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      Visible
                    </Badge>
                  )}
                </div>
              </div>
            ) : (
              <p>No session info available</p>
            )}
          </CardContent>
        </Card>

        {/* Inactivity Timer */}
        <Card>
          <CardHeader>
            <CardTitle>Inactivity Timer</CardTitle>
            <CardDescription>
              Time until automatic logout due to inactivity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-mono">{formatTime(timeLeft)}</div>
                <p className="text-sm text-muted-foreground">
                  {timeLeft === 0 ? 'Session should timeout now!' : 'Time remaining'}
                </p>
              </div>
              <Button onClick={resetTimer} variant="outline">
                Reset Timer (Simulate Activity)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Logout Tests */}
        <Card>
          <CardHeader>
            <CardTitle>Logout Scenario Tests</CardTitle>
            <CardDescription>
              Test different logout mechanisms and verify proper session ending
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                onClick={testManualLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Test Manual Logout
              </Button>
              
              <Button 
                onClick={testBrowserClose}
                variant="outline"
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Test Browser Close
              </Button>
              
              <Button 
                onClick={testTabHide}
                variant="outline"
                className="flex items-center gap-2"
              >
                <EyeOff className="h-4 w-4" />
                Test Tab Hide Timeout
              </Button>
              
              <Button 
                onClick={() => window.location.reload()}
                variant="secondary"
                className="flex items-center gap-2"
              >
                🔄 Test Page Refresh (No New Session)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Test Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold">1. Manual Logout Test</h4>
                <p className="text-sm text-muted-foreground">
                  Click "Test Manual Logout" and verify session ends with reason 'logout' in Session Analytics
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold">2. Inactivity Timeout Test</h4>
                <p className="text-sm text-muted-foreground">
                  Don't interact with the page for 15 minutes. Watch the timer count down and verify automatic logout.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold">3. Browser Close Test</h4>
                <p className="text-sm text-muted-foreground">
                  Click "Test Browser Close" to simulate closing the browser. Check Session Analytics after reopening.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold">4. Tab Hide Test</h4>
                <p className="text-sm text-muted-foreground">
                  Switch to another tab for 15+ minutes. Return to verify session ended with 'browser_close' reason.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold">5. Page Refresh Test</h4>
                <p className="text-sm text-muted-foreground">
                  Refresh the page multiple times. Verify the same session is maintained (no duplicates created).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}