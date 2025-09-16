import { VercelRequest, VercelResponse } from '@vercel/node';

function createEmailTemplate(templateId: string, variables: Record<string, string>) {
  // Use hosted SVG logo for better email delivery
  const logoUrl = `${process.env.FRONTEND_URL || 'https://freight-shark.vercel.app'}/freight-shark-logo.svg`;

  const header = `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #1f2c39;">
      <tr>
        <td style="padding: 30px; text-align: center; background-color: #1f2c39;">
          <img src="${logoUrl}" alt="Freight Shark" width="200" height="60" style="display: block; border: none; margin: 0 auto;" />
        </td>
      </tr>
    </table>
  `;

  const footer = `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #f8fafc; border-top: 1px solid #e2e8f0; margin-top: 40px;">
      <tr>
        <td style="padding: 30px; text-align: center;">
          <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto; max-width: 400px;">
            <tr>
              <td style="text-align: center;">
                <img src="${logoUrl}" alt="Freight Shark Logo" width="30" height="30" style="display: inline-block; border: none; margin-bottom: 10px; opacity: 0.6;" />
                <p style="color: #64748b !important; font-size: 14px; margin: 0 0 15px 0; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                  <strong style="color: #1e293b !important;">Freight Shark</strong><br>
                  Your trusted partner in global logistics
                </p>
                <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; margin-top: 15px;">
                  <p style="color: #94a3b8 !important; font-size: 12px; margin: 5px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                    © ${new Date().getFullYear()} Freight Shark. All rights reserved.
                  </p>
                  <p style="color: #cbd5e1 !important; font-size: 11px; margin: 5px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
                    This email was sent from an automated system. Please do not reply.
                  </p>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  const wrapTemplate = (content: string) => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Freight Shark</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: Arial, sans-serif;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f1f5f9;">
        <tr>
          <td align="center" style="padding: 20px 10px;">
            <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; max-width: 600px;">
              <tr>
                <td>
                  ${header}
                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td style="padding: 40px 30px; color: #333333; font-family: Arial, sans-serif;">
                        ${content}
                      </td>
                    </tr>
                  </table>
                  ${footer}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const templates: Record<string, any> = {
    'welcome': {
      subject: `Welcome to Freight Shark!`,
      html: wrapTemplate(`
        <!-- Welcome Header -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td align="center" style="padding: 20px 0;">
              <h1 style="color: #1e293b; margin: 0; font-size: 32px; font-family: Arial, sans-serif;">
                Welcome to Freight Shark! 🦈
              </h1>
            </td>
          </tr>
        </table>

        <!-- Personal Greeting -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="padding: 20px; background-color: #f8f9fa; border-left: 4px solid #00b4d8;">
              <p style="color: #333333; font-size: 16px; margin: 0 0 10px 0; font-family: Arial, sans-serif;">
                <strong>Dear ${variables.customerName},</strong>
              </p>
              <p style="color: #555555; font-size: 15px; margin: 0; line-height: 1.6; font-family: Arial, sans-serif;">
                Thank you for creating an account with Freight Shark! We're excited to have you on board and look forward to helping you streamline your shipping operations.
              </p>
            </td>
          </tr>
        </table>

        <!-- What You Can Do Section -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 30px;">
          <tr>
            <td style="padding: 0 20px;">
              <h2 style="color: #1e293b; font-size: 22px; margin: 0 0 20px 0; font-family: Arial, sans-serif;">
                Here's What You Can Do:
              </h2>
            </td>
          </tr>
        </table>

        <!-- Feature 1 -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 0 0 15px 0;">
          <tr>
            <td style="padding: 15px 20px; background-color: #ffffff; border: 1px solid #dddddd;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="width: 40px; vertical-align: top; padding-right: 15px; font-size: 24px;">
                    📦
                  </td>
                  <td style="vertical-align: top;">
                    <strong style="color: #1e293b; font-size: 16px; font-family: Arial, sans-serif;">Request Quotes</strong>
                    <p style="color: #666666; margin: 5px 0 0 0; font-size: 14px; font-family: Arial, sans-serif;">
                      Get competitive shipping rates within 24 hours
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Feature 2 -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 0 0 15px 0;">
          <tr>
            <td style="padding: 15px 20px; background-color: #ffffff; border: 1px solid #dddddd;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="width: 40px; vertical-align: top; padding-right: 15px; font-size: 24px;">
                    📍
                  </td>
                  <td style="vertical-align: top;">
                    <strong style="color: #1e293b; font-size: 16px; font-family: Arial, sans-serif;">Track Shipments</strong>
                    <p style="color: #666666; margin: 5px 0 0 0; font-size: 14px; font-family: Arial, sans-serif;">
                      Monitor your cargo in real-time from pickup to delivery
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Feature 3 -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 0 0 15px 0;">
          <tr>
            <td style="padding: 15px 20px; background-color: #ffffff; border: 1px solid #dddddd;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="width: 40px; vertical-align: top; padding-right: 15px; font-size: 24px;">
                    💬
                  </td>
                  <td style="vertical-align: top;">
                    <strong style="color: #1e293b; font-size: 16px; font-family: Arial, sans-serif;">Direct Support</strong>
                    <p style="color: #666666; margin: 5px 0 0 0; font-size: 14px; font-family: Arial, sans-serif;">
                      Chat with our logistics experts whenever you need help
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- CTA Button -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 30px 0;">
          <tr>
            <td align="center">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color: #00b4d8; padding: 12px 30px; text-align: center;">
                    <a href="${process.env.FRONTEND_URL || 'https://freight-shark.vercel.app'}/dashboard" 
                       style="color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; font-family: Arial, sans-serif;">
                      Go to Your Dashboard
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

      `),
      text: `Welcome to Freight Shark! Dear ${variables.customerName}, we're thrilled to have you join our family! Your account has been successfully created and you're ready to start shipping. Visit your dashboard to get started with quotes, tracking, and more. Need help? Contact us at support@freightshark.com`
    },
    'quote-requested': {
      subject: `Quote Request #${variables.quoteId} Received ✅`,
      html: wrapTemplate(`
        <!-- Header -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td align="center" style="padding: 20px 0;">
              <h1 style="color: #16a34a; margin: 0 0 10px 0; font-size: 28px; font-family: Arial, sans-serif;">
                ✅ Quote Request Received!
              </h1>
              <p style="color: #666666; font-size: 16px; margin: 0; font-family: Arial, sans-serif;">
                Quote ID: <strong>#${variables.quoteId}</strong>
              </p>
            </td>
          </tr>
        </table>

        <!-- Greeting -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="padding: 20px; background-color: #f8f9fa; border-left: 4px solid #00b4d8;">
              <p style="color: #333333; font-size: 16px; margin: 0 0 10px 0; font-family: Arial, sans-serif;">
                <strong>Dear ${variables.customerName},</strong>
              </p>
              <p style="color: #555555; font-size: 15px; margin: 0; line-height: 1.6; font-family: Arial, sans-serif;">
                Thank you for submitting your quote request. Our logistics team has received your inquiry and is already working on preparing the best shipping rates for you.
              </p>
            </td>
          </tr>
        </table>

        <!-- What Happens Next -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 30px;">
          <tr>
            <td style="padding: 0 20px;">
              <h2 style="color: #1e293b; font-size: 20px; margin: 0 0 20px 0; font-family: Arial, sans-serif;">
                What Happens Next:
              </h2>
            </td>
          </tr>
        </table>

        <!-- Step 1 -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 0 0 15px 0;">
          <tr>
            <td style="padding: 15px 20px; background-color: #ffffff; border: 1px solid #dddddd;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="width: 30px; vertical-align: top; padding-right: 15px;">
                    <strong style="color: #00b4d8; font-size: 18px; font-family: Arial, sans-serif;">1.</strong>
                  </td>
                  <td style="vertical-align: top;">
                    <strong style="color: #1e293b; font-size: 15px; font-family: Arial, sans-serif;">Expert Review</strong>
                    <p style="color: #666666; margin: 5px 0 0 0; font-size: 14px; font-family: Arial, sans-serif;">
                      Our team will analyze your shipping requirements
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Step 2 -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 0 0 15px 0;">
          <tr>
            <td style="padding: 15px 20px; background-color: #ffffff; border: 1px solid #dddddd;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="width: 30px; vertical-align: top; padding-right: 15px;">
                    <strong style="color: #00b4d8; font-size: 18px; font-family: Arial, sans-serif;">2.</strong>
                  </td>
                  <td style="vertical-align: top;">
                    <strong style="color: #1e293b; font-size: 15px; font-family: Arial, sans-serif;">Rate Calculation</strong>
                    <p style="color: #666666; margin: 5px 0 0 0; font-size: 14px; font-family: Arial, sans-serif;">
                      We'll find the best shipping options and rates
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Step 3 -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 0 0 15px 0;">
          <tr>
            <td style="padding: 15px 20px; background-color: #ffffff; border: 1px solid #dddddd;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="width: 30px; vertical-align: top; padding-right: 15px;">
                    <strong style="color: #00b4d8; font-size: 18px; font-family: Arial, sans-serif;">3.</strong>
                  </td>
                  <td style="vertical-align: top;">
                    <strong style="color: #1e293b; font-size: 15px; font-family: Arial, sans-serif;">Quote Delivery</strong>
                    <p style="color: #666666; margin: 5px 0 0 0; font-size: 14px; font-family: Arial, sans-serif;">
                      You'll receive your detailed quote within 24 hours
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Promise Box -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 30px 0;">
          <tr>
            <td style="padding: 20px; background-color: #dcfce7; border: 2px solid #16a34a;">
              <p style="color: #166534; font-size: 16px; margin: 0; text-align: center; font-weight: bold; font-family: Arial, sans-serif;">
                ⚡ Our Promise: Quote within 24 hours or your first shipment is expedited FREE!
              </p>
            </td>
          </tr>
        </table>

        <!-- CTA Button -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 30px 0;">
          <tr>
            <td align="center">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color: #00b4d8; padding: 12px 30px; text-align: center;">
                    <a href="${process.env.FRONTEND_URL || 'https://freight-shark.vercel.app'}/quotes" 
                       style="color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; font-family: Arial, sans-serif;">
                      Track Your Quote
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Support -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="padding: 20px; background-color: #f8f9fa;">
              <h3 style="color: #1e293b; font-size: 18px; margin: 0 0 15px 0; font-family: Arial, sans-serif;">
                Questions?
              </h3>
              <p style="color: #666666; font-size: 14px; margin: 5px 0; font-family: Arial, sans-serif;">
                • Email: quotes@freightshark.com<br>
                • Live Chat: Available in your dashboard<br>
                • Phone: 1-800-FREIGHT
              </p>
            </td>
          </tr>
        </table>

      `),
      text: `Quote Request #${variables.quoteId} Received! Dear ${variables.customerName}, we have successfully received your quote request and our experts are working on it. You'll receive your detailed quote within 1 business day. Track your quote status in your dashboard or contact us at quotes@freightshark.com`
    }
  };

  return templates[templateId] || null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('Email notification endpoint called with method:', req.method);
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, templateId, variables, config } = req.body;
    
    if (!to || !templateId) {
      return res.status(400).json({
        success: false,
        message: 'Email address and template ID are required'
      });
    }

    // Create template inline
    console.log('Creating template for:', templateId);
    const template = createEmailTemplate(templateId, variables || {});
    if (!template) {
      return res.status(400).json({
        success: false,
        message: 'Email template not found'
      });
    }

    // Check if SMTP config is provided
    if (!config || !config.host || !config.port || !config.auth?.user || !config.auth?.pass) {
      // Fallback to simulation
      console.log('📨 Email Notification (Simulated - No SMTP Config):', {
        to,
        template: templateId,
        subject: template.subject,
        variables,
        timestamp: new Date().toISOString()
      });
      
      return res.status(200).json({
        success: true,
        message: `Email simulated to ${to}. Configure SMTP to send real emails.`
      });
    }

    // Import nodemailer dynamically to avoid issues
    const nodemailer = await import('nodemailer');
    const createTransport = nodemailer.default?.createTransport || nodemailer.createTransport;
    
    if (!createTransport) {
      throw new Error('Failed to load nodemailer createTransport');
    }

    // Create transporter with the provided config
    const transporter = createTransport({
      host: config.host,
      port: parseInt(config.port),
      secure: config.secure,
      auth: {
        user: config.auth.user,
        pass: config.auth.pass
      }
    });

    // Verify SMTP connection
    try {
      await transporter.verify();
      console.log('SMTP connection verified successfully');
    } catch (verifyError) {
      console.error('SMTP verification failed:', verifyError);
      // Continue with simulation if SMTP fails
      console.log('📨 Email Notification (Simulated - SMTP Failed):', {
        to,
        template: templateId,
        subject: template.subject,
        variables,
        error: verifyError instanceof Error ? verifyError.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
      
      return res.status(200).json({
        success: true,
        message: `Email simulated to ${to}. SMTP verification failed - check configuration.`
      });
    }

    // Send real email
    const mailOptions = {
      from: `"${config.from?.name || 'Freight Shark'}" <${config.from?.email || config.auth.user}>`,
      to,
      subject: template.subject,
      html: template.html,
      text: template.text
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Real email sent successfully:', info.messageId);
    
    res.status(200).json({
      success: true,
      message: `Email sent successfully to ${to}`,
      messageId: info.messageId
    });
    
  } catch (error) {
    console.error('Failed to send notification email:', error);
    
    // Always return success with simulation fallback to avoid breaking the flow
    res.status(200).json({
      success: true,
      message: `Email simulated to ${req.body?.to || 'recipient'}. Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}