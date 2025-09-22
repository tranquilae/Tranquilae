import { Resend } from 'resend';
import { emailTemplates } from './email-templates';

interface EmailData {
  to: string;
  subject: string;
  template: keyof typeof emailTemplates;
  data: Record<string, any>;
}

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Email configuration
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@tranquilae.com';
const FROM_NAME = process.env.FROM_NAME || 'Tranquilae';

/**
 * Send transactional email using Resend
 */
export async function sendEmail(emailData: EmailData): Promise<void> {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    
    const template = emailTemplates[emailData.template];
    if (!template) {
      throw new Error(`Email template '${emailData.template}' not found`);
    }

    // Render template with data
    const html = template.html(emailData.data);
    const text = template.text(emailData.data);

    const emailOptions = {
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [emailData.to],
      subject: emailData.subject,
      html: html,
      text: text,
      // Add Tranquilae branding
      headers: {
        'X-Mailer': 'Tranquilae Wellness Platform',
      },
      tags: [
        {
          name: 'category',
          value: emailData.template
        }
      ]
    };

    const { data, error } = await resend.emails.send(emailOptions);
    
    if (error) {
      throw new Error(`Resend API error: ${error.message}`);
    }
    
    // Log success in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Email sent successfully:');
      console.log('- To:', emailData.to);
      console.log('- Subject:', emailData.subject);
      console.log('- Template:', emailData.template);
      console.log('- Message ID:', data?.id);
    }

  } catch (error) {
    console.error('❌ Failed to send email:', error);
    
    // In production, you might want to queue failed emails for retry
    if (process.env.NODE_ENV === 'production') {
      // TODO: Add to retry queue or log to monitoring service
      console.error('📧 Email sending failed in production:', {
        to: emailData.to,
        template: emailData.template,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    
    throw error;
  }
}

/**
 * Send multiple emails (batch sending)
 */
export async function sendBatchEmails(emails: EmailData[]): Promise<void> {
  const results = await Promise.allSettled(
    emails.map(email => sendEmail(email))
  );

  const failures = results.filter(result => result.status === 'rejected');
  
  if (failures.length > 0) {
    console.error(`${failures.length} out of ${emails.length} emails failed to send`);
    failures.forEach((failure, index) => {
      if (failure.status === 'rejected') {
        console.error(`Email ${index} failed:`, failure.reason);
      }
    });
  }
}

/**
 * Verify Resend email configuration
 */
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY is not configured');
      return false;
    }
    
    // Test Resend connection by sending a test email to ourselves
    // (In practice, you might want to use Resend's API to check domains)
    console.log('✅ Resend API key is configured');
    console.log('📧 To fully test, send a real email through the system');
    
    return true;
  } catch (error) {
    console.error('❌ Email configuration is invalid:', error);
    return false;
  }
}
