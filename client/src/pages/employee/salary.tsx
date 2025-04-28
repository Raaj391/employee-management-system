import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import EmployeeLayout from "@/components/layout/employee-layout";
import { DollarSign, Download } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { format, subMonths } from "date-fns";

type SalaryDetails = {
  yours?: { completed: number; rate: number; amount: number; rejected: number; deduction: number };
  yoursinternational?: { completed: number; rate: number; amount: number; rejected: number; deduction: number };
  ssi?: { completed: number; rate: number; amount: number; rejected: number; deduction: number };
  dynata?: { completed: number; rate: number; amount: number; rejected: number; deduction: number };
};

type Salary = {
  id: number;
  month: string;
  grossSalary: number;
  rejectedSurveyDeduction: number;
  leaveDeduction: number;
  finalSalary: number;
  details: SalaryDetails;
  calculatedAt: string;
};

export default function EmployeeSalary() {
  // Get current month and year for default month selection
  const currentDate = new Date();
  const defaultMonth = format(currentDate, "yyyy-MM");
  
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  
  // Get salary data for the selected month
  const { data: salary, isLoading } = useQuery({
    queryKey: ["/api/salary", selectedMonth],
  });
  
  // Generate last 12 months for dropdown
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
  
  // Define columns for survey details table
  const detailsColumns: ColumnDef<any>[] = [
    {
      accessorKey: "type",
      header: "Survey Type",
    },
    {
      accessorKey: "completed",
      header: "Completed",
    },
    {
      accessorKey: "rate",
      header: "Rate",
      cell: ({ row }) => formatCurrency(row.getValue("rate")),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => formatCurrency(row.getValue("amount")),
    },
    {
      accessorKey: "rejected",
      header: "Rejected",
    },
    {
      accessorKey: "deduction",
      header: "Deduction",
      cell: ({ row }) => formatCurrency(row.getValue("deduction")),
    },
    {
      accessorKey: "net",
      header: "Net Amount",
      cell: ({ row }) => {
        const amount = row.getValue("amount") as number;
        const deduction = row.getValue("deduction") as number;
        return formatCurrency(amount - deduction);
      },
    },
  ];
  
  // Format survey details for table
  const getSurveyDetails = () => {
    if (!salary || !salary.details) return [];
    
    const details = salary.details as SalaryDetails;
    return [
      {
        type: "Yours Surveys",
        completed: details.yours?.completed || 0,
        rate: details.yours?.rate || 27,
        amount: details.yours?.amount || 0,
        rejected: details.yours?.rejected || 0,
        deduction: details.yours?.deduction || 0,
      },
      {
        type: "Yours Surveys International",
        completed: details.yoursinternational?.completed || 0,
        rate: details.yoursinternational?.rate || 25,
        amount: details.yoursinternational?.amount || 0,
        rejected: details.yoursinternational?.rejected || 0,
        deduction: details.yoursinternational?.deduction || 0,
      },
      {
        type: "SSI",
        completed: details.ssi?.completed || 0,
        rate: details.ssi?.rate || 25,
        amount: details.ssi?.amount || 0,
        rejected: details.ssi?.rejected || 0,
        deduction: details.ssi?.deduction || 0,
      },
      {
        type: "Dynata",
        completed: details.dynata?.completed || 0,
        rate: details.dynata?.rate || 20,
        amount: details.dynata?.amount || 0,
        rejected: details.dynata?.rejected || 0,
        deduction: details.dynata?.deduction || 0,
      },
    ];
  };

  return (
    <EmployeeLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Salary Information</h1>
        
        <div className="mt-2 md:mt-0 flex items-center gap-2">
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
          
          <Button variant="outline" disabled={!salary}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      ) : salary ? (
        <>
          {/* Salary Summary Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Salary Summary for {format(new Date(salary.month + "-01"), "MMMM yyyy")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-blue-50 p-5 rounded-lg border border-blue-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Gross Salary</p>
                      <p className="text-2xl font-bold text-blue-700 mt-1">{formatCurrency(salary.grossSalary)}</p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-full">
                      <DollarSign className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-red-50 p-5 rounded-lg border border-red-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-red-600 font-medium">Rejected Survey Deduction</p>
                      <p className="text-2xl font-bold text-red-700 mt-1">{formatCurrency(salary.rejectedSurveyDeduction)}</p>
                    </div>
                    <div className="bg-red-100 p-3 rounded-full">
                      <DollarSign className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-amber-50 p-5 rounded-lg border border-amber-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-amber-600 font-medium">Leave Deduction</p>
                      <p className="text-2xl font-bold text-amber-700 mt-1">{formatCurrency(salary.leaveDeduction)}</p>
                    </div>
                    <div className="bg-amber-100 p-3 rounded-full">
                      <DollarSign className="h-6 w-6 text-amber-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 p-5 rounded-lg border border-green-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 font-medium">Final Salary</p>
                      <p className="text-2xl font-bold text-green-700 mt-1">{formatCurrency(salary.finalSalary)}</p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-full">
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Salary Calculation</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gross Salary (Total Survey Earnings)</span>
                    <span className="font-medium">{formatCurrency(salary.grossSalary)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rejected Survey Deduction</span>
                    <span className="font-medium text-red-600">- {formatCurrency(salary.rejectedSurveyDeduction)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Leave Deduction (Gross ÷ 30 × Leave Days)</span>
                    <span className="font-medium text-red-600">- {formatCurrency(salary.leaveDeduction)}</span>
                  </div>
                  <div className="border-t pt-1 mt-1 flex justify-between font-medium">
                    <span>Final Salary</span>
                    <span className="text-green-600">{formatCurrency(salary.finalSalary)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Detailed Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="surveys">
                <TabsList>
                  <TabsTrigger value="surveys">Survey Details</TabsTrigger>
                  <TabsTrigger value="deductions">Deductions</TabsTrigger>
                </TabsList>
                
                <TabsContent value="surveys" className="mt-4">
                  <DataTable 
                    columns={detailsColumns} 
                    data={getSurveyDetails()}
                    showPagination={false}
                  />
                  
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total Surveys Completed</span>
                      <span className="font-semibold">
                        {getSurveyDetails().reduce((sum, detail) => sum + detail.completed, 0)}
                      </span>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="deductions" className="mt-4">
                  <div className="space-y-4">
                    <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                      <h3 className="text-sm font-medium text-red-800 mb-2">Rejected Survey Deductions</h3>
                      <div className="space-y-2">
                        {getSurveyDetails().map((detail, index) => (
                          detail.rejected > 0 ? (
                            <div key={index} className="flex justify-between text-sm">
                              <span>{detail.type}</span>
                              <span className="font-medium">
                                {detail.rejected} × {formatCurrency(detail.rate)} = {formatCurrency(detail.deduction)}
                              </span>
                            </div>
                          ) : null
                        ))}
                        {getSurveyDetails().every(detail => detail.rejected === 0) && (
                          <p className="text-sm text-red-600">No rejected surveys for this month.</p>
                        )}
                        <div className="border-t border-red-200 pt-2 mt-2 flex justify-between font-medium">
                          <span>Total Deduction</span>
                          <span>{formatCurrency(salary.rejectedSurveyDeduction)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                      <h3 className="text-sm font-medium text-amber-800 mb-2">Leave Deduction</h3>
                      <div className="space-y-2">
                        {salary.leaveDeduction > 0 ? (
                          <>
                            <div className="text-sm">
                              <p>Calculation: (Gross Salary ÷ 30) × Leave Days</p>
                              <p className="mt-1">
                                ({formatCurrency(salary.grossSalary)} ÷ 30) × {Math.round((salary.leaveDeduction / (salary.grossSalary / 30)))} days = {formatCurrency(salary.leaveDeduction)}
                              </p>
                            </div>
                            <div className="border-t border-amber-200 pt-2 mt-2 flex justify-between font-medium">
                              <span>Total Leave Deduction</span>
                              <span>{formatCurrency(salary.leaveDeduction)}</span>
                            </div>
                          </>
                        ) : (
                          <p className="text-sm text-amber-600">No leave taken during this month.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Salary Data Available</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Salary information for {format(new Date(selectedMonth + "-01"), "MMMM yyyy")} has not been calculated yet. 
                Please check back later or contact your administrator.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </EmployeeLayout>
  );
}
