import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  insertUserSchema, insertAttendanceSchema, insertSurveyWorkSchema, 
  insertRejectedSurveySchema, insertLeaveApplicationSchema, insertSalarySchema,
  surveyRates
} from "@shared/schema";
import { format } from "date-fns";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);

  // Attendance Routes
  app.post("/api/attendance/check-in", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = req.user.id;
      const today = format(new Date(), "yyyy-MM-dd");
      
      // Check if user already checked in today
      const existingAttendance = await storage.getAttendanceByUserAndDate(userId, today);
      if (existingAttendance) {
        // User already checked in
        if (existingAttendance.checkOut) {
          return res.status(400).json({ message: "You have already completed your attendance for today" });
        }
        
        return res.status(200).json(existingAttendance);
      }
      
      const checkIn = new Date().toISOString();
      const attendance = await storage.createAttendance({
        userId,
        checkIn,
        checkOut: null,
        date: today
      });
      
      return res.status(201).json(attendance);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/attendance/check-out", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = req.user.id;
      const today = format(new Date(), "yyyy-MM-dd");
      
      // Check if user already checked in today
      const existingAttendance = await storage.getAttendanceByUserAndDate(userId, today);
      if (!existingAttendance) {
        return res.status(400).json({ message: "You need to check in first" });
      }
      
      if (existingAttendance.checkOut) {
        return res.status(400).json({ message: "You have already checked out today" });
      }
      
      const checkOut = new Date().toISOString();
      const updatedAttendance = await storage.updateAttendance(existingAttendance.id, {
        ...existingAttendance,
        checkOut
      });
      
      return res.status(200).json(updatedAttendance);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/attendance", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = req.user.id;
      const attendanceList = await storage.listAttendanceByUser(userId);
      
      return res.status(200).json(attendanceList);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/attendance/today", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = req.user.id;
      const today = format(new Date(), "yyyy-MM-dd");
      const attendance = await storage.getAttendanceByUserAndDate(userId, today);
      
      return res.status(200).json(attendance || null);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Survey Work Routes
  app.post("/api/surveys", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = req.user.id;
      const { surveyType, completed } = req.body;
      const today = format(new Date(), "yyyy-MM-dd");
      
      if (!surveyType || !completed || completed < 0) {
        return res.status(400).json({ message: "Invalid survey data" });
      }
      
      // Check if user already submitted this survey type today
      const existingSurvey = await storage.getSurveyWorkByUserAndDate(userId, today, surveyType);
      if (existingSurvey) {
        return res.status(400).json({ message: "You have already submitted this survey type today" });
      }
      
      const surveyWork = await storage.createSurveyWork({
        userId,
        date: today,
        surveyType,
        completed
      });
      
      return res.status(201).json(surveyWork);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/surveys", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = req.user.id;
      const surveyList = await storage.listSurveyWorkByUser(userId);
      
      return res.status(200).json(surveyList);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/surveys/today", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = req.user.id;
      const today = format(new Date(), "yyyy-MM-dd");
      
      // Get all survey types for today
      const yours = await storage.getSurveyWorkByUserAndDate(userId, today, "yours");
      const yoursinternational = await storage.getSurveyWorkByUserAndDate(userId, today, "yoursinternational");
      const ssi = await storage.getSurveyWorkByUserAndDate(userId, today, "ssi");
      const dynata = await storage.getSurveyWorkByUserAndDate(userId, today, "dynata");
      
      return res.status(200).json({
        yours: yours || null,
        yoursinternational: yoursinternational || null,
        ssi: ssi || null,
        dynata: dynata || null
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Leave Application Routes
  app.post("/api/leave", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = req.user.id;
      const { leaveType, startDate, endDate, reason } = req.body;
      
      if (!leaveType || !startDate || !endDate || !reason) {
        return res.status(400).json({ message: "All fields are required" });
      }
      
      const leaveApplication = await storage.createLeaveApplication({
        userId,
        leaveType,
        startDate,
        endDate,
        reason,
        status: "pending",
        approvedBy: null
      });
      
      return res.status(201).json(leaveApplication);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/leave", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = req.user.id;
      const leaveList = await storage.listLeaveApplicationsByUser(userId);
      
      return res.status(200).json(leaveList);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Salary Routes
  app.get("/api/salary/:month?", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = req.user.id;
      const month = req.params.month || format(new Date(), "yyyy-MM");
      
      const salary = await storage.getSalaryByUserAndMonth(userId, month);
      
      return res.status(200).json(salary || null);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Admin Routes
  // Employee Management
  app.get("/api/admin/employees", async (req: Request, res: Response) => {
    try {
      const employees = await storage.listUsers();
      const employeesWithoutPasswords = employees.map(emp => {
        const { password, ...employeeWithoutPassword } = emp;
        return employeeWithoutPassword;
      });
      return res.status(200).json(employeesWithoutPasswords);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/admin/employees/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid employee ID" });
      }
      
      const employee = await storage.getUser(id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      const { password, ...employeeWithoutPassword } = employee;
      return res.status(200).json(employeeWithoutPassword);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.put("/api/admin/employees/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid employee ID" });
      }
      
      const employeeExists = await storage.getUser(id);
      if (!employeeExists) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      const updatedData = { ...req.body };
      
      // Check if password needs to be updated
      if (updatedData.password) {
        const scryptAsync = promisify(require("crypto").scrypt);
        const salt = randomBytes(16).toString("hex");
        const buf = (await scryptAsync(updatedData.password, salt, 64)) as Buffer;
        updatedData.password = `${buf.toString("hex")}.${salt}`;
      }
      
      const updatedEmployee = await storage.updateUser(id, updatedData);
      
      if (!updatedEmployee) {
        return res.status(500).json({ message: "Failed to update employee" });
      }
      
      const { password, ...employeeWithoutPassword } = updatedEmployee;
      return res.status(200).json(employeeWithoutPassword);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/admin/employees/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid employee ID" });
      }
      
      // Cannot delete admin users
      const employee = await storage.getUser(id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      if (employee.role === "admin") {
        return res.status(403).json({ message: "Cannot delete admin users" });
      }
      
      const deleted = await storage.deleteUser(id);
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete employee" });
      }
      
      return res.status(200).json({ message: "Employee deleted successfully" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Admin Attendance Management
  app.get("/api/admin/attendance/:date?", async (req: Request, res: Response) => {
    try {
      const date = req.params.date || format(new Date(), "yyyy-MM-dd");
      const attendanceList = await storage.listAttendanceByDate(date);
      
      // Enrich with employee data
      const enrichedAttendance = await Promise.all(attendanceList.map(async (attendance) => {
        const employee = await storage.getUser(attendance.userId);
        return {
          ...attendance,
          employee: employee ? {
            id: employee.id,
            username: employee.username,
            fullName: employee.fullName,
            department: employee.department
          } : null
        };
      }));
      
      return res.status(200).json(enrichedAttendance);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Admin Survey Management
  app.get("/api/admin/surveys/:date?", async (req: Request, res: Response) => {
    try {
      const date = req.params.date || format(new Date(), "yyyy-MM-dd");
      const surveysList = await storage.listSurveyWorkByDate(date);
      
      // Enrich with employee data
      const enrichedSurveys = await Promise.all(surveysList.map(async (survey) => {
        const employee = await storage.getUser(survey.userId);
        return {
          ...survey,
          employee: employee ? {
            id: employee.id,
            username: employee.username,
            fullName: employee.fullName,
            department: employee.department
          } : null
        };
      }));
      
      return res.status(200).json(enrichedSurveys);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Admin Rejected Surveys Management
  app.post("/api/admin/rejected-surveys", async (req: Request, res: Response) => {
    try {
      const { userId, month, surveyType, rejected } = req.body;
      
      if (!userId || !month || !surveyType || rejected === undefined || rejected < 0) {
        return res.status(400).json({ message: "All fields are required" });
      }
      
      const adminId = req.user!.id; // Admin making the change
      
      const rejectedSurvey = await storage.createRejectedSurvey({
        userId,
        month,
        surveyType,
        rejected,
        createdBy: adminId
      });
      
      return res.status(201).json(rejectedSurvey);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/admin/rejected-surveys/:month?", async (req: Request, res: Response) => {
    try {
      const month = req.params.month || format(new Date(), "yyyy-MM");
      const rejectedSurveysList = await storage.listRejectedSurveysByMonth(month);
      
      // Enrich with employee data
      const enrichedRejectedSurveys = await Promise.all(rejectedSurveysList.map(async (rejectedSurvey) => {
        const employee = await storage.getUser(rejectedSurvey.userId);
        return {
          ...rejectedSurvey,
          employee: employee ? {
            id: employee.id,
            username: employee.username,
            fullName: employee.fullName,
            department: employee.department
          } : null
        };
      }));
      
      return res.status(200).json(enrichedRejectedSurveys);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Admin Leave Management
  app.get("/api/admin/leave", async (req: Request, res: Response) => {
    try {
      const pendingLeaves = await storage.listPendingLeaveApplications();
      
      // Enrich with employee data
      const enrichedLeaves = await Promise.all(pendingLeaves.map(async (leave) => {
        const employee = await storage.getUser(leave.userId);
        return {
          ...leave,
          employee: employee ? {
            id: employee.id,
            username: employee.username,
            fullName: employee.fullName,
            department: employee.department
          } : null
        };
      }));
      
      return res.status(200).json(enrichedLeaves);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.put("/api/admin/leave/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid leave application ID" });
      }
      
      const { status } = req.body;
      if (!status || !["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const adminId = req.user!.id; // Admin making the change
      
      const leaveApplication = await storage.getLeaveApplication(id);
      if (!leaveApplication) {
        return res.status(404).json({ message: "Leave application not found" });
      }
      
      // Update leave application
      const updatedLeaveApplication = await storage.updateLeaveApplication(id, {
        ...leaveApplication,
        status,
        approvedBy: adminId
      });
      
      // If approved, we might want to update the employee's leave balance
      if (status === "approved") {
        const employee = await storage.getUser(leaveApplication.userId);
        if (employee) {
          // Calculate number of days
          const startDate = new Date(leaveApplication.startDate);
          const endDate = new Date(leaveApplication.endDate);
          const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          
          // Update leave balance (ensure it doesn't go below 0)
          const newLeaveBalance = Math.max(0, employee.leaveBalance - daysDiff);
          await storage.updateUser(employee.id, {
            ...employee,
            leaveBalance: newLeaveBalance
          });
        }
      }
      
      return res.status(200).json(updatedLeaveApplication);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Admin Salary Management
  app.post("/api/admin/calculate-salary", async (req: Request, res: Response) => {
    try {
      const { userId, month } = req.body;
      
      if (!userId || !month) {
        return res.status(400).json({ message: "User ID and month are required" });
      }
      
      const adminId = req.user!.id; // Admin making the calculation
      
      // Get employee to ensure they exist
      const employee = await storage.getUser(userId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      // Get all survey work for the month
      const surveyWorkList = await storage.listSurveyWorkByUserAndMonth(userId, month);
      
      // Calculate gross salary
      let grossSalary = 0;
      let details: Record<string, { completed: number, rate: number, amount: number, rejected: number, deduction: number }> = {};
      
      // Initialize details for all survey types
      details['yours'] = { completed: 0, rate: surveyRates['yours'], amount: 0, rejected: 0, deduction: 0 };
      details['yoursinternational'] = { completed: 0, rate: surveyRates['yoursinternational'], amount: 0, rejected: 0, deduction: 0 };
      details['ssi'] = { completed: 0, rate: surveyRates['ssi'], amount: 0, rejected: 0, deduction: 0 };
      details['dynata'] = { completed: 0, rate: surveyRates['dynata'], amount: 0, rejected: 0, deduction: 0 };
      
      // Add up all completed surveys
      for (const survey of surveyWorkList) {
        if (details[survey.surveyType]) {
          details[survey.surveyType].completed += survey.completed;
          details[survey.surveyType].amount += survey.completed * details[survey.surveyType].rate;
          grossSalary += survey.completed * surveyRates[survey.surveyType as keyof typeof surveyRates];
        }
      }
      
      // Get rejected surveys for the month
      const rejectedSurveysList = await storage.listRejectedSurveysByUser(userId);
      const monthRejectedSurveys = rejectedSurveysList.filter(rs => rs.month === month);
      
      // Calculate rejected survey deduction
      let rejectedSurveyDeduction = 0;
      for (const rejectedSurvey of monthRejectedSurveys) {
        if (details[rejectedSurvey.surveyType]) {
          details[rejectedSurvey.surveyType].rejected = rejectedSurvey.rejected;
          details[rejectedSurvey.surveyType].deduction = rejectedSurvey.rejected * details[rejectedSurvey.surveyType].rate;
          rejectedSurveyDeduction += rejectedSurvey.rejected * surveyRates[rejectedSurvey.surveyType as keyof typeof surveyRates];
        }
      }
      
      // Calculate leave deduction
      const leaveDays = await storage.countLeaveDaysByUserAndMonth(userId, month);
      const leaveDeduction = Math.round((grossSalary / 30) * leaveDays);
      
      // Calculate final salary
      const finalSalary = grossSalary - (rejectedSurveyDeduction + leaveDeduction);
      
      // Create or update salary record
      const salary = await storage.createSalary({
        userId,
        month,
        grossSalary,
        rejectedSurveyDeduction,
        leaveDeduction,
        finalSalary,
        details,
        calculatedBy: adminId
      });
      
      return res.status(200).json(salary);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/admin/salaries/:month?", async (req: Request, res: Response) => {
    try {
      const month = req.params.month || format(new Date(), "yyyy-MM");
      const salariesList = await storage.listSalariesByMonth(month);
      
      // Enrich with employee data
      const enrichedSalaries = await Promise.all(salariesList.map(async (salary) => {
        const employee = await storage.getUser(salary.userId);
        return {
          ...salary,
          employee: employee ? {
            id: employee.id,
            username: employee.username,
            fullName: employee.fullName,
            department: employee.department
          } : null
        };
      }));
      
      return res.status(200).json(enrichedSalaries);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Admin Dashboard Stats
  app.get("/api/admin/stats/:month?", async (req: Request, res: Response) => {
    try {
      const month = req.params.month || format(new Date(), "yyyy-MM");
      const today = format(new Date(), "yyyy-MM-dd");
      
      // Get all employees
      const employees = await storage.listUsers();
      const employeeCount = employees.filter(emp => emp.role === "employee").length;
      
      // Get active employees today
      const todayAttendance = await storage.listAttendanceByDate(today);
      const presentToday = todayAttendance.length;
      
      // Get survey stats for the month
      const surveyStats = await storage.getSurveyStats(month);
      
      // Get pending leave applications
      const pendingLeaves = await storage.listPendingLeaveApplications();
      
      // Calculate total surveys completed today
      const todaySurveys = await storage.listSurveyWorkByDate(today);
      const surveysToday = todaySurveys.reduce((total, survey) => total + survey.completed, 0);
      
      return res.status(200).json({
        employeeCount,
        presentToday,
        pendingLeaves: pendingLeaves.length,
        surveysToday,
        surveyStats
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
