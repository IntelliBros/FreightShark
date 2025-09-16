import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: {
    name: string;
    email: string;
  };
}

interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig;

  constructor() {
    this.config = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
      },
      from: {
        name: process.env.SMTP_FROM_NAME || 'Freight Shark',
        email: process.env.SMTP_FROM_EMAIL || 'noreply@freightshark.com'
      }
    };

    this.initializeTransporter();
  }

  private getLogoUrl(format: 'svg' | 'png' = 'svg'): string {
    // Use environment variable or default to production URL
    const baseUrl = process.env.FRONTEND_URL || 'https://freight-shark.vercel.app';
    // Using SVG as default per request
    const filename = format === 'svg' ? 'freight-shark-logo.svg' : 'freight-shark-logo.png';
    return `${baseUrl}/${filename}`;
  }

  private initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: this.config.auth
      });
    } catch (error) {
      console.error('Failed to initialize email transporter:', error);
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.transporter) {
      return { success: false, message: 'Email transporter not initialized' };
    }

    try {
      await this.transporter.verify();
      return { success: true, message: 'SMTP connection successful' };
    } catch (error) {
      console.error('SMTP connection test failed:', error);
      return { 
        success: false, 
        message: `SMTP connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  async sendTestEmail(to: string): Promise<{ success: boolean; message: string }> {
    if (!this.transporter) {
      return { success: false, message: 'Email transporter not initialized' };
    }

    const mailOptions = {
      from: `"${this.config.from.name}" <${this.config.from.email}>`,
      to,
      subject: 'Test Email from Freight Shark',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #00b4d8; padding: 20px; text-align: center;">
            <img src="${this.getLogoUrl()}" alt="Freight Shark" style="height: 50px; width: auto; margin-bottom: 10px;">
            <h1 style="color: white; margin: 0;">Freight Shark</h1>
          </div>
          <div style="padding: 20px; background: #f5f5f5;">
            <h2 style="color: #333;">Test Email Successful!</h2>
            <p style="color: #666;">This is a test email from your Freight Shark email system.</p>
            <p style="color: #666;">If you received this email, your SMTP configuration is working correctly.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">Configuration Details:</p>
            <ul style="color: #999; font-size: 12px;">
              <li>SMTP Host: ${this.config.host}</li>
              <li>Port: ${this.config.port}</li>
              <li>Secure: ${this.config.secure ? 'Yes (SSL/TLS)' : 'No (STARTTLS)'}</li>
            </ul>
          </div>
        </div>
      `,
      text: 'Test Email from Freight Shark. Your SMTP configuration is working correctly.'
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Test email sent:', info.messageId);
      return { success: true, message: `Test email sent successfully to ${to}` };
    } catch (error) {
      console.error('Failed to send test email:', error);
      return { 
        success: false, 
        message: `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  async sendNotificationEmail(
    to: string, 
    templateId: string, 
    variables: Record<string, string>
  ): Promise<{ success: boolean; message: string }> {
    if (!this.transporter) {
      return { success: false, message: 'Email transporter not initialized' };
    }

    // Get template based on templateId
    const template = this.getEmailTemplate(templateId, variables);
    if (!template) {
      return { success: false, message: 'Email template not found' };
    }

    const mailOptions = {
      from: `"${this.config.from.name}" <${this.config.from.email}>`,
      to,
      subject: template.subject,
      html: template.html,
      text: template.text
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Notification email sent:', info.messageId);
      return { success: true, message: `Email sent successfully to ${to}` };
    } catch (error) {
      console.error('Failed to send notification email:', error);
      return { 
        success: false, 
        message: `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  private getEmailTemplate(templateId: string, variables: Record<string, string>) {
    const templates: Record<string, any> = {
      'quote-requested': {
        subject: `Your Quote Request #${variables.quoteId} has been received`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #00b4d8; padding: 20px; text-align: center;">
              <img src="${this.getLogoUrl()}" alt="Freight Shark" style="height: 50px; width: auto; margin-bottom: 10px;">
              <h1 style="color: white; margin: 0;">Freight Shark</h1>
            </div>
            <div style="padding: 20px; background: #f5f5f5;">
              <h2 style="color: #333;">Quote Request Received</h2>
              <p style="color: #666;">Dear ${variables.customerName},</p>
              <p style="color: #666;">We have received your quote request <strong>#${variables.quoteId}</strong>.</p>
              <p style="color: #666;">Our team will review it and respond within 1 business day.</p>
              <div style="margin: 20px 0; padding: 15px; background: white; border-left: 4px solid #00b4d8;">
                <p style="color: #333; margin: 0;"><strong>What's Next?</strong></p>
                <ul style="color: #666;">
                  <li>Our team will review your request</li>
                  <li>We'll prepare a competitive quote</li>
                  <li>You'll receive an email when your quote is ready</li>
                </ul>
              </div>
              <p style="color: #666;">Thank you for choosing Freight Shark!</p>
            </div>
          </div>
        `,
        text: `Dear ${variables.customerName}, We have received your quote request #${variables.quoteId}. Our team will review it and respond within 1 business day.`
      },
      'quote-ready': {
        subject: `Your Quote #${variables.quoteId} is ready`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #00b4d8; padding: 20px; text-align: center;">
              <img src="${this.getLogoUrl()}" alt="Freight Shark" style="height: 50px; width: auto; margin-bottom: 10px;">
              <h1 style="color: white; margin: 0;">Freight Shark</h1>
            </div>
            <div style="padding: 20px; background: #f5f5f5;">
              <h2 style="color: #333;">Your Quote is Ready!</h2>
              <p style="color: #666;">Dear ${variables.customerName},</p>
              <p style="color: #666;">Your quote <strong>#${variables.quoteId}</strong> is ready for review.</p>
              <div style="margin: 20px 0; padding: 15px; background: white; border-left: 4px solid #00b4d8;">
                <p style="color: #333; font-size: 18px; margin: 0;">Total Amount: <strong>${variables.amount}</strong></p>
              </div>
              <p style="color: #666;">Please log in to your account to view the full details and accept the quote.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/quotes/${variables.quoteId}" 
                   style="display: inline-block; padding: 12px 30px; background: #00b4d8; color: white; text-decoration: none; border-radius: 5px;">
                  View Quote
                </a>
              </div>
            </div>
          </div>
        `,
        text: `Dear ${variables.customerName}, Your quote #${variables.quoteId} is ready. Total amount: ${variables.amount}. Please log in to view details.`
      }
    };

    return templates[templateId] || null;
  }

  updateConfig(newConfig: Partial<EmailConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.initializeTransporter();
  }

  getConfig(): EmailConfig {
    return this.config;
  }
}

export const emailService = new EmailService();