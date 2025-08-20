// Simple email notification system for order management
export interface OrderNotificationData {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  productName: string;
  amount: number;
  currency: string;
  businessName: string;
  businessPhone?: string;
  businessEmail?: string;
  paymentInstructions?: string;
  orderStatus: 'pending' | 'paid' | 'cancelled' | 'failed';
}

export interface NotificationOptions {
  sendEmail?: boolean;
  customEmailSubject?: string;
}

// Generate email content based on order status
const generateEmailContent = (data: OrderNotificationData): { subject: string; html: string } => {
  const { orderNumber, customerName, productName, amount, currency, businessName, orderStatus } = data;
  
  let subject = '';
  let statusMessage = '';
  let statusColor = '';
  
  switch (orderStatus) {
    case 'paid':
      subject = `Order Confirmation - ${orderNumber}`;
      statusMessage = 'Your order has been confirmed and payment received!';
      statusColor = '#10B981';
      break;
    case 'pending':
      subject = `Payment Instructions - ${orderNumber}`;
      statusMessage = 'Your order is awaiting payment. Please complete payment to confirm your order.';
      statusColor = '#F59E0B';
      break;
    case 'cancelled':
      subject = `Order Cancelled - ${orderNumber}`;
      statusMessage = 'Your order has been cancelled. Order details are below for your reference.';
      statusColor = '#EF4444';
      break;
    case 'failed':
      subject = `Payment Failed - ${orderNumber}`;
      statusMessage = 'Payment for your order failed. Please try again using the instructions below.';
      statusColor = '#EF4444';
      break;
    default:
      subject = `Order Update - ${orderNumber}`;
      statusMessage = 'Order status update';
      statusColor = '#6B7280';
  }

  const html = `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <div style="background: ${statusColor}; color: white; padding: 20px; text-align: center;">
        <h1>${businessName}</h1>
        <h2>${subject}</h2>
      </div>
      
      <div style="background: #f9f9f9; padding: 20px;">
        <p>Dear ${customerName},</p>
        <p>${statusMessage}</p>
        
        <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3>Order Details</h3>
          <p><strong>Order Number:</strong> ${orderNumber}</p>
          <p><strong>Product:</strong> ${productName}</p>
          <p><strong>Customer:</strong> ${customerName}</p>
          <p><strong>Phone:</strong> ${data.customerPhone}</p>
          <p style="font-size: 1.2em; color: ${statusColor};"><strong>Total Amount:</strong> ${currency} ${amount}</p>
        </div>
        
        ${data.paymentInstructions ? `
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3>Payment Instructions</h3>
            <pre style="white-space: pre-wrap; font-family: inherit;">${data.paymentInstructions}</pre>
          </div>
        ` : ''}
        
        <div style="text-align: center; margin-top: 20px; font-size: 0.9em; color: #666;">
          <p>Thank you for choosing ${businessName}!</p>
          ${data.businessPhone ? `<p>Contact us: ${data.businessPhone}</p>` : ''}
        </div>
      </div>
    </div>
  `;
  
  return { subject, html };
};

export class NotificationService {
  
  static async sendEmailNotification(data: OrderNotificationData, options: NotificationOptions = {}): Promise<boolean> {
    try {
      if (!data.customerEmail) {
        console.log('📧 No email address provided - skipping email notification');
        return false;
      }

      const { subject, html } = generateEmailContent(data);
      
      console.log('📧 Email notification generated:', {
        to: data.customerEmail,
        subject: options.customEmailSubject || subject,
        orderNumber: data.orderNumber,
        status: data.orderStatus
      });
      
      // TODO: Integrate with your email service here
      // For now, just log the notification
      console.log('📧 Email would be sent with content:', { subject, html: html.length + ' characters' });
      
      return true;
    } catch (error) {
      console.error('❌ Error sending email notification:', error);
      return false;
    }
  }

  static async sendOrderNotification(
    data: OrderNotificationData, 
    options: NotificationOptions = { sendEmail: true }
  ): Promise<{ emailSent: boolean }> {
    const results = {
      emailSent: false
    };
    
    try {
      if (data.customerEmail && options.sendEmail !== false) {
        results.emailSent = await this.sendEmailNotification(data, options);
      }
      
      console.log('📋 Order Notification:', {
        orderId: data.orderId,
        orderNumber: data.orderNumber,
        customer: `${data.customerName} (${data.customerPhone})`,
        product: data.productName,
        amount: `${data.currency} ${data.amount}`,
        status: data.orderStatus,
        emailSent: results.emailSent
      });
      
      return results;
    } catch (error) {
      console.error('❌ Error sending notifications:', error);
      return results;
    }
  }
}

export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    return '254' + cleaned.substring(1);
  } else if (cleaned.length === 9) {
    return '254' + cleaned;
  } else if (cleaned.length === 12 && cleaned.startsWith('254')) {
    return cleaned;
  }
  
  return cleaned;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
