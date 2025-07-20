import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertLeadSchema, insertCustomerSchema, insertRfqSchema, insertSupportTicketSchema, insertEmailTemplateSchema, insertLeadFollowUpSchema } from "@shared/schema";
import { authMiddleware, requireRole } from "./middleware/auth";
import { otpService } from "./services/otpService";
import { emailService } from "./services/emailService";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Helper function to get real client IP address
function getClientIP(req: any): string {
  return req.get('X-Forwarded-For')?.split(',')[0]?.trim() || 
         req.get('X-Real-IP') || 
         req.get('CF-Connecting-IP') ||
         req.ip || 
         req.connection.remoteAddress || 
         "unknown";
}

// Validation schemas
const loginSchema = z.object({
  email: z.string().email(),
});

const verifyOTPSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/request-otp", async (req, res) => {
    try {
      const { email } = loginSchema.parse(req.body);
      
      // Check if user exists
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Generate and send OTP
      const otp = otpService.generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      await storage.createOTP(email, otp, expiresAt);
      await emailService.sendOTP(email, otp);
      
      // Log attempt
      const clientIP = req.ip || req.connection.remoteAddress || "unknown";
      const userAgent = req.get("User-Agent") || "unknown";
      await storage.createLoginLog(user.id, email, clientIP, userAgent, false);

      res.json({ message: "OTP sent successfully" });
    } catch (error) {
      console.error("Request OTP error:", error);
      res.status(500).json({ message: "Failed to send OTP" });
    }
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { email, otp } = verifyOTPSchema.parse(req.body);
      
      // Verify OTP
      const validOTP = await storage.getValidOTP(email, otp);
      if (!validOTP) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }

      // Get user
      const user = await storage.getUserByEmail(email);
      if (!user || !user.isActive) {
        return res.status(401).json({ message: "User not found or inactive" });
      }

      // Mark OTP as used
      await storage.markOTPAsUsed(validOTP.id);
      
      // Update last login
      await storage.updateUser(user.id, { lastLogin: new Date() });

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      // Log successful login
      const clientIP = getClientIP(req);
      const userAgent = req.get("User-Agent") || "unknown";
      await storage.createLoginLog(user.id, email, clientIP, userAgent, true);

      res.json({
        message: "Login successful",
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Verify OTP error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", authMiddleware, async (req, res) => {
    // In a production app, you might want to maintain a token blacklist
    res.json({ message: "Logout successful" });
  });

  app.get("/api/auth/me", authMiddleware, async (req, res) => {
    const user = await storage.getUser((req as any).user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  });

  // Dashboard routes
  app.get("/api/dashboard/kpis", authMiddleware, async (req, res) => {
    try {
      const kpis = await storage.getDashboardKPIs();
      res.json(kpis);
    } catch (error) {
      console.error("Dashboard KPIs error:", error);
      res.status(500).json({ message: "Failed to fetch KPIs" });
    }
  });

  app.get("/api/dashboard/lead-sources", authMiddleware, async (req, res) => {
    try {
      const leadSources = await storage.getLeadSourceAnalytics();
      res.json(leadSources);
    } catch (error) {
      console.error("Lead sources error:", error);
      res.status(500).json({ message: "Failed to fetch lead sources" });
    }
  });

  app.get("/api/dashboard/sales-performance", authMiddleware, async (req, res) => {
    try {
      const performance = await storage.getSalesPerformance();
      res.json(performance);
    } catch (error) {
      console.error("Sales performance error:", error);
      res.status(500).json({ message: "Failed to fetch sales performance" });
    }
  });

  app.get("/api/dashboard/recent-activities", authMiddleware, async (req, res) => {
    try {
      const activities = await storage.getRecentActivities(10);
      res.json(activities);
    } catch (error) {
      console.error("Recent activities error:", error);
      res.status(500).json({ message: "Failed to fetch recent activities" });
    }
  });

  // Leads routes
  app.get("/api/leads", authMiddleware, async (req, res) => {
    try {
      const user = (req as any).user;
      let leads;
      
      if (user.role === 'admin') {
        leads = await storage.getAllLeads();
      } else {
        leads = await storage.getLeadsByAssignee(user.userId);
      }
      
      res.json(leads);
    } catch (error) {
      console.error("Get leads error:", error);
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  app.post("/api/leads", authMiddleware, requireRole(['admin', 'sales']), async (req, res) => {
    try {
      const leadData = insertLeadSchema.parse(req.body);
      const lead = await storage.createLead(leadData);
      
      // Log activity
      const clientIP = getClientIP(req);
      const userAgent = req.get("User-Agent") || "unknown";
      await storage.createActivityLog(
        (req as any).user.userId,
        'lead',
        lead.id,
        'create',
        { leadName: lead.name },
        clientIP,
        userAgent
      );
      
      res.status(201).json(lead);
    } catch (error) {
      console.error("Create lead error:", error);
      res.status(500).json({ message: "Failed to create lead" });
    }
  });

  app.put("/api/leads/:id", authMiddleware, requireRole(['admin', 'sales']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const leadData = insertLeadSchema.partial().parse(req.body);
      const lead = await storage.updateLead(id, leadData);
      
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      // Log activity
      const clientIP = getClientIP(req);
      const userAgent = req.get("User-Agent") || "unknown";
      await storage.createActivityLog(
        (req as any).user.userId,
        'lead',
        lead.id,
        'update',
        { updates: leadData },
        clientIP,
        userAgent
      );
      
      res.json(lead);
    } catch (error) {
      console.error("Update lead error:", error);
      res.status(500).json({ message: "Failed to update lead" });
    }
  });

  app.delete("/api/leads/:id", authMiddleware, requireRole(['admin']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteLead(id);
      
      if (!success) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      // Log activity
      const clientIP = getClientIP(req);
      const userAgent = req.get("User-Agent") || "unknown";
      await storage.createActivityLog(
        (req as any).user.userId,
        'lead',
        id,
        'delete',
        {},
        clientIP,
        userAgent
      );
      
      res.json({ message: "Lead deleted successfully" });
    } catch (error) {
      console.error("Delete lead error:", error);
      res.status(500).json({ message: "Failed to delete lead" });
    }
  });

  // Customers routes
  app.get("/api/customers", authMiddleware, async (req, res) => {
    try {
      const user = (req as any).user;
      let customers;
      
      if (user.role === 'admin') {
        customers = await storage.getAllCustomers();
      } else if (user.role === 'rm') {
        customers = await storage.getCustomersByRM(user.userId);
      } else {
        customers = await storage.getAllCustomers();
      }
      
      res.json(customers);
    } catch (error) {
      console.error("Get customers error:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.post("/api/customers", authMiddleware, requireRole(['admin', 'sales', 'rm']), async (req, res) => {
    try {
      const customerData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(customerData);
      
      // Log activity
      const clientIP = getClientIP(req);
      const userAgent = req.get("User-Agent") || "unknown";
      await storage.createActivityLog(
        (req as any).user.userId,
        'customer',
        customer.id,
        'create',
        { customerName: customer.name },
        clientIP,
        userAgent
      );
      
      res.status(201).json(customer);
    } catch (error) {
      console.error("Create customer error:", error);
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  app.put("/api/customers/:id", authMiddleware, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customerData = insertCustomerSchema.partial().parse(req.body);
      const customer = await storage.updateCustomer(id, customerData);
      
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      // Log activity
      const clientIP = getClientIP(req);
      const userAgent = req.get("User-Agent") || "unknown";
      await storage.createActivityLog(
        (req as any).user.userId,
        'customer',
        customer.id,
        'update',
        { updates: customerData },
        clientIP,
        userAgent
      );
      
      res.json(customer);
    } catch (error) {
      console.error("Update customer error:", error);
      res.status(500).json({ message: "Failed to update customer" });
    }
  });

  // RFQ routes
  app.get("/api/rfqs", authMiddleware, async (req, res) => {
    try {
      const rfqs = await storage.getAllRFQs();
      res.json(rfqs);
    } catch (error) {
      console.error("Get RFQs error:", error);
      res.status(500).json({ message: "Failed to fetch RFQs" });
    }
  });

  app.post("/api/rfqs", authMiddleware, requireRole(['admin', 'sales', 'rm']), async (req, res) => {
    try {
      const rfqData = insertRfqSchema.parse(req.body);
      // Generate RFQ number
      const rfqNumber = `RFQ-${Date.now()}`;
      const rfq = await storage.createRFQ({ ...rfqData, rfqNumber });
      
      // Log activity
      const clientIP = getClientIP(req);
      const userAgent = req.get("User-Agent") || "unknown";
      await storage.createActivityLog(
        (req as any).user.userId,
        'rfq',
        rfq.id,
        'create',
        { rfqNumber: rfq.rfqNumber },
        clientIP,
        userAgent
      );
      
      res.status(201).json(rfq);
    } catch (error) {
      console.error("Create RFQ error:", error);
      res.status(500).json({ message: "Failed to create RFQ" });
    }
  });

  // Support tickets routes
  app.get("/api/support-tickets", authMiddleware, async (req, res) => {
    try {
      const user = (req as any).user;
      let tickets;
      
      if (user.role === 'admin' || user.role === 'support') {
        tickets = await storage.getAllSupportTickets();
      } else {
        tickets = await storage.getTicketsByAssignee(user.userId);
      }
      
      res.json(tickets);
    } catch (error) {
      console.error("Get support tickets error:", error);
      res.status(500).json({ message: "Failed to fetch support tickets" });
    }
  });

  app.post("/api/support-tickets", authMiddleware, async (req, res) => {
    try {
      const ticketData = insertSupportTicketSchema.parse(req.body);
      // Generate ticket number
      const ticketNumber = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      const ticket = await storage.createSupportTicket({ ...ticketData, ticketNumber });
      
      // Log activity
      const clientIP = getClientIP(req);
      const userAgent = req.get("User-Agent") || "unknown";
      await storage.createActivityLog(
        (req as any).user.userId,
        'ticket',
        ticket.id,
        'create',
        { ticketNumber: ticket.ticketNumber },
        clientIP,
        userAgent
      );
      
      res.status(201).json(ticket);
    } catch (error) {
      console.error("Create support ticket error:", error);
      res.status(500).json({ message: "Failed to create support ticket" });
    }
  });

  // Email templates routes
  app.get("/api/email-templates", authMiddleware, async (req, res) => {
    try {
      const templates = await storage.getAllEmailTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Get email templates error:", error);
      res.status(500).json({ message: "Failed to fetch email templates" });
    }
  });

  app.post("/api/email-templates", authMiddleware, requireRole(['admin', 'sales']), async (req, res) => {
    try {
      const templateData = insertEmailTemplateSchema.parse(req.body);
      const template = await storage.createEmailTemplate(templateData);
      
      // Log activity
      const clientIP = getClientIP(req);
      const userAgent = req.get("User-Agent") || "unknown";
      await storage.createActivityLog(
        (req as any).user.userId,
        'template',
        template.id,
        'create',
        { templateName: template.name },
        clientIP,
        userAgent
      );
      
      res.status(201).json(template);
    } catch (error) {
      console.error("Create email template error:", error);
      res.status(500).json({ message: "Failed to create email template" });
    }
  });

  // User management routes (admin only)
  app.get("/api/users", authMiddleware, requireRole(['admin']), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", authMiddleware, requireRole(['admin']), async (req, res) => {
    try {
      const userData = req.body;
      const user = await storage.createUser(userData);
      
      // Log activity
      const clientIP = getClientIP(req);
      const userAgent = req.get("User-Agent") || "unknown";
      await storage.createActivityLog(
        (req as any).user.userId,
        'user',
        user.id,
        'create',
        { userName: user.name, userRole: user.role },
        clientIP,
        userAgent
      );
      
      res.status(201).json(user);
    } catch (error) {
      console.error("Create user error:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put("/api/users/:id", authMiddleware, requireRole(['admin']), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const userData = req.body;
      
      // Check if trying to deactivate the system admin (user ID 1 or the original admin)
      if (userData.hasOwnProperty('isActive') && !userData.isActive) {
        const targetUser = await storage.getUser(userId);
        if (targetUser && (targetUser.email === 'vikas.kukreja@meradhan.co' || userId === 1)) {
          return res.status(403).json({ 
            message: "Cannot deactivate the system administrator account" 
          });
        }
      }
      
      const updatedUser = await storage.updateUser(userId, userData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Log activity
      const clientIP = getClientIP(req);
      const userAgent = req.get("User-Agent") || "unknown";
      await storage.createActivityLog(
        (req as any).user.userId,
        'user',
        userId,
        'update',
        { userName: updatedUser.name, changes: Object.keys(userData) },
        clientIP,
        userAgent
      );
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Lead follow-up routes
  app.get("/api/leads/:id/follow-ups", authMiddleware, async (req, res) => {
    try {
      const leadId = parseInt(req.params.id);
      const followUps = await storage.getLeadFollowUps(leadId);
      res.json(followUps);
    } catch (error) {
      console.error("Get lead follow-ups error:", error);
      res.status(500).json({ message: "Failed to fetch follow-ups" });
    }
  });

  app.post("/api/leads/:id/follow-ups", authMiddleware, async (req, res) => {
    try {
      const leadId = parseInt(req.params.id);
      const followUpData = insertLeadFollowUpSchema.parse({
        ...req.body,
        leadId,
        createdBy: (req as any).user.userId,
      });
      
      const followUp = await storage.createLeadFollowUp(followUpData);
      
      // Log activity
      const clientIP = getClientIP(req);
      const userAgent = req.get("User-Agent") || "unknown";
      await storage.createActivityLog(
        (req as any).user.userId,
        'lead',
        leadId,
        'update',
        { action: 'follow_up_added', note: followUpData.note },
        clientIP,
        userAgent
      );
      
      res.status(201).json(followUp);
    } catch (error) {
      console.error("Create follow-up error:", error);
      res.status(500).json({ message: "Failed to create follow-up" });
    }
  });

  // Activity logs routes (admin only)
  app.get("/api/activity-logs", authMiddleware, requireRole(['admin']), async (req, res) => {
    try {
      const logs = await storage.getRecentActivities(50);
      res.json(logs);
    } catch (error) {
      console.error("Get activity logs error:", error);
      res.status(500).json({ message: "Failed to fetch activity logs" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
