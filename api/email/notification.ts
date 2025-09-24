import { VercelRequest, VercelResponse } from '@vercel/node';

function createEmailTemplate(templateId: string, variables: Record<string, string>) {
  // Use hosted SVG logos for better email delivery
  const baseUrl = process.env.FRONTEND_URL || 'https://freight-shark.vercel.app';
  const logoWhiteUrl = `${baseUrl}/freight-shark-logo-white.svg`;
  const logoUrl = `${baseUrl}/freight-shark-logo.svg`;

  const header = `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #1f2c39;">
      <tr>
        <td style="padding: 30px; text-align: center; background-color: #1f2c39;">
          <img src="${logoWhiteUrl}" alt="Freight Shark" width="200" height="60" style="display: block; border: none; margin: 0 auto;" />
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
                <img src="${logoUrl}" alt="Freight Shark Logo" width="120" height="40" style="display: inline-block; border: none; margin-bottom: 15px;" />
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
                      Get competitive shipping rates within one business day
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
                      You'll receive your detailed quote within one business day
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

      `),
      text: `Quote Request #${variables.quoteId} Received! Dear ${variables.customerName}, we have successfully received your quote request and our experts are working on it. You'll receive your detailed quote within 1 business day. Track your quote status in your dashboard or contact us at quotes@freightshark.com`
    },
    'quote-created': {
      subject: `Quote #${variables.quoteId} has been created for your request`,
      html: wrapTemplate(`
        <!-- Header -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td align="center" style="padding: 20px 0;">
              <h1 style="color: #16a34a; margin: 0 0 10px 0; font-size: 28px; font-family: Arial, sans-serif;">
                ✨ Your Quote is Ready!
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
                Great news! We have created a detailed quote for your request <strong>#${variables.requestId}</strong>.
              </p>
            </td>
          </tr>
        </table>

        <!-- Quote Details -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 30px 0;">
          <tr>
            <td style="padding: 25px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px;">
              <p style="color: #ffffff; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; font-weight: bold;">
                Total Quote Amount
              </p>
              <p style="color: #ffffff; font-size: 32px; margin: 0; font-weight: bold;">
                $${variables.amount}
              </p>
              <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 10px 0 0 0;">
                Valid until: ${variables.validUntil}
              </p>
            </td>
          </tr>
        </table>

        <!-- Next Steps -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td>
              <h3 style="color: #1e293b; font-size: 18px; margin: 0 0 15px 0;">Next Steps:</h3>
              <ol style="color: #666666; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li>Review the detailed quote in your dashboard</li>
                <li>Accept the quote if it meets your requirements</li>
                <li>Our team will begin processing your shipment immediately</li>
              </ol>
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
                    <a href="${process.env.FRONTEND_URL || 'https://freight-shark.vercel.app'}/quotes/${variables.quoteId}"
                       style="color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; font-family: Arial, sans-serif;">
                      Review & Accept Quote
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `),
      text: `Quote #${variables.quoteId} Created! Dear ${variables.customerName}, we have created a quote for your request #${variables.requestId}. Total Amount: $${variables.amount}. Valid until: ${variables.validUntil}. Please log in to review and accept the quote.`
    },
    'quote-ready': {
      subject: `Your Quote #${variables.quoteId} is ready`,
      html: wrapTemplate(`
        <h1 style="color: #16a34a; margin: 0 0 20px 0; font-size: 28px; font-family: Arial, sans-serif;">
          Your Quote is Ready!
        </h1>

        <p style="color: #333333; font-size: 16px; margin: 0 0 10px 0; font-family: Arial, sans-serif;">
          Dear ${variables.customerName},
        </p>

        <p style="color: #555555; font-size: 15px; line-height: 1.6; font-family: Arial, sans-serif;">
          Your quote <strong>#${variables.quoteId}</strong> is ready for review.
        </p>

        <div style="margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-left: 4px solid #00b4d8;">
          <p style="color: #333; font-size: 18px; margin: 0;">
            Total Amount: <strong>${variables.amount}</strong>
          </p>
        </div>

        <p style="color: #666666; font-size: 15px; margin: 20px 0; font-family: Arial, sans-serif;">
          Please log in to your account to view the full details and accept the quote.
        </p>

        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 30px 0;">
          <tr>
            <td align="center">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color: #00b4d8; padding: 12px 30px; text-align: center;">
                    <a href="${process.env.FRONTEND_URL || 'https://freight-shark.vercel.app'}/quotes/${variables.quoteId}"
                       style="color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; font-family: Arial, sans-serif;">
                      View Quote Details
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `),
      text: `Your Quote #${variables.quoteId} is ready! Dear ${variables.customerName}, your quote is ready for review. Total amount: ${variables.amount}. Please log in to view the full details.`
    },
    'shipment-update': {
      subject: `Shipment ${variables.shipmentId} Status Update`,
      html: wrapTemplate(`
        <h1 style="color: #1e293b; margin: 0 0 20px 0; font-size: 28px; font-family: Arial, sans-serif;">
          Shipment Status Update
        </h1>

        <p style="color: #333333; font-size: 16px; margin: 0 0 10px 0; font-family: Arial, sans-serif;">
          Dear ${variables.customerName},
        </p>

        <p style="color: #555555; font-size: 15px; line-height: 1.6; font-family: Arial, sans-serif;">
          Your shipment <strong>${variables.shipmentId}</strong> status has been updated.
        </p>

        <div style="margin: 30px 0; padding: 20px; background-color: #e8f7fa; border-left: 4px solid #00b4d8;">
          <p style="color: #0096c7; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; font-weight: bold;">
            Current Status
          </p>
          <p style="color: #333; font-size: 20px; margin: 0; font-weight: bold;">
            ${variables.status}
          </p>
        </div>

        <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa;">
          <p style="color: #666; font-size: 14px; margin: 0 0 10px 0;">
            <strong>Tracking Information:</strong>
          </p>
          <p style="color: #333; font-size: 14px; margin: 0; white-space: pre-line;">
            ${variables.trackingInfo || 'No additional tracking information available.'}
          </p>
        </div>

        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 30px 0;">
          <tr>
            <td align="center">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color: #00b4d8; padding: 12px 30px; text-align: center;">
                    <a href="${process.env.FRONTEND_URL || 'https://freight-shark.vercel.app'}/shipments/${variables.shipmentId}"
                       style="color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; font-family: Arial, sans-serif;">
                      Track Shipment
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `),
      text: `Shipment ${variables.shipmentId} Status Update. Dear ${variables.customerName}, your shipment status has been updated to: ${variables.status}. ${variables.trackingInfo || ''}`
    },
    'sample-received': {
      subject: `Sample Received in Warehouse - ${variables.consolidationId}`,
      html: wrapTemplate(`
        <h1 style="color: #1e293b; margin: 0 0 20px 0; font-size: 28px; font-family: Arial, sans-serif;">
          Sample Received in Warehouse
        </h1>

        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="padding: 20px; background-color: #f8f9fa; border-left: 4px solid #00b4d8;">
              <p style="color: #333333; font-size: 16px; margin: 0 0 10px 0; font-family: Arial, sans-serif;">
                <strong>Dear ${variables.customerName},</strong>
              </p>
              <p style="color: #555555; font-size: 15px; margin: 0; line-height: 1.6; font-family: Arial, sans-serif;">
                We have received a sample in your consolidation request <strong>${variables.consolidationId}</strong>
              </p>
            </td>
          </tr>
        </table>

        <!-- Sample Details Card -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 20px;">
          <tr>
            <td style="padding: 20px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
              <h3 style="color: #00b4d8; margin: 0 0 15px 0; font-size: 18px; font-family: Arial, sans-serif;">
                Sample Details:
              </h3>
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
                    <span style="color: #64748b; font-size: 14px; font-family: Arial, sans-serif;">Product:</span>
                    <strong style="color: #1e293b; font-size: 14px; font-family: Arial, sans-serif; float: right;">${variables.productName}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
                    <span style="color: #64748b; font-size: 14px; font-family: Arial, sans-serif;">Samples Received:</span>
                    <strong style="color: #1e293b; font-size: 14px; font-family: Arial, sans-serif; float: right;">${variables.receivedCount}/${variables.expectedCount}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="color: #64748b; font-size: 14px; font-family: Arial, sans-serif;">Received Date:</span>
                    <strong style="color: #1e293b; font-size: 14px; font-family: Arial, sans-serif; float: right;">${variables.receivedDate}</strong>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Instructions -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 20px;">
          <tr>
            <td style="padding: 20px;">
              <p style="color: #555555; font-size: 15px; margin: 0; line-height: 1.6; font-family: Arial, sans-serif;">
                Once you are ready, you can view your warehouse samples and submit a request to ship the samples to the address of your choice.
              </p>
            </td>
          </tr>
        </table>

        <!-- CTA Button -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 30px;">
          <tr>
            <td align="center">
              <a href="https://freight-shark.vercel.app/samples"
                 style="background-color: #00b4d8; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block; font-family: Arial, sans-serif;">
                Submit Samples for Shipment
              </a>
            </td>
          </tr>
        </table>
      `),
      text: `Sample Received in Warehouse. Dear ${variables.customerName}, we have received a sample in your consolidation request ${variables.consolidationId}. Product: ${variables.productName}. Samples Received: ${variables.receivedCount}/${variables.expectedCount}. Once you are ready, you can view your warehouse samples and submit a request to ship the samples to the address of your choice.`
    },
    'invoice-generated': {
      subject: `Invoice for Shipment ${variables.shipmentId}`,
      html: wrapTemplate(`
        <h1 style="color: #1e293b; margin: 0 0 20px 0; font-size: 28px; font-family: Arial, sans-serif;">
          Invoice Generated
        </h1>

        <p style="color: #333333; font-size: 16px; margin: 0 0 10px 0; font-family: Arial, sans-serif;">
          Dear ${variables.customerName},
        </p>

        <p style="color: #555555; font-size: 15px; line-height: 1.6; font-family: Arial, sans-serif;">
          An invoice has been generated for your shipment <strong>${variables.shipmentId}</strong>.
        </p>

        <div style="margin: 30px 0; padding: 20px; background-color: #fff3cd; border-left: 4px solid #ffc107;">
          <p style="color: #856404; font-size: 14px; margin: 0 0 10px 0;">
            <strong>Amount Due:</strong> ${variables.amount}
          </p>
          <p style="color: #856404; font-size: 14px; margin: 0;">
            <strong>Due Date:</strong> ${variables.dueDate}
          </p>
        </div>

        <div style="margin: 20px 0; padding: 15px; background-color: #fee2e2; border-left: 4px solid #ef4444;">
          <p style="color: #991b1b; font-size: 14px; margin: 0; font-weight: bold;">
            ⚠️ Important: Your shipment will not leave the warehouse until payment is received.
          </p>
        </div>

        <p style="color: #666666; font-size: 15px; margin: 20px 0; font-family: Arial, sans-serif;">
          Please log in to your account to view and pay the invoice.
        </p>

        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 30px 0;">
          <tr>
            <td align="center">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color: #00b4d8; padding: 12px 30px; text-align: center;">
                    <a href="${process.env.FRONTEND_URL || 'https://freight-shark.vercel.app'}/invoices"
                       style="color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; font-family: Arial, sans-serif;">
                      View Invoice
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `),
      text: `Invoice for Shipment ${variables.shipmentId}. Dear ${variables.customerName}, an invoice has been generated. Amount Due: ${variables.amount}. Due Date: ${variables.dueDate}. IMPORTANT: Your shipment will not leave the warehouse until payment is received. Please log in to view and pay.`
    },
    'shipment-created': {
      subject: `Your Shipment ${variables.shipmentId} has been created`,
      html: wrapTemplate(`
        <!-- Header -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td align="center" style="padding: 20px 0;">
              <h1 style="color: #16a34a; margin: 0 0 10px 0; font-size: 28px; font-family: Arial, sans-serif;">
                📦 Shipment Created Successfully!
              </h1>
              <p style="color: #666666; font-size: 16px; margin: 0; font-family: Arial, sans-serif;">
                Shipment ID: <strong>${variables.shipmentId}</strong>
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
                Great news! Your shipment has been created and is being processed by our logistics team.
              </p>
            </td>
          </tr>
        </table>

        <!-- What Happens Next -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 30px;">
          <tr>
            <td>
              <h3 style="color: #1e293b; font-size: 18px; margin: 0 0 15px 0;">What Happens Next:</h3>
              <ul style="color: #666666; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li>Our team will arrange pickup from the origin</li>
                <li>You'll receive tracking information once the shipment is picked up</li>
                <li>Real-time updates will be available in your dashboard</li>
              </ul>
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
                    <a href="${process.env.FRONTEND_URL || 'https://freight-shark.vercel.app'}/shipments/${variables.shipmentId}"
                       style="color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; font-family: Arial, sans-serif;">
                      Track Your Shipment
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `),
      text: `Shipment ${variables.shipmentId} Created! Dear ${variables.customerName}, your shipment has been created and is being processed. Our team will provide tracking information once your shipment is picked up.`
    },
    'shipment-delivered': {
      subject: `Your Shipment ${variables.shipmentId} has been delivered! 🎉`,
      html: wrapTemplate(`
        <!-- Header -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td align="center" style="padding: 20px 0;">
              <h1 style="color: #16a34a; margin: 0 0 10px 0; font-size: 28px; font-family: Arial, sans-serif;">
                🎉 Shipment Delivered Successfully!
              </h1>
              <p style="color: #666666; font-size: 16px; margin: 0; font-family: Arial, sans-serif;">
                Shipment ID: <strong>${variables.shipmentId}</strong>
              </p>
            </td>
          </tr>
        </table>

        <!-- Greeting -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="padding: 20px; background-color: #dcfce7; border-left: 4px solid #16a34a;">
              <p style="color: #333333; font-size: 16px; margin: 0 0 10px 0; font-family: Arial, sans-serif;">
                <strong>Dear ${variables.customerName},</strong>
              </p>
              <p style="color: #555555; font-size: 15px; margin: 0; line-height: 1.6; font-family: Arial, sans-serif;">
                Excellent news! Your shipment has been successfully delivered to its destination.
              </p>
            </td>
          </tr>
        </table>

        <!-- Delivery Details -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 30px 0;">
          <tr>
            <td style="padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
              <h3 style="color: #1e293b; font-size: 18px; margin: 0 0 15px 0;">Delivery Details:</h3>
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="padding: 5px 0;">
                    <strong style="color: #64748b; font-size: 14px;">Delivered to:</strong>
                    <p style="color: #1e293b; font-size: 14px; margin: 5px 0 0 0;">${variables.destination}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 5px 0;">
                    <strong style="color: #64748b; font-size: 14px;">Delivery Date:</strong>
                    <p style="color: #1e293b; font-size: 14px; margin: 5px 0 0 0;">${variables.deliveryDate}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 5px 0;">
                    <strong style="color: #64748b; font-size: 14px;">Tracking Number:</strong>
                    <p style="color: #1e293b; font-size: 14px; margin: 5px 0 0 0;">${variables.trackingNumber}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Thank You Message -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="text-align: center; padding: 20px;">
              <p style="color: #666666; font-size: 15px; margin: 0;">
                Thank you for choosing Freight Shark for your shipping needs!
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
                    <a href="${process.env.FRONTEND_URL || 'https://freight-shark.vercel.app'}/shipments"
                       style="color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; font-family: Arial, sans-serif;">
                      View All Shipments
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `),
      text: `Shipment ${variables.shipmentId} Delivered! Dear ${variables.customerName}, your shipment has been successfully delivered. Destination: ${variables.destination}. Delivery Date: ${variables.deliveryDate}. Tracking: ${variables.trackingNumber}. Thank you for choosing Freight Shark!`
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
    const { to, templateId, variables } = req.body;

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

    // Fetch SMTP config from Supabase
    let smtpConfig: any = null;
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://isvuolzqqjutrfytebtl.supabase.co';
      // Use service role key for backend API access to system_settings
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

      console.log('Supabase connection:', {
        url: supabaseUrl,
        hasKey: !!supabaseKey,
        keyType: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'service_role' :
                 process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ? 'vite_service_role' :
                 process.env.VITE_SUPABASE_ANON_KEY ? 'anon' : 'none'
      });

      const supabase = createClient(supabaseUrl, supabaseKey);

      // Try to fetch SMTP configuration using the function first
      try {
        const { data, error } = await supabase.rpc('get_smtp_config');
        if (!error && data && data.enabled) {
          smtpConfig = data;
          console.log('SMTP config fetched from Supabase function:', {
            enabled: smtpConfig.enabled,
            host: smtpConfig.host,
            from: smtpConfig.from?.email
          });
        }
      } catch (funcError) {
        console.log('get_smtp_config function not found, fetching settings individually');
      }

      // Fallback: fetch settings individually if function didn't work
      if (!smtpConfig) {
        const settings: Record<string, string> = {};
        const keys = ['smtp_host', 'smtp_port', 'smtp_secure', 'smtp_user', 'smtp_pass', 'smtp_from_name', 'smtp_from_email', 'smtp_enabled'];

        for (const key of keys) {
          const { data: setting } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', key)
            .single();

          if (setting) {
            settings[key] = setting.value;
          }
        }

        console.log('Fetched individual SMTP settings:', settings);

        if (settings.smtp_enabled === 'true' && settings.smtp_host) {
          smtpConfig = {
            enabled: true,
            host: settings.smtp_host,
            port: parseInt(settings.smtp_port || '587'),
            secure: settings.smtp_secure === 'true',
            auth: {
              user: settings.smtp_user || '',
              pass: settings.smtp_pass || ''
            },
            from: {
              name: settings.smtp_from_name || 'FreightShark',
              email: settings.smtp_from_email || ''
            }
          };
          console.log('SMTP config built from individual settings:', {
            enabled: smtpConfig.enabled,
            host: smtpConfig.host,
            from: smtpConfig.from?.email
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch SMTP config from Supabase:', error);
    }

    // Check if SMTP is configured and enabled
    if (!smtpConfig || !smtpConfig.enabled || !smtpConfig.host || !smtpConfig.auth?.user) {
      // Fallback to simulation
      console.log('📨 Email Notification (Simulated - No SMTP Config):', {
        to,
        template: templateId,
        subject: template.subject,
        variables,
        timestamp: new Date().toISOString(),
        reason: !smtpConfig ? 'No config fetched' :
                !smtpConfig.enabled ? 'SMTP disabled' :
                !smtpConfig.host ? 'No host configured' :
                !smtpConfig.auth?.user ? 'No auth user configured' : 'Unknown'
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

    // Create transporter with the fetched config
    const transporter = createTransport({
      host: smtpConfig.host,
      port: parseInt(smtpConfig.port),
      secure: smtpConfig.secure,
      auth: {
        user: smtpConfig.auth.user,
        pass: smtpConfig.auth.pass
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
      from: `"${smtpConfig.from?.name || 'Freight Shark'}" <${smtpConfig.from?.email || smtpConfig.auth.user}>`,
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