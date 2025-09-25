/**
 * Email Templates for Tranquilae
 * All templates follow the Tranquilae brand: soft cream, nature green, soft blue
 */

interface EmailTemplate {
  html: (data: Record<string, any>) => string;
  text: (data: Record<string, any>) => string;
}

// Common styling for all emails
const baseStyles = `
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #374151;
      margin: 0;
      padding: 0;
      background-color: #f5f5f0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #6ba368 0%, #a7c7e7 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .button {
      display: inline-block;
      background: #6ba368;
      color: white;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 25px;
      font-weight: 600;
      margin: 20px 0;
      transition: background-color 0.2s;
    }
    .button:hover {
      background: #5a8c57;
    }
    .warning {
      background: #fef3cd;
      border: 1px solid #fbbf24;
      border-radius: 8px;
      padding: 16px;
      margin: 20px 0;
    }
    .success {
      background: #d1fae5;
      border: 1px solid #10b981;
      border-radius: 8px;
      padding: 16px;
      margin: 20px 0;
    }
    .footer {
      background: #f9fafb;
      padding: 20px 30px;
      text-align: center;
      font-size: 14px;
      color: #6b7280;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: white;
    }
  </style>
`;

export const emailTemplates: Record<string, EmailTemplate> = {
  // Welcome email for Explorer plan
  welcome: {
    html: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        ${baseStyles}
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🌿 Tranquilae</div>
            <h1>Welcome to your wellness journey!</h1>
          </div>
          <div class="content">
            <p>Hi ${data['name']},</p>
            
            <p>Welcome to Tranquilae! We're excited to help you on your wellness journey with our ${data['plan'] === 'pathfinder' ? 'Pathfinder' : 'Explorer'} plan.</p>
            
            ${data['plan'] === 'explorer' ? `
              <div class="success">
                <strong>🎉 Your Explorer plan is now active!</strong><br>
                Start tracking your wellness with our essential features. You can upgrade to Pathfinder anytime for advanced coaching and analytics.
              </div>
            ` : ''}
            
            <p>Here's what you can do next:</p>
            <ul>
              <li>Complete your profile in the dashboard</li>
              <li>Set up your first wellness goals</li>
              <li>Connect your favorite apps and devices</li>
              <li>Explore our AI-powered insights</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${data['dashboardUrl']}" class="button">Go to Dashboard</a>
            </div>
            
            <p>If you have any questions, our support team is here to help!</p>
            
            <p>Best regards,<br>The Tranquilae Team</p>
          </div>
          <div class="footer">
            <p>© 2024 Tranquilae. All rights reserved.</p>
            <p>You're receiving this because you signed up for Tranquilae.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: (data) => `
      Welcome to Tranquilae, ${data['name']}!
      
      We're excited to help you on your wellness journey with our ${data['plan'] === 'pathfinder' ? 'Pathfinder' : 'Explorer'} plan.
      
      Here's what you can do next:
      - Complete your profile in the dashboard
      - Set up your first wellness goals  
      - Connect your favorite apps and devices
      - Explore our AI-powered insights
      
      Go to Dashboard: ${data['dashboardUrl']}
      
      If you have any questions, our support team is here to help!
      
      Best regards,
      The Tranquilae Team
    `
  },

  // Welcome email for Pathfinder with trial
  'pathfinder-welcome': {
    html: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        ${baseStyles}
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🌿 Tranquilae</div>
            <h1>Welcome to Pathfinder! 🚀</h1>
          </div>
          <div class="content">
            <p>Hi ${data['name']},</p>
            
            <div class="success">
              <strong>🎉 Your 7-day Pathfinder trial has started!</strong><br>
              Trial ends: ${data['trialEndDate']}
            </div>
            
            <p>You now have full access to all Pathfinder features:</p>
            <ul>
              <li>✓ Personalized AI coaching</li>
              <li>✓ Advanced analytics and insights</li>
              <li>✓ All device integrations</li>
              <li>✓ Premium content and programs</li>
              <li>✓ Priority support</li>
            </ul>
            
            <p>Your card ending in ****${data['cardLast4'] || 'XXXX'} is saved for when your trial ends. You can manage your billing anytime.</p>
            
            <div style="text-align: center;">
              <a href="${data['dashboardUrl']}" class="button">Explore Pathfinder</a>
              <br><br>
              <a href="${data['billingPortalUrl']}" style="color: #6b7280; text-decoration: none; font-size: 14px;">Manage Billing</a>
            </div>
            
            <p>Make the most of your trial and discover how Pathfinder can transform your wellness routine!</p>
            
            <p>Best regards,<br>The Tranquilae Team</p>
          </div>
          <div class="footer">
            <p>© 2024 Tranquilae. All rights reserved.</p>
            <p>Trial ends ${data['trialEndDate']} • Cancel anytime</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: (data) => `
      Welcome to Pathfinder, ${data['name']}!
      
      🎉 Your 7-day Pathfinder trial has started!
      Trial ends: ${data['trialEndDate']}
      
      You now have full access to all Pathfinder features:
      - Personalized AI coaching
      - Advanced analytics and insights  
      - All device integrations
      - Premium content and programs
      - Priority support
      
      Explore Pathfinder: ${data['dashboardUrl']}
      Manage Billing: ${data['billingPortalUrl']}
      
      Make the most of your trial and discover how Pathfinder can transform your wellness routine!
      
      Best regards,
      The Tranquilae Team
    `
  },

  // Payment success notification
  'payment-success': {
    html: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        ${baseStyles}
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🌿 Tranquilae</div>
            <h1>Payment Successful! 💳</h1>
          </div>
          <div class="content">
            <p>Hi ${data['name']},</p>
            
            <div class="success">
              <strong>✅ Payment of ${data['currency']} ${data['amount']} processed successfully</strong><br>
              Your Pathfinder subscription is now active!
            </div>
            
            <p>Thank you for choosing Pathfinder! Here's what's included in your subscription:</p>
            <ul>
              <li>🤖 Personalized AI coaching</li>
              <li>📊 Advanced analytics dashboard</li>
              <li>📱 All device integrations</li>
              <li>🎯 Premium wellness programs</li>
              <li>💬 Priority support</li>
            </ul>
            
            <p><strong>Next billing date:</strong> ${data['nextBillingDate']}</p>
            
            <div style="text-align: center;">
              <a href="${data['dashboardUrl']}" class="button">Go to Dashboard</a>
            </div>
            
            <p>Your wellness journey continues with full Pathfinder benefits. Let's achieve your goals together!</p>
            
            <p>Best regards,<br>The Tranquilae Team</p>
          </div>
          <div class="footer">
            <p>© 2024 Tranquilae. All rights reserved.</p>
            <p>Next billing: ${data['nextBillingDate']}</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: (data) => `
      Payment Successful!
      
      Hi ${data['name']},
      
      ✅ Payment of ${data['currency']} ${data['amount']} processed successfully
      Your Pathfinder subscription is now active!
      
      Thank you for choosing Pathfinder! Here's what's included:
      - Personalized AI coaching
      - Advanced analytics dashboard
      - All device integrations  
      - Premium wellness programs
      - Priority support
      
      Next billing date: ${data['nextBillingDate']}
      
      Go to Dashboard: ${data['dashboardUrl']}
      
      Your wellness journey continues with full Pathfinder benefits. Let's achieve your goals together!
      
      Best regards,
      The Tranquilae Team
    `
  },

  // Payment failure and downgrade notification
  'payment-failure-downgrade': {
    html: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        ${baseStyles}
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🌿 Tranquilae</div>
            <h1>Payment Issue - Switched to Explorer</h1>
          </div>
          <div class="content">
            <p>Hi ${data['name']},</p>
            
            <div class="warning">
              <strong>⚠️ Payment Issue</strong><br>
              ${data['reason']}. Don't worry - we've automatically switched you to our Explorer plan so you can continue your wellness journey uninterrupted.
            </div>
            
            <p><strong>What happened?</strong><br>
            We were unable to process payment for your Pathfinder subscription, so we've moved you to our free Explorer plan to ensure you don't lose access to your wellness data.</p>
            
            <p><strong>What you still have access to:</strong></p>
            <ul>
              <li>✓ Essential wellness tracking</li>
              <li>✓ Basic AI insights</li>
              <li>✓ Core features and data</li>
              <li>✓ Your complete wellness history</li>
            </ul>
            
            <p><strong>Ready to upgrade back to Pathfinder?</strong><br>
            Update your payment method to regain access to personalized AI coaching, advanced analytics, and all premium features.</p>
            
            <div style="text-align: center;">
              <a href="${data['upgradeUrl']}" class="button">Update Payment & Upgrade</a>
              <br><br>
              <a href="${data['dashboardUrl']}" style="color: #6b7280; text-decoration: none;">Continue with Explorer</a>
            </div>
            
            <p>Need help? Our support team is ready to assist you at any time.</p>
            
            <div style="text-align: center; margin: 20px 0;">
              <a href="${data['supportUrl']}" style="color: #6ba368; text-decoration: none;">Contact Support</a>
            </div>
            
            <p>Best regards,<br>The Tranquilae Team</p>
          </div>
          <div class="footer">
            <p>© 2024 Tranquilae. All rights reserved.</p>
            <p>You're currently on the Explorer plan</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: (data) => `
      Payment Issue - Switched to Explorer
      
      Hi ${data['name']},
      
      ⚠️ Payment Issue
      ${data['reason']}. Don't worry - we've automatically switched you to our Explorer plan so you can continue your wellness journey uninterrupted.
      
      What happened?
      We were unable to process payment for your Pathfinder subscription, so we've moved you to our free Explorer plan to ensure you don't lose access to your wellness data.
      
      What you still have access to:
      - Essential wellness tracking
      - Basic AI insights
      - Core features and data
      - Your complete wellness history
      
      Ready to upgrade back to Pathfinder?
      Update your payment method to regain access to personalized AI coaching, advanced analytics, and all premium features.
      
      Update Payment & Upgrade: ${data['upgradeUrl']}
      Continue with Explorer: ${data['dashboardUrl']}
      Contact Support: ${data['supportUrl']}
      
      Need help? Our support team is ready to assist you at any time.
      
      Best regards,
      The Tranquilae Team
    `
  },

  // Upgrade reminder email
  'upgrade-reminder': {
    html: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        ${baseStyles}
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🌿 Tranquilae</div>
            <h1>Missing Pathfinder? 🚀</h1>
          </div>
          <div class="content">
            <p>Hi ${data['name']},</p>
            
            <p>We hope you're enjoying Tranquilae! We noticed you're currently on our Explorer plan, and wanted to remind you about the powerful features available with Pathfinder.</p>
            
            <p><strong>Upgrade to Pathfinder and unlock:</strong></p>
            <ul>
              <li>🤖 AI Coach that learns your preferences</li>
              <li>📊 Advanced analytics and trends</li>
              <li>🔗 Connect all your favorite apps</li>
              <li>🎯 Personalized programs and challenges</li>
              <li>💬 Priority support from our team</li>
            </ul>
            
            <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <strong>🎁 Special Offer</strong><br>
              Start with a 7-day free trial - no commitment required!
            </div>
            
            <div style="text-align: center;">
              <a href="${data['upgradeUrl']}" class="button">Start 7-Day Free Trial</a>
              <br><br>
              <a href="${data['featuresUrl']}" style="color: #6b7280; text-decoration: none;">Compare Plans</a>
            </div>
            
            <p>Questions? Reply to this email and we'll help you choose the right plan for your wellness goals.</p>
            
            <p>Keep thriving,<br>The Tranquilae Team</p>
          </div>
          <div class="footer">
            <p>© 2024 Tranquilae. All rights reserved.</p>
            <p>You can unsubscribe from promotional emails in your account settings</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: (data) => `
      Missing Pathfinder?
      
      Hi ${data['name']},
      
      We hope you're enjoying Tranquilae! We noticed you're currently on our Explorer plan, and wanted to remind you about the powerful features available with Pathfinder.
      
      Upgrade to Pathfinder and unlock:
      - AI Coach that learns your preferences
      - Advanced analytics and trends
      - Connect all your favorite apps
      - Personalized programs and challenges
      - Priority support from our team
      
      🎁 Special Offer
      Start with a 7-day free trial - no commitment required!
      
      Start 7-Day Free Trial: ${data['upgradeUrl']}
      Compare Plans: ${data['featuresUrl']}
      
      Questions? Reply to this email and we'll help you choose the right plan for your wellness goals.
      
      Keep thriving,
      The Tranquilae Team
    `
  },

  // Trial ending reminder
  'trial-ending': {
    html: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        ${baseStyles}
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🌿 Tranquilae</div>
            <h1>Your trial ends ${data['daysLeft']} day${data['daysLeft'] === 1 ? '' : 's'}</h1>
          </div>
          <div class="content">
            <p>Hi ${data['name']},</p>
            
            <div class="warning">
              <strong>⏰ Trial ending soon</strong><br>
              Your Pathfinder trial ends on ${data['trialEndDate']}
            </div>
            
            <p>We hope you've enjoyed exploring all the powerful features of Pathfinder! ${data['daysLeft'] === 1 ? 'Tomorrow' : `In ${data['daysLeft']} days`}, your trial will end and we'll charge your saved payment method to continue your Pathfinder subscription.</p>
            
            <p><strong>What happens next?</strong></p>
            <ul>
              <li>Your subscription continues automatically</li>
              <li>You keep all Pathfinder features</li>
              <li>Your wellness data stays safe</li>
              <li>Cancel anytime if you change your mind</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${data['billingUrl']}" class="button">Manage Subscription</a>
            </div>
            
            <p>Want to continue with Explorer instead? You can cancel your Pathfinder subscription and we'll automatically switch you to our free Explorer plan.</p>
            
            <p>Questions? We're here to help!</p>
            
            <p>Best regards,<br>The Tranquilae Team</p>
          </div>
          <div class="footer">
            <p>© 2024 Tranquilae. All rights reserved.</p>
            <p>Trial ends ${data['trialEndDate']}</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: (data) => `
      Your trial ends ${data['daysLeft']} day${data['daysLeft'] === 1 ? '' : 's'}
      
      Hi ${data['name']},
      
      ⏰ Trial ending soon
      Your Pathfinder trial ends on ${data['trialEndDate']}
      
      We hope you've enjoyed exploring all the powerful features of Pathfinder! ${data['daysLeft'] === 1 ? 'Tomorrow' : `In ${data['daysLeft']} days`}, your trial will end and we'll charge your saved payment method to continue your Pathfinder subscription.
      
      What happens next?
      - Your subscription continues automatically
      - You keep all Pathfinder features  
      - Your wellness data stays safe
      - Cancel anytime if you change your mind
      
      Manage Subscription: ${data['billingUrl']}
      
      Want to continue with Explorer instead? You can cancel your Pathfinder subscription and we'll automatically switch you to our free Explorer plan.
      
      Questions? We're here to help!
      
      Best regards,
      The Tranquilae Team
    `
  }
};
