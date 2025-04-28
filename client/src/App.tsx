import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";

// Employee pages
import EmployeeDashboard from "@/pages/employee/dashboard";
import EmployeeAttendance from "@/pages/employee/attendance";
import EmployeeSurveys from "@/pages/employee/surveys";
import EmployeeLeave from "@/pages/employee/leave";
import EmployeeSalary from "@/pages/employee/salary";

// Admin pages
import AdminDashboard from "@/pages/admin/dashboard";
import AdminEmployees from "@/pages/admin/employees";
import AdminAttendance from "@/pages/admin/attendance";
import AdminSurveys from "@/pages/admin/surveys";
import AdminLeave from "@/pages/admin/leave";
import AdminSalary from "@/pages/admin/salary";
import AdminReports from "@/pages/admin/reports";
import AdminSettings from "@/pages/admin/settings";

function Router() {
  return (
    <Switch>
      {/* Auth route */}
      <Route path="/auth" component={AuthPage} />
      
      {/* Employee routes */}
      <ProtectedRoute path="/" component={EmployeeDashboard} roles={["employee", "admin"]} />
      <ProtectedRoute path="/attendance" component={EmployeeAttendance} roles={["employee", "admin"]} />
      <ProtectedRoute path="/surveys" component={EmployeeSurveys} roles={["employee", "admin"]} />
      <ProtectedRoute path="/leave" component={EmployeeLeave} roles={["employee", "admin"]} />
      <ProtectedRoute path="/salary" component={EmployeeSalary} roles={["employee", "admin"]} />
      
      {/* Admin routes */}
      <ProtectedRoute path="/admin" component={AdminDashboard} roles={["admin"]} />
      <ProtectedRoute path="/admin/employees" component={AdminEmployees} roles={["admin"]} />
      <ProtectedRoute path="/admin/attendance" component={AdminAttendance} roles={["admin"]} />
      <ProtectedRoute path="/admin/surveys" component={AdminSurveys} roles={["admin"]} />
      <ProtectedRoute path="/admin/leave" component={AdminLeave} roles={["admin"]} />
      <ProtectedRoute path="/admin/salary" component={AdminSalary} roles={["admin"]} />
      <ProtectedRoute path="/admin/reports" component={AdminReports} roles={["admin"]} />
      <ProtectedRoute path="/admin/settings" component={AdminSettings} roles={["admin"]} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
