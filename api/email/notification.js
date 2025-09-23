import nodemailer from 'nodemailer';

// Email templates with proper formatting
const emailTemplates = {
  'sample-received': {
    subject: 'Sample Received in Warehouse - {consolidationId}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #00b4d8; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Sample Received in Warehouse</h1>
        </div>

        <div style="padding: 30px; background: #f5f5f5;">
          <p style="font-size: 16px; color: #333;">Dear {customerName},</p>

          <p style="font-size: 16px; color: #333; margin: 20px 0;">
            We have received a sample in your consolidation request <strong>{consolidationId}</strong>
          </p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #00b4d8; margin-top: 0;">Sample Details:</h3>
            <p style="margin: 10px 0;"><strong>Product:</strong> {productName}</p>
            <p style="margin: 10px 0;"><strong>Samples Received:</strong> {receivedCount}/{expectedCount}</p>
            <p style="margin: 10px 0;"><strong>Received Date:</strong> {receivedDate}</p>
          </div>

          <p style="font-size: 16px; color: #333; margin: 20px 0;">
            Once you are ready, you can view your warehouse samples and submit a request to ship the samples to the address of your choice.
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://freight-shark.vercel.app/samples"
               style="background: #00b4d8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Submit Samples for Shipment
            </a>
          </div>

          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            Best regards,<br>
            The Freight Shark Team
          </p>
        </div>

        <div style="background: #333; padding: 15px; text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            © 2025 Freight Shark. All rights reserved.
          </p>
        </div>
      </div>
    `
  },
  'shipment-update': {
    subject: 'Shipment {shipmentId} Status Update',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #00b4d8; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Shipment Status Update</h1>
        </div>

        <div style="padding: 30px; background: #f5f5f5;">
          <p style="font-size: 16px; color: #333;">Dear {customerName},</p>

          <p style="font-size: 16px; color: #333; margin: 20px 0;">
            Your shipment <strong>{shipmentId}</strong> status has been updated.
          </p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>Current Status:</strong> {status}</p>
            <p style="margin: 10px 0;"><strong>Tracking Information:</strong><br>{trackingInfo}</p>
            {estimatedDelivery}
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://freight-shark.vercel.app/shipments/{shipmentId}"
               style="background: #00b4d8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Track Your Shipment
            </a>
          </div>

          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            Best regards,<br>
            The Freight Shark Team
          </p>
        </div>

        <div style="background: #333; padding: 15px; text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            © 2025 Freight Shark. All rights reserved.
          </p>
        </div>
      </div>
    `
  },
  'quote-ready': {
    subject: 'Your Quote #{quoteId} is Ready',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #00b4d8; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Your Quote is Ready!</h1>
        </div>

        <div style="padding: 30px; background: #f5f5f5;">
          <p style="font-size: 16px; color: #333;">Dear {customerName},</p>

          <p style="font-size: 16px; color: #333; margin: 20px 0;">
            Your quote <strong>#{quoteId}</strong> is ready for review.
          </p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>Total Amount:</strong> {amount}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://freight-shark.vercel.app/quotes/{quoteId}"
               style="background: #00b4d8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              View Quote Details
            </a>
          </div>

          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            Best regards,<br>
            The Freight Shark Team
          </p>
        </div>

        <div style="background: #333; padding: 15px; text-align: center;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            © 2025 Freight Shark. All rights reserved.
          </p>
        </div>
      </div>
    `
  }
};

// Replace variables in template
function replaceVariables(template, variables) {
  let result = template;
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`{${key}}`, 'g');
    result = result.replace(regex, variables[key] || '');
  });

  // Handle conditional estimatedDelivery
  if (variables.estimatedDelivery) {
    result = result.replace('{estimatedDelivery}',
      `<p style="margin: 10px 0;"><strong>Estimated Delivery:</strong> ${variables.estimatedDelivery}</p>`);
  } else {
    result = result.replace('{estimatedDelivery}', '');
  }

  return result;
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  console.log('[info] Email notification endpoint called with method:', req.method);

  const { to, templateId, variables, config } = req.body;

  // Validate required fields
  if (!to || !templateId || !variables) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: to, templateId, or variables'
    });
  }

  // Check if template exists
  const template = emailTemplates[templateId];
  if (!template) {
    console.log('[info] Creating template for:', templateId);

    // Fallback for unknown templates
    return res.status(400).json({
      success: false,
      message: 'Email template not found'
    });
  }

  // If no SMTP config provided, simulate sending
  if (!config || !config.host) {
    console.log('[info] No SMTP config, simulating email to:', to);
    return res.status(200).json({
      success: true,
      message: `Email simulated to ${to} (SMTP not configured)`,
      simulated: true
    });
  }

  try {
    // Create transporter with provided config
    const transporter = nodemailer.createTransporter({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.auth.user,
        pass: config.auth.pass
      }
    });

    // Prepare email with template
    const subject = replaceVariables(template.subject, variables);
    const html = replaceVariables(template.html, variables);

    // Send email
    const info = await transporter.sendMail({
      from: `"${config.from.name}" <${config.from.email}>`,
      to: to,
      subject: subject,
      html: html
    });

    console.log('[info] Email sent successfully:', info.messageId);

    return res.status(200).json({
      success: true,
      message: `Email sent successfully to ${to}`,
      messageId: info.messageId
    });

  } catch (error) {
    console.error('[error] Failed to send email:', error);
    return res.status(500).json({
      success: false,
      message: `Failed to send email: ${error.message}`
    });
  }
}