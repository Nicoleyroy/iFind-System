const config = require('./index');

let OAuth2Client = null;
try {
  OAuth2Client = require('google-auth-library').OAuth2Client;
} catch (err) {
  console.warn('google-auth-library not installed. Google OAuth endpoints will be disabled until you run `npm install` in the server folder.');
}

let oauth2Client = null;
if (config.GOOGLE_CLIENT_ID && OAuth2Client) {
  oauth2Client = new OAuth2Client(
    config.GOOGLE_CLIENT_ID, 
    config.GOOGLE_CLIENT_SECRET || undefined
  );
}

module.exports = {
  OAuth2Client,
  oauth2Client,
  GOOGLE_CLIENT_ID: config.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: config.GOOGLE_CLIENT_SECRET,
};

