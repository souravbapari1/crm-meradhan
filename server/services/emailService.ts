import nodemailer from "nodemailer";

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    console.log(process.env.SMTP_USER);

    // Configure email transporter
    this.transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false, // true for 465, false for other ports
      auth: {
        user: "8a96b2001@smtp-brevo.com",
        pass: "nZ7pcDdOr9XxTBQw",
      },
    });
  }

  async sendOTP(email: string, otp: string): Promise<void> {
    try {
      const mailOptions = {
        from:"noreply@meradhan.co",
        to: email,
        subject: "MeraDhan CRM - Your Login OTP",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">MeraDhan CRM</h1>
              <p style="color: white; margin: 5px 0;">SEBI Registered OBPP</p>
            </div>
            <div style="padding: 30px; background: white;">
              <h2 style="color: #1e40af; margin-bottom: 20px;">Login Verification Code</h2>
              <p style="color: #64748b; margin-bottom: 30px;">
                Please use the following verification code to complete your login:
              </p>
              <div style="background: #f8fafc; border: 2px solid #e2e8f0; padding: 20px; text-align: center; border-radius: 8px; margin: 30px 0;">
                <h1 style="color: #1e40af; font-size: 36px; letter-spacing: 8px; margin: 0;">${otp}</h1>
              </div>
              <p style="color: #64748b; font-size: 14px;">
                This code will expire in 10 minutes. If you didn't request this code, please ignore this email.
              </p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
              <p style="color: #9ca3af; font-size: 12px;">
                This is an automated message from MeraDhan CRM. Please do not reply to this email.
              </p>
            </div>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`OTP sent successfully to ${email}`);
    } catch (error) {
      console.error("Failed to send OTP email:", error);
      // For testing purposes, log the OTP when email fails
      console.log(`🔑 TEST MODE - OTP for ${email}: ${otp}`);
      // Don't throw error in development to allow testing without email setup
    }
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || "noreply@meradhan.co",
        to: email,
        subject: "Welcome to MeraDhan CRM",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">Welcome to MeraDhan CRM</h1>
              <p style="color: white; margin: 5px 0;">SEBI Registered OBPP</p>
            </div>
            <div style="padding: 30px; background: white;">
              <h2 style="color: #1e40af; margin-bottom: 20px;">Hello ${name}!</h2>
              <p style="color: #64748b; margin-bottom: 20px;">
                Welcome to MeraDhan CRM, India's leading Online Bond Provider Platform. 
                We're excited to have you on board!
              </p>
              <p style="color: #64748b; margin-bottom: 20px;">
                Your account has been successfully created and you can now access our comprehensive 
                bond trading and CRM platform.
              </p>
              <div style="background: #f8fafc; border-left: 4px solid #1e40af; padding: 20px; margin: 20px 0;">
                <h3 style="color: #1e40af; margin-top: 0;">Key Features:</h3>
                <ul style="color: #64748b;">
                  <li>Real-time bond trading on NSE & BSE</li>
                  <li>Comprehensive customer relationship management</li>
                  <li>Advanced analytics and reporting</li>
                  <li>SEBI compliant platform</li>
                </ul>
              </div>
              <p style="color: #64748b;">
                If you have any questions, our support team is here to help.
              </p>
            </div>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Welcome email sent successfully to ${email}`);
    } catch (error) {
      console.error("Failed to send welcome email:", error);
      throw new Error("Failed to send welcome email");
    }
  }
}

export const emailService = new EmailService();
