import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatDateRange, getLeaveStatusColor } from "@/lib/utils";
import EmployeeLayout from "@/components/layout/employee-layout";
import LeaveForm from "@/components/forms/leave-form";
import { Calendar, CalendarIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";

type Leave = {
  id: number;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  createdAt: string;
  duration: number;
};

export default function EmployeeLeave() {
  const { user } = useAuth();
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  
  // Get leave applications
  const { data: leaveApplications, isLoading } = useQuery({
    queryKey: ["/api/leave"],
  });
  
  // Format leave data for table
  const getFormattedLeave = (): Leave[] => {
    if (!leaveApplications) return [];
    
    return leaveApplications.map(leave => {
      const startDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include both start and end days
      
      return {
        ...leave,
        duration: diffDays
      };
    });
  };
  
  // Calculate pending leaves
  const getPendingLeaves = () => {
    return getFormattedLeave().filter(leave => leave.status === 'pending');
  };
  
  // Calculate approved leaves this month
  const getApprovedLeavesThisMonth = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return getFormattedLeave().filter(leave => {
      const leaveDate = new Date(leave.startDate);
      return (
        leave.status === 'approved' && 
        leaveDate.getMonth() === currentMonth && 
        leaveDate.getFullYear() === currentYear
      );
    });
  };
  
  // Calculate total leave days taken this month
  const getTotalLeaveDaysThisMonth = () => {
    return getApprovedLeavesThisMonth().reduce((total, leave) => total + leave.duration, 0);
  };
  
  // Define columns for leave table
  const columns: ColumnDef<Leave>[] = [
    {
      accessorKey: "leaveType",
      header: "Leave Type",
      cell: ({ row }) => {
        const type = row.getValue("leaveType") as string;
        return type.charAt(0).toUpperCase() + type.slice(1);
      },
    },
    {
      accessorKey: "dateRange",
      header: "Date Range",
      cell: ({ row }) => {
        const startDate = row.original.startDate;
        const endDate = row.original.endDate;
        return formatDateRange(startDate, endDate);
      },
    },
    {
      accessorKey: "duration",
      header: "Duration",
      cell: ({ row }) => `${row.getValue("duration")} days`,
    },
    {
      accessorKey: "reason",
      header: "Reason",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge 
            variant="outline" 
            className={getLeaveStatusColor(status)}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Applied On",
      cell: ({ row }) => formatDate(row.getValue("createdAt")),
    },
  ];

  return (
    <EmployeeLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Leave Management</h1>
        
        <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
          <DialogTrigger asChild>
            <Button className="mt-2 md:mt-0">
              <Calendar className="mr-2 h-4 w-4" />
              Apply for Leave
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Apply for Leave</DialogTitle>
            </DialogHeader>
            <LeaveForm onSuccess={() => setLeaveDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Leave Balance Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Leave Balance</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : (
            <div>
              <div className="flex justify-between mb-2">
                <div>
                  <span className="text-sm font-medium text-gray-700">Available Leave Balance</span>
                  <span className="ml-2 font-semibold text-blue-600">{user?.leaveBalance || 0} days</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Used This Month</span>
                  <span className="ml-2 font-semibold text-amber-600">{getTotalLeaveDaysThisMonth()} days</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Pending Requests</span>
                  <span className="ml-2 font-semibold text-purple-600">{getPendingLeaves().length}</span>
                </div>
              </div>
              
              <Progress 
                value={((12 - (user?.leaveBalance || 0)) / 12) * 100} 
                className="h-2"
              />
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <div className="flex items-start">
                    <CalendarIcon className="h-5 w-5 text-blue-500 mt-0.5 mr-2" />
                    <div>
                      <h3 className="text-sm font-medium text-blue-800">Leave Policy</h3>
                      <p className="text-xs text-blue-600 mt-1">
                        Employees are entitled to 12 days of leave per year. Unused leave does not carry over to the next year.
                        Leave requests must be submitted at least 3 days in advance except for emergencies.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                  <div className="flex items-start">
                    <CalendarIcon className="h-5 w-5 text-amber-500 mt-0.5 mr-2" />
                    <div>
                      <h3 className="text-sm font-medium text-amber-800">Leave Deduction</h3>
                      <p className="text-xs text-amber-600 mt-1">
                        Leave deduction is calculated as: (Gross Salary ÷ 30) × Number of leave days.
                        This amount will be deducted from your monthly salary.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Leave History */}
      <Card>
        <CardHeader>
          <CardTitle>Leave History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <DataTable 
              columns={columns} 
              data={getFormattedLeave()}
              searchColumn="leaveType"
              searchPlaceholder="Search leave records..."
            />
          )}
        </CardContent>
      </Card>
    </EmployeeLayout>
  );
}
