import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { format, subDays } from "date-fns";
import { formatDate, formatTime, getInitials, getRandomColor } from "@/lib/utils";
import { Calendar, CalendarIcon, Clock, Search, UserCheck, UserX } from "lucide-react";
import AdminLayout from "@/components/layout/admin-layout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { cn } from "@/lib/utils";

type Attendance = {
  id: number;
  date: string;
  userId: number;
  checkIn: string;
  checkOut: string | null;
  employee: {
    id: number;
    username: string;
    fullName: string;
    department: string;
  };
  duration: string;
  status: string;
};

export default function AdminAttendance() {
  // State for date filtering
  const today = format(new Date(), "yyyy-MM-dd");
  const [selectedDate, setSelectedDate] = useState(today);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Get attendance data for the selected date
  const { data: attendanceList, isLoading } = useQuery({
    queryKey: ["/api/admin/attendance", selectedDate],
  });
  
  // Function to get the last 7 dates for quick selection
  const getRecentDates = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = subDays(new Date(), i);
      dates.push({
        value: format(date, "yyyy-MM-dd"),
        label: i === 0 ? "Today" : i === 1 ? "Yesterday" : format(date, "EEE, MMM d")
      });
    }
    return dates;
  };
  
  // Calculate attendance statistics
  const getAttendanceStats = () => {
    if (!attendanceList) return { total: 0, present: 0, absent: 0, late: 0 };
    
    const present = attendanceList.length;
    // For demo, we'll assume 24 is the total number of employees (from dashboard card)
    const total = 24; 
    const absent = total - present;
    // Count how many checked in after 9:30 AM as late
    const late = attendanceList.filter(record => {
      const checkInTime = new Date(record.checkIn);
      const checkInHour = checkInTime.getHours();
      const checkInMinute = checkInTime.getMinutes();
      return checkInHour > 9 || (checkInHour === 9 && checkInMinute > 30);
    }).length;
    
    return { total, present, absent, late };
  };
  
  // Format attendance data for table
  const getFormattedAttendance = (): Attendance[] => {
    if (!attendanceList) return [];
    
    return attendanceList.map(record => {
      let duration = '-';
      let status = 'In Progress';
      
      if (record.checkIn && record.checkOut) {
        const checkInTime = new Date(record.checkIn);
        const checkOutTime = new Date(record.checkOut);
        const diffMs = checkOutTime.getTime() - checkInTime.getTime();
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.round((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        duration = `${diffHrs}h ${diffMins}m`;
        status = 'Completed';
      }
      
      return {
        ...record,
        duration,
        status
      };
    }).filter(record => 
      record.employee.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.employee.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };
  
  // Define columns for attendance table
  const columns: ColumnDef<Attendance>[] = [
    {
      accessorKey: "employee",
      header: "Employee",
      cell: ({ row }) => {
        const employee = row.original.employee;
        return (
          <div className="flex items-center">
            <div className={`flex-shrink-0 h-10 w-10 rounded-full ${getRandomColor(employee.fullName)} flex items-center justify-center`}>
              <span className="font-medium">{getInitials(employee.fullName)}</span>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900">{employee.fullName}</div>
              <div className="text-sm text-gray-500">ID: {employee.username}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "department",
      header: "Department",
      cell: ({ row }) => <span className="text-sm text-gray-500">{row.original.employee.department || "-"}</span>,
    },
    {
      accessorKey: "checkIn",
      header: "Check In",
      cell: ({ row }) => {
        const checkIn = row.getValue("checkIn") as string;
        return checkIn ? (
          <div className="flex items-center">
            <Clock className="mr-2 h-4 w-4 text-green-500" />
            <span>{formatTime(checkIn)}</span>
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        );
      },
    },
    {
      accessorKey: "checkOut",
      header: "Check Out",
      cell: ({ row }) => {
        const checkOut = row.getValue("checkOut") as string | null;
        return checkOut ? (
          <div className="flex items-center">
            <Clock className="mr-2 h-4 w-4 text-red-500" />
            <span>{formatTime(checkOut)}</span>
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        );
      },
    },
    {
      accessorKey: "duration",
      header: "Duration",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        
        return (
          <Badge
            variant="outline"
            className={status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}
          >
            {status}
          </Badge>
        );
      },
    },
  ];
  
  const stats = getAttendanceStats();

  return (
    <AdminLayout>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Attendance Management</h1>
      
      {/* Date Selection */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div className="flex items-center gap-2 mb-4 md:mb-0">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(new Date(selectedDate), "MMMM d, yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Select
                value={selectedDate}
                onValueChange={setSelectedDate}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select date" />
                </SelectTrigger>
                <SelectContent>
                  {getRecentDates().map((date) => (
                    <SelectItem key={date.value} value={date.value}>
                      {date.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </PopoverContent>
          </Popover>
          
          <Button
            variant="outline"
            onClick={() => setSelectedDate(today)}
            className={selectedDate === today ? "bg-blue-50 text-blue-600 border-blue-200" : ""}
          >
            Today
          </Button>
        </div>
        
        <div className="w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search employee"
              className="pl-10 w-full md:w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      {/* Attendance Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 mb-6">
        <DashboardCard
          title="Total Employees"
          value={stats.total.toString()}
          icon={<Calendar className="h-6 w-6 text-white" />}
          color="blue"
        />
        
        <DashboardCard
          title="Present"
          value={stats.present.toString()}
          icon={<UserCheck className="h-6 w-6 text-white" />}
          color="green"
        />
        
        <DashboardCard
          title="Absent"
          value={stats.absent.toString()}
          icon={<UserX className="h-6 w-6 text-white" />}
          color="red"
        />
        
        <DashboardCard
          title="Late Arrivals"
          value={stats.late.toString()}
          icon={<Clock className="h-6 w-6 text-white" />}
          color="amber"
        />
      </div>
      
      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Attendance for {format(new Date(selectedDate), "MMMM d, yyyy")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : getFormattedAttendance().length > 0 ? (
            <DataTable 
              columns={columns} 
              data={getFormattedAttendance()}
              searchColumn="employee.fullName"
              searchPlaceholder="Filter employees..."
            />
          ) : (
            <div className="text-center py-8">
              <UserX className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No Attendance Records</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                No attendance records found for {format(new Date(selectedDate), "MMMM d, yyyy")}.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
