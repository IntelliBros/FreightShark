import { emailService } from './EmailService';
import { QuoteRequest, Quote, Shipment, Invoice, User } from './DataService';
import { supabase } from '../lib/supabase';

export interface Notification {
  id: string;
  user_id: string;
  type: 'quote' | 'shipment' | 'invoice' | 'sample' | 'message';
  title: string;
  message: string;
  icon?: string;
  link?: string;
  read: boolean;
  created_at: string;
  updated_at: string;
}

class NotificationService {
  private supabase = supabase;

  // Create in-app notification in database
  async createNotification(notification: Omit<Notification, 'id' | 'created_at' | 'updated_at' | 'read'>): Promise<Notification | null> {
    const newNotification: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      ...notification,
      read: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };


    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .insert(newNotification)
        .select()
        .single();

      if (error) {
        if (error.code === '42501') {
          console.warn('⚠️ RLS policy blocking notification insert - notification will be shown locally only');
          console.log('To fix: Run ALTER TABLE notifications DISABLE ROW LEVEL SECURITY; in Supabase SQL editor');
        } else {
          console.error('Failed to create notification in Supabase:', error);
        }
        // Return the notification anyway so the app can continue
        // This ensures notifications work even if database save fails
        return newNotification;
      }

      console.log('✅ Notification saved to database successfully');
      return data;
    } catch (error) {
      console.error('Error creating notification:', error);
      // Return the notification anyway so the app can continue
      return newNotification;
    }
  }

  // Get all notifications for a user
  async getUserNotifications(userId: string): Promise<Notification[]> {

    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch notifications:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Failed to mark notification as read:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) {
        console.error('Failed to mark all notifications as read:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  // Clear all notifications for a user
  async clearAll(userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Failed to clear notifications:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error clearing notifications:', error);
      return false;
    }
  }
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
    // Send email notification - using exact same pattern as shipment notifications
    if (!customer.email) return;

    try {
      // Create custom email content for sample notifications
      const receivedCount = sample.received_count || 1;
      const expectedCount = sample.expected_count || 1;

      // Log the exact data being sent for debugging
      const emailData = {
        to: customer.email,
        template: 'custom-sample',
        variables: {
          title: 'Sample Received in Warehouse',
          message: `We have received a sample in your consolidation request ${sample.consolidation_id}`,
          sampleCount: `Samples Received: ${receivedCount}/${expectedCount}`,
          productName: sample.product_name || 'Sample',
          instructions: 'Once you are ready, you can view your warehouse samples and submit a request to ship the samples to the address of your choice.',
          buttonText: 'Submit Samples for Shipment',
          buttonUrl: 'https://freight-shark.vercel.app/samples'
        }
      };

      console.log('Sending sample email with data:', JSON.stringify(emailData, null, 2));

      // Use the new sample-received template with proper formatting
      await emailService.sendNotification(
        customer.email,
        'sample-received',
        {
          customerName: customer.name || 'Valued Customer',
          consolidationId: sample.consolidation_id,
          productName: sample.product_name || 'Sample',
          receivedCount: receivedCount.toString(),
          expectedCount: expectedCount.toString(),
          receivedDate: new Date(sample.received_date).toLocaleDateString()
        }
      );
      console.log(`✅ Sample received email sent successfully to ${customer.email}`);
    } catch (error) {
      console.error('❌ Failed to send sample received email:', error);
      // Don't throw - continue with in-app notification
    }

    // Create in-app notification in database
    try {
      await this.createNotification({
        user_id: customer.id,
        type: 'sample',
        title: 'Sample Received',
        message: `Your sample ${sample.product_name} (${sample.id}) has been received at our warehouse.`,
        icon: 'Package',
        link: '/samples'
      });
      console.log(`Sample received notification created for user ${customer.id}`);
    } catch (error) {
      console.error('Failed to create sample received notification:', error);
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
export default notificationService;