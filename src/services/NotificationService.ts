import { emailService } from './EmailService';
import { QuoteRequest, Quote, Shipment, Invoice, User } from './DataService';

class NotificationService {
  // Send welcome email to new users
  async notifyWelcome(user: User) {
    if (!user.email) return;
    
    try {
      await emailService.sendNotification(
        user.email,
        'welcome',
        {
          customerName: user.name || 'Valued Customer'
        }
      );
      console.log(`Welcome email sent to ${user.email}`);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }
  }

  // Send notification when quote request is received
  async notifyQuoteRequested(quoteRequest: QuoteRequest, customer: User) {
    if (!customer.email) return;
    
    try {
      await emailService.sendNotification(
        customer.email,
        'quote-requested',
        {
          quoteId: quoteRequest.id,
          customerName: customer.name || 'Valued Customer'
        }
      );
      console.log(`Quote requested notification sent to ${customer.email}`);
    } catch (error) {
      console.error('Failed to send quote requested notification:', error);
    }
  }

  // Send notification when quote is ready
  async notifyQuoteReady(quote: Quote, customer: User) {
    if (!customer.email) return;
    
    try {
      await emailService.sendNotification(
        customer.email,
        'quote-ready',
        {
          quoteId: quote.id,
          customerName: customer.name || 'Valued Customer',
          amount: `$${quote.totalAmount.toLocaleString()}`
        }
      );
      console.log(`Quote ready notification sent to ${customer.email}`);
    } catch (error) {
      console.error('Failed to send quote ready notification:', error);
    }
  }

  // Send notification for shipment updates
  async notifyShipmentUpdate(shipment: Shipment, customer: User, trackingInfo?: string) {
    if (!customer.email) return;
    
    try {
      await emailService.sendNotification(
        customer.email,
        'shipment-update',
        {
          shipmentId: shipment.id,
          customerName: customer.name || 'Valued Customer',
          status: shipment.status,
          trackingInfo: trackingInfo || shipment.trackingNumber || '',
          estimatedDelivery: shipment.estimatedDelivery || ''
        }
      );
      console.log(`Shipment update notification sent to ${customer.email}`);
    } catch (error) {
      console.error('Failed to send shipment update notification:', error);
    }
  }

  // Send notification when shipment is delivered
  async notifyShipmentDelivered(shipment: Shipment, customer: User, deliveryDetails?: {
    location?: string;
    date?: string;
    signature?: string;
  }) {
    if (!customer.email) return;
    
    try {
      await emailService.sendNotification(
        customer.email,
        'shipment-delivered',
        {
          shipmentId: shipment.id,
          customerName: customer.name || 'Valued Customer',
          deliveryLocation: deliveryDetails?.location || shipment.destination,
          deliveryDate: deliveryDetails?.date || new Date().toLocaleString(),
          signature: deliveryDetails?.signature || ''
        }
      );
      console.log(`Shipment delivered notification sent to ${customer.email}`);
    } catch (error) {
      console.error('Failed to send shipment delivered notification:', error);
    }
  }

  // Send notification when invoice is generated
  async notifyInvoiceGenerated(invoice: Invoice, shipment: Shipment, customer: User) {
    if (!customer.email) return;
    
    try {
      await emailService.sendNotification(
        customer.email,
        'invoice-generated',
        {
          invoiceNumber: invoice.id,
          shipmentId: shipment.id,
          customerName: customer.name || 'Valued Customer',
          amount: `$${invoice.amount.toLocaleString()}`,
          dueDate: invoice.dueDate
        }
      );
      console.log(`Invoice generated notification sent to ${customer.email}`);
    } catch (error) {
      console.error('Failed to send invoice notification:', error);
    }
  }

  // Send notification for warehouse IDs required
  async notifyWarehouseIDsRequired(shipment: Shipment, customer: User, reason?: string) {
    if (!customer.email) return;
    
    try {
      await emailService.sendNotification(
        customer.email,
        'warehouse-ids-required',
        {
          shipmentId: shipment.id,
          customerName: customer.name || 'Valued Customer',
          reason: reason || 'This information ensures your shipment is routed correctly and delivered to the right warehouse.'
        }
      );
      console.log(`Warehouse IDs required notification sent to ${customer.email}`);
    } catch (error) {
      console.error('Failed to send warehouse IDs notification:', error);
    }
  }

  // Send notification for new message
  async notifyNewMessage(customer: User, message: {
    senderRole: 'Staff' | 'Admin';
    senderName?: string;
    subject?: string;
    content: string;
  }) {
    if (!customer.email) return;
    
    try {
      await emailService.sendNotification(
        customer.email,
        'new-message',
        {
          customerName: customer.name || 'Valued Customer',
          senderRole: message.senderRole,
          senderName: message.senderName || '',
          subject: message.subject || '',
          message: message.content
        }
      );
      console.log(`New message notification sent to ${customer.email}`);
    } catch (error) {
      console.error('Failed to send message notification:', error);
    }
  }

  // Send notification for payment received
  async notifyPaymentReceived(invoice: Invoice, customer: User, paymentDetails?: {
    amount: string;
    date?: string;
    reference?: string;
  }) {
    if (!customer.email) return;

    try {
      await emailService.sendNotification(
        customer.email,
        'payment-received',
        {
          invoiceNumber: invoice.id,
          customerName: customer.name || 'Valued Customer',
          amount: paymentDetails?.amount || `$${invoice.amount.toLocaleString()}`,
          paymentDate: paymentDetails?.date || new Date().toLocaleDateString(),
          reference: paymentDetails?.reference || invoice.id
        }
      );
      console.log(`Payment received notification sent to ${customer.email}`);
    } catch (error) {
      console.error('Failed to send payment notification:', error);
    }
  }

  // Send notification when sample is received at warehouse
  async notifySampleReceived(sample: any, customer: User) {
    if (!customer.email) return;

    try {
      await emailService.sendNotification(
        customer.email,
        'sample-received',
        {
          sampleId: sample.id,
          customerName: customer.name || 'Valued Customer',
          productName: sample.product_name || 'Sample',
          consolidationId: sample.consolidation_id || '',
          receivedDate: new Date(sample.received_date).toLocaleDateString()
        }
      );
      console.log(`Sample received notification sent to ${customer.email}`);
    } catch (error) {
      console.error('Failed to send sample received notification:', error);
    }
  }

  // Send notification when payment link is added to sample shipment
  async notifySamplePaymentLink(request: any, customer: User) {
    if (!customer.email) return;

    try {
      await emailService.sendNotification(
        customer.email,
        'sample-payment-link',
        {
          requestId: request.id,
          customerName: customer.name || 'Valued Customer',
          sampleCount: request.sample_ids?.length.toString() || '0',
          deliveryAddress: request.delivery_address || '',
          paymentLink: request.payment_link || ''
        }
      );
      console.log(`Sample payment link notification sent to ${customer.email}`);
    } catch (error) {
      console.error('Failed to send sample payment notification:', error);
    }
  }

  // Send notification when sample shipment is shipped with tracking
  async notifySampleShipped(request: any, customer: User) {
    if (!customer.email) return;

    try {
      await emailService.sendNotification(
        customer.email,
        'sample-shipped',
        {
          requestId: request.id,
          customerName: customer.name || 'Valued Customer',
          trackingNumber: request.tracking_number || '',
          carrier: 'Express Shipping'
        }
      );
      console.log(`Sample shipped notification sent to ${customer.email}`);
    } catch (error) {
      console.error('Failed to send sample shipped notification:', error);
    }
  }
}

export const notificationService = new NotificationService();