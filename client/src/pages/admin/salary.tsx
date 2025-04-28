import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { format, subMonths } from "date-fns";
import { formatCurrency, getInitials, getRandomColor } from "@/lib/utils";
import { Calculator, Download, FileText, Search } from "lucide-react";
import AdminLayout from "@/components/layout/admin-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { Loader2 } from "lucide-react";

type Salary = {
  id: number;
  month: string;
  userId: number;
  grossSalary: number;
  rejectedSurveyDeduction: number;
  leaveDeduction: number;
  finalSalary: number;
  details: Record<string, any>;
  calculatedAt: string;
  employee: {
    id: number;
    username: string;
    fullName: string;
    department: string;
  };
};

// Form schema for salary calculation
const calculateSalarySchema = z.object({
  userId: z.number({
    required_error: "Employee is required",
  }),
});

export default function AdminSalary() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [calculateDialogOpen, setCalculateDialogOpen] = useState(false);
  
  // Get current month for stats
  const currentDate = new Date();
  const defaultMonth = format(currentDate, "yyyy-MM");
  
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  
  // Get salaries for the selected month
  const { data: salaries, isLoading } = useQuery({
    queryKey: ["/api/admin/salaries", selectedMonth],
  });
  
  // Get all employees for dropdown
  const { data: employees } = useQuery({
    queryKey: ["/api/admin/employees"],
  });
  
  // Form for salary calculation
  const calculateForm = useForm<z.infer<typeof calculateSalarySchema>>({
    resolver: zodResolver(calculateSalarySchema),
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  async function onSubmitCalculate(values: z.infer<typeof calculateSalarySchema>) {
    setIsSubmitting(true);
    
    try {
      const payload = {
        ...values,
        month: selectedMonth,
      };
      
      await apiRequest("POST", "/api/admin/calculate-salary", payload);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/salaries", selectedMonth] });
      
      toast({
        title: "Salary calculated",
        description: `Successfully calculated salary for ${selectedMonth}.`,
      });
      
      calculateForm.reset();
      setCalculateDialogOpen(false);
    } catch (error) {
      toast({
        title: "Failed to calculate salary",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
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
  
  // Format salary data for table
  const getFormattedSalaries = (): Salary[] => {
    if (!salaries) return [];
    
    return salaries
      .filter(salary => 
        salary.employee.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        salary.employee.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
  };
  
  // Calculate totals for the month
  const getMonthTotals = () => {
    if (!salaries || salaries.length === 0) return { gross: 0, rejected: 0, leave: 0, final: 0, count: 0 };
    
    return salaries.reduce(
      (acc, salary) => {
        return {
          gross: acc.gross + salary.grossSalary,
          rejected: acc.rejected + salary.rejectedSurveyDeduction,
          leave: acc.leave + salary.leaveDeduction,
          final: acc.final + salary.finalSalary,
          count: acc.count + 1
        };
      },
      { gross: 0, rejected: 0, leave: 0, final: 0, count: 0 }
    );
  };
  
  // Define columns for salary table
  const columns: ColumnDef<Salary>[] = [
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
      accessorKey: "grossSalary",
      header: "Gross Salary",
      cell: ({ row }) => (
        <span className="font-medium text-gray-900">
          {formatCurrency(row.original.grossSalary)}
        </span>
      ),
    },
    {
      accessorKey: "rejectedSurveyDeduction",
      header: "Rejected Survey Deduction",
      cell: ({ row }) => (
        <span className="font-medium text-red-600">
          {formatCurrency(row.original.rejectedSurveyDeduction)}
        </span>
      ),
    },
    {
      accessorKey: "leaveDeduction",
      header: "Leave Deduction",
      cell: ({ row }) => (
        <span className="font-medium text-amber-600">
          {formatCurrency(row.original.leaveDeduction)}
        </span>
      ),
    },
    {
      accessorKey: "finalSalary",
      header: "Final Salary",
      cell: ({ row }) => (
        <span className="font-medium text-green-600">
          {formatCurrency(row.original.finalSalary)}
        </span>
      ),
    },
    {
      accessorKey: "actions",
      header: "",
      cell: () => (
        <Button variant="ghost" size="sm" className="flex items-center">
          <FileText className="h-4 w-4 mr-2" />
          View
        </Button>
      ),
    },
  ];
  
  const totals = getMonthTotals();

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Salary Management</h1>
        
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <Dialog open={calculateDialogOpen} onOpenChange={setCalculateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Calculator className="mr-2 h-4 w-4" />
                Calculate Salary
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Calculate Salary</DialogTitle>
              </DialogHeader>
              <Form {...calculateForm}>
                <form onSubmit={calculateForm.handleSubmit(onSubmitCalculate)} className="space-y-6">
                  <FormField
                    control={calculateForm.control}
                    name="userId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Employee</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select employee" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {employees?.map((employee) => (
                              <SelectItem key={employee.id} value={employee.id.toString()}>
                                {employee.fullName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="pt-2">
                    <p className="text-sm text-gray-500 mb-2">
                      Calculating salary for {format(new Date(selectedMonth + "-01"), "MMMM yyyy")}
                    </p>
                    <p className="text-sm text-gray-500">
                      This will calculate the salary based on:
                    </p>
                    <ul className="text-sm text-gray-500 list-disc pl-5 mt-1">
                      <li>Survey work completed this month</li>
                      <li>Rejected surveys recorded for this month</li>
                      <li>Leave taken during this month</li>
                    </ul>
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Calculating...
                      </>
                    ) : (
                      "Calculate Salary"
                    )}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
      
      {/* Month selection and search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="w-full md:w-48">
          <Select
            value={selectedMonth}
            onValueChange={setSelectedMonth}
          >
            <SelectTrigger>
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
        </div>
        
        <div className="w-full md:w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search employee"
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      {/* Salary summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Salary Summary for {format(new Date(selectedMonth + "-01"), "MMMM yyyy")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Total Gross Salary</h3>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(totals.gross)}</p>
              <p className="text-sm text-blue-500 mt-1">For {totals.count} employees</p>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg border border-red-100">
              <h3 className="text-sm font-medium text-red-800 mb-2">Rejected Survey Deduction</h3>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totals.rejected)}</p>
              <p className="text-sm text-red-500 mt-1">{((totals.rejected / totals.gross) * 100).toFixed(2)}% of gross</p>
            </div>
            
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
              <h3 className="text-sm font-medium text-amber-800 mb-2">Leave Deduction</h3>
              <p className="text-2xl font-bold text-amber-600">{formatCurrency(totals.leave)}</p>
              <p className="text-sm text-amber-500 mt-1">{((totals.leave / totals.gross) * 100).toFixed(2)}% of gross</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <h3 className="text-sm font-medium text-green-800 mb-2">Total Final Salary</h3>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totals.final)}</p>
              <p className="text-sm text-green-500 mt-1">{((totals.final / totals.gross) * 100).toFixed(2)}% of gross</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Salary Table */}
      <Card>
        <CardHeader>
          <CardTitle>Salary Details</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : getFormattedSalaries().length > 0 ? (
            <DataTable 
              columns={columns} 
              data={getFormattedSalaries()}
              searchColumn="employee.fullName"
              searchPlaceholder="Filter employees..."
            />
          ) : (
            <div className="text-center py-8">
              <Calculator className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No Salary Data</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                No salary data is available for {format(new Date(selectedMonth + "-01"), "MMMM yyyy")}.
                Use the Calculate Salary button to calculate salaries for employees.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
