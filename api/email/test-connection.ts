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
    const config = req.body;
    
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

    // Test connection
    await transporter.verify();
    
    res.status(200).json({
      success: true,
      message: 'SMTP connection test successful'
    });
    
  } catch (error) {
    console.error('SMTP connection test failed:', error);
    res.status(200).json({
      success: false,
      message: `SMTP connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}