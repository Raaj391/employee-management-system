import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layout/admin-layout";
import EmployeeForm from "@/components/forms/employee-form";
import { getInitials, getRandomColor } from "@/lib/utils";
import { Edit, Search, Trash2, UserPlus } from "lucide-react";

type Employee = {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: string;
  department: string;
  isActive: boolean;
  leaveBalance: number;
};

export default function AdminEmployees() {
  const { toast } = useToast();
  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [deleteEmployeeId, setDeleteEmployeeId] = useState<number | null>(null);
  
  // Get all employees
  const { data: employees, isLoading } = useQuery({
    queryKey: ["/api/admin/employees"],
  });
  
  const handleDeleteEmployee = async () => {
    if (!deleteEmployeeId) return;
    
    try {
      await apiRequest("DELETE", `/api/admin/employees/${deleteEmployeeId}`);
      
      queryClient.invalidateQueries({ queryKey: ["/api/admin/employees"] });
      
      toast({
        title: "Employee deleted",
        description: "The employee has been successfully deleted.",
      });
      
      setDeleteEmployeeId(null);
    } catch (error) {
      toast({
        title: "Failed to delete employee",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };
  
  // Define columns for employees table
  const columns: ColumnDef<Employee>[] = [
    {
      accessorKey: "employee",
      header: "Employee",
      cell: ({ row }) => {
        const employee = row.original;
        return (
          <div className="flex items-center">
            <div className={`flex-shrink-0 h-10 w-10 rounded-full ${getRandomColor(employee.fullName)} flex items-center justify-center`}>
              <span className="font-medium">{getInitials(employee.fullName)}</span>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900">{employee.fullName}</div>
              <div className="text-sm text-gray-500">{employee.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "username",
      header: "ID",
      cell: ({ row }) => <span className="text-sm text-gray-500">{row.getValue("username")}</span>,
    },
    {
      accessorKey: "department",
      header: "Department",
      cell: ({ row }) => <span className="text-sm text-gray-500">{row.getValue("department") || "-"}</span>,
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("isActive") as boolean;
        return (
          <Badge 
            variant="outline" 
            className={isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
          >
            {isActive ? "Active" : "Inactive"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "leaveBalance",
      header: "Leave Balance",
      cell: ({ row }) => <span className="text-sm text-gray-500">{row.getValue("leaveBalance")} days</span>,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const employee = row.original;
        return (
          <div className="flex justify-end gap-2">
            <Dialog
              open={editEmployee?.id === employee.id}
              onOpenChange={(open) => {
                if (!open) setEditEmployee(null);
              }}
            >
              <DialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setEditEmployee(employee)}
                >
                  <Edit className="h-4 w-4 text-blue-600" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Employee</DialogTitle>
                </DialogHeader>
                <EmployeeForm 
                  employee={editEmployee!} 
                  onSuccess={() => setEditEmployee(null)} 
                />
              </DialogContent>
            </Dialog>
            
            <AlertDialog
              open={deleteEmployeeId === employee.id}
              onOpenChange={(open) => {
                if (!open) setDeleteEmployeeId(null);
              }}
            >
              <AlertDialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setDeleteEmployeeId(employee.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Employee</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {employee.fullName}? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteEmployee}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        );
      },
    },
  ];

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Employee Management</h1>
        
        <Dialog open={addEmployeeOpen} onOpenChange={setAddEmployeeOpen}>
          <DialogTrigger asChild>
            <Button className="mt-2 md:mt-0">
              <UserPlus className="mr-2 h-4 w-4" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
            </DialogHeader>
            <EmployeeForm onSuccess={() => setAddEmployeeOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Search and Filter */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search by name or ID"
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="">All Departments</option>
                <option value="Survey Division">Survey Division</option>
                <option value="Data Analytics">Data Analytics</option>
                <option value="Support Team">Support Team</option>
              </select>
            </div>
            
            <div>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Employees Table */}
      <Card>
        <CardHeader>
          <CardTitle>Employees</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <DataTable 
              columns={columns} 
              data={employees || []}
              searchColumn="fullName"
              searchPlaceholder="Search employees..."
            />
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
