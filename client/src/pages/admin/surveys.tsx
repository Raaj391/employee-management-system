import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { format, subMonths } from "date-fns";
import { SurveyType, surveyRates } from "@shared/schema";
import { formatCurrency, formatDate, getInitials, getRandomColor, getSurveyTypeData } from "@/lib/utils";
import { BarChart, CalendarIcon, FileText, Search } from "lucide-react";
import AdminLayout from "@/components/layout/admin-layout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { Loader2 } from "lucide-react";

type Survey = {
  id: number;
  date: string;
  surveyType: SurveyType;
  completed: number;
  userId: number;
  employee: {
    id: number;
    username: string;
    fullName: string;
    department: string;
  };
  earnings: number;
};

// Form schema for rejected surveys
const rejectedSurveySchema = z.object({
  userId: z.number({
    required_error: "Employee is required",
  }),
  surveyType: z.enum(["yours", "yoursinternational", "ssi", "dynata"], {
    required_error: "Survey type is required",
  }),
  rejected: z.coerce.number()
    .int("Number must be a whole number")
    .min(1, "At least 1 rejected survey is required")
    .max(100, "Maximum 100 rejected surveys can be entered"),
});

export default function AdminSurveys() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [rejectedDialogOpen, setRejectedDialogOpen] = useState(false);
  
  // Get current month for stats
  const currentDate = new Date();
  const defaultMonth = format(currentDate, "yyyy-MM");
  const today = format(currentDate, "yyyy-MM-dd");
  
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [selectedDate, setSelectedDate] = useState(today);
  
  // Get surveys for today (default)
  const { data: todaySurveys, isLoading: todaySurveysLoading } = useQuery({
    queryKey: ["/api/admin/surveys", selectedDate],
  });
  
  // Get all employees for dropdown
  const { data: employees } = useQuery({
    queryKey: ["/api/admin/employees"],
  });
  
  // Get rejected surveys for the month
  const { data: rejectedSurveys, isLoading: rejectedLoading } = useQuery({
    queryKey: ["/api/admin/rejected-surveys", selectedMonth],
  });
  
  // Form for rejected surveys
  const rejectedForm = useForm<z.infer<typeof rejectedSurveySchema>>({
    resolver: zodResolver(rejectedSurveySchema),
    defaultValues: {
      rejected: 1,
    },
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  async function onSubmitRejected(values: z.infer<typeof rejectedSurveySchema>) {
    setIsSubmitting(true);
    
    try {
      const payload = {
        ...values,
        month: selectedMonth,
      };
      
      await apiRequest("POST", "/api/admin/rejected-surveys", payload);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/rejected-surveys", selectedMonth] });
      
      toast({
        title: "Rejected surveys recorded",
        description: `Successfully recorded ${values.rejected} rejected surveys.`,
      });
      
      rejectedForm.reset({
        userId: undefined,
        surveyType: undefined,
        rejected: 1,
      });
      
      setRejectedDialogOpen(false);
    } catch (error) {
      toast({
        title: "Failed to record rejected surveys",
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
  
  // Format survey data for table
  const getFormattedSurveys = (): Survey[] => {
    if (!todaySurveys) return [];
    
    return todaySurveys
      .map(survey => {
        const rate = surveyRates[survey.surveyType as SurveyType] || 0;
        return {
          ...survey,
          earnings: rate * survey.completed
        };
      })
      .filter(survey => 
        survey.employee.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        survey.employee.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
  };
  
  // Get survey stats for today
  const getSurveyStats = () => {
    if (!todaySurveys) return { total: 0, yours: 0, international: 0, ssi: 0, dynata: 0 };
    
    const yours = todaySurveys.filter(s => s.surveyType === 'yours').reduce((sum, s) => sum + s.completed, 0);
    const international = todaySurveys.filter(s => s.surveyType === 'yoursinternational').reduce((sum, s) => sum + s.completed, 0);
    const ssi = todaySurveys.filter(s => s.surveyType === 'ssi').reduce((sum, s) => sum + s.completed, 0);
    const dynata = todaySurveys.filter(s => s.surveyType === 'dynata').reduce((sum, s) => sum + s.completed, 0);
    
    return {
      total: yours + international + ssi + dynata,
      yours,
      international,
      ssi,
      dynata
    };
  };
  
  // Define columns for surveys table
  const columns: ColumnDef<Survey>[] = [
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
      accessorKey: "surveyType",
      header: "Survey Type",
      cell: ({ row }) => {
        const type = row.getValue("surveyType") as SurveyType;
        const typeData = getSurveyTypeData(type);
        
        return (
          <div className={`px-2 py-1 rounded inline-flex items-center ${typeData.bgColor}`}>
            <FileText className={`h-4 w-4 mr-1 ${typeData.textColor}`} />
            <span className={typeData.textColor}>{typeData.name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "completed",
      header: "Surveys Completed",
      cell: ({ row }) => row.getValue("completed"),
    },
    {
      accessorKey: "earnings",
      header: "Earnings",
      cell: ({ row }) => formatCurrency(row.getValue("earnings")),
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => formatDate(row.getValue("date")),
    },
  ];
  
  // Define columns for rejected surveys table
  const rejectedColumns: ColumnDef<any>[] = [
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
      accessorKey: "surveyType",
      header: "Survey Type",
      cell: ({ row }) => {
        const type = row.getValue("surveyType") as SurveyType;
        const typeData = getSurveyTypeData(type);
        
        return (
          <div className={`px-2 py-1 rounded inline-flex items-center ${typeData.bgColor}`}>
            <FileText className={`h-4 w-4 mr-1 ${typeData.textColor}`} />
            <span className={typeData.textColor}>{typeData.name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "rejected",
      header: "Rejected Surveys",
      cell: ({ row }) => (
        <span className="text-red-600 font-medium">{row.getValue("rejected")}</span>
      ),
    },
    {
      accessorKey: "deduction",
      header: "Deduction Amount",
      cell: ({ row }) => {
        const type = row.getValue("surveyType") as SurveyType;
        const rejected = row.getValue("rejected") as number;
        const rate = surveyRates[type] || 0;
        return (
          <span className="text-red-600 font-medium">
            {formatCurrency(rejected * rate)}
          </span>
        );
      },
    },
  ];
  
  const stats = getSurveyStats();

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Survey Management</h1>
        
        <Dialog open={rejectedDialogOpen} onOpenChange={setRejectedDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" className="mt-2 md:mt-0">
              <FileText className="mr-2 h-4 w-4" />
              Record Rejected Surveys
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Rejected Surveys</DialogTitle>
            </DialogHeader>
            <Form {...rejectedForm}>
              <form onSubmit={rejectedForm.handleSubmit(onSubmitRejected)} className="space-y-6">
                <FormField
                  control={rejectedForm.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employee</FormLabel>
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
                
                <FormField
                  control={rejectedForm.control}
                  name="surveyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Survey Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select survey type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="yours">Yours Surveys</SelectItem>
                          <SelectItem value="yoursinternational">Yours Surveys International</SelectItem>
                          <SelectItem value="ssi">SSI</SelectItem>
                          <SelectItem value="dynata">Dynata</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={rejectedForm.control}
                  name="rejected"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Rejected Surveys</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="pt-2">
                  <p className="text-sm text-gray-500 mb-2">
                    Recording rejected surveys for {format(new Date(selectedMonth + "-01"), "MMMM yyyy")}
                  </p>
                  {rejectedForm.watch("surveyType") && rejectedForm.watch("rejected") > 0 && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-md text-sm">
                      <p className="text-red-800">
                        Deduction Amount: <span className="font-semibold">
                          {formatCurrency(
                            surveyRates[rejectedForm.watch("surveyType") as SurveyType] * 
                            rejectedForm.watch("rejected")
                          )}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
                
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Record Rejected Surveys"
                  )}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Tabs defaultValue="daily" className="space-y-6">
        <TabsList>
          <TabsTrigger value="daily">Daily Surveys</TabsTrigger>
          <TabsTrigger value="rejected">Rejected Surveys</TabsTrigger>
        </TabsList>
        
        <TabsContent value="daily" className="space-y-6">
          {/* Date Selection for Daily Tab */}
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
                  {/* Date picker would go here - simplified for this example */}
                  <Input 
                    type="date" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full"
                  />
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
          
          {/* Survey Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <Card className="bg-gray-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Surveys</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <div className="bg-blue-100 p-2 rounded-full">
                    <BarChart className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-blue-50">
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-blue-800 mb-1">Yours Surveys</p>
                <p className="text-2xl font-bold text-blue-600">{stats.yours}</p>
              </CardContent>
            </Card>
            
            <Card className="bg-green-50">
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-green-800 mb-1">Yours International</p>
                <p className="text-2xl font-bold text-green-600">{stats.international}</p>
              </CardContent>
            </Card>
            
            <Card className="bg-purple-50">
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-purple-800 mb-1">SSI</p>
                <p className="text-2xl font-bold text-purple-600">{stats.ssi}</p>
              </CardContent>
            </Card>
            
            <Card className="bg-amber-50">
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-amber-800 mb-1">Dynata</p>
                <p className="text-2xl font-bold text-amber-600">{stats.dynata}</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Survey Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                Survey Work for {format(new Date(selectedDate), "MMMM d, yyyy")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todaySurveysLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : getFormattedSurveys().length > 0 ? (
                <DataTable 
                  columns={columns} 
                  data={getFormattedSurveys()}
                  searchColumn="employee.fullName"
                  searchPlaceholder="Filter employees..."
                />
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No Survey Records</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    No survey records found for {format(new Date(selectedDate), "MMMM d, yyyy")}.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="rejected" className="space-y-6">
          {/* Month Selection for Rejected Tab */}
          <div className="flex items-center gap-2 mb-4">
            <Select
              value={selectedMonth}
              onValueChange={setSelectedMonth}
            >
              <SelectTrigger className="w-[240px]">
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
            
            <Button
              variant="outline"
              onClick={() => setSelectedMonth(defaultMonth)}
              className={selectedMonth === defaultMonth ? "bg-blue-50 text-blue-600 border-blue-200" : ""}
            >
              Current Month
            </Button>
          </div>
          
          {/* Rejected Surveys Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                Rejected Surveys for {format(new Date(selectedMonth + "-01"), "MMMM yyyy")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rejectedLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : rejectedSurveys && rejectedSurveys.length > 0 ? (
                <DataTable 
                  columns={rejectedColumns} 
                  data={rejectedSurveys}
                  searchColumn="employee.fullName"
                  searchPlaceholder="Filter employees..."
                />
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No Rejected Surveys</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    No rejected surveys recorded for {format(new Date(selectedMonth + "-01"), "MMMM yyyy")}.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
