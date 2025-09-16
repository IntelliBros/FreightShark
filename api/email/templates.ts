export function getEmailTemplate(templateId: string, variables: Record<string, string>) {
  const logoSvg = `
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" 
            stroke="#00b4d8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" 
            stroke="#00b4d8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;

  const header = `
    <div style="background: linear-gradient(135deg, #00b4d8 0%, #0096c7 100%); padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
      <div style="display: inline-block; vertical-align: middle;">
        ${logoSvg}
      </div>
      <h1 style="color: white; margin: 0; display: inline-block; vertical-align: middle; margin-left: 15px; font-size: 28px;">Freight Shark</h1>
    </div>
  `;

  const footer = `
    <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; text-align: center; border-radius: 0 0 8px 8px;">
      <p style="color: #666; font-size: 14px; margin: 10px 0;">
        © ${new Date().getFullYear()} Freight Shark. All rights reserved.
      </p>
      <p style="color: #999; font-size: 12px; margin: 10px 0;">
        This is an automated message. Please do not reply to this email.
      </p>
    </div>
  `;

  const wrapTemplate = (content: string) => `
    <div style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
      ${header}
      <div style="padding: 30px 20px;">
        ${content}
      </div>
      ${footer}
    </div>
  `;

  const templates: Record<string, any> = {
    'welcome': {
      subject: `Welcome to Freight Shark! 🦈`,
      html: wrapTemplate(`
        <h2 style="color: #333; margin-top: 0;">Welcome Aboard! 🎉</h2>
        <p style="color: #666; font-size: 16px;">Dear ${variables.customerName},</p>
        <p style="color: #666; font-size: 16px;">We're thrilled to have you join the Freight Shark family! Your account has been successfully created and you're all set to revolutionize your shipping experience.</p>
        
        <div style="margin: 25px 0; padding: 25px; background: linear-gradient(135deg, #f0fafd 0%, #e8f7fa 100%); border-radius: 12px;">
          <h3 style="color: #00b4d8; margin: 0 0 20px 0; font-size: 20px;">🚀 What You Can Do Now:</h3>
          <div style="display: flex; flex-direction: column; gap: 15px;">
            <div style="display: flex; align-items: start;">
              <span style="color: #00b4d8; font-size: 20px; margin-right: 15px;">📦</span>
              <div>
                <strong style="color: #333;">Request Quotes Instantly</strong>
                <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Get competitive rates for your shipments in just 1 business day</p>
              </div>
            </div>
            <div style="display: flex; align-items: start;">
              <span style="color: #00b4d8; font-size: 20px; margin-right: 15px;">📍</span>
              <div>
                <strong style="color: #333;">Track Shipments in Real-Time</strong>
                <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Monitor your cargo from pickup to delivery with live updates</p>
              </div>
            </div>
            <div style="display: flex; align-items: start;">
              <span style="color: #00b4d8; font-size: 20px; margin-right: 15px;">📊</span>
              <div>
                <strong style="color: #333;">Manage Documents</strong>
                <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Access all your shipping documents in one secure place</p>
              </div>
            </div>
            <div style="display: flex; align-items: start;">
              <span style="color: #00b4d8; font-size: 20px; margin-right: 15px;">💬</span>
              <div>
                <strong style="color: #333;">Direct Communication</strong>
                <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Chat directly with our logistics experts for personalized support</p>
              </div>
            </div>
          </div>
        </div>
        
        <div style="margin: 25px 0; padding: 20px; background: #fff; border: 2px solid #00b4d8; border-radius: 8px;">
          <h4 style="color: #333; margin: 0 0 10px 0;">🎁 Special Welcome Offer</h4>
          <p style="color: #666; font-size: 15px; margin: 0;">As a welcome gift, enjoy <strong style="color: #00b4d8;">priority processing</strong> on your first quote request!</p>
        </div>
        
        <div style="text-align: center; margin: 35px 0;">
          <a href="${process.env.FRONTEND_URL || 'https://freight-shark.vercel.app'}/dashboard" 
             style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #00b4d8 0%, #0096c7 100%); color: white; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(0,180,216,0.3);">
            Go to Your Dashboard
          </a>
        </div>
        
        <div style="margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 8px;">
          <h4 style="color: #333; margin: 0 0 15px 0;">Need Help Getting Started?</h4>
          <p style="color: #666; font-size: 14px; margin: 10px 0;">Our support team is here to help you every step of the way:</p>
          <ul style="color: #666; font-size: 14px; margin: 10px 0; padding-left: 20px;">
            <li style="margin: 5px 0;">📧 Email: support@freightshark.com</li>
            <li style="margin: 5px 0;">💬 Live chat available in your dashboard</li>
            <li style="margin: 5px 0;">📱 24/7 Customer Support</li>
          </ul>
        </div>
        
        <p style="color: #666; font-size: 16px; text-align: center; margin-top: 30px;">
          <em>Thank you for choosing Freight Shark - Your trusted partner in global logistics!</em>
        </p>
      `),
      text: `Dear ${variables.customerName}, Welcome to Freight Shark! Your account has been successfully created. You can now request quotes, track shipments, and manage all your logistics needs from your dashboard. Visit ${process.env.FRONTEND_URL || 'https://freight-shark.vercel.app'} to get started.`
    },

    'quote-requested': {
      subject: `Quote Request #${variables.quoteId} Received`,
      html: wrapTemplate(`
        <h2 style="color: #333; margin-top: 0;">Quote Request Received ✅</h2>
        <p style="color: #666; font-size: 16px;">Dear ${variables.customerName},</p>
        <p style="color: #666; font-size: 16px;">We have successfully received your quote request <strong style="color: #00b4d8;">#${variables.quoteId}</strong>.</p>
        
        <div style="margin: 25px 0; padding: 20px; background: #f0fafd; border-left: 4px solid #00b4d8; border-radius: 4px;">
          <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">What Happens Next?</h3>
          <ul style="color: #666; margin: 10px 0; padding-left: 20px; font-size: 15px;">
            <li style="margin: 8px 0;">Our logistics experts will review your requirements</li>
            <li style="margin: 8px 0;">We'll calculate the most competitive rates</li>
            <li style="margin: 8px 0;">You'll receive a detailed quote within <strong>1 business day</strong></li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'https://freight-shark.vercel.app'}/quotes" 
             style="display: inline-block; padding: 14px 35px; background: linear-gradient(135deg, #00b4d8 0%, #0096c7 100%); color: white; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px;">
            View Quote Status
          </a>
        </div>
      `),
      text: `Dear ${variables.customerName}, We have received your quote request #${variables.quoteId}. Our team will review it and respond within 1 business day.`
    },

    'quote-ready': {
      subject: `Your Quote #${variables.quoteId} is Ready!`,
      html: wrapTemplate(`
        <h2 style="color: #333; margin-top: 0;">Your Quote is Ready! 📋</h2>
        <p style="color: #666; font-size: 16px;">Dear ${variables.customerName},</p>
        <p style="color: #666; font-size: 16px;">Great news! Your quote <strong style="color: #00b4d8;">#${variables.quoteId}</strong> has been prepared and is ready for your review.</p>
        
        <div style="margin: 25px 0; padding: 20px; background: linear-gradient(135deg, #f0fafd 0%, #e8f7fa 100%); border-radius: 8px; text-align: center;">
          <p style="color: #333; font-size: 14px; margin: 5px 0;">Total Quote Amount</p>
          <p style="color: #00b4d8; font-size: 32px; font-weight: bold; margin: 10px 0;">${variables.amount}</p>
          <p style="color: #666; font-size: 14px; margin: 5px 0;">Valid for 30 days</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'https://freight-shark.vercel.app'}/quotes/${variables.quoteId}" 
             style="display: inline-block; padding: 14px 35px; background: linear-gradient(135deg, #00b4d8 0%, #0096c7 100%); color: white; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px;">
            Review & Accept Quote
          </a>
        </div>
      `),
      text: `Dear ${variables.customerName}, Your quote #${variables.quoteId} is ready. Total amount: ${variables.amount}. Please log in to view details.`
    },

    'shipment-update': {
      subject: `Shipment ${variables.shipmentId} - ${variables.status}`,
      html: wrapTemplate(`
        <h2 style="color: #333; margin-top: 0;">Shipment Status Update 📦</h2>
        <p style="color: #666; font-size: 16px;">Dear ${variables.customerName},</p>
        <p style="color: #666; font-size: 16px;">Your shipment <strong style="color: #00b4d8;">${variables.shipmentId}</strong> has been updated.</p>
        
        <div style="margin: 25px 0; padding: 20px; background: #f0fafd; border-radius: 8px;">
          <div style="display: flex; align-items: center; margin-bottom: 15px;">
            <div style="width: 12px; height: 12px; background: #10b981; border-radius: 50%; margin-right: 10px;"></div>
            <p style="color: #333; font-size: 18px; margin: 0;"><strong>Status: ${variables.status}</strong></p>
          </div>
          ${variables.trackingInfo ? `
            <div style="padding: 15px; background: white; border-radius: 4px; margin-top: 15px;">
              <p style="color: #666; font-size: 14px; margin: 0;"><strong>Tracking Details:</strong></p>
              <p style="color: #666; font-size: 14px; margin: 10px 0 0 0;">${variables.trackingInfo}</p>
            </div>
          ` : ''}
          ${variables.estimatedDelivery ? `
            <p style="color: #666; font-size: 14px; margin: 15px 0 5px 0;">
              <strong>Estimated Delivery:</strong> ${variables.estimatedDelivery}
            </p>
          ` : ''}
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'https://freight-shark.vercel.app'}/shipments/${variables.shipmentId}" 
             style="display: inline-block; padding: 14px 35px; background: linear-gradient(135deg, #00b4d8 0%, #0096c7 100%); color: white; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px;">
            Track Shipment
          </a>
        </div>
      `),
      text: `Dear ${variables.customerName}, Your shipment ${variables.shipmentId} status has been updated to: ${variables.status}.`
    },

    'shipment-delivered': {
      subject: `Shipment ${variables.shipmentId} Delivered Successfully!`,
      html: wrapTemplate(`
        <h2 style="color: #333; margin-top: 0;">Shipment Delivered! 🎉</h2>
        <p style="color: #666; font-size: 16px;">Dear ${variables.customerName},</p>
        <p style="color: #666; font-size: 16px;">Great news! Your shipment <strong style="color: #00b4d8;">${variables.shipmentId}</strong> has been successfully delivered.</p>
        
        <div style="margin: 25px 0; padding: 20px; background: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
          <h3 style="color: #10b981; margin: 0 0 15px 0;">✅ Delivery Confirmed</h3>
          <p style="color: #666; font-size: 15px; margin: 8px 0;"><strong>Delivered to:</strong> ${variables.deliveryLocation || 'Destination warehouse'}</p>
          <p style="color: #666; font-size: 15px; margin: 8px 0;"><strong>Date & Time:</strong> ${variables.deliveryDate || new Date().toLocaleString()}</p>
          ${variables.signature ? `<p style="color: #666; font-size: 15px; margin: 8px 0;"><strong>Signed by:</strong> ${variables.signature}</p>` : ''}
        </div>
        
        <p style="color: #666; font-size: 16px;">Thank you for choosing Freight Shark for your logistics needs!</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'https://freight-shark.vercel.app'}/shipments/${variables.shipmentId}" 
             style="display: inline-block; padding: 14px 35px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px;">
            View Delivery Details
          </a>
        </div>
      `),
      text: `Dear ${variables.customerName}, Your shipment ${variables.shipmentId} has been successfully delivered.`
    },

    'invoice-generated': {
      subject: `Invoice #${variables.invoiceNumber} - Shipment ${variables.shipmentId}`,
      html: wrapTemplate(`
        <h2 style="color: #333; margin-top: 0;">Invoice Generated 💳</h2>
        <p style="color: #666; font-size: 16px;">Dear ${variables.customerName},</p>
        <p style="color: #666; font-size: 16px;">An invoice has been generated for your shipment <strong style="color: #00b4d8;">${variables.shipmentId}</strong>.</p>
        
        <div style="margin: 25px 0; padding: 20px; background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 4px;">
          <h3 style="color: #333; margin: 0 0 15px 0;">Invoice Details</h3>
          <p style="color: #666; font-size: 15px; margin: 8px 0;"><strong>Invoice Number:</strong> ${variables.invoiceNumber}</p>
          <p style="color: #666; font-size: 15px; margin: 8px 0;"><strong>Amount Due:</strong> <span style="color: #f59e0b; font-size: 20px; font-weight: bold;">${variables.amount}</span></p>
          <p style="color: #666; font-size: 15px; margin: 8px 0;"><strong>Due Date:</strong> ${variables.dueDate}</p>
        </div>
        
        <p style="color: #666; font-size: 16px;">Please ensure payment is made by the due date to avoid any service interruptions.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'https://freight-shark.vercel.app'}/invoices/${variables.invoiceNumber}" 
             style="display: inline-block; padding: 14px 35px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px;">
            View & Pay Invoice
          </a>
        </div>
      `),
      text: `Dear ${variables.customerName}, Invoice #${variables.invoiceNumber} has been generated for shipment ${variables.shipmentId}. Amount Due: ${variables.amount}, Due Date: ${variables.dueDate}.`
    },

    'warehouse-ids-required': {
      subject: `Action Required: Warehouse IDs Needed for ${variables.shipmentId}`,
      html: wrapTemplate(`
        <h2 style="color: #333; margin-top: 0;">Action Required: Warehouse IDs ⚠️</h2>
        <p style="color: #666; font-size: 16px;">Dear ${variables.customerName},</p>
        <p style="color: #666; font-size: 16px;">We need warehouse identification details to proceed with your shipment <strong style="color: #00b4d8;">${variables.shipmentId}</strong>.</p>
        
        <div style="margin: 25px 0; padding: 20px; background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px;">
          <h3 style="color: #ef4444; margin: 0 0 15px 0;">Required Information</h3>
          <ul style="color: #666; margin: 10px 0; padding-left: 20px; font-size: 15px;">
            <li style="margin: 8px 0;">FBA Warehouse ID or Reference Number</li>
            <li style="margin: 8px 0;">Destination Warehouse Code</li>
            <li style="margin: 8px 0;">Any special handling instructions</li>
          </ul>
        </div>
        
        <p style="color: #666; font-size: 16px;"><strong>Why is this needed?</strong> ${variables.reason || 'This information ensures your shipment is routed correctly and delivered to the right warehouse.'}</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'https://freight-shark.vercel.app'}/shipments/${variables.shipmentId}/update" 
             style="display: inline-block; padding: 14px 35px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px;">
            Provide Warehouse IDs
          </a>
        </div>
        
        <p style="color: #999; font-size: 14px; text-align: center;">
          Please provide this information within 24 hours to avoid delays.
        </p>
      `),
      text: `Dear ${variables.customerName}, We need warehouse IDs for shipment ${variables.shipmentId}. Please log in to provide this information.`
    },

    'new-message': {
      subject: `New Message from ${variables.senderRole} - ${variables.subject || 'Freight Shark'}`,
      html: wrapTemplate(`
        <h2 style="color: #333; margin-top: 0;">New Message Received 💬</h2>
        <p style="color: #666; font-size: 16px;">Dear ${variables.customerName},</p>
        <p style="color: #666; font-size: 16px;">You have a new message from our <strong>${variables.senderRole}</strong> team.</p>
        
        <div style="margin: 25px 0; padding: 20px; background: #f3f4f6; border-radius: 8px;">
          ${variables.subject ? `<h3 style="color: #333; margin: 0 0 15px 0;">${variables.subject}</h3>` : ''}
          <div style="padding: 15px; background: white; border-left: 3px solid #00b4d8; border-radius: 4px;">
            <p style="color: #666; font-size: 15px; margin: 0; white-space: pre-wrap;">${variables.message}</p>
          </div>
          <p style="color: #999; font-size: 13px; margin: 15px 0 0 0;">
            <strong>From:</strong> ${variables.senderName || variables.senderRole} • ${new Date().toLocaleString()}
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'https://freight-shark.vercel.app'}/messages" 
             style="display: inline-block; padding: 14px 35px; background: linear-gradient(135deg, #00b4d8 0%, #0096c7 100%); color: white; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px;">
            View & Reply
          </a>
        </div>
      `),
      text: `Dear ${variables.customerName}, You have a new message from ${variables.senderRole}: ${variables.message}`
    },

    'payment-received': {
      subject: `Payment Received - Invoice #${variables.invoiceNumber}`,
      html: wrapTemplate(`
        <h2 style="color: #333; margin-top: 0;">Payment Received ✅</h2>
        <p style="color: #666; font-size: 16px;">Dear ${variables.customerName},</p>
        <p style="color: #666; font-size: 16px;">Thank you! We've successfully received your payment for invoice <strong style="color: #00b4d8;">#${variables.invoiceNumber}</strong>.</p>
        
        <div style="margin: 25px 0; padding: 20px; background: #f0fdf4; border-left: 4px solid #10b981; border-radius: 4px;">
          <h3 style="color: #10b981; margin: 0 0 15px 0;">Payment Details</h3>
          <p style="color: #666; font-size: 15px; margin: 8px 0;"><strong>Amount Paid:</strong> ${variables.amount}</p>
          <p style="color: #666; font-size: 15px; margin: 8px 0;"><strong>Payment Date:</strong> ${variables.paymentDate || new Date().toLocaleDateString()}</p>
          <p style="color: #666; font-size: 15px; margin: 8px 0;"><strong>Reference:</strong> ${variables.reference || variables.invoiceNumber}</p>
        </div>
        
        <p style="color: #666; font-size: 16px;">Your account has been updated and your shipments will continue without interruption.</p>
      `),
      text: `Dear ${variables.customerName}, Payment received for invoice #${variables.invoiceNumber}. Amount: ${variables.amount}.`
    }
  };

  return templates[templateId] || null;
}