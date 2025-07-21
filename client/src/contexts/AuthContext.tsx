import { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from "react";
import { api } from "@/lib/api";
import { User } from "@/types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, otp: string) => Promise<void>;
  requestOTP: (email: string) => Promise<void>;
  logout: () => void;
  hasRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Session timeout: 15 minutes (in milliseconds)
const SESSION_TIMEOUT = 15 * 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Auto logout function
  const autoLogout = useCallback((reason: 'timeout' | 'browser_close' = 'timeout') => {
    console.log(`🔒 Session terminating due to: ${reason}`);
    
    const token = localStorage.getItem("token");
    if (user && token) {
      // Extract sessionToken from JWT token
      let sessionToken = null;
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        sessionToken = payload.sessionToken;
      } catch (e) {
        console.log('Could not extract sessionToken from JWT');
      }
      
      // Log the session end with detailed audit information
      const logData = {
        reason,
        timestamp: new Date().toISOString(),
        sessionDuration: Date.now() - lastActivityRef.current,
        token,
        sessionToken
      };
      
      // Try to log session end - use both regular API call and beacon for reliability
      api.post("/auth/session-end", logData).catch(() => {
        // If regular API fails, try beacon as fallback
        if (navigator.sendBeacon) {
          navigator.sendBeacon("/api/auth/session-end", JSON.stringify(logData));
        }
      });
    }
    
    localStorage.removeItem("token");
    setUser(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [user]);

  // Reset inactivity timer
  const resetTimer = useCallback(() => {
    if (!user) return;
    
    lastActivityRef.current = Date.now();
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      console.log('⏰ 15-minute inactivity timeout reached');
      autoLogout('timeout');
    }, SESSION_TIMEOUT);
  }, [user, autoLogout]);

  // Activity event listeners
  useEffect(() => {
    if (!user) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      resetTimer();
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Start the timer
    resetTimer();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [user, resetTimer]);

  // Browser/tab close detection
  useEffect(() => {
    if (!user) return;

    const handleBeforeUnload = () => {
      console.log('📡 Browser/tab closing - sending session end signal');
      // Use sendBeacon for reliable logout on page unload
      const token = localStorage.getItem("token");
      if (token && user) {
        // Extract sessionToken from JWT token
        let sessionToken = null;
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          sessionToken = payload.sessionToken;
        } catch (e) {
          console.log('Could not extract sessionToken from JWT');
        }
        
        const data = JSON.stringify({ 
          reason: 'browser_close',
          timestamp: new Date().toISOString(),
          sessionDuration: Date.now() - lastActivityRef.current,
          token,
          sessionToken
        });
        
        if (navigator.sendBeacon) {
          navigator.sendBeacon("/api/auth/session-end", data);
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        console.log('👁️ Tab/window hidden - starting logout timer');
        // Store timeout reference to clear it if tab becomes visible again
        const timeoutId = setTimeout(() => {
          if (document.visibilityState === 'hidden') {
            console.log('🚪 Tab/window still hidden after 15 minutes - logging out');
            autoLogout('browser_close');
          }
        }, 15 * 60 * 1000); // 15 minutes delay
        
        // Store timeout ID for potential cleanup
        (window as any).__visibilityTimeout = timeoutId;
      } else {
        console.log('👁️ Tab/window visible again');
        // Clear timeout if tab becomes visible again
        if ((window as any).__visibilityTimeout) {
          clearTimeout((window as any).__visibilityTimeout);
          delete (window as any).__visibilityTimeout;
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, autoLogout]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // Verify token and get user info
      api.get("/auth/me")
        .then(response => {
          setUser(response.data);
        })
        .catch(() => {
          localStorage.removeItem("token");
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const requestOTP = async (email: string) => {
    await api.post("/auth/request-otp", { email });
  };

  const login = async (email: string, otp: string) => {
    const response = await api.post("/auth/verify-otp", { email, otp });
    const { token, user: userData } = response.data;
    
    localStorage.setItem("token", token);
    setUser(userData);
    
    // Start session management
    resetTimer();
  };

  const logout = () => {
    console.log('🚪 Manual logout initiated');
    
    if (user) {
      // Log the session end with detailed audit information
      const logData = {
        reason: 'logout',
        timestamp: new Date().toISOString(),
        sessionDuration: Date.now() - lastActivityRef.current
      };
      
      // Extract sessionToken from JWT token
      const token = localStorage.getItem("token");
      let sessionToken = null;
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          sessionToken = payload.sessionToken;
        } catch (e) {
          console.log('Could not extract sessionToken from JWT');
        }
      }
      
      // Try to log session end - include token and sessionToken in main request
      api.post("/auth/session-end", {
        ...logData,
        token,
        sessionToken
      }).catch((error) => {
        // If regular API fails, try beacon as fallback
        console.log('Using beacon for logout tracking', error);
        if (navigator.sendBeacon) {
          navigator.sendBeacon("/api/auth/session-end", JSON.stringify({
            ...logData,
            token,
            sessionToken
          }));
        }
      });
    }
    
    localStorage.removeItem("token");
    localStorage.removeItem("sessionToken");
    setUser(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const hasRole = (roles: string[]): boolean => {
    return user ? roles.includes(user.role) : false;
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      requestOTP,
      logout,
      hasRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
