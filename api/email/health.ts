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

  // Test if nodemailer can be loaded
  let nodemailerStatus = 'not loaded';
  let moduleInfo = {};
  try {
    const nodemailerModule = await import('nodemailer');
    const nodemailer = nodemailerModule.default || nodemailerModule;
    
    moduleInfo = {
      hasDefault: !!nodemailerModule.default,
      hasCreateTransport: typeof nodemailer.createTransport === 'function',
      keys: Object.keys(nodemailer || {}).slice(0, 10),
      type: typeof nodemailer
    };
    
    nodemailerStatus = typeof nodemailer.createTransport === 'function' 
      ? 'loaded successfully' 
      : `loaded but createTransport not found - ${JSON.stringify(moduleInfo)}`;
  } catch (error) {
    nodemailerStatus = `error: ${error instanceof Error ? error.message : 'unknown'}`;
  }

  res.status(200).json({
    status: 'ok',
    nodemailer: nodemailerStatus,
    moduleInfo,
    node_version: process.version,
    timestamp: new Date().toISOString()
  });
}