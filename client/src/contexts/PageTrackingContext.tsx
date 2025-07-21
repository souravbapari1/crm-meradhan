import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { useLocation } from 'wouter';

interface PageView {
  pagePath: string;
  pageTitle: string;
  entryTime: Date;
  exitTime?: Date;
  duration?: number;
  scrollDepth: number;
  interactions: number;
}

interface PageTrackingContextType {
  currentPageView: PageView | null;
  updateInteractions: () => void;
  updateScrollDepth: (depth: number) => void;
}

const PageTrackingContext = createContext<PageTrackingContextType | undefined>(undefined);

export const usePageTracking = () => {
  const context = useContext(PageTrackingContext);
  if (!context) {
    throw new Error('usePageTracking must be used within a PageTrackingProvider');
  }
  return context;
};

const getPageTitle = (path: string): string => {
  const titleMap: Record<string, string> = {
    '/': 'Dashboard',
    '/dashboard': 'Dashboard',
    '/leads': 'Lead Management',
    '/customers': 'Customer Management',
    '/sales-pipeline': 'Sales Pipeline',
    '/rfq-management': 'RFQ Management',
    '/support-tickets': 'Support Tickets',
    '/email-templates': 'Email Templates',
    '/reports': 'Reports',
    '/user-management': 'User Management',
    '/audit-logs': 'Audit Logs',
    '/session-test': 'Session Test',
  };
  return titleMap[path] || `Page: ${path}`;
};

export const PageTrackingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [location] = useLocation();
  const [currentPageView, setCurrentPageView] = useState<PageView | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const pageViewIdRef = useRef<number | null>(null);
  const maxScrollRef = useRef(0);
  const interactionsRef = useRef(0);
  const visibilityTimeRef = useRef<number>(Date.now());

  // Initialize session tracking
  useEffect(() => {
    if (user) {
      const sessionToken = localStorage.getItem('sessionToken') || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('sessionToken', sessionToken);
      sessionIdRef.current = sessionToken;
    }
  }, [user]);

  // Track page changes
  useEffect(() => {
    if (!user || !sessionIdRef.current) return;

    const startPageView = async () => {
      // End previous page view if exists
      if (currentPageView && pageViewIdRef.current) {
        await endPageView();
      }

      // Start new page view
      const pageTitle = getPageTitle(location);
      const newPageView: PageView = {
        pagePath: location,
        pageTitle,
        entryTime: new Date(),
        scrollDepth: 0,
        interactions: 0,
      };

      setCurrentPageView(newPageView);
      maxScrollRef.current = 0;
      interactionsRef.current = 0;
      visibilityTimeRef.current = Date.now();

      try {
        const response = await fetch('/api/page-tracking/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            sessionToken: sessionIdRef.current,
            pagePath: location,
            pageTitle,
            referrer: document.referrer,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          pageViewIdRef.current = data.pageViewId;
        }
      } catch (error) {
        console.error('Failed to start page tracking:', error);
      }
    };

    startPageView();
  }, [location, user]);

  // End page view function
  const endPageView = async () => {
    if (!currentPageView || !pageViewIdRef.current || !user) return;

    const exitTime = new Date();
    const duration = Math.floor((exitTime.getTime() - currentPageView.entryTime.getTime()) / 1000);

    try {
      await fetch('/api/page-tracking/end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          pageViewId: pageViewIdRef.current,
          exitTime: exitTime.toISOString(),
          duration,
          scrollDepth: maxScrollRef.current,
          interactions: interactionsRef.current,
        }),
      });
    } catch (error) {
      console.error('Failed to end page tracking:', error);
    }
  };

  // Track scroll depth
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = scrollHeight > 0 ? Math.round((scrollTop / scrollHeight) * 100) : 0;
      
      if (scrollPercent > maxScrollRef.current) {
        maxScrollRef.current = scrollPercent;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Track interactions
  useEffect(() => {
    const handleInteraction = () => {
      if (document.visibilityState === 'visible') {
        interactionsRef.current += 1;
      }
    };

    const events = ['click', 'keydown', 'submit'];
    events.forEach(event => {
      document.addEventListener(event, handleInteraction, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleInteraction, true);
      });
    };
  }, []);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        endPageView();
      } else {
        visibilityTimeRef.current = Date.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Handle page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentPageView && pageViewIdRef.current && user) {
        const exitTime = new Date();
        const duration = Math.floor((exitTime.getTime() - currentPageView.entryTime.getTime()) / 1000);

        // Use sendBeacon for reliable data sending on page unload
        navigator.sendBeacon('/api/page-tracking/end', JSON.stringify({
          pageViewId: pageViewIdRef.current,
          exitTime: exitTime.toISOString(),
          duration,
          scrollDepth: maxScrollRef.current,
          interactions: interactionsRef.current,
          token: localStorage.getItem('token'),
        }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentPageView, user]);

  const updateInteractions = () => {
    interactionsRef.current += 1;
  };

  const updateScrollDepth = (depth: number) => {
    if (depth > maxScrollRef.current) {
      maxScrollRef.current = depth;
    }
  };

  return (
    <PageTrackingContext.Provider value={{
      currentPageView,
      updateInteractions,
      updateScrollDepth,
    }}>
      {children}
    </PageTrackingContext.Provider>
  );
};