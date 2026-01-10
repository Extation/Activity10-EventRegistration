import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'HandyHub4c@gmail.com',
        pass: 'mhhj xhuv wxho luxy',
      },
    });
  }

  async sendRegistrationConfirmation(
    to: string,
    userName: string,
    eventTitle: string,
    eventDate: string,
    eventTime: string,
    eventLocation: string,
    ticketUuid: string,
    qrCodeDataUrl: string,
  ): Promise<void> {
    const mailOptions = {
      from: {
        name: 'Event Registration System',
        address: 'HandyHub4c@gmail.com',
      },
      to,
      subject: `Registration Confirmed: ${eventTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .event-details {
              background: white;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .detail-row {
              display: flex;
              padding: 10px 0;
              border-bottom: 1px solid #eee;
            }
            .detail-label {
              font-weight: bold;
              width: 120px;
              color: #667eea;
            }
            .qr-section {
              text-align: center;
              margin: 30px 0;
              padding: 20px;
              background: white;
              border-radius: 8px;
            }
            .qr-code {
              max-width: 250px;
              margin: 20px auto;
              display: block;
            }
            .ticket-id {
              font-family: monospace;
              background: #f0f0f0;
              padding: 10px;
              border-radius: 5px;
              word-break: break-all;
              font-size: 12px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 2px solid #eee;
              color: #666;
              font-size: 14px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: #667eea;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎉 Registration Confirmed!</h1>
          </div>
          
          <div class="content">
            <p>Dear ${userName},</p>
            
            <p>Thank you for registering! Your ticket for <strong>${eventTitle}</strong> has been confirmed.</p>
            
            <div class="event-details">
              <h2 style="color: #667eea; margin-top: 0;">Event Details</h2>
              <div class="detail-row">
                <span class="detail-label">Event:</span>
                <span>${eventTitle}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span>${eventDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Time:</span>
                <span>${eventTime}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Location:</span>
                <span>${eventLocation}</span>
              </div>
            </div>
            
            <div class="qr-section">
              <h2 style="color: #667eea;">Your Ticket QR Code</h2>
              <p>Present this QR code at the event entrance for check-in:</p>
              <img src="${qrCodeDataUrl}" alt="QR Code" class="qr-code" />
              <p style="margin-top: 20px;"><strong>Ticket ID:</strong></p>
              <div class="ticket-id">${ticketUuid}</div>
            </div>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
              <strong>⚠️ Important:</strong>
              <ul style="margin: 10px 0;">
                <li>Save this email or download the QR code</li>
                <li>Arrive 15 minutes early for check-in</li>
                <li>Bring a valid ID for verification</li>
              </ul>
            </div>
            
            <div class="footer">
              <p>If you have any questions, please contact us.</p>
              <p style="color: #999; font-size: 12px;">
                This is an automated email. Please do not reply to this message.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Registration Confirmed: ${eventTitle}

Dear ${userName},

Thank you for registering! Your ticket has been confirmed.

Event Details:
- Event: ${eventTitle}
- Date: ${eventDate}
- Time: ${eventTime}
- Location: ${eventLocation}

Your Ticket ID: ${ticketUuid}

Please save this email and present your QR code at the event entrance.

Important:
- Arrive 15 minutes early for check-in
- Bring a valid ID for verification

If you have any questions, please contact us.
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Registration email sent:', info.messageId);
    } catch (error) {
      console.error('❌ Failed to send registration email:', error);
      throw error;
    }
  }

  async sendAnnouncementEmail(
    to: string[],
    subject: string,
    message: string,
    eventTitle: string,
  ): Promise<void> {
    const mailOptions = {
      from: {
        name: 'Event Registration System',
        address: 'HandyHub4c@gmail.com',
      },
      bcc: to,
      subject: `${eventTitle}: ${subject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .message-box {
              background: white;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 2px solid #eee;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📢 Event Announcement</h1>
            <h2>${eventTitle}</h2>
          </div>
          
          <div class="content">
            <div class="message-box">
              <h2 style="color: #667eea; margin-top: 0;">${subject}</h2>
              <div style="white-space: pre-wrap;">${message}</div>
            </div>
            
            <div class="footer">
              <p>This announcement was sent to all registered attendees.</p>
              <p style="color: #999; font-size: 12px;">
                This is an automated email. Please do not reply to this message.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Event Announcement: ${eventTitle}

${subject}

${message}

---
This announcement was sent to all registered attendees.
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Announcement email sent:', info.messageId);
    } catch (error) {
      console.error('❌ Failed to send announcement email:', error);
      throw error;
    }
  }

  async sendPasswordResetEmail(
    to: string,
    userName: string,
    resetToken: string,
  ): Promise<void> {
    const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: {
        name: 'Event Registration System',
        address: 'HandyHub4c@gmail.com',
      },
      to,
      subject: 'Password Reset Request',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: #667eea;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .warning {
              background: #fff3cd;
              padding: 15px;
              border-radius: 8px;
              border-left: 4px solid #ffc107;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🔐 Password Reset</h1>
          </div>
          
          <div class="content">
            <p>Dear ${userName},</p>
            
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            
            <div style="text-align: center;">
              <a href="${resetLink}" class="button">Reset Password</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 5px;">
              ${resetLink}
            </p>
            
            <div class="warning">
              <strong>⚠️ Security Notice:</strong>
              <ul style="margin: 10px 0;">
                <li>This link will expire in 1 hour</li>
                <li>If you didn't request this, please ignore this email</li>
                <li>Never share this link with anyone</li>
              </ul>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Password Reset Request

Dear ${userName},

We received a request to reset your password. Click the link below to create a new password:

${resetLink}

This link will expire in 1 hour.

If you didn't request this, please ignore this email.
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Password reset email sent:', info.messageId);
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error);
      throw error;
    }
  }

  async sendCheckInConfirmation(
    to: string,
    userName: string,
    eventTitle: string,
    eventDate: string,
    eventTime: string,
    eventLocation: string,
    verifiedAt: string,
  ): Promise<void> {
    const mailOptions = {
      from: {
        name: 'Event Registration System',
        address: 'HandyHub4c@gmail.com',
      },
      to,
      subject: `Check-In Confirmed: ${eventTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .event-details {
              background: white;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .detail-row {
              display: flex;
              padding: 10px 0;
              border-bottom: 1px solid #eee;
            }
            .detail-label {
              font-weight: bold;
              width: 140px;
              color: #4caf50;
            }
            .success-box {
              background: #d4edda;
              padding: 20px;
              border-radius: 8px;
              border-left: 4px solid #28a745;
              margin: 20px 0;
              text-align: center;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 2px solid #eee;
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Check-In Successful!</h1>
          </div>
          
          <div class="content">
            <p>Dear ${userName},</p>
            
            <div class="success-box">
              <h2 style="color: #28a745; margin: 0 0 10px 0;">Welcome to the Event!</h2>
              <p style="margin: 0; font-size: 16px;">You have been successfully checked in.</p>
            </div>
            
            <div class="event-details">
              <h2 style="color: #4caf50; margin-top: 0;">Event Information</h2>
              <div class="detail-row">
                <span class="detail-label">Event:</span>
                <span>${eventTitle}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span>${eventDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Time:</span>
                <span>${eventTime}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Location:</span>
                <span>${eventLocation}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Checked In At:</span>
                <span>${verifiedAt}</span>
              </div>
            </div>
            
            <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; border-left: 4px solid #2196F3;">
              <strong>ℹImportant Information:</strong>
              <ul style="margin: 10px 0;">
                <li>Please keep your event badge visible at all times</li>
                <li>Follow event guidelines and instructions from staff</li>
                <li>Enjoy the event!</li>
              </ul>
            </div>
            
            <div class="footer">
              <p>Thank you for attending ${eventTitle}!</p>
              <p style="color: #999; font-size: 12px;">
                This is an automated email. Please do not reply to this message.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Check-In Confirmed: ${eventTitle}

Dear ${userName},

You have been successfully checked in!

Event Information:
- Event: ${eventTitle}
- Date: ${eventDate}
- Time: ${eventTime}
- Location: ${eventLocation}
- Checked In At: ${verifiedAt}

Important:
- Keep your event badge visible at all times
- Follow event guidelines and instructions from staff
- Enjoy the event!

Thank you for attending!
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Check-in confirmation email sent:', info.messageId);
    } catch (error) {
      console.error('❌ Failed to send check-in confirmation email:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ Email service is ready');
      return true;
    } catch (error) {
      console.error('❌ Email service connection failed:', error);
      return false;
    }
  }
}
