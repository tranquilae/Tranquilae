export const accountRestoredTemplate = {
  subject: 'Account Restored - Welcome Back!',
  
  html: (data: { name: string; dashboardUrl: string }) => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Account Restored - Tranquilae</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #2d3748;
          background-color: #fdf6f0;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: white;
          border-radius: 16px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .content {
          padding: 40px 30px;
        }
        .success-box {
          background-color: #f0fff4;
          border: 2px solid #9ae6b4;
          border-radius: 12px;
          padding: 20px;
          margin: 20px 0;
          text-align: center;
        }
        .success-icon {
          font-size: 48px;
          margin-bottom: 15px;
        }
        .success-title {
          color: #38a169;
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .success-message {
          color: #2f855a;
          margin-bottom: 0;
        }
        .btn {
          display: inline-block;
          padding: 14px 28px;
          background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          text-align: center;
          margin: 20px 0;
          transition: all 0.3s ease;
        }
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(72, 187, 120, 0.4);
        }
        .what-next {
          background-color: #f7fafc;
          border-radius: 12px;
          padding: 25px;
          margin: 30px 0;
        }
        .section-title {
          color: #2d3748;
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 15px;
        }
        .steps-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .steps-list li {
          padding: 10px 0;
          padding-left: 30px;
          position: relative;
          border-bottom: 1px solid #e2e8f0;
        }
        .steps-list li:last-child {
          border-bottom: none;
        }
        .steps-list li:before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #48bb78;
          font-weight: bold;
          font-size: 16px;
        }
        .security-reminder {
          background-color: #ebf8ff;
          border-radius: 12px;
          padding: 20px;
          margin: 25px 0;
          border-left: 4px solid #4299e1;
        }
        .reminder-title {
          color: #2b6cb0;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .footer {
          background-color: #f7fafc;
          padding: 30px;
          text-align: center;
          color: #718096;
          font-size: 14px;
        }
        .contact-info {
          margin-top: 20px;
          padding: 20px;
          background-color: #edf2f7;
          border-radius: 8px;
          text-align: center;
        }
        @media (max-width: 600px) {
          .container {
            margin: 20px;
            border-radius: 12px;
          }
          .header, .content {
            padding: 20px;
          }
          .btn {
            display: block;
            margin: 20px 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🌿 Tranquilae</div>
          <p>Account Restored Successfully</p>
        </div>
        
        <div class="content">
          <h1 style="color: #2d3748; margin-bottom: 20px;">Welcome back, ${data.name}! 🎉</h1>
          
          <div class="success-box">
            <div class="success-icon">✅</div>
            <div class="success-title">Your Account is Active Again</div>
            <p class="success-message">
              Great news! We've completed our security review and your account has been fully restored.
            </p>
          </div>
          
          <p>We're pleased to inform you that our security team has completed the review of your account. After careful investigation, we've determined that your account is secure and all restrictions have been lifted.</p>
          
          <p><strong>What was reviewed:</strong><br>
          Our security team verified your identity and payment methods, ensuring that all account activity was legitimate and authorized by you.</p>
          
          <div style="text-align: center;">
            <a href="${data.dashboardUrl}" class="btn">Access Your Dashboard</a>
          </div>
          
          <div class="what-next">
            <div class="section-title">What you can do now:</div>
            <ul class="steps-list">
              <li>Access your full Tranquilae dashboard and features</li>
              <li>Continue your mindfulness journey where you left off</li>
              <li>Manage your subscription and account settings</li>
              <li>Explore new meditation sessions and wellness content</li>
              <li>Connect with the Tranquilae community</li>
            </ul>
          </div>
          
          <div class="security-reminder">
            <div class="reminder-title">🔒 Enhanced Security Moving Forward</div>
            <p>To help prevent future security alerts, we recommend:</p>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Always log in from trusted devices and secure networks</li>
              <li>Keep your account information up to date</li>
              <li>Contact us immediately if you notice any unusual account activity</li>
              <li>Use a strong, unique password for your account</li>
            </ul>
          </div>
          
          <p><strong>Thank you for your patience</strong><br>
          We understand that security alerts can be concerning, and we appreciate your cooperation during the review process. Your account security is our highest priority.</p>
          
          <div class="contact-info">
            <p><strong>Need Assistance?</strong></p>
            <p>If you have any questions or concerns, our support team is here to help:</p>
            <p>📧 Email Support • 🔗 Help Center • 💬 Live Chat Available</p>
            <p style="font-size: 12px; margin-top: 15px;">
              Response time: Usually within 2 hours during business hours
            </p>
          </div>
          
          <p style="margin-top: 30px; text-align: center;">
            <strong>Welcome back to your wellness journey! 🧘‍♀️</strong><br>
            <em>We're excited to continue supporting your mindfulness practice.</em>
          </p>
        </div>
        
        <div class="footer">
          <p><strong>Tranquilae Security Team</strong></p>
          <p>Your account has been fully restored and is ready to use. Thank you for being a valued member of our community!</p>
          <p style="margin-top: 20px; font-size: 12px;">
            This confirmation was sent to notify you that your account restrictions have been lifted.
            All account features are now fully accessible.
          </p>
        </div>
      </div>
    </body>
    </html>
  `,
  
  text: (data: { name: string; dashboardUrl: string }) => `
    ACCOUNT RESTORED - Tranquilae

    Welcome back, ${data.name}! 🎉

    YOUR ACCOUNT IS ACTIVE AGAIN

    Great news! We've completed our security review and your account has been fully restored.

    We're pleased to inform you that our security team has completed the review of your account. After careful investigation, we've determined that your account is secure and all restrictions have been lifted.

    What was reviewed:
    Our security team verified your identity and payment methods, ensuring that all account activity was legitimate and authorized by you.

    ACCESS YOUR DASHBOARD: ${data.dashboardUrl}

    What you can do now:
    ✓ Access your full Tranquilae dashboard and features
    ✓ Continue your mindfulness journey where you left off
    ✓ Manage your subscription and account settings
    ✓ Explore new meditation sessions and wellness content
    ✓ Connect with the Tranquilae community

    🔒 Enhanced Security Moving Forward
    To help prevent future security alerts, we recommend:
    - Always log in from trusted devices and secure networks
    - Keep your account information up to date
    - Contact us immediately if you notice any unusual account activity
    - Use a strong, unique password for your account

    Thank you for your patience
    We understand that security alerts can be concerning, and we appreciate your cooperation during the review process. Your account security is our highest priority.

    Need Assistance?
    If you have any questions or concerns, our support team is here to help:
    📧 Email Support • 🔗 Help Center • 💬 Live Chat Available
    Response time: Usually within 2 hours during business hours

    Welcome back to your wellness journey! 🧘‍♀️
    We're excited to continue supporting your mindfulness practice.

    Tranquilae Security Team
    Your account has been fully restored and is ready to use. Thank you for being a valued member of our community!
  `
};
