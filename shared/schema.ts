import { pgTable, text, serial, integer, boolean, timestamp, json, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema (for both employees and admins)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  role: text("role").notNull().default("employee"), // 'employee' or 'admin'
  department: text("department"),
  isActive: boolean("is_active").notNull().default(true),
  leaveBalance: integer("leave_balance").notNull().default(12),
});

// Attendance schema
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  checkIn: timestamp("check_in", { mode: 'string' }).notNull(),
  checkOut: timestamp("check_out", { mode: 'string' }),
  date: text("date").notNull(), // YYYY-MM-DD format
});

// Survey types
export type SurveyType = 'yours' | 'yoursinternational' | 'ssi' | 'dynata';

// Survey rates
export const surveyRates = {
  'yours': 27,
  'yoursinternational': 25,
  'ssi': 25,
  'dynata': 20
};

// Survey work schema
export const surveyWork = pgTable("survey_work", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  date: text("date").notNull(), // YYYY-MM-DD format
  surveyType: text("survey_type").notNull(), // 'yours', 'yoursinternational', 'ssi', 'dynata'
  completed: integer("completed").notNull().default(0),
});

// Rejected survey schema (monthly by admin)
export const rejectedSurveys = pgTable("rejected_surveys", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  month: text("month").notNull(), // YYYY-MM format
  surveyType: text("survey_type").notNull(), // 'yours', 'yoursinternational', 'ssi', 'dynata'
  rejected: integer("rejected").notNull().default(0),
  createdBy: integer("created_by").notNull().references(() => users.id),
}, (table) => {
  return {
    uniqueUserMonthType: unique().on(table.userId, table.month, table.surveyType),
  };
});

// Leave application schema
export const leaveApplications = pgTable("leave_applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  leaveType: text("leave_type").notNull(), // 'medical', 'personal', 'vacation', 'other'
  startDate: text("start_date").notNull(), // YYYY-MM-DD format
  endDate: text("end_date").notNull(), // YYYY-MM-DD format
  reason: text("reason").notNull(),
  status: text("status").notNull().default("pending"), // 'pending', 'approved', 'rejected'
  approvedBy: integer("approved_by").references(() => users.id),
  createdAt: timestamp("created_at", { mode: 'string' }).notNull().defaultNow(),
});

// Salary schema
export const salaries = pgTable("salaries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  month: text("month").notNull(), // YYYY-MM format
  grossSalary: integer("gross_salary").notNull().default(0),
  rejectedSurveyDeduction: integer("rejected_survey_deduction").notNull().default(0),
  leaveDeduction: integer("leave_deduction").notNull().default(0),
  finalSalary: integer("final_salary").notNull().default(0),
  details: json("details").notNull().default({}), // For storing survey type breakdown
  calculatedBy: integer("calculated_by").notNull().references(() => users.id),
  calculatedAt: timestamp("calculated_at", { mode: 'string' }).notNull().defaultNow(),
}, (table) => {
  return {
    uniqueUserMonth: unique().on(table.userId, table.month),
  };
});

// Zod schemas for form validation
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  email: true,
  phone: true,
  role: true,
  department: true,
  isActive: true,
  leaveBalance: true,
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const insertAttendanceSchema = createInsertSchema(attendance).pick({
  userId: true,
  checkIn: true,
  checkOut: true,
  date: true,
});

export const insertSurveyWorkSchema = createInsertSchema(surveyWork).pick({
  userId: true,
  date: true,
  surveyType: true,
  completed: true,
});

export const insertRejectedSurveySchema = createInsertSchema(rejectedSurveys).pick({
  userId: true,
  month: true,
  surveyType: true,
  rejected: true,
  createdBy: true,
});

export const insertLeaveApplicationSchema = createInsertSchema(leaveApplications).pick({
  userId: true,
  leaveType: true,
  startDate: true,
  endDate: true,
  reason: true,
  status: true,
  approvedBy: true,
});

export const insertSalarySchema = createInsertSchema(salaries).pick({
  userId: true,
  month: true,
  grossSalary: true,
  rejectedSurveyDeduction: true,
  leaveDeduction: true,
  finalSalary: true,
  details: true,
  calculatedBy: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Login = z.infer<typeof loginSchema>;

export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;

export type SurveyWork = typeof surveyWork.$inferSelect;
export type InsertSurveyWork = z.infer<typeof insertSurveyWorkSchema>;

export type RejectedSurvey = typeof rejectedSurveys.$inferSelect;
export type InsertRejectedSurvey = z.infer<typeof insertRejectedSurveySchema>;

export type LeaveApplication = typeof leaveApplications.$inferSelect;
export type InsertLeaveApplication = z.infer<typeof insertLeaveApplicationSchema>;

export type Salary = typeof salaries.$inferSelect;
export type InsertSalary = z.infer<typeof insertSalarySchema>;
