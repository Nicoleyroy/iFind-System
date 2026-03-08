const https = require('https');
const config = require('../config');

/**
 * Verify reCAPTCHA token with Google's API
 * @param {string} token - The reCAPTCHA response token from the client
 * @param {string} remoteip - Optional: The user's IP address
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function verifyRecaptcha(token, remoteip = null) {
  // Skip verification in development if no secret key is configured
  if (!config.RECAPTCHA_SECRET_KEY || config.RECAPTCHA_SECRET_KEY === 'YOUR_RECAPTCHA_SECRET_KEY_HERE') {
    if (config.NODE_ENV === 'development') {
      console.warn('⚠️  reCAPTCHA verification skipped: Secret key not configured');
      return { success: true, warning: 'reCAPTCHA not configured' };
    }
    return { success: false, error: 'reCAPTCHA not configured on server' };
  }

  if (!token) {
    return { success: false, error: 'Missing reCAPTCHA token' };
  }

  // Build the verification request
  const params = new URLSearchParams({
    secret: config.RECAPTCHA_SECRET_KEY,
    response: token,
  });

  if (remoteip) {
    params.append('remoteip', remoteip);
  }

  const postData = params.toString();

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'www.google.com',
      port: 443,
      path: '/recaptcha/api/siteverify',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (response.success) {
            resolve({ success: true });
          } else {
            console.error('reCAPTCHA verification failed:', response['error-codes']);
            resolve({ 
              success: false, 
              error: 'reCAPTCHA verification failed',
              errorCodes: response['error-codes']
            });
          }
        } catch (err) {
          console.error('Error parsing reCAPTCHA response:', err);
          resolve({ success: false, error: 'Failed to verify reCAPTCHA' });
        }
      });
    });

    req.on('error', (err) => {
      console.error('reCAPTCHA verification request error:', err);
      resolve({ success: false, error: 'Failed to connect to reCAPTCHA service' });
    });

    req.write(postData);
    req.end();
  });
}

module.exports = {
  verifyRecaptcha,
};
