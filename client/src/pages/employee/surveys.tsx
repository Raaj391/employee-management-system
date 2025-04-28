import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { SurveyType, surveyRates } from "@shared/schema";
import { formatCurrency, formatDate, getSurveyTypeData } from "@/lib/utils";
import EmployeeLayout from "@/components/layout/employee-layout";
import SurveyForm from "@/components/forms/survey-form";
import { FileText } from "lucide-react";

type Survey = {
  id: number;
  date: string;
  surveyType: SurveyType;
  completed: number;
  earnings: number;
};

export default function EmployeeSurveys() {
  const [surveyDialogOpen, setSurveyDialogOpen] = useState(false);
  
  // Get all surveys
  const { data: surveys, isLoading: surveysLoading } = useQuery({
    queryKey: ["/api/surveys"],
  });
  
  // Get today's surveys
  const { data: todaySurveys, isLoading: todayLoading } = useQuery({
    queryKey: ["/api/surveys/today"],
  });
  
  // Format survey data for table
  const getFormattedSurveys = (): Survey[] => {
    if (!surveys) return [];
    
    return surveys.map(survey => {
      const rate = surveyRates[survey.surveyType as SurveyType] || 0;
      return {
        id: survey.id,
        date: survey.date,
        surveyType: survey.surveyType as SurveyType,
        completed: survey.completed,
        earnings: rate * survey.completed
      };
    });
  };
  
  // Calculate total completed surveys and earnings
  const calculateTotals = () => {
    if (!surveys) return { total: 0, earnings: 0 };
    
    return surveys.reduce(
      (acc, survey) => {
        const rate = surveyRates[survey.surveyType as SurveyType] || 0;
        return {
          total: acc.total + survey.completed,
          earnings: acc.earnings + (rate * survey.completed)
        };
      },
      { total: 0, earnings: 0 }
    );
  };
  
  // Get today's survey summary
  const getTodaySummary = () => {
    if (!todaySurveys) return [];
    
    const types = ['yours', 'yoursinternational', 'ssi', 'dynata'] as SurveyType[];
    return types.map(type => {
      const survey = todaySurveys[type];
      const typeData = getSurveyTypeData(type);
      
      return {
        type,
        name: typeData.name,
        bgColor: typeData.bgColor,
        textColor: typeData.textColor,
        accentColor: typeData.accentColor,
        rate: surveyRates[type],
        completed: survey ? survey.completed : 0,
        earnings: survey ? survey.completed * surveyRates[type] : 0,
        submitted: !!survey
      };
    });
  };
  
  // Define columns for surveys table
  const columns: ColumnDef<Survey>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => formatDate(row.getValue("date")),
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
  ];

  const totals = calculateTotals();

  return (
    <EmployeeLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Surveys</h1>
        
        <Dialog open={surveyDialogOpen} onOpenChange={setSurveyDialogOpen}>
          <DialogTrigger asChild>
            <Button className="mt-2 md:mt-0">
              <FileText className="mr-2 h-4 w-4" />
              Submit New Survey
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit Survey Work</DialogTitle>
            </DialogHeader>
            <SurveyForm onSuccess={() => setSurveyDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Today's Surveys Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Today's Surveys</CardTitle>
        </CardHeader>
        <CardContent>
          {todayLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {getTodaySummary().map((survey) => (
                <div 
                  key={survey.type} 
                  className={`${survey.bgColor} p-4 rounded-lg ${survey.submitted ? '' : 'opacity-70'}`}
                >
                  <h3 className={`text-sm font-medium ${survey.textColor} mb-2`}>{survey.name}</h3>
                  <div className="flex justify-between">
                    <div>
                      <p className={`text-xl font-bold ${survey.accentColor}`}>{survey.completed}</p>
                      <p className={`text-sm ${survey.textColor}`}>Completed</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xl font-bold ${survey.accentColor}`}>{formatCurrency(survey.earnings)}</p>
                      <p className={`text-sm ${survey.textColor}`}>Earned</p>
                    </div>
                  </div>
                  {!survey.submitted && (
                    <p className="text-xs mt-2 text-gray-500 italic">Not submitted yet</p>
                  )}
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
            <div className="flex flex-col md:flex-row justify-between">
              <div className="mb-2 md:mb-0">
                <span className="text-sm text-gray-500">Today's Total Submitted:</span>
                <span className="ml-2 font-semibold">{getTodaySummary().reduce((sum, s) => sum + s.completed, 0)} surveys</span>
              </div>
              <div>
                <span className="text-sm text-gray-500">Earnings:</span>
                <span className="ml-2 font-semibold text-green-600">
                  {formatCurrency(getTodaySummary().reduce((sum, s) => sum + s.earnings, 0))}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Survey History */}
      <Card>
        <CardHeader>
          <CardTitle>Survey History</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All Surveys</TabsTrigger>
              <TabsTrigger value="yours">Yours Surveys</TabsTrigger>
              <TabsTrigger value="yoursinternational">International</TabsTrigger>
              <TabsTrigger value="ssi">SSI</TabsTrigger>
              <TabsTrigger value="dynata">Dynata</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-4">
              {surveysLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <>
                  <DataTable 
                    columns={columns} 
                    data={getFormattedSurveys()}
                    searchColumn="date"
                    searchPlaceholder="Search by date..."
                  />
                  
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex flex-col md:flex-row justify-between">
                      <div className="mb-2 md:mb-0">
                        <span className="text-sm text-gray-500">Total Surveys Completed:</span>
                        <span className="ml-2 font-semibold">{totals.total}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Total Earnings:</span>
                        <span className="ml-2 font-semibold text-green-600">{formatCurrency(totals.earnings)}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>
            
            {['yours', 'yoursinternational', 'ssi', 'dynata'].map((type) => (
              <TabsContent key={type} value={type} className="mt-4">
                {surveysLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <>
                    <DataTable 
                      columns={columns} 
                      data={getFormattedSurveys().filter(s => s.surveyType === type)}
                      searchColumn="date"
                      searchPlaceholder="Search by date..."
                    />
                    
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex flex-col md:flex-row justify-between">
                        <div className="mb-2 md:mb-0">
                          <span className="text-sm text-gray-500">Total {getSurveyTypeData(type as SurveyType).name} Completed:</span>
                          <span className="ml-2 font-semibold">
                            {getFormattedSurveys().filter(s => s.surveyType === type).reduce((sum, s) => sum + s.completed, 0)}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Total Earnings:</span>
                          <span className="ml-2 font-semibold text-green-600">
                            {formatCurrency(
                              getFormattedSurveys().filter(s => s.surveyType === type).reduce((sum, s) => sum + s.earnings, 0)
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </EmployeeLayout>
  );
}
