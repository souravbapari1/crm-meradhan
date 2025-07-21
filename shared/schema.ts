import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone"),
  role: text("role").notNull().default("viewer"), // admin, sales, support, rm, viewer
  isActive: boolean("is_active").notNull().default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// OTP table for authentication
export const otps = pgTable("otps", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  otp: text("otp").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Login logs for audit trail
export const loginLogs = pgTable("login_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  email: text("email").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  browserName: text("browser_name"),
  deviceType: text("device_type"), // desktop, mobile, tablet
  operatingSystem: text("operating_system"),
  sessionType: text("session_type").notNull().default("login"), // login, logout, timeout, browser_close
  success: boolean("success").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Leads table
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  company: text("company"),
  source: text("source").notNull(), // website, referral, social_media, email_campaign, direct
  status: text("status").notNull().default("new"), // new, contacted, qualified, converted, lost
  assignedTo: integer("assigned_to").references(() => users.id),
  notes: text("notes"),
  investmentAmount: decimal("investment_amount", { precision: 15, scale: 2 }),
  bondType: text("bond_type"), // government, corporate, municipal
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Follow-up notes table for leads
export const leadFollowUps = pgTable("lead_follow_ups", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leads.id).notNull(),
  note: text("note").notNull(),
  followUpDate: timestamp("follow_up_date"),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Customers table
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").references(() => leads.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  company: text("company"),
  panNumber: text("pan_number"),
  kycStatus: text("kyc_status").notNull().default("pending"), // pending, verified, rejected
  dematAccount: text("demat_account"),
  totalInvestment: decimal("total_investment", { precision: 15, scale: 2 }).default("0"),
  relationshipManager: integer("relationship_manager").references(() => users.id),
  status: text("status").notNull().default("active"), // active, inactive, suspended
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// RFQ (Request for Quote) table
export const rfqs = pgTable("rfqs", {
  id: serial("id").primaryKey(),
  rfqNumber: text("rfq_number").notNull().unique(),
  customerId: integer("customer_id").references(() => customers.id),
  bondType: text("bond_type").notNull(), // government, corporate, municipal
  bondName: text("bond_name").notNull(),
  faceValue: decimal("face_value", { precision: 15, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
  bidPrice: decimal("bid_price", { precision: 10, scale: 4 }),
  askPrice: decimal("ask_price", { precision: 10, scale: 4 }),
  status: text("status").notNull().default("pending"), // pending, submitted, executed, cancelled
  nseRfqId: text("nse_rfq_id"),
  submittedBy: integer("submitted_by").references(() => users.id),
  submittedAt: timestamp("submitted_at"),
  executedAt: timestamp("executed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Support tickets table
export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  ticketNumber: text("ticket_number").notNull().unique(),
  customerId: integer("customer_id").references(() => customers.id),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // technical, trading, kyc, general
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  status: text("status").notNull().default("open"), // open, in_progress, resolved, closed
  assignedTo: integer("assigned_to").references(() => users.id),
  resolution: text("resolution"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Email templates table
export const emailTemplates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  category: text("category").notNull(), // welcome, follow_up, rfq_confirmation, support
  isActive: boolean("is_active").notNull().default(true),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Subscriptions table for newsletters, webinars
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id),
  type: text("type").notNull(), // newsletter, webinar, market_updates
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Activity logs for audit trail
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  entityType: text("entity_type").notNull(), // lead, customer, rfq, ticket
  entityId: integer("entity_id").notNull(),
  action: text("action").notNull(), // create, update, delete, view
  details: jsonb("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User sessions table for detailed session tracking
export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  sessionToken: text("session_token").notNull(),
  startTime: timestamp("start_time").defaultNow().notNull(),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // in seconds
  totalPages: integer("total_pages").default(0),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  browserName: text("browser_name"),
  deviceType: text("device_type"),
  operatingSystem: text("operating_system"),
  endReason: text("end_reason"), // logout, timeout, browser_close
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Page views table for tracking page browsing history
export const pageViews = pgTable("page_views", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => userSessions.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  pagePath: text("page_path").notNull(),
  pageTitle: text("page_title"),
  entryTime: timestamp("entry_time").defaultNow().notNull(),
  exitTime: timestamp("exit_time"),
  duration: integer("duration"), // in seconds
  scrollDepth: integer("scroll_depth"), // percentage
  interactions: integer("interactions").default(0), // clicks, form submissions, etc.
  referrer: text("referrer"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  assignedLeads: many(leads),
  managedCustomers: many(customers),
  submittedRfqs: many(rfqs),
  assignedTickets: many(supportTickets),
  createdTemplates: many(emailTemplates),
  activityLogs: many(activityLogs),
  loginLogs: many(loginLogs),
  leadFollowUps: many(leadFollowUps),
  userSessions: many(userSessions),
  pageViews: many(pageViews),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
  assignedUser: one(users, {
    fields: [leads.assignedTo],
    references: [users.id],
  }),
  customer: many(customers),
  followUps: many(leadFollowUps),
}));

export const leadFollowUpsRelations = relations(leadFollowUps, ({ one }) => ({
  lead: one(leads, {
    fields: [leadFollowUps.leadId],
    references: [leads.id],
  }),
  createdByUser: one(users, {
    fields: [leadFollowUps.createdBy],
    references: [users.id],
  }),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  lead: one(leads, {
    fields: [customers.leadId],
    references: [leads.id],
  }),
  relationshipManager: one(users, {
    fields: [customers.relationshipManager],
    references: [users.id],
  }),
  rfqs: many(rfqs),
  supportTickets: many(supportTickets),
  subscriptions: many(subscriptions),
}));

export const rfqsRelations = relations(rfqs, ({ one }) => ({
  customer: one(customers, {
    fields: [rfqs.customerId],
    references: [customers.id],
  }),
  submittedByUser: one(users, {
    fields: [rfqs.submittedBy],
    references: [users.id],
  }),
}));

export const supportTicketsRelations = relations(supportTickets, ({ one }) => ({
  customer: one(customers, {
    fields: [supportTickets.customerId],
    references: [customers.id],
  }),
  assignedUser: one(users, {
    fields: [supportTickets.assignedTo],
    references: [users.id],
  }),
}));

export const emailTemplatesRelations = relations(emailTemplates, ({ one }) => ({
  createdByUser: one(users, {
    fields: [emailTemplates.createdBy],
    references: [users.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  customer: one(customers, {
    fields: [subscriptions.customerId],
    references: [customers.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export const loginLogsRelations = relations(loginLogs, ({ one }) => ({
  user: one(users, {
    fields: [loginLogs.userId],
    references: [users.id],
  }),
}));

export const userSessionsRelations = relations(userSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id],
  }),
  pageViews: many(pageViews),
}));

export const pageViewsRelations = relations(pageViews, ({ one }) => ({
  session: one(userSessions, {
    fields: [pageViews.sessionId],
    references: [userSessions.id],
  }),
  user: one(users, {
    fields: [pageViews.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRfqSchema = createInsertSchema(rfqs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({
  id: true,
  ticketNumber: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLeadFollowUpSchema = createInsertSchema(leadFollowUps).omit({
  id: true,
  createdAt: true,
});

export const insertUserSessionSchema = createInsertSchema(userSessions).omit({
  id: true,
  createdAt: true,
});

export const insertPageViewSchema = createInsertSchema(pageViews).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type RFQ = typeof rfqs.$inferSelect;
export type InsertRFQ = z.infer<typeof insertRfqSchema>;
export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type OTP = typeof otps.$inferSelect;
export type LoginLog = typeof loginLogs.$inferSelect;
export const insertLoginLogSchema = createInsertSchema(loginLogs).omit({ id: true, createdAt: true });
export type InsertLoginLog = z.infer<typeof insertLoginLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type LeadFollowUp = typeof leadFollowUps.$inferSelect;
export type InsertLeadFollowUp = z.infer<typeof insertLeadFollowUpSchema>;
export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;
export type PageView = typeof pageViews.$inferSelect;
export type InsertPageView = z.infer<typeof insertPageViewSchema>;
