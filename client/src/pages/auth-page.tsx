import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import LoginForm from "@/components/forms/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuthPage() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    // Redirect if user is already logged in
    if (user && !isLoading) {
      if (user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-t-2 border-b-2 border-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Login Form Section */}
      <div className="w-full md:w-1/2 p-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-semibold text-gray-800">WorkTrack</CardTitle>
            <CardDescription className="text-gray-500">Employee Management System</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>

      {/* Hero Section */}
      <div className="w-full md:w-1/2 bg-gradient-to-r from-primary to-blue-700 p-8 flex items-center justify-center">
        <div className="max-w-lg text-white">
          <h1 className="text-4xl font-bold mb-6">Streamlined Employee Management</h1>
          <p className="text-lg mb-8">
            Track attendance, manage survey work, and calculate salaries efficiently with WorkTrack.
            Our platform helps businesses optimize employee productivity and simplify administrative tasks.
          </p>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 text-blue-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <p className="ml-3 text-white/90">Track employee attendance with check-in/check-out system</p>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 text-blue-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <p className="ml-3 text-white/90">Manage survey work across multiple providers</p>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 text-blue-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <p className="ml-3 text-white/90">Automatic salary calculations based on work performance</p>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 text-blue-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <p className="ml-3 text-white/90">Comprehensive leave management system</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
