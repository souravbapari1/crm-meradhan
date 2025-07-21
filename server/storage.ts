import { 
  users, 
  leads, 
  customers, 
  rfqs, 
  supportTickets, 
  emailTemplates, 
  subscriptions, 
  otps, 
  loginLogs, 
  activityLogs,
  leadFollowUps,
  userSessions,
  pageViews,
  type User, 
  type InsertUser,
  type Lead,
  type InsertLead,
  type Customer,
  type InsertCustomer,
  type RFQ,
  type InsertRFQ,
  type SupportTicket,
  type InsertSupportTicket,
  type EmailTemplate,
  type InsertEmailTemplate,
  type Subscription,
  type InsertSubscription,
  type OTP,
  type LoginLog,
  type ActivityLog,
  type LeadFollowUp,
  type InsertLeadFollowUp,
  type UserSession,
  type InsertUserSession,
  type PageView,
  type InsertPageView
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, like, sql, count, isNull } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  // OTP methods
  createOTP(email: string, otp: string, expiresAt: Date): Promise<OTP>;
  getValidOTP(email: string, otp: string): Promise<OTP | undefined>;
  markOTPAsUsed(id: number): Promise<void>;
  
  // Login log methods
  createLoginLog(userId: number | null, email: string, ipAddress: string, userAgent: string, browserName?: string, deviceType?: string, operatingSystem?: string, sessionType?: string, success?: boolean): Promise<LoginLog>;
  getAllLoginLogs(): Promise<LoginLog[]>;
  
  // Lead methods
  getAllLeads(): Promise<Lead[]>;
  getLeadById(id: number): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: number, lead: Partial<InsertLead>): Promise<Lead | undefined>;
  deleteLead(id: number): Promise<boolean>;
  getLeadsByAssignee(userId: number): Promise<Lead[]>;
  
  // Customer methods
  getAllCustomers(): Promise<Customer[]>;
  getCustomerById(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: number): Promise<boolean>;
  getCustomersByRM(rmId: number): Promise<Customer[]>;
  
  // RFQ methods
  getAllRFQs(): Promise<RFQ[]>;
  getRFQById(id: number): Promise<RFQ | undefined>;
  createRFQ(rfq: InsertRFQ): Promise<RFQ>;
  updateRFQ(id: number, rfq: Partial<InsertRFQ>): Promise<RFQ | undefined>;
  deleteRFQ(id: number): Promise<boolean>;
  getRFQsByCustomer(customerId: number): Promise<RFQ[]>;
  
  // Support ticket methods
  getAllSupportTickets(): Promise<SupportTicket[]>;
  getSupportTicketById(id: number): Promise<SupportTicket | undefined>;
  createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket>;
  updateSupportTicket(id: number, ticket: Partial<InsertSupportTicket>): Promise<SupportTicket | undefined>;
  deleteSupportTicket(id: number): Promise<boolean>;
  getTicketsByAssignee(userId: number): Promise<SupportTicket[]>;
  
  // Email template methods
  getAllEmailTemplates(): Promise<EmailTemplate[]>;
  getEmailTemplateById(id: number): Promise<EmailTemplate | undefined>;
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  updateEmailTemplate(id: number, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate | undefined>;
  deleteEmailTemplate(id: number): Promise<boolean>;
  
  // Subscription methods
  getAllSubscriptions(): Promise<Subscription[]>;
  getSubscriptionsByCustomer(customerId: number): Promise<Subscription[]>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: number, subscription: Partial<InsertSubscription>): Promise<Subscription | undefined>;
  
  // Activity log methods
  createActivityLog(userId: number, entityType: string, entityId: number, action: string, details: any, ipAddress: string, userAgent: string): Promise<ActivityLog>;
  getActivityLogs(limit?: number): Promise<ActivityLog[]>;
  
  // Session tracking methods
  createUserSession(session: InsertUserSession): Promise<UserSession>;
  getUserSessionByToken(sessionToken: string): Promise<UserSession | undefined>;
  endUserSession(sessionId: number, endReason: string): Promise<void>;
  getSessionAnalytics(params: { startDate?: Date; endDate?: Date; userId?: number }): Promise<any[]>;
  
  // Page tracking methods
  createPageView(pageView: InsertPageView): Promise<PageView>;
  endPageView(pageViewId: number, updates: { exitTime: Date; duration: number; scrollDepth: number; interactions: number }): Promise<void>;
  
  // Dashboard/Analytics methods
  getDashboardKPIs(): Promise<{
    activeLeads: number;
    activeCustomers: number;
    totalInvestment: string;
    pendingRFQs: number;
  }>;
  
  getLeadSourceAnalytics(): Promise<{source: string, count: number}[]>;
  getSalesPerformance(): Promise<{period: string, amount: string}[]>;
  getRecentActivities(limit?: number): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values({
      ...user,
      updatedAt: new Date(),
    }).returning();
    return newUser;
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db.update(users)
      .set({ ...user, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(asc(users.name));
  }

  // OTP methods
  async createOTP(email: string, otp: string, expiresAt: Date): Promise<OTP> {
    const [newOTP] = await db.insert(otps).values({
      email,
      otp,
      expiresAt,
    }).returning();
    return newOTP;
  }

  async getValidOTP(email: string, otp: string): Promise<OTP | undefined> {
    const [validOTP] = await db.select().from(otps)
      .where(
        and(
          eq(otps.email, email),
          eq(otps.otp, otp),
          eq(otps.isUsed, false),
          sql`${otps.expiresAt} > NOW()`
        )
      );
    return validOTP || undefined;
  }

  async markOTPAsUsed(id: number): Promise<void> {
    await db.update(otps).set({ isUsed: true }).where(eq(otps.id, id));
  }

  // Login log methods
  async createLoginLog(userId: number | null, email: string, ipAddress: string, userAgent: string, browserName?: string, deviceType?: string, operatingSystem?: string, sessionType: string = 'login', success: boolean = true): Promise<LoginLog> {
    // Convert to IST (UTC+5:30) - simple and reliable  
    const now = new Date();
    const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
    const [loginLog] = await db.insert(loginLogs).values({
      userId,
      email,
      ipAddress,
      userAgent,
      browserName,
      deviceType,
      operatingSystem,
      sessionType,
      success,
      createdAt: istTime,
    }).returning();
    return loginLog;
  }

  async getAllLoginLogs(): Promise<LoginLog[]> {
    return await db.select().from(loginLogs).orderBy(desc(loginLogs.createdAt));
  }

  // Lead methods
  async getAllLeads(): Promise<Lead[]> {
    return await db.select().from(leads).orderBy(desc(leads.createdAt));
  }

  async getLeadById(id: number): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead || undefined;
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const [newLead] = await db.insert(leads).values({
      ...lead,
      updatedAt: new Date(),
    }).returning();
    return newLead;
  }

  async updateLead(id: number, lead: Partial<InsertLead>): Promise<Lead | undefined> {
    const [updatedLead] = await db.update(leads)
      .set({ ...lead, updatedAt: new Date() })
      .where(eq(leads.id, id))
      .returning();
    return updatedLead || undefined;
  }

  async deleteLead(id: number): Promise<boolean> {
    const result = await db.delete(leads).where(eq(leads.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getLeadsByAssignee(userId: number): Promise<Lead[]> {
    return await db.select().from(leads).where(eq(leads.assignedTo, userId)).orderBy(desc(leads.createdAt));
  }

  // Lead follow-up methods
  async getLeadFollowUps(leadId: number): Promise<LeadFollowUp[]> {
    return await db.select({
      id: leadFollowUps.id,
      leadId: leadFollowUps.leadId,
      note: leadFollowUps.note,
      followUpDate: leadFollowUps.followUpDate,
      createdBy: leadFollowUps.createdBy,
      createdAt: leadFollowUps.createdAt,
      createdByName: users.name,
    }).from(leadFollowUps)
    .leftJoin(users, eq(leadFollowUps.createdBy, users.id))
    .where(eq(leadFollowUps.leadId, leadId))
    .orderBy(desc(leadFollowUps.createdAt));
  }

  async createLeadFollowUp(followUp: InsertLeadFollowUp): Promise<LeadFollowUp> {
    const [newFollowUp] = await db.insert(leadFollowUps).values(followUp).returning();
    return newFollowUp;
  }

  // Customer methods
  async getAllCustomers(): Promise<Customer[]> {
    return await db.select().from(customers).orderBy(desc(customers.createdAt));
  }

  async getCustomerById(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db.insert(customers).values({
      ...customer,
      updatedAt: new Date(),
    }).returning();
    return newCustomer;
  }

  async updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [updatedCustomer] = await db.update(customers)
      .set({ ...customer, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return updatedCustomer || undefined;
  }

  async deleteCustomer(id: number): Promise<boolean> {
    const result = await db.delete(customers).where(eq(customers.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getCustomersByRM(rmId: number): Promise<Customer[]> {
    return await db.select().from(customers).where(eq(customers.relationshipManager, rmId)).orderBy(desc(customers.createdAt));
  }

  // RFQ methods
  async getAllRFQs(): Promise<RFQ[]> {
    return await db.select().from(rfqs).orderBy(desc(rfqs.createdAt));
  }

  async getRFQById(id: number): Promise<RFQ | undefined> {
    const [rfq] = await db.select().from(rfqs).where(eq(rfqs.id, id));
    return rfq || undefined;
  }

  async createRFQ(rfq: InsertRFQ): Promise<RFQ> {
    const [newRFQ] = await db.insert(rfqs).values({
      ...rfq,
      updatedAt: new Date(),
    }).returning();
    return newRFQ;
  }

  async updateRFQ(id: number, rfq: Partial<InsertRFQ>): Promise<RFQ | undefined> {
    const [updatedRFQ] = await db.update(rfqs)
      .set({ ...rfq, updatedAt: new Date() })
      .where(eq(rfqs.id, id))
      .returning();
    return updatedRFQ || undefined;
  }

  async deleteRFQ(id: number): Promise<boolean> {
    const result = await db.delete(rfqs).where(eq(rfqs.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getRFQsByCustomer(customerId: number): Promise<RFQ[]> {
    return await db.select().from(rfqs).where(eq(rfqs.customerId, customerId)).orderBy(desc(rfqs.createdAt));
  }

  // Support ticket methods
  async getAllSupportTickets(): Promise<SupportTicket[]> {
    return await db.select().from(supportTickets).orderBy(desc(supportTickets.createdAt));
  }

  async getSupportTicketById(id: number): Promise<SupportTicket | undefined> {
    const [ticket] = await db.select().from(supportTickets).where(eq(supportTickets.id, id));
    return ticket || undefined;
  }

  async createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket> {
    // Generate unique ticket number
    const ticketNumber = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    const [newTicket] = await db.insert(supportTickets).values({
      ...ticket,
      ticketNumber,
      updatedAt: new Date(),
    }).returning();
    return newTicket;
  }

  async updateSupportTicket(id: number, ticket: Partial<InsertSupportTicket>): Promise<SupportTicket | undefined> {
    const [updatedTicket] = await db.update(supportTickets)
      .set({ ...ticket, updatedAt: new Date() })
      .where(eq(supportTickets.id, id))
      .returning();
    return updatedTicket || undefined;
  }

  async deleteSupportTicket(id: number): Promise<boolean> {
    const result = await db.delete(supportTickets).where(eq(supportTickets.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getTicketsByAssignee(userId: number): Promise<SupportTicket[]> {
    return await db.select().from(supportTickets).where(eq(supportTickets.assignedTo, userId)).orderBy(desc(supportTickets.createdAt));
  }

  // Email template methods
  async getAllEmailTemplates(): Promise<EmailTemplate[]> {
    return await db.select().from(emailTemplates).where(eq(emailTemplates.isActive, true)).orderBy(asc(emailTemplates.name));
  }

  async getEmailTemplateById(id: number): Promise<EmailTemplate | undefined> {
    const [template] = await db.select().from(emailTemplates).where(eq(emailTemplates.id, id));
    return template || undefined;
  }

  async createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    const [newTemplate] = await db.insert(emailTemplates).values({
      ...template,
      updatedAt: new Date(),
    }).returning();
    return newTemplate;
  }

  async updateEmailTemplate(id: number, template: Partial<InsertEmailTemplate>): Promise<EmailTemplate | undefined> {
    const [updatedTemplate] = await db.update(emailTemplates)
      .set({ ...template, updatedAt: new Date() })
      .where(eq(emailTemplates.id, id))
      .returning();
    return updatedTemplate || undefined;
  }

  async deleteEmailTemplate(id: number): Promise<boolean> {
    const result = await db.update(emailTemplates).set({ isActive: false }).where(eq(emailTemplates.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Subscription methods
  async getAllSubscriptions(): Promise<Subscription[]> {
    return await db.select().from(subscriptions).orderBy(desc(subscriptions.createdAt));
  }

  async getSubscriptionsByCustomer(customerId: number): Promise<Subscription[]> {
    return await db.select().from(subscriptions).where(eq(subscriptions.customerId, customerId));
  }

  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const [newSubscription] = await db.insert(subscriptions).values({
      ...subscription,
      updatedAt: new Date(),
    }).returning();
    return newSubscription;
  }

  async updateSubscription(id: number, subscription: Partial<InsertSubscription>): Promise<Subscription | undefined> {
    const [updatedSubscription] = await db.update(subscriptions)
      .set({ ...subscription, updatedAt: new Date() })
      .where(eq(subscriptions.id, id))
      .returning();
    return updatedSubscription || undefined;
  }

  // Activity log methods
  async createActivityLog(userId: number, entityType: string, entityId: number, action: string, details: any, ipAddress: string, userAgent: string): Promise<ActivityLog> {
    // Convert to IST (UTC+5:30) - simple and reliable
    const now = new Date();
    const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
    const [activityLog] = await db.insert(activityLogs).values({
      userId,
      entityType,
      entityId,
      action,
      details,
      ipAddress,
      userAgent,
      createdAt: istTime,
    }).returning();
    return activityLog;
  }

  async getActivityLogs(limit: number = 50): Promise<any[]> {
    return await db.select({
      id: activityLogs.id,
      userId: activityLogs.userId,
      action: activityLogs.action,
      entityType: activityLogs.entityType,
      entityId: activityLogs.entityId,
      details: activityLogs.details,
      ipAddress: activityLogs.ipAddress,
      userAgent: activityLogs.userAgent,
      createdAt: activityLogs.createdAt,
      userName: users.name,
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .orderBy(desc(activityLogs.createdAt))
    .limit(limit);
  }

  // Dashboard/Analytics methods
  async getDashboardKPIs(): Promise<{
    activeLeads: number;
    activeCustomers: number;
    totalInvestment: string;
    pendingRFQs: number;
  }> {
    const [activeLeadsResult] = await db.select({ count: count() }).from(leads).where(eq(leads.status, 'new'));
    const [activeCustomersResult] = await db.select({ count: count() }).from(customers).where(eq(customers.status, 'active'));
    const [totalInvestmentResult] = await db.select({ sum: sql<string>`COALESCE(SUM(${customers.totalInvestment}), 0)` }).from(customers);
    const [pendingRFQsResult] = await db.select({ count: count() }).from(rfqs).where(eq(rfqs.status, 'pending'));

    return {
      activeLeads: activeLeadsResult.count,
      activeCustomers: activeCustomersResult.count,
      totalInvestment: totalInvestmentResult.sum || '0',
      pendingRFQs: pendingRFQsResult.count,
    };
  }

  async getLeadSourceAnalytics(): Promise<{source: string, count: number}[]> {
    return await db.select({
      source: leads.source,
      count: count(),
    }).from(leads).groupBy(leads.source);
  }

  async getSalesPerformance(): Promise<{period: string, amount: string}[]> {
    // This is a simplified version - in production you'd want more sophisticated time-based aggregation
    return await db.select({
      period: sql<string>`DATE_TRUNC('week', ${customers.createdAt})`,
      amount: sql<string>`COALESCE(SUM(${customers.totalInvestment}), 0)`,
    }).from(customers)
    .groupBy(sql`DATE_TRUNC('week', ${customers.createdAt})`)
    .orderBy(sql`DATE_TRUNC('week', ${customers.createdAt})`);
  }

  async getRecentActivities(limit: number = 10): Promise<any[]> {
    return await db.select({
      id: activityLogs.id,
      userId: activityLogs.userId,
      action: activityLogs.action,
      entityType: activityLogs.entityType,
      entityId: activityLogs.entityId,
      details: activityLogs.details,
      ipAddress: activityLogs.ipAddress,
      userAgent: activityLogs.userAgent,
      createdAt: activityLogs.createdAt,
      userName: users.name,
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .orderBy(desc(activityLogs.createdAt))
    .limit(limit);
  }

  // Session tracking methods
  async createUserSession(session: InsertUserSession): Promise<UserSession> {
    // Convert to IST (UTC+5:30) before storing
    const istTime = new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000));
    const [newSession] = await db.insert(userSessions).values({
      ...session,
      startTime: istTime
    }).returning();
    return newSession;
  }

  async getUserSessionByToken(sessionToken: string): Promise<UserSession | undefined> {
    const [session] = await db.select().from(userSessions).where(eq(userSessions.sessionToken, sessionToken));
    return session || undefined;
  }

  async getActiveUserSessions(userId: number): Promise<UserSession[]> {
    return await db.select()
      .from(userSessions)
      .where(and(
        eq(userSessions.userId, userId),
        isNull(userSessions.endTime)
      ))
      .orderBy(desc(userSessions.startTime));
  }

  async endUserSession(sessionId: number, endReason: string): Promise<void> {
    // Convert to IST (UTC+5:30) before storing
    const istEndTime = new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000));
    await db.update(userSessions)
      .set({ 
        endTime: istEndTime,
        endReason,
        duration: sql`EXTRACT(EPOCH FROM (${istEndTime} - start_time))::integer`
      })
      .where(eq(userSessions.id, sessionId));
  }

  async getSessionAnalytics(params: { startDate?: Date; endDate?: Date; userId?: number }): Promise<any[]> {
    let conditions: any[] = [];
    
    if (params.startDate) {
      conditions.push(sql`${userSessions.startTime} >= ${params.startDate}`);
    }
    if (params.endDate) {
      conditions.push(sql`${userSessions.startTime} <= ${params.endDate}`);
    }
    if (params.userId) {
      conditions.push(eq(userSessions.userId, params.userId));
    }

    // First get all sessions
    let sessionsQuery = db.select({
      id: userSessions.id,
      userId: userSessions.userId,
      userName: users.name,
      userEmail: users.email,
      startTime: userSessions.startTime,
      endTime: userSessions.endTime,
      duration: userSessions.duration,
      totalPages: userSessions.totalPages,
      browserName: userSessions.browserName,
      deviceType: userSessions.deviceType,
      endReason: userSessions.endReason,
    })
    .from(userSessions)
    .leftJoin(users, eq(userSessions.userId, users.id))
    .$dynamic();

    if (conditions.length > 0) {
      sessionsQuery = sessionsQuery.where(and(...conditions));
    }

    const sessions = await sessionsQuery.orderBy(desc(userSessions.startTime));

    // Then get page views for each session separately
    const sessionsWithPageViews = await Promise.all(
      sessions.map(async (session) => {
        const sessionPageViews = await db.select({
          pagePath: pageViews.pagePath,
          pageTitle: pageViews.pageTitle,
          entryTime: pageViews.entryTime,
          exitTime: pageViews.exitTime,
          duration: pageViews.duration,
          scrollDepth: pageViews.scrollDepth,
          interactions: pageViews.interactions,
        })
        .from(pageViews)
        .where(eq(pageViews.sessionId, session.id))
        .orderBy(pageViews.entryTime);

        return {
          ...session,
          pageViews: sessionPageViews
        };
      })
    );

    return sessionsWithPageViews;
  }

  // Page tracking methods
  async createPageView(pageView: InsertPageView): Promise<PageView> {
    // Convert to IST (UTC+5:30) before storing
    const istTime = new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000));
    const [newPageView] = await db.insert(pageViews).values({
      ...pageView,
      entryTime: istTime
    }).returning();
    
    // Update session total pages count
    await db.update(userSessions)
      .set({ 
        totalPages: sql`${userSessions.totalPages} + 1`
      })
      .where(eq(userSessions.id, newPageView.sessionId));
      
    return newPageView;
  }

  async endPageView(pageViewId: number, updates: { exitTime: Date; duration: number; scrollDepth: number; interactions: number }): Promise<void> {
    // Convert exitTime to IST (UTC+5:30)
    const istExitTime = new Date(updates.exitTime.getTime() + (5.5 * 60 * 60 * 1000));
    await db.update(pageViews)
      .set({
        ...updates,
        exitTime: istExitTime
      })
      .where(eq(pageViews.id, pageViewId));
  }

  async updatePageView(pageViewId: number, data: { interactions?: number; action?: string }): Promise<void> {
    const updateData: any = {};
    if (data.interactions !== undefined) {
      updateData.interactions = data.interactions;
    }
    if (data.action) {
      // Store action in the referrer field for now (we can add a proper action field later if needed)
      updateData.referrer = `action:${data.action}`;
    }
    
    await db.update(pageViews)
      .set(updateData)
      .where(eq(pageViews.id, pageViewId));
  }
}

export const storage = new DatabaseStorage();
