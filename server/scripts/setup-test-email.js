/**
 * Setup Test Email Configuration
 * This script creates a test email account on Ethereal (fake SMTP service)
 * Run: node setup-test-email.js
 */

const nodemailer = require('nodemailer');

async function setupTestEmail() {
  console.log('Creating test email account on Ethereal...\n');
  
  try {
    // Create a test account
    const testAccount = await nodemailer.createTestAccount();
    
    console.log('Test email account created successfully!\n');
    console.log('Add these to your .env file:\n');
    console.log('SMTP_HOST=' + testAccount.smtp.host);
    console.log('SMTP_PORT=' + testAccount.smtp.port);
    console.log('SMTP_SECURE=' + testAccount.smtp.secure);
    console.log('SMTP_USER=' + testAccount.user);
    console.log('SMTP_PASS=' + testAccount.pass);
    console.log('SMTP_FROM=noreply@ifind.com\n');
    
    console.log('Test email address: ' + testAccount.user);
    console.log('View sent emails at: https://ethereal.email/messages\n');
    console.log(' Note: This is for TESTING only. For production, use real Gmail credentials.');
    
  } catch (error) {
    console.error('Error creating test account:', error.message);
  }
}

setupTestEmail();
