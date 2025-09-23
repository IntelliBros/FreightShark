export interface SMTPConfig {
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

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
}

class EmailService {
  private readonly SMTP_CONFIG_KEY = 'freight_shark_smtp_config';
  private readonly EMAIL_TEMPLATES_KEY = 'freight_shark_email_templates';
  private readonly BACKEND_URL = this.getBackendUrl();

  private getBackendUrl(): string {
    // In production, use relative URL for Vercel API routes
    // In development, use localhost backend
    if (window.location.hostname === 'localhost') {
      return import.meta.env.VITE_EMAIL_API_URL || 'http://localhost:3001/api/email';
    }
    return '/api/email'; // Vercel API routes
  }

  getSmtpConfig(): SMTPConfig | null {
    const config = localStorage.getItem(this.SMTP_CONFIG_KEY);
    return config ? JSON.parse(config) : null;
  }

  saveSmtpConfig(config: SMTPConfig): void {
    localStorage.setItem(this.SMTP_CONFIG_KEY, JSON.stringify(config));
  }

  async testSmtpConnection(config: SMTPConfig): Promise<{ success: boolean; message: string }> {
    try {
      // First, try to connect to backend API
      const response = await fetch(`${this.BACKEND_URL}/test-connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      if (response.ok) {
        const result = await response.json();
        return result;
      }
    } catch (error) {
      console.log('Backend not available, falling back to simulation');
    }

    // Fallback to simulation if backend is not available
    return new Promise((resolve) => {
      setTimeout(() => {
        if (config.host && config.port && config.auth.user && config.auth.pass) {
          console.log('SMTP Test Configuration (Simulated):', {
            host: config.host,
            port: config.port,
            secure: config.secure,
            user: config.auth.user,
            from: config.from.email
          });
          resolve({ 
            success: true, 
            message: 'Configuration validated (Backend not connected - emails will be simulated)' 
          });
        } else {
          resolve({ 
            success: false, 
            message: 'SMTP connection test failed. Please check your configuration.' 
          });
        }
      }, 1500);
    });
  }

  async sendTestEmail(to: string): Promise<{ success: boolean; message: string }> {
    const config = this.getSmtpConfig();
    
    if (!config) {
      return Promise.resolve({ 
        success: false, 
        message: 'SMTP configuration not found. Please configure email settings first.' 
      });
    }

    try {
      // First update backend with current config
      await fetch(`${this.BACKEND_URL}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      // Then send test email with config
      const response = await fetch(`${this.BACKEND_URL}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, config })
      });
      
      if (response.ok) {
        const result = await response.json();
        return result;
      }
    } catch (error) {
      console.log('Backend not available, falling back to simulation');
    }

    // Fallback to simulation
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('📧 Test Email (Simulated):', {
          to,
          from: `${config.from.name} <${config.from.email}>`,
          subject: 'Test Email from Freight Shark',
          body: 'This is a test email from your Freight Shark system.',
          smtp: {
            host: config.host,
            port: config.port,
            secure: config.secure
          }
        });
        
        resolve({ 
          success: true, 
          message: `Email simulated to ${to}. Backend not connected - start the backend server to send real emails.` 
        });
      }, 2000);
    });
  }

  getEmailTemplates(): EmailTemplate[] {
    const templates = localStorage.getItem(this.EMAIL_TEMPLATES_KEY);
    if (templates) {
      return JSON.parse(templates);
    }

    const defaultTemplates: EmailTemplate[] = [
      {
        id: 'quote-requested',
        name: 'Quote Requested',
        subject: 'Your Quote Request #{quoteId} has been received',
        body: 'Dear {customerName},\n\nWe have received your quote request #{quoteId}. Our team will review it and respond within 1 business day.\n\nBest regards,\nFreight Shark Team',
        variables: ['quoteId', 'customerName']
      },
      {
        id: 'quote-ready',
        name: 'Quote Ready',
        subject: 'Your Quote #{quoteId} is ready',
        body: 'Dear {customerName},\n\nYour quote #{quoteId} is ready for review. Total amount: {amount}.\n\nPlease log in to your account to view the details.\n\nBest regards,\nFreight Shark Team',
        variables: ['quoteId', 'customerName', 'amount']
      },
      {
        id: 'shipment-update',
        name: 'Shipment Status Update',
        subject: 'Shipment {shipmentId} Status Update',
        body: 'Dear {customerName},\n\nYour shipment {shipmentId} status has been updated to: {status}.\n\nTracking Details:\n{trackingInfo}\n\nBest regards,\nFreight Shark Team',
        variables: ['shipmentId', 'customerName', 'status', 'trackingInfo']
      },
      {
        id: 'invoice-generated',
        name: 'Invoice Generated',
        subject: 'Invoice for Shipment {shipmentId}',
        body: 'Dear {customerName},\n\nAn invoice has been generated for your shipment {shipmentId}.\n\nAmount Due: {amount}\nDue Date: {dueDate}\n\nPlease log in to your account to view and pay the invoice.\n\nBest regards,\nFreight Shark Team',
        variables: ['shipmentId', 'customerName', 'amount', 'dueDate']
      },
      {
        id: 'sample-received',
        name: 'Sample Received',
        subject: 'Sample {sampleId} has been received at warehouse',
        body: 'Dear {customerName},\n\nGreat news! Your sample {sampleId} has been received at our warehouse.\n\nSample Details:\nProduct: {productName}\nConsolidation ID: {consolidationId}\nReceived Date: {receivedDate}\n\nYou can now request shipment of this sample through your dashboard.\n\nBest regards,\nFreight Shark Team',
        variables: ['sampleId', 'customerName', 'productName', 'consolidationId', 'receivedDate']
      },
      {
        id: 'sample-payment-link',
        name: 'Sample Payment Link Available',
        subject: 'Payment required for Sample Shipment {requestId}',
        body: 'Dear {customerName},\n\nYour sample shipment request {requestId} is ready for payment.\n\nShipment Details:\nSamples: {sampleCount}\nDelivery Address: {deliveryAddress}\n\nPlease click the link below to complete your payment:\n{paymentLink}\n\nBest regards,\nFreight Shark Team',
        variables: ['requestId', 'customerName', 'sampleCount', 'deliveryAddress', 'paymentLink']
      },
      {
        id: 'sample-shipped',
        name: 'Sample Shipped',
        subject: 'Your samples have been shipped - Tracking #{trackingNumber}',
        body: 'Dear {customerName},\n\nYour sample shipment request {requestId} has been shipped!\n\nTracking Information:\nTracking Number: {trackingNumber}\nCarrier: {carrier}\n\nYou can track your package at: https://t.17track.net/en#nums={trackingNumber}\n\nEstimated delivery: 3-5 business days\n\nBest regards,\nFreight Shark Team',
        variables: ['requestId', 'customerName', 'trackingNumber', 'carrier']
      }
    ];

    this.saveEmailTemplates(defaultTemplates);
    return defaultTemplates;
  }

  saveEmailTemplates(templates: EmailTemplate[]): void {
    localStorage.setItem(this.EMAIL_TEMPLATES_KEY, JSON.stringify(templates));
  }

  async sendNotification(
    to: string,
    templateId: string,
    variables: Record<string, string>
  ): Promise<{ success: boolean; message: string }> {
    const config = this.getSmtpConfig();
    
    if (!config) {
      console.warn('⚠️ SMTP NOT CONFIGURED - Email will be simulated only');
      console.log('To send actual emails, configure SMTP in Admin > Email Settings');
      // Fallback to simulation when no config
      return this.simulateEmail(to, templateId, variables);
    }

    try {
      // First update backend with current config
      await fetch(`${this.BACKEND_URL}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      // Then send notification email with config
      const response = await fetch(`${this.BACKEND_URL}/notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, templateId, variables, config })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ EMAIL SENT SUCCESSFULLY via SMTP:', {
          to,
          template: templateId,
          timestamp: new Date().toISOString()
        });
        return result;
      } else {
        // Log the error response for debugging
        const errorText = await response.text();
        console.error(`❌ Email API error (${response.status}):`, errorText);
        throw new Error(`Email API error: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.log('Backend not available, falling back to simulation');
    }

    // Fallback to simulation
    const templates = this.getEmailTemplates();
    const template = templates.find(t => t.id === templateId);
    
    if (!template) {
      return Promise.resolve({ 
        success: false, 
        message: 'Email template not found' 
      });
    }

    let subject = template.subject;
    let body = template.body;

    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{${key}}`, 'g');
      subject = subject.replace(regex, variables[key]);
      body = body.replace(regex, variables[key]);
    });

    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('📨 Email Notification (Simulated):', { 
          to, 
          subject, 
          body,
          template: templateId,
          variables,
          from: `${config.from.name} <${config.from.email}>`
        });
        
        // Store simulated email in localStorage for demo purposes
        const simulatedEmails = JSON.parse(localStorage.getItem('freight_shark_simulated_emails') || '[]');
        simulatedEmails.push({
          timestamp: new Date().toISOString(),
          to,
          subject,
          body,
          template: templateId,
          from: config.from.email
        });
        // Keep only last 50 emails
        if (simulatedEmails.length > 50) {
          simulatedEmails.shift();
        }
        localStorage.setItem('freight_shark_simulated_emails', JSON.stringify(simulatedEmails));
        
        resolve({ 
          success: true, 
          message: `Email notification simulated to ${to}` 
        });
      }, 1000);
    });
  }

  private async simulateEmail(
    to: string,
    templateId: string,
    variables: Record<string, string>
  ): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.warn('📨 EMAIL SIMULATED (NOT ACTUALLY SENT):');
        console.log({
          to,
          template: templateId,
          variables,
          timestamp: new Date().toISOString(),
          note: '⚠️ Configure SMTP in Admin > Email Settings to send actual emails'
        });
        
        // Store simulated email in localStorage for demo purposes
        const simulatedEmails = JSON.parse(localStorage.getItem('freight_shark_simulated_emails') || '[]');
        simulatedEmails.push({
          timestamp: new Date().toISOString(),
          to,
          template: templateId,
          variables
        });
        // Keep only last 50 emails
        if (simulatedEmails.length > 50) {
          simulatedEmails.shift();
        }
        localStorage.setItem('freight_shark_simulated_emails', JSON.stringify(simulatedEmails));
        
        resolve({
          success: true,
          message: `Email simulated to ${to}. Configure SMTP in Admin Settings to send real emails.`
        });
      }, 500);
    });
  }
}

export const emailService = new EmailService();