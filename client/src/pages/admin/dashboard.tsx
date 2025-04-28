import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Skeleton } from "@/components/ui/skeleton";
import AdminLayout from "@/components/layout/admin-layout";
import { formatCurrency, getSurveyTypeData } from "@/lib/utils";
import { format, subMonths } from "date-fns";
import { SurveyType } from "@shared/schema";
import { 
  BarChart, BarChart2, CalendarRange, 
  CheckCircle, ClipboardCheck, CalendarDays, 
  Users, UserCheck 
} from "lucide-react";

export default function AdminDashboard() {
  // Get current month for stats
  const currentMonth = format(new Date(), "yyyy-MM");
  
  // Get dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/stats", currentMonth],
  });
  
  // Get all employees
  const { data: employees, isLoading: employeesLoading } = useQuery({
    queryKey: ["/api/admin/employees"],
  });
  
  // Get pending leaves
  const { data: pendingLeaves, isLoading: leavesLoading } = useQuery({
    queryKey: ["/api/admin/leave"],
  });
  
  // Get today's attendance
  const today = format(new Date(), "yyyy-MM-dd");
  const { data: todayAttendance, isLoading: attendanceLoading } = useQuery({
    queryKey: ["/api/admin/attendance", today],
  });
  
  // Get survey stats
  const { data: surveyStatsMonthly, isLoading: surveyStatsLoading } = useQuery({
    queryKey: ["/api/admin/surveys", today],
  });
  
  // Get salaries
  const { data: salaries, isLoading: salariesLoading } = useQuery({
    queryKey: ["/api/admin/salaries", currentMonth],
  });
  
  // Get top performers (sort by surveys completed this month)
  const getTopPerformers = () => {
    if (!employees || !salaries) return [];
    
    // Create a map of employee IDs to salary data
    const salaryMap = new Map();
    salaries.forEach(salary => {
      salaryMap.set(salary.employee?.id, salary);
    });
    
    // Filter employees with salary data
    return employees
      .filter(emp => salaryMap.has(emp.id))
      .map(emp => {
        const salary = salaryMap.get(emp.id);
        return {
          ...emp,
          salary: salary.grossSalary,
          surveysPerDay: Math.round(salary.grossSalary / 25 / 30) // Rough estimate
        };
      })
      .sort((a, b) => b.salary - a.salary)
      .slice(0, 4);
  };
  
  return (
    <AdminLayout>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Admin Dashboard</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {/* Total Employees */}
        <DashboardCard
          title="Total Employees"
          value={statsLoading ? "Loading..." : stats?.employeeCount.toString() || "0"}
          icon={<Users className="h-6 w-6 text-white" />}
          color="blue"
        />
        
        {/* Present Today */}
        <DashboardCard
          title="Present Today"
          value={statsLoading ? "Loading..." : stats?.presentToday.toString() || "0"}
          icon={<UserCheck className="h-6 w-6 text-white" />}
          color="green"
        />
        
        {/* Surveys Today */}
        <DashboardCard
          title="Surveys Today"
          value={statsLoading ? "Loading..." : stats?.surveysToday.toString() || "0"}
          icon={<ClipboardCheck className="h-6 w-6 text-white" />}
          color="purple"
        />
        
        {/* Pending Leaves */}
        <DashboardCard
          title="Pending Leaves"
          value={statsLoading ? "Loading..." : stats?.pendingLeaves.toString() || "0"}
          icon={<CalendarDays className="h-6 w-6 text-white" />}
          color="amber"
        />
      </div>
      
      {/* Survey Stats */}
      <h2 className="text-lg font-medium text-gray-900 mb-4">Survey Completion Stats</h2>
      <Card className="mb-6">
        <CardContent className="pt-6">
          {surveyStatsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-28 w-full" />
              ))}
            </div>
          ) : stats && stats.surveyStats ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {Object.entries(stats.surveyStats).map(([type, data]) => {
                const typeData = getSurveyTypeData(type as SurveyType);
                return (
                  <div key={type} className={`${typeData.bgColor} p-4 rounded-lg`}>
                    <h3 className={`text-sm font-medium ${typeData.textColor} mb-2`}>{typeData.name}</h3>
                    <div className="flex justify-between">
                      <div>
                        <p className={`text-2xl font-bold ${typeData.accentColor}`}>{data.completed}</p>
                        <p className={`text-sm ${typeData.textColor}`}>Completed</p>
                      </div>
                      <div>
                        <p className={`text-2xl font-bold text-red-600`}>{data.rejected}</p>
                        <p className={`text-sm text-red-500`}>Rejected</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center p-4 text-gray-500">No survey data available</div>
          )}
        </CardContent>
      </Card>
      
      {/* Recent Activity & Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {attendanceLoading || leavesLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {todayAttendance && todayAttendance.slice(0, 4).map((record) => (
                  <li key={record.id} className="py-3">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium rounded-full h-8 w-8 flex items-center justify-center">
                          {record.employee?.fullName.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">
                          {record.employee?.fullName} {record.checkOut 
                            ? "marked attendance OUT" 
                            : "marked attendance IN"}
                        </p>
                        <p className="text-xs text-gray-500">
                          Today, {format(new Date(record.checkOut || record.checkIn), "h:mm a")}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
                
                {pendingLeaves && pendingLeaves.slice(0, 2).map((leave) => (
                  <li key={leave.id} className="py-3">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <span className="bg-purple-100 text-purple-800 text-xs font-medium rounded-full h-8 w-8 flex items-center justify-center">
                          {leave.employee?.fullName.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">
                          {leave.employee?.fullName} requested leave for {Math.ceil(
                            (new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) / 
                            (1000 * 60 * 60 * 24)
                          ) + 1} days
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(leave.createdAt), "MMM d, h:mm a")}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
                
                {(!todayAttendance || todayAttendance.length === 0) && 
                 (!pendingLeaves || pendingLeaves.length === 0) && (
                  <div className="py-4 text-center text-gray-500">
                    No recent activity
                  </div>
                )}
              </ul>
            )}
          </CardContent>
        </Card>
        
        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
          </CardHeader>
          <CardContent>
            {employeesLoading || salariesLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : getTopPerformers().length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {getTopPerformers().map((employee) => (
                  <li key={employee.id} className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium rounded-full h-8 w-8 flex items-center justify-center">
                            {employee.fullName.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">{employee.fullName}</p>
                          <p className="text-xs text-gray-500">ID: {employee.username}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{employee.surveysPerDay} surveys/day</p>
                        <p className="text-xs text-green-500">{formatCurrency(employee.salary / 30)} avg. daily</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-4 text-center text-gray-500">
                No salary data available to determine top performers
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
