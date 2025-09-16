import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
    const { to, config } = req.body;
    
    if (!to) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    if (!config || !config.host || !config.port || !config.auth?.user || !config.auth?.pass) {
      return res.status(400).json({
        success: false,
        message: 'Complete SMTP configuration is required'
      });
    }

    // Import nodemailer dynamically
    const nodemailer = await import('nodemailer');
    const createTransport = nodemailer.default?.createTransport || nodemailer.createTransport;
    
    if (!createTransport) {
      throw new Error('Failed to load nodemailer');
    }

    // Create transporter
    const transporter = createTransport({
      host: config.host,
      port: parseInt(config.port),
      secure: config.secure,
      auth: {
        user: config.auth.user,
        pass: config.auth.pass
      }
    });

    // Test connection first
    await transporter.verify();

    // Send test email
    const mailOptions = {
      from: `"${config.from?.name || 'Freight Shark'}" <${config.from?.email || config.auth.user}>`,
      to,
      subject: 'Test Email from Freight Shark',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #00b4d8 0%, #0096c7 100%); padding: 20px; text-align: center; color: white;">
            <img src="${process.env.FRONTEND_URL || 'https://freight-shark.vercel.app'}/freight-shark-logo.svg" alt="Freight Shark" width="200" height="60" style="display: block; border: none; margin: 0 auto 10px;" />
            <p style="margin: 5px 0 0 0;">Email Configuration Test</p>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333;">Test Email Successful!</h2>
            <p style="color: #666;">This is a test email to verify your SMTP configuration is working correctly.</p>
            <div style="background: #e8f7fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0; color: #00695c;"><strong>✅ Your email settings are configured properly!</strong></p>
            </div>
            <p style="color: #666; font-size: 14px;">
              Test sent at: ${new Date().toLocaleString()}<br>
              From: ${config.host}:${config.port}
            </p>
          </div>
        </div>
      `,
      text: `Test Email from Freight Shark\n\nYour SMTP configuration is working correctly!\nTest sent at: ${new Date().toLocaleString()}`
    };

    const info = await transporter.sendMail(mailOptions);
    
    res.status(200).json({
      success: true,
      message: `Test email sent successfully to ${to}`,
      messageId: info.messageId
    });
    
  } catch (error) {
    console.error('Test email failed:', error);
    res.status(200).json({
      success: false,
      message: `Test email failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}