import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AdminLayout from "@/components/layout/admin-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Check, Save, X } from "lucide-react";
import { surveyRates, SurveyType } from "@shared/schema";

export default function AdminSettings() {
  const { toast } = useToast();
  const [isModified, setIsModified] = useState(false);
  
  // Survey rate settings
  const [rates, setRates] = useState({
    yours: surveyRates.yours,
    yoursinternational: surveyRates.yoursinternational,
    ssi: surveyRates.ssi,
    dynata: surveyRates.dynata
  });
  
  // Notification settings
  const [notifyLeaveRequests, setNotifyLeaveRequests] = useState(true);
  const [notifyLowAttendance, setNotifyLowAttendance] = useState(true);
  const [notifyHighRejection, setNotifyHighRejection] = useState(true);
  
  // Data retention settings
  const [attendanceRetention, setAttendanceRetention] = useState("365");
  const [surveysRetention, setSurveysRetention] = useState("730");
  const [salaryRetention, setSalaryRetention] = useState("1825");
  
  // Handle rate change
  const handleRateChange = (surveyType: SurveyType, value: string) => {
    const newValue = parseInt(value);
    if (!isNaN(newValue) && newValue >= 0) {
      setRates(prev => ({
        ...prev,
        [surveyType]: newValue
      }));
      setIsModified(true);
    }
  };
  
  // Handle save settings
  const handleSaveSettings = () => {
    // In a real app, this would save to the backend
    toast({
      title: "Settings saved",
      description: "Your settings have been saved successfully.",
    });
    setIsModified(false);
  };
  
  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">System Settings</h1>
        
        {isModified && (
          <div className="flex items-center gap-2 mt-2 md:mt-0">
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              Unsaved Changes
            </Badge>
            <Button onClick={handleSaveSettings}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        )}
      </div>
      
      <Tabs defaultValue="survey" className="space-y-6">
        <TabsList>
          <TabsTrigger value="survey">Survey Settings</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="data">Data Management</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>
        
        {/* Survey Settings */}
        <TabsContent value="survey">
          <Card>
            <CardHeader>
              <CardTitle>Survey Rate Configuration</CardTitle>
              <CardDescription>
                Configure the payment rates for different survey types
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="yours-rate">Yours Surveys Rate (₹)</Label>
                  <div className="flex items-center">
                    <span className="mr-2 text-gray-500">₹</span>
                    <Input 
                      id="yours-rate"
                      type="number"
                      min="0"
                      value={rates.yours}
                      onChange={(e) => handleRateChange('yours', e.target.value)}
                    />
                  </div>
                  <p className="text-sm text-gray-500">Current rate: ₹{surveyRates.yours}</p>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="international-rate">Yours Surveys International Rate (₹)</Label>
                  <div className="flex items-center">
                    <span className="mr-2 text-gray-500">₹</span>
                    <Input 
                      id="international-rate"
                      type="number"
                      min="0"
                      value={rates.yoursinternational}
                      onChange={(e) => handleRateChange('yoursinternational', e.target.value)}
                    />
                  </div>
                  <p className="text-sm text-gray-500">Current rate: ₹{surveyRates.yoursinternational}</p>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="ssi-rate">SSI Rate (₹)</Label>
                  <div className="flex items-center">
                    <span className="mr-2 text-gray-500">₹</span>
                    <Input 
                      id="ssi-rate"
                      type="number"
                      min="0"
                      value={rates.ssi}
                      onChange={(e) => handleRateChange('ssi', e.target.value)}
                    />
                  </div>
                  <p className="text-sm text-gray-500">Current rate: ₹{surveyRates.ssi}</p>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="dynata-rate">Dynata Rate (₹)</Label>
                  <div className="flex items-center">
                    <span className="mr-2 text-gray-500">₹</span>
                    <Input 
                      id="dynata-rate"
                      type="number"
                      min="0"
                      value={rates.dynata}
                      onChange={(e) => handleRateChange('dynata', e.target.value)}
                    />
                  </div>
                  <p className="text-sm text-gray-500">Current rate: ₹{surveyRates.dynata}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <h3 className="text-lg font-medium">Salary Calculation Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="leave-days">Leave Calculation (Days per Month)</Label>
                    <Input 
                      id="leave-days"
                      type="number"
                      min="28"
                      max="31"
                      defaultValue="30"
                      onChange={() => setIsModified(true)}
                    />
                    <p className="text-sm text-gray-500">
                      Number of days used to calculate leave deduction
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="default-leave">Default Leave Balance (Days per Year)</Label>
                    <Input 
                      id="default-leave"
                      type="number"
                      min="0"
                      defaultValue="12"
                      onChange={() => setIsModified(true)}
                    />
                    <p className="text-sm text-gray-500">
                      Default leave balance for new employees
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <Button 
                  onClick={handleSaveSettings}
                  disabled={!isModified}
                >
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure when and how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notify-leave" className="text-base">Leave Request Notifications</Label>
                    <p className="text-sm text-gray-500">
                      Receive notifications when employees submit leave requests
                    </p>
                  </div>
                  <Switch 
                    id="notify-leave" 
                    checked={notifyLeaveRequests} 
                    onCheckedChange={(checked) => {
                      setNotifyLeaveRequests(checked);
                      setIsModified(true);
                    }}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notify-attendance" className="text-base">Low Attendance Alerts</Label>
                    <p className="text-sm text-gray-500">
                      Receive alerts when attendance falls below 80%
                    </p>
                  </div>
                  <Switch 
                    id="notify-attendance" 
                    checked={notifyLowAttendance} 
                    onCheckedChange={(checked) => {
                      setNotifyLowAttendance(checked);
                      setIsModified(true);
                    }}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notify-rejection" className="text-base">High Rejection Alerts</Label>
                    <p className="text-sm text-gray-500">
                      Receive alerts when survey rejection rate exceeds 5%
                    </p>
                  </div>
                  <Switch 
                    id="notify-rejection" 
                    checked={notifyHighRejection} 
                    onCheckedChange={(checked) => {
                      setNotifyHighRejection(checked);
                      setIsModified(true);
                    }}
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <h3 className="text-lg font-medium">Email Notification Settings</h3>
                <div className="space-y-3">
                  <Label htmlFor="admin-email">Admin Email Address</Label>
                  <Input 
                    id="admin-email"
                    type="email"
                    placeholder="admin@example.com"
                    defaultValue="admin@worktrack.com"
                    onChange={() => setIsModified(true)}
                  />
                  <p className="text-sm text-gray-500">
                    Email address where notifications will be sent
                  </p>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <Button 
                  onClick={handleSaveSettings}
                  disabled={!isModified}
                >
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Data Management Settings */}
        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>
                Configure data retention and backup settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Data Retention Policy</h3>
                <p className="text-sm text-gray-500">
                  Configure how long different types of data are stored in the system
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                  <div className="space-y-3">
                    <Label htmlFor="attendance-retention">Attendance Records (days)</Label>
                    <Input 
                      id="attendance-retention"
                      type="number"
                      min="30"
                      value={attendanceRetention}
                      onChange={(e) => {
                        setAttendanceRetention(e.target.value);
                        setIsModified(true);
                      }}
                    />
                    <p className="text-sm text-gray-500">
                      Currently set to {attendanceRetention} days
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="surveys-retention">Survey Records (days)</Label>
                    <Input 
                      id="surveys-retention"
                      type="number"
                      min="30"
                      value={surveysRetention}
                      onChange={(e) => {
                        setSurveysRetention(e.target.value);
                        setIsModified(true);
                      }}
                    />
                    <p className="text-sm text-gray-500">
                      Currently set to {surveysRetention} days
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="salary-retention">Salary Records (days)</Label>
                    <Input 
                      id="salary-retention"
                      type="number"
                      min="365"
                      value={salaryRetention}
                      onChange={(e) => {
                        setSalaryRetention(e.target.value);
                        setIsModified(true);
                      }}
                    />
                    <p className="text-sm text-gray-500">
                      Currently set to {salaryRetention} days
                    </p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Export Options</h3>
                <div className="flex items-center space-x-2">
                  <Button variant="outline">Export All Employee Data</Button>
                  <Button variant="outline">Export Attendance Records</Button>
                  <Button variant="outline">Export Salary History</Button>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <Button 
                  onClick={handleSaveSettings}
                  disabled={!isModified}
                >
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* System Settings */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>
                Configure general system settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Application Settings</h3>
                
                <div className="space-y-3">
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input 
                    id="company-name"
                    defaultValue="WorkTrack Solutions"
                    onChange={() => setIsModified(true)}
                  />
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="timezone">Default Timezone</Label>
                  <select 
                    id="timezone"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    defaultValue="Asia/Kolkata"
                    onChange={() => setIsModified(true)}
                  >
                    <option value="Asia/Kolkata">India (GMT+5:30)</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time (GMT-5)</option>
                    <option value="Europe/London">London (GMT+0)</option>
                  </select>
                </div>
                
                <div className="flex items-center justify-between mt-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="maintenance-mode" className="text-base">Maintenance Mode</Label>
                    <p className="text-sm text-gray-500">
                      Enable maintenance mode to prevent users from accessing the system
                    </p>
                  </div>
                  <Switch 
                    id="maintenance-mode" 
                    defaultChecked={false}
                    onCheckedChange={() => setIsModified(true)}
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Authentication Settings</h3>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="password-expiry" className="text-base">Password Expiry</Label>
                    <p className="text-sm text-gray-500">
                      Require users to change passwords periodically
                    </p>
                  </div>
                  <Switch 
                    id="password-expiry" 
                    defaultChecked={true}
                    onCheckedChange={() => setIsModified(true)}
                  />
                </div>
                
                <div className="space-y-3 mt-4">
                  <Label htmlFor="password-days">Password Expiry Days</Label>
                  <Input 
                    id="password-days"
                    type="number"
                    min="30"
                    defaultValue="90"
                    onChange={() => setIsModified(true)}
                  />
                  <p className="text-sm text-gray-500">
                    Number of days before passwords expire
                  </p>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <Button 
                  onClick={handleSaveSettings}
                  disabled={!isModified}
                >
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
