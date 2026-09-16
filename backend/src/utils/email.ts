import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { prisma } from '../config/db';

export function generateOTP(): string {
  // CSPRNG — Math.random is not cryptographically secure.
  return crypto.randomInt(100000, 1000000).toString();
}

export async function storeOTP(email: string, otp: string): Promise<void> {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  // Delete any existing OTP for this email before creating a new one
  await prisma.otpToken.deleteMany({ where: { email } });
  await prisma.otpToken.create({ data: { email, otp, expiresAt } });
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DEV] OTP for ${email}: ${otp}`);
  }
}

export async function verifyOTP(email: string, otp: string): Promise<boolean> {
  const stored = await prisma.otpToken.findFirst({
    where: { email, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });
  if (!stored) return false;
  // Timing-safe compare on BYTE buffers (timingSafeEqual throws on unequal buffer
  // lengths, so compare Buffer.length — not JS string length, which is UTF-16 units).
  const a = Buffer.from(stored.otp);
  const b = Buffer.from(otp);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  await prisma.otpToken.deleteMany({ where: { email } });
  return true;
}

function createTransporter() {
  return nodemailer.createTransport({
    host: env.EMAIL_HOST,
    port: env.EMAIL_PORT,
    secure: env.EMAIL_PORT === 465,
    auth: {
      user: env.EMAIL_USER,
      pass: env.EMAIL_PASS,
    },
  });
}

export async function sendVerificationEmail(email: string, otp: string): Promise<void> {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"BibleStudy Pro" <${env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify Your Email - BibleStudy Pro',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Verify Your Email</h2>
        <p>Welcome to BibleStudy Pro! Please use the following OTP to verify your email address:</p>
        <div style="background: #F3F4F6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <h1 style="color: #4F46E5; font-size: 36px; letter-spacing: 8px; margin: 0;">${otp}</h1>
        </div>
        <p style="color: #6B7280;">This code expires in 10 minutes.</p>
        <p style="color: #6B7280;">If you did not create an account, please ignore this email.</p>
      </div>
    `,
  });
}

export async function sendWaitlistWelcomeEmail(email: string): Promise<void> {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"Verdance" <${env.EMAIL_USER}>`,
    to: email,
    subject: "You're on the Verdance waitlist 🌱",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #0F1117;">
        <h2 style="color: #6366F1;">You're on the list 🌱</h2>
        <p>Thanks for joining the Verdance waitlist. We're building a calmer, deeper way to
        study Scripture — modern flashcards, spaced-repetition review, quizzes, and group study.</p>
        <p><strong>We'll email you the day Verdance launches in your area.</strong></p>
        <p style="margin-top: 24px;">One favor: know a pastor or small-group leader who'd love this?
        Forward them <a href="https://getverdance.com" style="color: #6366F1;">getverdance.com</a> —
        it's the biggest way to help us launch.</p>
        <p style="color: #6B7280; margin-top: 24px;">Grow in the Word,<br>The Verdance team</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, otp: string): Promise<void> {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"BibleStudy Pro" <${env.EMAIL_USER}>`,
    to: email,
    subject: 'Reset Your Password - BibleStudy Pro',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Reset Your Password</h2>
        <p>You requested a password reset. Use the following OTP to reset your password:</p>
        <div style="background: #F3F4F6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <h1 style="color: #4F46E5; font-size: 36px; letter-spacing: 8px; margin: 0;">${otp}</h1>
        </div>
        <p style="color: #6B7280;">This code expires in 10 minutes.</p>
        <p style="color: #6B7280;">If you did not request a password reset, please ignore this email and your password will remain unchanged.</p>
      </div>
    `,
  });
}
