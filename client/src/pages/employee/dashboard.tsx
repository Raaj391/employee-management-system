import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import SurveyForm from "@/components/forms/survey-form";
import LeaveForm from "@/components/forms/leave-form";
import EmployeeLayout from "@/components/layout/employee-layout";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { BarChart, CalendarDays, CheckCircle, ClipboardList } from "lucide-react";

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [surveyDialogOpen, setSurveyDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  
  // Get today's attendance
  const { data: todayAttendance, isLoading: attendanceLoading } = useQuery({
    queryKey: ["/api/attendance/today"],
  });
  
  // Get today's surveys
  const { data: todaySurveys, isLoading: surveysLoading } = useQuery({
    queryKey: ["/api/surveys/today"],
  });
  
  // Get recent surveys
  const { data: allSurveys, isLoading: allSurveysLoading } = useQuery({
    queryKey: ["/api/surveys"],
  });
  
  // Get leave applications
  const { data: leaveApplications, isLoading: leaveLoading } = useQuery({
    queryKey: ["/api/leave"],
  });
  
  const handleCheckIn = async () => {
    try {
      await apiRequest("POST", "/api/attendance/check-in");
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/today"] });
    } catch (error) {
      console.error("Failed to check in:", error);
    }
  };
  
  const handleCheckOut = async () => {
    try {
      await apiRequest("POST", "/api/attendance/check-out");
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/today"] });
      setSurveyDialogOpen(true);
    } catch (error) {
      console.error("Failed to check out:", error);
    }
  };
  
  // Calculate total surveys today
  const calculateTodaySurveys = () => {
    if (!todaySurveys) return 0;
    let total = 0;
    if (todaySurveys.yours) total += todaySurveys.yours.completed;
    if (todaySurveys.yoursinternational) total += todaySurveys.yoursinternational.completed;
    if (todaySurveys.ssi) total += todaySurveys.ssi.completed;
    if (todaySurveys.dynata) total += todaySurveys.dynata.completed;
    return total;
  };
  
  // Calculate weekly surveys
  const calculateWeeklySurveys = () => {
    if (!allSurveys) return 0;
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return allSurveys.filter(survey => {
      const surveyDate = new Date(survey.date);
      return surveyDate >= oneWeekAgo;
    }).reduce((total, survey) => total + survey.completed, 0);
  };
  
  // Calculate monthly surveys
  const calculateMonthlySurveys = () => {
    if (!allSurveys) return 0;
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return allSurveys.filter(survey => {
      const surveyDate = new Date(survey.date);
      return surveyDate.getMonth() === currentMonth && surveyDate.getFullYear() === currentYear;
    }).reduce((total, survey) => total + survey.completed, 0);
  };
  
  // Get recent surveys (last 4)
  const getRecentSurveys = () => {
    if (!allSurveys) return [];
    
    return allSurveys
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 4);
  };
  
  // Get recent leave applications (last 2)
  const getRecentLeaveApplications = () => {
    if (!leaveApplications) return [];
    
    return leaveApplications
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 2);
  };
  
  // Function to get status badge class based on leave status
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };
  
  return (
    <EmployeeLayout>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Employee Dashboard</h1>
      
      {/* Attendance Card */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-2">Today's Attendance</h2>
              {attendanceLoading ? (
                <Skeleton className="h-5 w-40" />
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500 mr-2">Status:</span>
                    <span 
                      className={`text-sm font-medium ${
                        todayAttendance ? 'text-green-600' : 'text-gray-600'
                      }`}
                    >
                      {todayAttendance ? 'Checked In' : 'Not Checked In'}
                    </span>
                  </div>
                  
                  {todayAttendance && (
                    <div className="flex items-center mt-1 sm:mt-0">
                      <span className="text-sm text-gray-500 mr-2">Since:</span>
                      <span className="text-sm text-gray-600">{formatTime(todayAttendance.checkIn)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="mt-4 md:mt-0">
              {attendanceLoading ? (
                <Skeleton className="h-10 w-32" />
              ) : todayAttendance && !todayAttendance.checkOut ? (
                <Button 
                  onClick={handleCheckOut}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Check Out & Submit Work
                </Button>
              ) : todayAttendance && todayAttendance.checkOut ? (
                <div className="text-sm text-green-600 font-medium">
                  Completed for today
                  <div className="text-gray-500 font-normal">
                    Checked out at {formatTime(todayAttendance.checkOut)}
                  </div>
                </div>
              ) : (
                <Button 
                  onClick={handleCheckIn}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Check In
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Performance Summary */}
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Your Performance</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Today's Surveys */}
          <DashboardCard
            title="Today's Surveys"
            value={`${calculateTodaySurveys()}`}
            subtitle="Completed"
            icon={<ClipboardList className="h-6 w-6 text-white" />}
            color="blue"
          />
          
          {/* This Week */}
          <DashboardCard
            title="This Week"
            value={`${calculateWeeklySurveys()}`}
            subtitle="Completed"
            icon={<CalendarDays className="h-6 w-6 text-white" />}
            color="green"
          />
          
          {/* This Month */}
          <DashboardCard
            title="This Month"
            value={`${calculateMonthlySurveys()}`}
            subtitle="Completed"
            icon={<BarChart className="h-6 w-6 text-white" />}
            color="purple"
          />
          
          {/* Earnings Estimate */}
          <DashboardCard
            title="Monthly Earnings"
            value={formatCurrency(calculateMonthlySurveys() * 25)} // Average rate
            subtitle="Estimated"
            icon={<CheckCircle className="h-6 w-6 text-white" />}
            color="amber"
          />
        </div>
      </div>
      
      {/* Recent Surveys & Leave Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Survey Submissions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Recent Survey Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            {allSurveysLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : allSurveys && allSurveys.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {getRecentSurveys().map((survey) => (
                  <li key={survey.id} className="py-3">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {survey.surveyType === 'yours' ? 'Yours Surveys' : 
                           survey.surveyType === 'yoursinternational' ? 'Yours Surveys International' : 
                           survey.surveyType === 'ssi' ? 'SSI' : 'Dynata'}
                        </p>
                        <p className="text-xs text-gray-500">{formatDate(survey.date)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{survey.completed} surveys</p>
                        <p className="text-xs text-green-500">
                          {formatCurrency(
                            survey.surveyType === 'yours' ? survey.completed * 27 :
                            survey.surveyType === 'dynata' ? survey.completed * 20 :
                            survey.completed * 25
                          )}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-4 text-gray-500">
                No survey submissions yet
              </div>
            )}
            
            <Dialog open={surveyDialogOpen} onOpenChange={setSurveyDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Submit Today's Survey Work</DialogTitle>
                </DialogHeader>
                <SurveyForm onSuccess={() => setSurveyDialogOpen(false)} />
              </DialogContent>
            </Dialog>
            
            {todayAttendance && todayAttendance.checkOut && (
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => setSurveyDialogOpen(true)}
              >
                Submit Additional Survey Work
              </Button>
            )}
          </CardContent>
        </Card>
        
        {/* Leave Status */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-medium">Leave Status</CardTitle>
            <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">Apply for Leave</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Apply for Leave</DialogTitle>
                </DialogHeader>
                <LeaveForm onSuccess={() => setLeaveDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Leave Balance</span>
                <span className="text-sm font-medium text-blue-600">{user?.leaveBalance || 0} days</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div 
                  className="h-2 bg-blue-600 rounded-full" 
                  style={{ width: `${Math.min(100, ((user?.leaveBalance || 0) / 12) * 100)}%` }}
                ></div>
              </div>
            </div>
            
            <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Leave Applications</h4>
            
            {leaveLoading ? (
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : leaveApplications && leaveApplications.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {getRecentLeaveApplications().map((leave) => (
                  <li key={leave.id} className="py-3">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {leave.leaveType.charAt(0).toUpperCase() + leave.leaveType.slice(1)} Leave
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                        </p>
                      </div>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(leave.status)}`}>
                        {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-4 text-gray-500">
                No leave applications yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </EmployeeLayout>
  );
}
