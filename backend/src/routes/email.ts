import { Router } from 'express';
import { emailService } from '../services/emailService';

const router = Router();

// Get current email configuration (without sensitive data)
router.get('/config', (req, res) => {
  const config = emailService.getConfig();
  res.json({
    host: config.host,
    port: config.port,
    secure: config.secure,
    from: config.from,
    configured: !!(config.auth.user && config.auth.pass)
  });
});

// Update email configuration
router.post('/config', async (req, res) => {
  try {
    const { host, port, secure, auth, from } = req.body;
    
    if (!host || !port || !auth?.user || !auth?.pass) {
      return res.status(400).json({
        success: false,
        message: 'Missing required configuration fields'
      });
    }

    emailService.updateConfig({
      host,
      port,
      secure,
      auth,
      from
    });

    res.json({
      success: true,
      message: 'Email configuration updated successfully'
    });
  } catch (error) {
    console.error('Failed to update email config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update configuration'
    });
  }
});

// Test SMTP connection
router.post('/test-connection', async (req, res) => {
  try {
    // If config is provided in request, update it first
    const { host, port, secure, auth, from } = req.body;
    
    if (host && port && auth?.user && auth?.pass) {
      emailService.updateConfig({
        host,
        port,
        secure,
        auth,
        from
      });
    }
    
    const result = await emailService.testConnection();
    res.json(result);
  } catch (error) {
    console.error('Connection test error:', error);
    res.status(500).json({
      success: false,
      message: 'Connection test failed'
    });
  }
});

// Send test email
router.post('/test', async (req, res) => {
  try {
    const { to } = req.body;
    
    if (!to) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    const result = await emailService.sendTestEmail(to);
    res.json(result);
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email'
    });
  }
});

// Send notification email
router.post('/notification', async (req, res) => {
  try {
    const { to, templateId, variables } = req.body;
    
    if (!to || !templateId) {
      return res.status(400).json({
        success: false,
        message: 'Email address and template ID are required'
      });
    }

    const result = await emailService.sendNotificationEmail(to, templateId, variables || {});
    res.json(result);
  } catch (error) {
    console.error('Notification email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification email'
    });
  }
});

export default router;