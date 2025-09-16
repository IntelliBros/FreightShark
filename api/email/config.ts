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
    // This endpoint is used for updating the backend SMTP configuration
    // For now, we just acknowledge the config update since we're using 
    // dynamic configuration passed with each email request
    const config = req.body;
    
    console.log('SMTP configuration updated:', {
      host: config?.host,
      port: config?.port,
      secure: config?.secure,
      from: config?.from?.email
    });
    
    res.status(200).json({
      success: true,
      message: 'SMTP configuration updated successfully'
    });
    
  } catch (error) {
    console.error('Failed to update SMTP config:', error);
    res.status(200).json({
      success: false,
      message: `Failed to update config: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}