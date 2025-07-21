import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertLeadSchema, insertCustomerSchema, insertRfqSchema, insertSupportTicketSchema, insertEmailTemplateSchema, insertLeadFollowUpSchema, userSessions, pageViews, insertUserSessionSchema, insertPageViewSchema } from "@shared/schema";
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

// Browser detection utility
function parseBrowserInfo(userAgent: string) {
  let browserName = 'Unknown';
  let deviceType = 'desktop';
  let operatingSystem = 'Unknown';

  // Detect browser
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    browserName = 'Chrome';
  } else if (userAgent.includes('Firefox')) {
    browserName = 'Firefox';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browserName = 'Safari';
  } else if (userAgent.includes('Edg')) {
    browserName = 'Edge';
  } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
    browserName = 'Opera';
  }

  // Detect device type
  if (/Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
    if (/iPad|Tablet/i.test(userAgent)) {
      deviceType = 'tablet';
    } else {
      deviceType = 'mobile';
    }
  }

  // Detect operating system
  if (userAgent.includes('Windows')) {
    operatingSystem = 'Windows';
  } else if (userAgent.includes('Mac')) {
    operatingSystem = 'macOS';
  } else if (userAgent.includes('Linux')) {
    operatingSystem = 'Linux';
  } else if (userAgent.includes('Android')) {
    operatingSystem = 'Android';
  } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    operatingSystem = 'iOS';
  }

  return { browserName, deviceType, operatingSystem };
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
      const browserInfo = parseBrowserInfo(userAgent);
      await storage.createLoginLog(user.id, email, clientIP, userAgent, browserInfo.browserName, browserInfo.deviceType, browserInfo.operatingSystem, 'otp_request', false);

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

      // Enhanced login logging with browser detection
      const clientIP = getClientIP(req);
      const userAgent = req.get("User-Agent") || "unknown";
      
      // Parse browser info from user agent
      const browserInfo = parseBrowserInfo(userAgent);
      
      await storage.createLoginLog(
        user.id, 
        email, 
        clientIP, 
        userAgent, 
        browserInfo.browserName,
        browserInfo.deviceType,
        browserInfo.operatingSystem,
        'login',
        true
      );
      
      // Log to activity logs as well
      await storage.createActivityLog(
        user.id,
        'user',
        user.id,
        'login',
        { 
          browserName: browserInfo.browserName,
          deviceType: browserInfo.deviceType,
          operatingSystem: browserInfo.operatingSystem
        },
        clientIP,
        userAgent
      );

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

  app.post("/api/auth/session-end", async (req, res) => {
    try {
      const { reason, timestamp, sessionDuration, token } = req.body;
      const clientIP = getClientIP(req);
      const userAgent = req.get("User-Agent") || "unknown";
      const browserInfo = parseBrowserInfo(userAgent);
      
      // Extract user info from token if available
      let userId, userEmail;
      let authToken = token; // Try token from body first (for sendBeacon)
      
      if (!authToken) {
        // Fallback to Authorization header
        const authHeader = req.get("Authorization");
        if (authHeader?.startsWith("Bearer ")) {
          authToken = authHeader.substring(7);
        }
      }
      
      if (authToken) {
        try {
          const decoded = jwt.verify(authToken, JWT_SECRET) as any;
          userId = decoded.userId;
          userEmail = decoded.email;
        } catch (jwtError: any) {
          // Token might be expired or invalid, but we still want to log the session end attempt
          console.log("Invalid token for session end:", jwtError.message);
        }
      }
      
      // If we have user info, log the session end
      if (userId && userEmail) {
        // Log session end in login logs
        await storage.createLoginLog(
          userId,
          userEmail,
          clientIP,
          userAgent,
          browserInfo.browserName,
          browserInfo.deviceType,
          browserInfo.operatingSystem,
          reason || 'logout',
          true
        );
        
        // Create detailed audit log entry for automatic session termination
        const auditDetails = {
          reason,
          timestamp: timestamp || new Date().toISOString(),
          sessionDuration: sessionDuration || 0,
          browserName: browserInfo.browserName,
          deviceType: browserInfo.deviceType,
          operatingSystem: browserInfo.operatingSystem,
          clientIP,
          userAgent
        };
        
        let actionDescription = 'session_end';
        if (reason === 'timeout') {
          actionDescription = 'auto_logout_timeout';
        } else if (reason === 'browser_close') {
          actionDescription = 'auto_logout_browser_close';
        }
        
        // Log to activity logs with detailed audit information
        await storage.createActivityLog(
          userId,
          'user',
          userId,
          actionDescription,
          auditDetails,
          clientIP,
          userAgent
        );
        
        console.log(`📋 Session ended for user ${userEmail} (ID: ${userId}) - Reason: ${reason}`);
      } else {
        console.log(`⚠️ Session end attempt without valid user context - Reason: ${reason}`);
      }
      
      res.json({ message: "Session ended" });
    } catch (error) {
      console.error("Session end error:", error);
      res.status(500).json({ message: "Failed to end session" });
    }
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
      const ticket = await storage.createSupportTicket({ ...ticketData, ticketNumber } as any);
      
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
      
      // Check if trying to deactivate the main admin account
      if (userData.hasOwnProperty('isActive') && !userData.isActive) {
        const targetUser = await storage.getUser(userId);
        if (targetUser && targetUser.email === 'vikas.kukreja@meradhan.co') {
          return res.status(403).json({ 
            message: "Cannot deactivate the main administrator account" 
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

  // Login logs routes (admin only)
  app.get("/api/login-logs", authMiddleware, requireRole(['admin']), async (req, res) => {
    try {
      const logs = await storage.getAllLoginLogs();
      res.json(logs);
    } catch (error) {
      console.error("Get login logs error:", error);
      res.status(500).json({ message: "Failed to fetch login logs" });
    }
  });

  // Page tracking routes
  app.post("/api/page-tracking/start", authMiddleware, async (req: any, res) => {
    try {
      const { sessionToken, pagePath, pageTitle, referrer } = req.body;
      const userId = req.user!.userId;
      const ipAddress = getClientIP(req);
      const userAgent = req.get('User-Agent') || 'Unknown';

      // Get or create session
      let session = await storage.getUserSessionByToken(sessionToken);
      if (!session) {
        const browserInfo = parseBrowserInfo(userAgent);
        session = await storage.createUserSession({
          userId,
          sessionToken,
          ipAddress,
          userAgent,
          browserName: browserInfo.browserName,
          deviceType: browserInfo.deviceType,
          operatingSystem: browserInfo.operatingSystem,
        });
      }

      // Create page view record
      const pageView = await storage.createPageView({
        sessionId: session.id,
        userId,
        pagePath,
        pageTitle,
        referrer: referrer || null,
      });

      res.json({ pageViewId: pageView.id, sessionId: session.id });
    } catch (error) {
      console.error("Error starting page tracking:", error);
      res.status(500).json({ message: "Failed to start page tracking" });
    }
  });

  app.post("/api/page-tracking/end", async (req, res) => {
    try {
      let { pageViewId, exitTime, duration, scrollDepth, interactions, token } = req.body;

      // Handle sendBeacon requests (from beforeunload)
      if (!token && req.headers.authorization) {
        token = req.headers.authorization.replace('Bearer ', '');
      }

      if (!token) {
        return res.status(401).json({ message: "Access token required" });
      }

      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (!decoded) {
        return res.status(401).json({ message: "Invalid token" });
      }

      await storage.endPageView(pageViewId, {
        exitTime: new Date(exitTime),
        duration,
        scrollDepth: scrollDepth || 0,
        interactions: interactions || 0,
      });

      res.json({ message: "Page tracking ended successfully" });
    } catch (error) {
      console.error("Error ending page tracking:", error);
      res.status(500).json({ message: "Failed to end page tracking" });
    }
  });

  // Get session analytics
  app.get("/api/session-analytics", authMiddleware, requireRole(['admin']), async (req, res) => {
    try {
      const { startDate, endDate, userId } = req.query;
      const sessions = await storage.getSessionAnalytics({
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        userId: userId ? parseInt(userId as string) : undefined,
      });
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching session analytics:", error);
      res.status(500).json({ message: "Failed to fetch session analytics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
