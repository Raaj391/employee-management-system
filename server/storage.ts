import { users, User, InsertUser, attendance, Attendance, InsertAttendance, surveyWork, SurveyWork, InsertSurveyWork, rejectedSurveys, RejectedSurvey, InsertRejectedSurvey, leaveApplications, LeaveApplication, InsertLeaveApplication, salaries, Salary, InsertSalary } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { eq, and, sql } from "drizzle-orm";
import { db, pool } from "./db";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

// Interface for all storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  listUsers(): Promise<User[]>;
  
  // Attendance operations
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: number, data: Partial<InsertAttendance>): Promise<Attendance | undefined>;
  getAttendanceByUserAndDate(userId: number, date: string): Promise<Attendance | undefined>;
  listAttendanceByUser(userId: number): Promise<Attendance[]>;
  listAttendanceByDate(date: string): Promise<Attendance[]>;
  
  // Survey work operations
  createSurveyWork(surveyWork: InsertSurveyWork): Promise<SurveyWork>;
  getSurveyWorkByUserAndDate(userId: number, date: string, surveyType: string): Promise<SurveyWork | undefined>;
  listSurveyWorkByUser(userId: number): Promise<SurveyWork[]>;
  listSurveyWorkByUserAndMonth(userId: number, month: string): Promise<SurveyWork[]>;
  listSurveyWorkByDate(date: string): Promise<SurveyWork[]>;
  getSurveyStats(month: string): Promise<Record<string, { completed: number, rejected: number }>>;
  
  // Rejected survey operations
  createRejectedSurvey(rejectedSurvey: InsertRejectedSurvey): Promise<RejectedSurvey>;
  getRejectedSurvey(userId: number, month: string, surveyType: string): Promise<RejectedSurvey | undefined>;
  updateRejectedSurvey(id: number, data: Partial<InsertRejectedSurvey>): Promise<RejectedSurvey | undefined>;
  listRejectedSurveysByMonth(month: string): Promise<RejectedSurvey[]>;
  listRejectedSurveysByUser(userId: number): Promise<RejectedSurvey[]>;
  
  // Leave application operations
  createLeaveApplication(leaveApplication: InsertLeaveApplication): Promise<LeaveApplication>;
  getLeaveApplication(id: number): Promise<LeaveApplication | undefined>;
  updateLeaveApplication(id: number, data: Partial<InsertLeaveApplication>): Promise<LeaveApplication | undefined>;
  listLeaveApplicationsByUser(userId: number): Promise<LeaveApplication[]>;
  listPendingLeaveApplications(): Promise<LeaveApplication[]>;
  countLeaveDaysByUserAndMonth(userId: number, month: string): Promise<number>;
  
  // Salary operations
  createSalary(salary: InsertSalary): Promise<Salary>;
  getSalaryByUserAndMonth(userId: number, month: string): Promise<Salary | undefined>;
  updateSalary(id: number, data: Partial<InsertSalary>): Promise<Salary | undefined>;
  listSalariesByMonth(month: string): Promise<Salary[]>;
  listSalariesByUser(userId: number): Promise<Salary[]>;
  
  // Session store
  sessionStore: any;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private attendance: Map<number, Attendance>;
  private surveyWork: Map<number, SurveyWork>;
  private rejectedSurveys: Map<number, RejectedSurvey>;
  private leaveApplications: Map<number, LeaveApplication>;
  private salaries: Map<number, Salary>;
  
  sessionStore: any;
  
  userCurrentId: number;
  attendanceCurrentId: number;
  surveyWorkCurrentId: number;
  rejectedSurveysCurrentId: number;
  leaveApplicationsCurrentId: number;
  salariesCurrentId: number;

  constructor() {
    this.users = new Map();
    this.attendance = new Map();
    this.surveyWork = new Map();
    this.rejectedSurveys = new Map();
    this.leaveApplications = new Map();
    this.salaries = new Map();
    
    this.userCurrentId = 1;
    this.attendanceCurrentId = 1;
    this.surveyWorkCurrentId = 1;
    this.rejectedSurveysCurrentId = 1;
    this.leaveApplicationsCurrentId = 1;
    this.salariesCurrentId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }
  
  async listUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  // Attendance operations
  async createAttendance(insertAttendance: InsertAttendance): Promise<Attendance> {
    const id = this.attendanceCurrentId++;
    const attendance: Attendance = { ...insertAttendance, id };
    this.attendance.set(id, attendance);
    return attendance;
  }
  
  async updateAttendance(id: number, data: Partial<InsertAttendance>): Promise<Attendance | undefined> {
    const attendance = this.attendance.get(id);
    if (!attendance) return undefined;
    
    const updatedAttendance = { ...attendance, ...data };
    this.attendance.set(id, updatedAttendance);
    return updatedAttendance;
  }
  
  async getAttendanceByUserAndDate(userId: number, date: string): Promise<Attendance | undefined> {
    return Array.from(this.attendance.values()).find(
      (a) => a.userId === userId && a.date === date,
    );
  }
  
  async listAttendanceByUser(userId: number): Promise<Attendance[]> {
    return Array.from(this.attendance.values()).filter(
      (a) => a.userId === userId,
    );
  }
  
  async listAttendanceByDate(date: string): Promise<Attendance[]> {
    return Array.from(this.attendance.values()).filter(
      (a) => a.date === date,
    );
  }
  
  // Survey work operations
  async createSurveyWork(insertSurveyWork: InsertSurveyWork): Promise<SurveyWork> {
    const id = this.surveyWorkCurrentId++;
    const surveyWork: SurveyWork = { ...insertSurveyWork, id };
    this.surveyWork.set(id, surveyWork);
    return surveyWork;
  }
  
  async getSurveyWorkByUserAndDate(userId: number, date: string, surveyType: string): Promise<SurveyWork | undefined> {
    return Array.from(this.surveyWork.values()).find(
      (s) => s.userId === userId && s.date === date && s.surveyType === surveyType,
    );
  }
  
  async listSurveyWorkByUser(userId: number): Promise<SurveyWork[]> {
    return Array.from(this.surveyWork.values()).filter(
      (s) => s.userId === userId,
    );
  }
  
  async listSurveyWorkByUserAndMonth(userId: number, month: string): Promise<SurveyWork[]> {
    return Array.from(this.surveyWork.values()).filter(
      (s) => s.userId === userId && s.date.startsWith(month),
    );
  }
  
  async listSurveyWorkByDate(date: string): Promise<SurveyWork[]> {
    return Array.from(this.surveyWork.values()).filter(
      (s) => s.date === date,
    );
  }
  
  async getSurveyStats(month: string): Promise<Record<string, { completed: number, rejected: number }>> {
    const stats: Record<string, { completed: number, rejected: number }> = {
      'yours': { completed: 0, rejected: 0 },
      'yoursinternational': { completed: 0, rejected: 0 },
      'ssi': { completed: 0, rejected: 0 },
      'dynata': { completed: 0, rejected: 0 },
    };
    
    // Get completed surveys for the month
    Array.from(this.surveyWork.values())
      .filter(s => s.date.startsWith(month))
      .forEach(s => {
        if (stats[s.surveyType]) {
          stats[s.surveyType].completed += s.completed;
        }
      });
    
    // Get rejected surveys for the month
    Array.from(this.rejectedSurveys.values())
      .filter(s => s.month === month)
      .forEach(s => {
        if (stats[s.surveyType]) {
          stats[s.surveyType].rejected += s.rejected;
        }
      });
    
    return stats;
  }
  
  // Rejected survey operations
  async createRejectedSurvey(insertRejectedSurvey: InsertRejectedSurvey): Promise<RejectedSurvey> {
    // Check if a rejected survey record already exists for this user, month, and survey type
    const existing = await this.getRejectedSurvey(
      insertRejectedSurvey.userId,
      insertRejectedSurvey.month,
      insertRejectedSurvey.surveyType
    );
    
    if (existing) {
      // Update the existing record
      return this.updateRejectedSurvey(existing.id, insertRejectedSurvey) as Promise<RejectedSurvey>;
    }
    
    const id = this.rejectedSurveysCurrentId++;
    const rejectedSurvey: RejectedSurvey = { ...insertRejectedSurvey, id };
    this.rejectedSurveys.set(id, rejectedSurvey);
    return rejectedSurvey;
  }
  
  async getRejectedSurvey(userId: number, month: string, surveyType: string): Promise<RejectedSurvey | undefined> {
    return Array.from(this.rejectedSurveys.values()).find(
      (r) => r.userId === userId && r.month === month && r.surveyType === surveyType,
    );
  }
  
  async updateRejectedSurvey(id: number, data: Partial<InsertRejectedSurvey>): Promise<RejectedSurvey | undefined> {
    const rejectedSurvey = this.rejectedSurveys.get(id);
    if (!rejectedSurvey) return undefined;
    
    const updatedRejectedSurvey = { ...rejectedSurvey, ...data };
    this.rejectedSurveys.set(id, updatedRejectedSurvey);
    return updatedRejectedSurvey;
  }
  
  async listRejectedSurveysByMonth(month: string): Promise<RejectedSurvey[]> {
    return Array.from(this.rejectedSurveys.values()).filter(
      (r) => r.month === month,
    );
  }
  
  async listRejectedSurveysByUser(userId: number): Promise<RejectedSurvey[]> {
    return Array.from(this.rejectedSurveys.values()).filter(
      (r) => r.userId === userId,
    );
  }
  
  // Leave application operations
  async createLeaveApplication(insertLeaveApplication: InsertLeaveApplication): Promise<LeaveApplication> {
    const id = this.leaveApplicationsCurrentId++;
    const createdAt = new Date().toISOString();
    const leaveApplication: LeaveApplication = { ...insertLeaveApplication, id, createdAt };
    this.leaveApplications.set(id, leaveApplication);
    return leaveApplication;
  }
  
  async getLeaveApplication(id: number): Promise<LeaveApplication | undefined> {
    return this.leaveApplications.get(id);
  }
  
  async updateLeaveApplication(id: number, data: Partial<InsertLeaveApplication>): Promise<LeaveApplication | undefined> {
    const leaveApplication = this.leaveApplications.get(id);
    if (!leaveApplication) return undefined;
    
    const updatedLeaveApplication = { ...leaveApplication, ...data };
    this.leaveApplications.set(id, updatedLeaveApplication);
    return updatedLeaveApplication;
  }
  
  async listLeaveApplicationsByUser(userId: number): Promise<LeaveApplication[]> {
    return Array.from(this.leaveApplications.values()).filter(
      (l) => l.userId === userId,
    );
  }
  
  async listPendingLeaveApplications(): Promise<LeaveApplication[]> {
    return Array.from(this.leaveApplications.values()).filter(
      (l) => l.status === 'pending',
    );
  }
  
  async countLeaveDaysByUserAndMonth(userId: number, month: string): Promise<number> {
    const approvedLeaves = Array.from(this.leaveApplications.values()).filter(
      (l) => l.userId === userId && l.status === 'approved',
    );
    
    let totalDays = 0;
    for (const leave of approvedLeaves) {
      const startDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);
      
      // Check if leave overlaps with the specified month
      const startMonth = `${startDate.getFullYear()}-${(startDate.getMonth() + 1).toString().padStart(2, '0')}`;
      const endMonth = `${endDate.getFullYear()}-${(endDate.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (startMonth === month || endMonth === month) {
        // Calculate days in the specified month
        let currentDate = new Date(Math.max(startDate.getTime(), new Date(`${month}-01`).getTime()));
        const monthEndDate = new Date(`${month}-${new Date(+month.split('-')[0], +month.split('-')[1], 0).getDate()}`);
        const lastDay = new Date(Math.min(endDate.getTime(), monthEndDate.getTime()));
        
        while (currentDate <= lastDay) {
          totalDays++;
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    }
    
    return totalDays;
  }
  
  // Salary operations
  async createSalary(insertSalary: InsertSalary): Promise<Salary> {
    // Check if a salary record already exists for this user and month
    const existing = await this.getSalaryByUserAndMonth(
      insertSalary.userId,
      insertSalary.month
    );
    
    if (existing) {
      // Update the existing record
      return this.updateSalary(existing.id, insertSalary) as Promise<Salary>;
    }
    
    const id = this.salariesCurrentId++;
    const calculatedAt = new Date().toISOString();
    const salary: Salary = { ...insertSalary, id, calculatedAt };
    this.salaries.set(id, salary);
    return salary;
  }
  
  async getSalaryByUserAndMonth(userId: number, month: string): Promise<Salary | undefined> {
    return Array.from(this.salaries.values()).find(
      (s) => s.userId === userId && s.month === month,
    );
  }
  
  async updateSalary(id: number, data: Partial<InsertSalary>): Promise<Salary | undefined> {
    const salary = this.salaries.get(id);
    if (!salary) return undefined;
    
    const updatedSalary = { ...salary, ...data, calculatedAt: new Date().toISOString() };
    this.salaries.set(id, updatedSalary);
    return updatedSalary;
  }
  
  async listSalariesByMonth(month: string): Promise<Salary[]> {
    return Array.from(this.salaries.values()).filter(
      (s) => s.month === month,
    );
  }
  
  async listSalariesByUser(userId: number): Promise<Salary[]> {
    return Array.from(this.salaries.values()).filter(
      (s) => s.userId === userId,
    );
  }
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool, 
      createTableIfMissing: true
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return !!result;
  }

  async listUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  // Attendance operations
  async createAttendance(insertAttendance: InsertAttendance): Promise<Attendance> {
    const [record] = await db.insert(attendance).values(insertAttendance).returning();
    return record;
  }

  async updateAttendance(id: number, data: Partial<InsertAttendance>): Promise<Attendance | undefined> {
    const [record] = await db.update(attendance).set(data).where(eq(attendance.id, id)).returning();
    return record;
  }

  async getAttendanceByUserAndDate(userId: number, date: string): Promise<Attendance | undefined> {
    const [record] = await db.select().from(attendance)
      .where(and(eq(attendance.userId, userId), eq(attendance.date, date)));
    return record;
  }

  async listAttendanceByUser(userId: number): Promise<Attendance[]> {
    return db.select().from(attendance).where(eq(attendance.userId, userId));
  }

  async listAttendanceByDate(date: string): Promise<Attendance[]> {
    return db.select().from(attendance).where(eq(attendance.date, date));
  }

  // Survey work operations
  async createSurveyWork(insertSurveyWork: InsertSurveyWork): Promise<SurveyWork> {
    const [record] = await db.insert(surveyWork).values(insertSurveyWork).returning();
    return record;
  }

  async getSurveyWorkByUserAndDate(userId: number, date: string, surveyType: string): Promise<SurveyWork | undefined> {
    const [record] = await db.select().from(surveyWork)
      .where(and(
        eq(surveyWork.userId, userId),
        eq(surveyWork.date, date),
        eq(surveyWork.surveyType, surveyType)
      ));
    return record;
  }

  async listSurveyWorkByUser(userId: number): Promise<SurveyWork[]> {
    return db.select().from(surveyWork).where(eq(surveyWork.userId, userId));
  }

  async listSurveyWorkByUserAndMonth(userId: number, month: string): Promise<SurveyWork[]> {
    return db.select().from(surveyWork)
      .where(and(
        eq(surveyWork.userId, userId),
        sql`${surveyWork.date} LIKE ${month + '%'}`
      ));
  }

  async listSurveyWorkByDate(date: string): Promise<SurveyWork[]> {
    return db.select().from(surveyWork).where(eq(surveyWork.date, date));
  }

  async getSurveyStats(month: string): Promise<Record<string, { completed: number, rejected: number }>> {
    const stats: Record<string, { completed: number, rejected: number }> = {
      'yours': { completed: 0, rejected: 0 },
      'yoursinternational': { completed: 0, rejected: 0 },
      'ssi': { completed: 0, rejected: 0 },
      'dynata': { completed: 0, rejected: 0 },
    };
    
    // Get completed surveys for the month
    const completedSurveys = await db.select().from(surveyWork)
      .where(sql`${surveyWork.date} LIKE ${month + '%'}`);
      
    completedSurveys.forEach(s => {
      if (stats[s.surveyType]) {
        stats[s.surveyType].completed += s.completed;
      }
    });
    
    // Get rejected surveys for the month
    const rejectedSurveysData = await db.select().from(rejectedSurveys)
      .where(eq(rejectedSurveys.month, month));
      
    rejectedSurveysData.forEach(s => {
      if (stats[s.surveyType]) {
        stats[s.surveyType].rejected += s.rejected;
      }
    });
    
    return stats;
  }

  // Rejected survey operations
  async createRejectedSurvey(insertRejectedSurvey: InsertRejectedSurvey): Promise<RejectedSurvey> {
    // Check if a rejected survey record already exists for this user, month, and survey type
    const existing = await this.getRejectedSurvey(
      insertRejectedSurvey.userId,
      insertRejectedSurvey.month,
      insertRejectedSurvey.surveyType
    );
    
    if (existing) {
      // Update the existing record
      return this.updateRejectedSurvey(existing.id, insertRejectedSurvey) as Promise<RejectedSurvey>;
    }
    
    const [record] = await db.insert(rejectedSurveys).values(insertRejectedSurvey).returning();
    return record;
  }

  async getRejectedSurvey(userId: number, month: string, surveyType: string): Promise<RejectedSurvey | undefined> {
    const [record] = await db.select().from(rejectedSurveys)
      .where(and(
        eq(rejectedSurveys.userId, userId),
        eq(rejectedSurveys.month, month),
        eq(rejectedSurveys.surveyType, surveyType)
      ));
    return record;
  }

  async updateRejectedSurvey(id: number, data: Partial<InsertRejectedSurvey>): Promise<RejectedSurvey | undefined> {
    const [record] = await db.update(rejectedSurveys).set(data).where(eq(rejectedSurveys.id, id)).returning();
    return record;
  }

  async listRejectedSurveysByMonth(month: string): Promise<RejectedSurvey[]> {
    return db.select().from(rejectedSurveys).where(eq(rejectedSurveys.month, month));
  }

  async listRejectedSurveysByUser(userId: number): Promise<RejectedSurvey[]> {
    return db.select().from(rejectedSurveys).where(eq(rejectedSurveys.userId, userId));
  }

  // Leave application operations
  async createLeaveApplication(insertLeaveApplication: InsertLeaveApplication): Promise<LeaveApplication> {
    const [record] = await db.insert(leaveApplications)
      .values({
        ...insertLeaveApplication,
        createdAt: new Date().toISOString()
      })
      .returning();
    return record;
  }

  async getLeaveApplication(id: number): Promise<LeaveApplication | undefined> {
    const [record] = await db.select().from(leaveApplications).where(eq(leaveApplications.id, id));
    return record;
  }

  async updateLeaveApplication(id: number, data: Partial<InsertLeaveApplication>): Promise<LeaveApplication | undefined> {
    const [record] = await db.update(leaveApplications).set(data).where(eq(leaveApplications.id, id)).returning();
    return record;
  }

  async listLeaveApplicationsByUser(userId: number): Promise<LeaveApplication[]> {
    return db.select().from(leaveApplications).where(eq(leaveApplications.userId, userId));
  }

  async listPendingLeaveApplications(): Promise<LeaveApplication[]> {
    return db.select().from(leaveApplications).where(eq(leaveApplications.status, 'pending'));
  }

  async countLeaveDaysByUserAndMonth(userId: number, month: string): Promise<number> {
    // Get approved leave applications for the user in the month
    const leaveApps = await db.select().from(leaveApplications)
      .where(and(
        eq(leaveApplications.userId, userId),
        eq(leaveApplications.status, 'approved'),
        sql`${leaveApplications.startDate} LIKE ${month + '%'}`
      ));
    
    let totalDays = 0;
    leaveApps.forEach(leave => {
      const startDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include both start and end days
      totalDays += diffDays;
    });
    
    return totalDays;
  }

  // Salary operations
  async createSalary(insertSalary: InsertSalary): Promise<Salary> {
    const [record] = await db.insert(salaries)
      .values({
        ...insertSalary,
        calculatedAt: new Date().toISOString()
      })
      .returning();
    return record;
  }

  async getSalaryByUserAndMonth(userId: number, month: string): Promise<Salary | undefined> {
    const [record] = await db.select().from(salaries)
      .where(and(
        eq(salaries.userId, userId),
        eq(salaries.month, month)
      ));
    return record;
  }

  async updateSalary(id: number, data: Partial<InsertSalary>): Promise<Salary | undefined> {
    const [record] = await db.update(salaries).set(data).where(eq(salaries.id, id)).returning();
    return record;
  }

  async listSalariesByMonth(month: string): Promise<Salary[]> {
    return db.select().from(salaries).where(eq(salaries.month, month));
  }

  async listSalariesByUser(userId: number): Promise<Salary[]> {
    return db.select().from(salaries).where(eq(salaries.userId, userId));
  }
}

// Switch from MemStorage to DatabaseStorage
export const storage = new DatabaseStorage();
