const config = require('./index');

let nodemailer = null;
try {
  nodemailer = require('nodemailer');
} catch (err) {
  console.warn('nodemailer not installed. Email sending will be disabled until you run `npm install` in the server folder.');
}

let mailTransport = null;
if (nodemailer && config.SMTP_HOST && config.SMTP_PORT && config.SMTP_USER && config.SMTP_PASS) {
  mailTransport = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: parseInt(config.SMTP_PORT, 10),
    secure: config.SMTP_SECURE,
    auth: {
      user: config.SMTP_USER,
      pass: config.SMTP_PASS,
    },
  });
  
  mailTransport.verify()
    .then(() => console.log('Mail transport configured and ready'))
    .catch((err) => console.warn('Mail transport verification failed:', err?.message || err));
}

module.exports = mailTransport;

