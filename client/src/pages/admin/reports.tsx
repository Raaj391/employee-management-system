import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format, subMonths } from "date-fns";
import AdminLayout from "@/components/layout/admin-layout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart as BarChartIcon,
  Calendar,
  ChevronDown,
  Download,
  FileText,
  PieChart,
  TrendingUp,
  Users
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart as RechartsePieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";

// Mock data for the charts
const surveyData = [
  { name: 'Yours', completed: 245, rejected: 12 },
  { name: 'International', completed: 178, rejected: 8 },
  { name: 'SSI', completed: 192, rejected: 5 },
  { name: 'Dynata', completed: 135, rejected: 7 },
];

const monthlyTrend = [
  { name: 'Jan', surveys: 600, revenue: 15000 },
  { name: 'Feb', surveys: 650, revenue: 16500 },
  { name: 'Mar', surveys: 700, revenue: 17500 },
  { name: 'Apr', surveys: 680, revenue: 17000 },
  { name: 'May', surveys: 720, revenue: 18000 },
  { name: 'Jun', surveys: 750, revenue: 19000 },
];

const employeePerformance = [
  { name: 'Mike J.', surveys: 28, revenue: 756 },
  { name: 'Rita P.', surveys: 26, revenue: 702 },
  { name: 'Amit K.', surveys: 24, revenue: 648 },
  { name: 'Sunita G.', surveys: 22, revenue: 594 },
  { name: 'David C.', surveys: 20, revenue: 540 },
];

const attendanceStats = [
  { name: 'On Time', value: 18 },
  { name: 'Late', value: 2 },
  { name: 'Absent', value: 4 },
];

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
const ATTENDANCE_COLORS = ['#10B981', '#F59E0B', '#EF4444'];

export default function AdminReports() {
  // Get current month for stats
  const currentDate = new Date();
  const defaultMonth = format(currentDate, "yyyy-MM");
  
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  
  // Generate options for month dropdown
  const getLastMonths = () => {
    const months = [];
    for (let i = 0; i < 12; i++) {
      const date = subMonths(currentDate, i);
      months.push({
        value: format(date, "yyyy-MM"),
        label: format(date, "MMMM yyyy")
      });
    }
    return months;
  };
  
  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Reports & Analytics</h1>
        
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <Select
            value={selectedMonth}
            onValueChange={setSelectedMonth}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {getLastMonths().map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="surveys" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full md:w-[500px]">
          <TabsTrigger value="surveys" className="flex gap-1 items-center">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Surveys</span>
          </TabsTrigger>
          <TabsTrigger value="attendance" className="flex gap-1 items-center">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Attendance</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex gap-1 items-center">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Performance</span>
          </TabsTrigger>
          <TabsTrigger value="salary" className="flex gap-1 items-center">
            <BarChartIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Salary</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Survey Reports */}
        <TabsContent value="surveys">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Survey Completion by Type</CardTitle>
                <CardDescription>
                  Breakdown of completed and rejected surveys
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={surveyData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="completed" name="Completed" fill="#3B82F6" />
                      <Bar dataKey="rejected" name="Rejected" fill="#EF4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Survey Distribution</CardTitle>
                <CardDescription>
                  Distribution of survey types
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsePieChart>
                      <Pie
                        data={surveyData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="completed"
                      >
                        {surveyData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} surveys`, "Completed"]} />
                      <Legend />
                    </RechartsePieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Monthly Survey Trends</CardTitle>
                <CardDescription>
                  Survey completion trends over the last 6 months
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={monthlyTrend}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="surveys" name="Total Surveys" stroke="#3B82F6" activeDot={{ r: 8 }} />
                      <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue (₹)" stroke="#10B981" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Attendance Reports */}
        <TabsContent value="attendance">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Overview</CardTitle>
                <CardDescription>
                  Attendance statistics for {format(new Date(selectedMonth + "-01"), "MMMM yyyy")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsePieChart>
                      <Pie
                        data={attendanceStats}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {attendanceStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={ATTENDANCE_COLORS[index % ATTENDANCE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} employees`, ""]} />
                      <Legend />
                    </RechartsePieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Daily Attendance</CardTitle>
                <CardDescription>
                  Attendance tracking for each day of the month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { day: '1', present: 20, absent: 4 },
                        { day: '2', present: 22, absent: 2 },
                        { day: '3', present: 19, absent: 5 },
                        { day: '4', present: 21, absent: 3 },
                        { day: '5', present: 23, absent: 1 },
                        { day: '6', present: 18, absent: 6 },
                        { day: '7', present: 20, absent: 4 },
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="present" name="Present" stackId="a" fill="#10B981" />
                      <Bar dataKey="absent" name="Absent" stackId="a" fill="#EF4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle>Attendance Reports</CardTitle>
                  <CardDescription>
                    Detailed attendance reports for {format(new Date(selectedMonth + "-01"), "MMMM yyyy")}
                  </CardDescription>
                </div>
                <div>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Download className="h-4 w-4" />
                    <span>Download Report</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Present Days</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Absent Days</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Late Arrivals</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Working Hours</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Mike Johnson</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">20</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">2</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">1</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">7.5 hours</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Rita Patel</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">22</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">0</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">0</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">8.2 hours</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Amit Kumar</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">19</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">3</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">2</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">7.8 hours</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Performance Reports */}
        <TabsContent value="performance">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
                <CardDescription>
                  Employees with highest survey completion rates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={employeePerformance}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="surveys" name="Surveys per Day" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Revenue Generation</CardTitle>
                <CardDescription>
                  Daily revenue generated by top employees
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={employeePerformance}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" />
                      <Tooltip formatter={(value) => [`₹${value}`, "Revenue per Day"]} />
                      <Legend />
                      <Bar dataKey="revenue" name="Revenue per Day (₹)" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>
                    Detailed performance metrics for all employees
                  </CardDescription>
                </div>
                <div>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Download className="h-4 w-4" />
                    <span>Download Report</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Surveys</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Daily</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rejection Rate</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue Generated</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Mike Johnson</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">560</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">28</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">1.2%</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">₹15,120</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Rita Patel</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">520</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">26</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">0.8%</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">₹14,040</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Amit Kumar</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">480</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">24</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">1.5%</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">₹12,960</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Salary Reports */}
        <TabsContent value="salary">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Salary Distribution</CardTitle>
                <CardDescription>
                  Distribution of salaries across employees
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsePieChart>
                      <Pie
                        data={[
                          { name: '₹10k-15k', value: 4 },
                          { name: '₹15k-20k', value: 10 },
                          { name: '₹20k-25k', value: 6 },
                          { name: '₹25k+', value: 4 },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} employees`, ""]} />
                      <Legend />
                    </RechartsePieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Salary Components</CardTitle>
                <CardDescription>
                  Breakdown of salary components
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: 'Gross', amount: 380000 },
                        { name: 'Rejected', amount: 15000 },
                        { name: 'Leave', amount: 25000 },
                        { name: 'Final', amount: 340000 },
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, ""]} />
                      <Legend />
                      <Bar dataKey="amount" name="Amount (₹)" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle>Salary Reports</CardTitle>
                  <CardDescription>
                    Detailed salary report for {format(new Date(selectedMonth + "-01"), "MMMM yyyy")}
                  </CardDescription>
                </div>
                <div>
                  <Button variant="outline" size="sm" className="gap-1">
                    <Download className="h-4 w-4" />
                    <span>Download Report</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Salary</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rejected Deduction</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Deduction</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Final Salary</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Mike Johnson</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">₹15,120</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">₹324</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">₹1,008</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">₹13,788</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Rita Patel</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">₹14,040</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">₹200</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">₹0</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">₹13,840</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Amit Kumar</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">₹12,960</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">₹375</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">₹1,296</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">₹11,289</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
