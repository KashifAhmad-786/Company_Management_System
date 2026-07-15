const nodemailer = require('nodemailer');

// Setup transporter
// Uses Gmail SMTP by default, fallback to logs if not configured
const createTransporter = () => {
  if (process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });
  } else {
    // If not configured, return null; we will log the email output to console
    return null;
  }
};

const sendOtpEmail = async (email, otpCode) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"Company Management System" <${process.env.EMAIL_USER || 'no-reply@company.com'}>`,
    to: email,
    subject: 'Verification Code - Company Management System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #3b82f6; text-align: center;">Verify Your Account</h2>
        <p>Hello,</p>
        <p>Thank you for registering at Company Management System. Please use the following 6-digit One-Time Password (OTP) to verify your account. This code is valid for 10 minutes:</p>
        <div style="font-size: 28px; font-weight: bold; color: #1e3a8a; text-align: center; margin: 30px 0; letter-spacing: 4px; padding: 10px; background-color: #eff6ff; border-radius: 6px;">
          ${otpCode}
        </div>
        <p>If you did not request this verification, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-top: 30px;" />
        <p style="font-size: 12px; color: #64748b; text-align: center;">Company Management System Team</p>
      </div>
    `,
  };

  if (transporter) {
    try {
      await transporter.sendMail(mailOptions);
      console.log(`[Email Service] OTP email successfully sent to ${email}`);
      return true;
    } catch (error) {
      console.error(`[Email Service Error] Failed to send OTP email: ${error.message}`);
      // Return true/fallback to dev console logging to allow testing
      console.log(`[DEVELOPMENT FALLBACK] OTP Code for ${email} is: ${otpCode}`);
      return false;
    }
  } else {
    console.log('\n==================================================');
    console.log(`[MOCK EMAIL SERVICE] OTP Code for ${email} is: ${otpCode}`);
    console.log('==================================================\n');
    return true;
  }
};

const sendResetPasswordEmail = async (email, resetUrl) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"Company Management System" <${process.env.EMAIL_USER || 'no-reply@company.com'}>`,
    to: email,
    subject: 'Password Reset Request - Company Management System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #ef4444; text-align: center;">Reset Your Password</h2>
        <p>Hello,</p>
        <p>You requested a password reset for your account. Please click the button below to reset your password. This link is valid for 10 minutes:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
        </div>
        <p>If the button doesn't work, copy and paste this URL into your browser:</p>
        <p style="word-break: break-all; color: #2563eb;">${resetUrl}</p>
        <p>If you did not request this, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-top: 30px;" />
        <p style="font-size: 12px; color: #64748b; text-align: center;">Company Management System Team</p>
      </div>
    `,
  };

  if (transporter) {
    try {
      await transporter.sendMail(mailOptions);
      console.log(`[Email Service] Password reset link sent to ${email}`);
      return true;
    } catch (error) {
      console.error(`[Email Service Error] Failed to send reset email: ${error.message}`);
      console.log(`[DEVELOPMENT FALLBACK] Reset Link for ${email} is: ${resetUrl}`);
      return false;
    }
  } else {
    console.log('\n==================================================');
    console.log(`[MOCK EMAIL SERVICE] Reset Link for ${email} is: ${resetUrl}`);
    console.log('==================================================\n');
    return true;
  }
};

module.exports = {
  sendOtpEmail,
  sendResetPasswordEmail,
};
