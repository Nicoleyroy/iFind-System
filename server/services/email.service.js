const mailTransport = require('../config/email');
const config = require('../config');

const sendPasswordResetEmail = async (email, code, hostname) => {
  if (!mailTransport) {
    console.warn('Mail transport not configured; skipping send');
    if (config.NODE_ENV !== 'production') {
      console.log(`Password reset code for ${email}: ${code}`);
    }
    return { sent: false, devCode: code };
  }

  const mail = {
    from: config.SMTP_FROM || `no-reply@${hostname || 'iFind'}`,
    to: email,
    subject: 'iFind Password Reset Code',
    text: `Your password reset code is: ${code}. It expires in 15 minutes.`,
    html: `<p>Your password reset code is: <strong>${code}</strong>. It expires in 15 minutes.</p>`,
  };

  await mailTransport.sendMail(mail);
  return { sent: true };
};

const sendTestEmail = async (to, hostname) => {
  if (!mailTransport) {
    throw new Error('Mail transport not configured');
  }

  const info = await mailTransport.sendMail({
    from: config.SMTP_FROM || `no-reply@${hostname || 'iFind'}`,
    to,
    subject: 'iFind SMTP test',
    text: 'This is a test email from iFind (development). If you received this, SMTP is configured correctly.',
    html: '<p>This is a <strong>test</strong> email from iFind (development).</p>',
  });

  return info;
};

module.exports = {
  sendPasswordResetEmail,
  sendTestEmail,
};

