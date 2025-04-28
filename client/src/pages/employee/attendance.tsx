import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate, formatTime } from "@/lib/utils";
import EmployeeLayout from "@/components/layout/employee-layout";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Calendar, CheckCircle, Clock, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import SurveyForm from "@/components/forms/survey-form";
import { useState } from "react";

type Attendance = {
  id: number;
  date: string;
  checkIn: string;
  checkOut: string | null;
  duration: string;
  status: string;
};

export default function EmployeeAttendance() {
  const { user } = useAuth();
  const [surveyDialogOpen, setSurveyDialogOpen] = useState(false);
  
  // Get today's attendance
  const { data: todayAttendance, isLoading: todayLoading } = useQuery({
    queryKey: ["/api/attendance/today"],
  });
  
  // Get all attendance records
  const { data: attendanceList, isLoading: historyLoading } = useQuery({
    queryKey: ["/api/attendance"],
  });
  
  const handleCheckIn = async () => {
    try {
      await apiRequest("POST", "/api/attendance/check-in");
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
    } catch (error) {
      console.error("Failed to check in:", error);
    }
  };
  
  const handleCheckOut = async () => {
    try {
      await apiRequest("POST", "/api/attendance/check-out");
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      setSurveyDialogOpen(true);
    } catch (error) {
      console.error("Failed to check out:", error);
    }
  };
  
  // Format attendance data for table
  const getFormattedAttendance = (): Attendance[] => {
    if (!attendanceList) return [];
    
    return attendanceList.map(record => {
      let duration = '-';
      let status = 'Pending';
      
      if (record.checkIn && record.checkOut) {
        const checkInTime = new Date(record.checkIn);
        const checkOutTime = new Date(record.checkOut);
        const diffMs = checkOutTime.getTime() - checkInTime.getTime();
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.round((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        duration = `${diffHrs}h ${diffMins}m`;
        status = 'Completed';
      } else if (record.checkIn) {
        status = 'In Progress';
      }
      
      return {
        id: record.id,
        date: record.date,
        checkIn: record.checkIn,
        checkOut: record.checkOut,
        duration,
        status
      };
    });
  };
  
  // Define columns for attendance table
  const columns: ColumnDef<Attendance>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => {
        const date = row.getValue("date") as string;
        return (
          <div className="flex items-center">
            <Calendar className="mr-2 h-4 w-4 text-gray-400" />
            <span>{formatDate(date)}</span>
          </div>
        );
      },
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
        
        if (status === 'Completed') {
          return (
            <div className="flex items-center">
              <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
              <span>Completed</span>
            </div>
          );
        } else if (status === 'In Progress') {
          return (
            <div className="flex items-center">
              <Clock className="mr-2 h-4 w-4 text-blue-500" />
              <span>In Progress</span>
            </div>
          );
        } else {
          return (
            <div className="flex items-center">
              <XCircle className="mr-2 h-4 w-4 text-gray-400" />
              <span>Pending</span>
            </div>
          );
        }
      },
    },
  ];

  return (
    <EmployeeLayout>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Attendance</h1>
      
      {/* Today's Attendance Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Today's Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          {todayLoading ? (
            <div className="flex flex-col gap-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-10 w-40" />
            </div>
          ) : (
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div className="mb-4 md:mb-0">
                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-500">Status</span>
                    <span className={`text-sm font-semibold ${todayAttendance ? 'text-green-600' : 'text-gray-600'}`}>
                      {todayAttendance ? 'Checked In' : 'Not Checked In'}
                    </span>
                  </div>
                  
                  {todayAttendance && (
                    <>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-500">Check In Time</span>
                        <span className="text-sm font-semibold">{formatTime(todayAttendance.checkIn)}</span>
                      </div>
                      
                      {todayAttendance.checkOut && (
                        <>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-500">Check Out Time</span>
                            <span className="text-sm font-semibold">{formatTime(todayAttendance.checkOut)}</span>
                          </div>
                          
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-500">Duration</span>
                            <span className="text-sm font-semibold">
                              {(() => {
                                const checkInTime = new Date(todayAttendance.checkIn);
                                const checkOutTime = new Date(todayAttendance.checkOut);
                                const diffMs = checkOutTime.getTime() - checkInTime.getTime();
                                const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                                const diffMins = Math.round((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                                return `${diffHrs}h ${diffMins}m`;
                              })()}
                            </span>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              <div>
                {todayAttendance && !todayAttendance.checkOut ? (
                  <Button 
                    onClick={handleCheckOut}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Check Out & Submit Work
                  </Button>
                ) : todayAttendance && todayAttendance.checkOut ? (
                  <div className="text-sm text-green-600 font-medium">
                    Completed for today
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
          )}
        </CardContent>
      </Card>
      
      {/* Attendance History */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance History</CardTitle>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <DataTable 
              columns={columns} 
              data={getFormattedAttendance()}
              searchColumn="date"
              searchPlaceholder="Search by date..."
            />
          )}
        </CardContent>
      </Card>
      
      {/* Survey Submission Dialog */}
      <Dialog open={surveyDialogOpen} onOpenChange={setSurveyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Today's Survey Work</DialogTitle>
          </DialogHeader>
          <SurveyForm onSuccess={() => setSurveyDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </EmployeeLayout>
  );
}
