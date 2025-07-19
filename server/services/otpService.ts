import crypto from "crypto";

export class OTPService {
  generateOTP(): string {
    // Generate a 6-digit OTP
    return crypto.randomInt(100000, 999999).toString();
  }

  validateOTPFormat(otp: string): boolean {
    return /^\d{6}$/.test(otp);
  }
}

export const otpService = new OTPService();
