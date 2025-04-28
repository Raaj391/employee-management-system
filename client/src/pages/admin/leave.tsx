import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { formatDateRange, getInitials, getLeaveStatusColor, getRandomColor } from "@/lib/utils";
import { Calendar, CheckCircle, Search, XCircle } from "lucide-react";
import AdminLayout from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

type LeaveApplication = {
  id: number;
  userId: number;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  createdAt: string;
  employee: {
    id: number;
    username: string;
    fullName: string;
    department: string;
  };
  duration: number;
};

export default function AdminLeave() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Get all leave applications
  const { data: leaveApplications, isLoading } = useQuery({
    queryKey: ["/api/admin/leave"],
  });
  
  // Handle approve/reject leave
  const handleStatusChange = async (id: number, status: string) => {
    setIsUpdating(true);
    try {
      await apiRequest("PUT", `/api/admin/leave/${id}`, { status });
      
      queryClient.invalidateQueries({ queryKey: ["/api/admin/leave"] });
      
      toast({
        title: `Leave ${status === 'approved' ? 'approved' : 'rejected'}`,
        description: `The leave application has been ${status === 'approved' ? 'approved' : 'rejected'} successfully.`,
      });
    } catch (error) {
      toast({
        title: "Action failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Format leave data for table
  const getFormattedLeaveApplications = (): LeaveApplication[] => {
    if (!leaveApplications) return [];
    
    return leaveApplications
      .map(leave => {
        const startDate = new Date(leave.startDate);
        const endDate = new Date(leave.endDate);
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include both start and end days
        
        return {
          ...leave,
          duration: diffDays
        };
      })
      .filter(leave => {
        // Apply status filter
        if (statusFilter !== "all" && leave.status !== statusFilter) {
          return false;
        }
        
        // Apply search filter
        return (
          leave.employee.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          leave.employee.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          leave.leaveType.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
  };
  
  // Define columns for leave table
  const columns: ColumnDef<LeaveApplication>[] = [
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
      cell: ({ row }) => format(new Date(row.original.createdAt), "MMM d, yyyy"),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const leave = row.original;
        // Only show action buttons for pending leave applications
        if (leave.status !== 'pending') {
          return <span className="text-sm text-gray-500">No actions needed</span>;
        }
        
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="bg-green-50 text-green-600 hover:bg-green-100 border-green-200"
              onClick={() => handleStatusChange(leave.id, 'approved')}
              disabled={isUpdating}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
              onClick={() => handleStatusChange(leave.id, 'rejected')}
              disabled={isUpdating}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <AdminLayout>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Leave Management</h1>
      
      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="relative md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search employee or leave type"
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="w-full md:w-48">
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Leave Applications */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Applications</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : getFormattedLeaveApplications().length > 0 ? (
            <DataTable 
              columns={columns} 
              data={getFormattedLeaveApplications()}
              searchColumn="employee.fullName"
              searchPlaceholder="Filter applications..."
            />
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No Leave Applications</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {statusFilter !== "all" 
                  ? `No ${statusFilter} leave applications found.` 
                  : "No leave applications found."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Policy Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Leave Policy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Standard Leave</h3>
              <p className="text-sm text-blue-600">
                Each employee is entitled to 12 days of leave per year. Unused leave does not carry over to the next year.
              </p>
            </div>
            
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
              <h3 className="text-sm font-medium text-amber-800 mb-2">Leave Deduction</h3>
              <p className="text-sm text-amber-600">
                Leave deduction is calculated as: (Gross Salary ÷ 30) × Number of leave days.
                This amount will be deducted from the monthly salary.
              </p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <h3 className="text-sm font-medium text-green-800 mb-2">Approval Process</h3>
              <p className="text-sm text-green-600">
                Leave requests must be approved by an administrator. Employees should submit leave requests at least 3 days in advance except for emergencies.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
