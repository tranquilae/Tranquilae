export const fraudAlertTemplate = {
  subject: 'Account Security Alert - Verification Required',
  
  html: (data: { name: string; supportUrl: string }) => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Security Alert - Tranquilae</title>
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
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
        .alert-box {
          background-color: #fff5f5;
          border: 2px solid #feb2b2;
          border-radius: 12px;
          padding: 20px;
          margin: 20px 0;
          text-align: center;
        }
        .alert-icon {
          font-size: 48px;
          margin-bottom: 15px;
        }
        .alert-title {
          color: #e53e3e;
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .alert-message {
          color: #742a2a;
          margin-bottom: 0;
        }
        .btn {
          display: inline-block;
          padding: 14px 28px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        .security-tips {
          background-color: #f7fafc;
          border-radius: 12px;
          padding: 25px;
          margin: 30px 0;
        }
        .tips-title {
          color: #2d3748;
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 15px;
        }
        .tips-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .tips-list li {
          padding: 8px 0;
          padding-left: 25px;
          position: relative;
        }
        .tips-list li:before {
          content: "🔒";
          position: absolute;
          left: 0;
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
          <p>Account Security Alert</p>
        </div>
        
        <div class="content">
          <h1 style="color: #2d3748; margin-bottom: 20px;">Hi ${data.name}!</h1>
          
          <div class="alert-box">
            <div class="alert-icon">⚠️</div>
            <div class="alert-title">Unusual Account Activity Detected</div>
            <p class="alert-message">
              We've temporarily restricted your account due to unusual activity that may indicate fraud or misuse.
            </p>
          </div>
          
          <p>Your account security is our top priority. We've detected some suspicious activity associated with your account and have taken precautionary measures to protect you.</p>
          
          <p><strong>What happened:</strong><br>
          Our fraud prevention systems flagged your recent payment activity for manual review. This could be due to various factors including unusual location, spending patterns, or payment methods.</p>
          
          <p><strong>What we've done:</strong><br>
          We've temporarily suspended account access while we investigate. Your data remains safe and secure.</p>
          
          <div style="text-align: center;">
            <a href="${data.supportUrl}" class="btn">Contact Support</a>
          </div>
          
          <div class="security-tips">
            <div class="tips-title">Account Security Best Practices:</div>
            <ul class="tips-list">
              <li>Use a strong, unique password for your Tranquilae account</li>
              <li>Enable two-factor authentication if available</li>
              <li>Only access your account from trusted devices</li>
              <li>Never share your login credentials with others</li>
              <li>Contact us immediately if you notice suspicious activity</li>
            </ul>
          </div>
          
          <p><strong>Need immediate assistance?</strong><br>
          Our support team is here to help verify your identity and restore your account access quickly and securely.</p>
          
          <div class="contact-info">
            <p><strong>Get Help:</strong></p>
            <p>📧 Email us for account verification<br>
            🔗 Visit our support center<br>
            📱 We typically respond within 2 hours during business hours</p>
          </div>
          
          <p style="margin-top: 30px; color: #718096; font-size: 14px;">
            If you believe this alert was sent in error, please contact our support team immediately. We apologize for any inconvenience this may cause.
          </p>
        </div>
        
        <div class="footer">
          <p><strong>Tranquilae Security Team</strong></p>
          <p>This is an automated security alert. If you did not request this action, please contact support immediately.</p>
          <p style="margin-top: 20px; font-size: 12px;">
            This email was sent to ensure the security of your Tranquilae account. 
            We take your privacy and security seriously.
          </p>
        </div>
      </div>
    </body>
    </html>
  `,
  
  text: (data: { name: string; supportUrl: string }) => `
    ACCOUNT SECURITY ALERT - Tranquilae

    Hi ${data.name}!

    UNUSUAL ACCOUNT ACTIVITY DETECTED

    We've temporarily restricted your account due to unusual activity that may indicate fraud or misuse.

    Your account security is our top priority. We've detected some suspicious activity associated with your account and have taken precautionary measures to protect you.

    What happened:
    Our fraud prevention systems flagged your recent payment activity for manual review. This could be due to various factors including unusual location, spending patterns, or payment methods.

    What we've done:
    We've temporarily suspended account access while we investigate. Your data remains safe and secure.

    CONTACT SUPPORT: ${data.supportUrl}

    Account Security Best Practices:
    - Use a strong, unique password for your Tranquilae account
    - Enable two-factor authentication if available
    - Only access your account from trusted devices
    - Never share your login credentials with others
    - Contact us immediately if you notice suspicious activity

    Need immediate assistance?
    Our support team is here to help verify your identity and restore your account access quickly and securely.

    Get Help:
    📧 Email us for account verification
    🔗 Visit our support center
    📱 We typically respond within 2 hours during business hours

    If you believe this alert was sent in error, please contact our support team immediately. We apologize for any inconvenience this may cause.

    Tranquilae Security Team
    This is an automated security alert. If you did not request this action, please contact support immediately.
  `
};
