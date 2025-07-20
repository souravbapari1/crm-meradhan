import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import Leads from "./pages/leads";
import Customers from "./pages/customers";
import SalesPipeline from "./pages/sales-pipeline";
import RFQManagement from "./pages/rfq-management";
import SupportTickets from "./pages/support-tickets";
import EmailTemplates from "./pages/email-templates";
import Reports from "./pages/reports";
import UserManagement from "./pages/user-management";
import AuditLogs from "./pages/audit-logs";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/login" component={Login} />
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/leads">
        <ProtectedRoute>
          <Leads />
        </ProtectedRoute>
      </Route>
      <Route path="/customers">
        <ProtectedRoute>
          <Customers />
        </ProtectedRoute>
      </Route>
      <Route path="/sales-pipeline">
        <ProtectedRoute>
          <SalesPipeline />
        </ProtectedRoute>
      </Route>
      <Route path="/rfq-management">
        <ProtectedRoute>
          <RFQManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/support-tickets">
        <ProtectedRoute>
          <SupportTickets />
        </ProtectedRoute>
      </Route>
      <Route path="/email-templates">
        <ProtectedRoute>
          <EmailTemplates />
        </ProtectedRoute>
      </Route>
      <Route path="/reports">
        <ProtectedRoute>
          <Reports />
        </ProtectedRoute>
      </Route>
      <Route path="/user-management">
        <ProtectedRoute allowedRoles={['admin']}>
          <UserManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/audit-logs">
        <ProtectedRoute allowedRoles={['admin']}>
          <AuditLogs />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
