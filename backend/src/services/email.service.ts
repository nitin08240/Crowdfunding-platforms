import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
});

const sendEmail = async (to: string, subject: string, html: string) => {
  if (!env.SMTP_USER || env.SMTP_USER === 'your_email@gmail.com') {
    logger.info(`[Email Mock] To: ${to}, Subject: ${subject}`);
    return;
  }
  try {
    await transporter.sendMail({ from: env.SMTP_FROM, to, subject, html });
    logger.info(`Email sent to ${to}`);
  } catch (err) {
    logger.error({ err }, `Failed to send email to ${to}`);
  }
};

export const emailService = {
  async sendVerificationEmail(email: string, name: string, token: string) {
    const url = `${env.CLIENT_URL}/verify-email?token=${token}`;
    await sendEmail(
      email,
      'Verify your CrowdFund email',
      `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#6C63FF">Welcome to CrowdFund, ${name}!</h2>
        <p>Please verify your email address to get started:</p>
        <a href="${url}" style="display:inline-block;padding:12px 24px;background:#6C63FF;color:#fff;border-radius:8px;text-decoration:none">Verify Email</a>
        <p style="color:#888;margin-top:24px">This link expires in 24 hours.</p>
      </div>`
    );
  },

  async sendPasswordResetEmail(email: string, name: string, token: string) {
    const url = `${env.CLIENT_URL}/reset-password?token=${token}`;
    await sendEmail(
      email,
      'Reset your CrowdFund password',
      `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#6C63FF">Password Reset</h2>
        <p>Hi ${name}, you requested a password reset.</p>
        <a href="${url}" style="display:inline-block;padding:12px 24px;background:#6C63FF;color:#fff;border-radius:8px;text-decoration:none">Reset Password</a>
        <p style="color:#888;margin-top:24px">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
      </div>`
    );
  },

  async sendDonationConfirmation(
    email: string,
    donorName: string,
    campaignTitle: string,
    amount: number
  ) {
    await sendEmail(
      email,
      `Thank you for your donation to "${campaignTitle}"`,
      `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#6C63FF">Donation Confirmed! 🎉</h2>
        <p>Hi ${donorName}, your donation of <strong>₹${amount}</strong> to <strong>${campaignTitle}</strong> has been received.</p>
        <p>Thank you for making a difference!</p>
        <a href="${env.CLIENT_URL}/campaigns" style="display:inline-block;padding:12px 24px;background:#6C63FF;color:#fff;border-radius:8px;text-decoration:none">Explore More Campaigns</a>
      </div>`
    );
  },

  async sendCampaignApproved(email: string, creatorName: string, campaignTitle: string, slug: string) {
    await sendEmail(
      email,
      `Your campaign "${campaignTitle}" is live!`,
      `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#7c3aed">Campaign Approved! 🚀</h2>
        <p>Hi ${creatorName}, your campaign <strong>${campaignTitle}</strong> has been reviewed and <strong style="color:#22c55e">approved</strong>! It is now live and accepting donations.</p>
        <a href="${env.CLIENT_URL}/campaigns/${slug}" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;border-radius:8px;text-decoration:none">View Your Campaign</a>
        <p style="color:#888;margin-top:24px">Share your campaign with friends and family to start raising funds!</p>
      </div>`
    );
  },

  async sendCampaignRejected(email: string, creatorName: string, campaignTitle: string, reason: string) {
    await sendEmail(
      email,
      `Update on your campaign "${campaignTitle}"`,
      `<div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#7c3aed">Campaign Review Update</h2>
        <p>Hi ${creatorName}, we've reviewed your campaign <strong>${campaignTitle}</strong>.</p>
        <p>Unfortunately, we were unable to approve it at this time for the following reason:</p>
        <div style="background:#fee2e2;border-left:4px solid #ef4444;padding:12px 16px;border-radius:4px;margin:16px 0">
          <p style="margin:0;color:#991b1b">${reason}</p>
        </div>
        <p>You may address the issue and resubmit your campaign.</p>
        <a href="${env.CLIENT_URL}/dashboard" style="display:inline-block;padding:12px 24px;background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;border-radius:8px;text-decoration:none">Go to Dashboard</a>
        <p style="color:#888;margin-top:24px">If you have questions, please contact our support team.</p>
      </div>`
    );
  },

  async sendNGOApplicationReceived(email: string, ngoName: string, repName: string) {
    await sendEmail(
      email,
      `NGO Application Received: ${ngoName}`,
      `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#ffffff;padding:24px;border:1px solid #eaeaea;border-radius:12px">
        <h2 style="color:#A66A00;margin-top:0">NGO Registration Submitted! 📋</h2>
        <p>Dear ${repName},</p>
        <p>Thank you for registering <strong>${ngoName}</strong> on CrowdFund.</p>
        <p>Your application has been received and is currently under verification by our team. This process usually takes <strong>24–72 hours</strong>.</p>
        <div style="background:#f8f9fa;border-left:4px solid #A66A00;padding:12px 16px;margin:20px 0;border-radius:4px">
          <p style="margin:0;font-size:14px;color:#333"><strong>Application Status:</strong> Pending Verification</p>
        </div>
        <p>You will receive an email as soon as your application is reviewed.</p>
        <p style="color:#888;font-size:12px;margin-top:24px">If you have any urgent queries, reply directly to this email.</p>
      </div>`
    );
  },

  async sendNGOApproved(email: string, ngoName: string, repName: string) {
    await sendEmail(
      email,
      `🎉 NGO Application Approved — Welcome to CrowdFund!`,
      `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#ffffff;padding:24px;border:1px solid #eaeaea;border-radius:12px">
        <h2 style="color:#16A34A;margin-top:0">Congratulations! Application Approved 🌟</h2>
        <p>Dear ${repName},</p>
        <p>We are delighted to inform you that <strong>${ngoName}</strong> has been officially verified and approved on CrowdFund.</p>
        <div style="background:#f0fdf4;border-left:4px solid #16A34A;padding:12px 16px;margin:20px 0;border-radius:4px">
          <p style="margin:0;font-size:14px;color:#166534"><strong>Status:</strong> Verified NGO</p>
        </div>
        <p>You can now log in to your NGO dashboard to:</p>
        <ul>
          <li>Create fundraising campaigns</li>
          <li>Display your verified NGO profile publicly</li>
          <li>Accept direct donations</li>
        </ul>
        <a href="${env.CLIENT_URL}/dashboard" style="display:inline-block;padding:12px 24px;background:#A66A00;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:12px">Access NGO Dashboard</a>
      </div>`
    );
  },

  async sendNGORejected(email: string, ngoName: string, repName: string, reason: string) {
    await sendEmail(
      email,
      `Update regarding your NGO application for ${ngoName}`,
      `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#ffffff;padding:24px;border:1px solid #eaeaea;border-radius:12px">
        <h2 style="color:#DC2626;margin-top:0">NGO Application Status Update</h2>
        <p>Dear ${repName},</p>
        <p>We have reviewed the application for <strong>${ngoName}</strong>.</p>
        <p>Unfortunately, we are unable to approve your application at this time due to the following reason:</p>
        <div style="background:#fef2f2;border-left:4px solid #DC2626;padding:12px 16px;margin:20px 0;border-radius:4px">
          <p style="margin:0;font-size:14px;color:#991b1b"><strong>Reason:</strong> ${reason}</p>
        </div>
        <p>If you believe this is an error or wish to re-apply with corrected documentation, please contact our support team.</p>
      </div>`
    );
  },

  async sendNGOMoreInfoRequested(email: string, ngoName: string, repName: string, notes: string) {
    await sendEmail(
      email,
      `Action Required: More Information Needed for ${ngoName}`,
      `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#ffffff;padding:24px;border:1px solid #eaeaea;border-radius:12px">
        <h2 style="color:#D89A2B;margin-top:0">Action Required for NGO Verification ⚠️</h2>
        <p>Dear ${repName},</p>
        <p>Our verification team is reviewing your application for <strong>${ngoName}</strong> and requires additional information or document corrections before proceeding.</p>
        <div style="background:#fffbeb;border-left:4px solid #D89A2B;padding:12px 16px;margin:20px 0;border-radius:4px">
          <p style="margin:0;font-size:14px;color:#92400e"><strong>Requested Information / Documents:</strong></p>
          <p style="margin:8px 0 0 0;font-size:14px;color:#78350f">${notes}</p>
        </div>
        <p>Please log in to your account and upload the missing details/documents to resume verification.</p>
        <a href="${env.CLIENT_URL}/register-ngo" style="display:inline-block;padding:12px 24px;background:#A66A00;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:12px">Update Application</a>
      </div>`
    );
  },
};

