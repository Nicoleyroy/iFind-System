const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const { OAuth2 } = google.auth;

const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const CREDENTIALS_PATH = path.join(__dirname, '..', 'drive_credentials.json');

const getOAuthClient = () => {
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI; // e.g., https://yourdomain.com/api/backup/drive/callback
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Google Drive OAuth credentials not configured');
  }
  return new OAuth2(clientId, clientSecret, redirectUri);
};

exports.connect = (req, res) => {
  try {
    const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI;
    
    if (!clientId || !clientSecret || !redirectUri) {
      return res.status(500).send(`
        <!doctype html>
        <html>
          <head><meta charset="utf-8"><title>Configuration Error</title></head>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Google Drive Not Configured</h2>
            <p>Google Drive credentials are missing. Please configure the following environment variables:</p>
            <ul>
              <li>GOOGLE_DRIVE_CLIENT_ID</li>
              <li>GOOGLE_DRIVE_CLIENT_SECRET</li>
              <li>GOOGLE_DRIVE_REDIRECT_URI</li>
            </ul>
            <p><a href="#" onclick="window.close()">Close this window</a></p>
          </body>
        </html>
      `);
    }
    
    const oauth2Client = getOAuthClient();
    const scopes = [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.metadata'
    ];
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
    });
    return res.redirect(url);
  } catch (err) {
    console.error('Drive connect error', err);
    return res.status(500).json({ message: 'Failed to start Google Drive OAuth flow', error: err.message });
  }
};

// (debug endpoint removed) -- production-ready flow uses popup + postMessage

exports.callback = async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) return res.status(400).json({ message: 'Missing authorization code' });

    const oauth2Client = getOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    // Persist tokens to disk (or DB) for later use
    fs.writeFileSync(CREDENTIALS_PATH, JSON.stringify(tokens, null, 2));

    // Return a small HTML page that notifies the opener (client) and closes the popup
    const successHtml = `<!doctype html>
      <html>
        <head><meta charset="utf-8"><title>Drive Connected</title></head>
        <body>
          <p>Google Drive connected successfully. This window will close automatically.</p>
          <script>
            try {
              if (window.opener) {
                window.opener.postMessage({ type: 'drive_connected', success: true }, '*');
              }
            } catch (e) {
              // ignore
            }
            setTimeout(function(){ window.close(); }, 750);
          </script>
        </body>
      </html>`;
    res.send(successHtml);
  } catch (err) {
    console.error('Drive callback error', err);
    const errorHtml = `<!doctype html>
      <html>
        <head><meta charset="utf-8"><title>Drive Connect Error</title></head>
        <body>
          <p>Failed to connect Google Drive. You can close this window.</p>
          <script>
            try {
              if (window.opener) {
                window.opener.postMessage({ type: 'drive_connected', success: false, error: ${JSON.stringify(err.message)} }, '*');
              }
            } catch (e) {}
            setTimeout(function(){ window.close(); }, 2000);
          </script>
        </body>
      </html>`;
    res.status(500).send(errorHtml);
  }
};

const loadCredentials = () => {
  if (!fs.existsSync(CREDENTIALS_PATH)) return null;
  try {
    const data = fs.readFileSync(CREDENTIALS_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    console.warn('Failed to read drive credentials', e);
    return null;
  }
};

exports.getStatus = (req, res) => {
  const creds = loadCredentials();
  if (!creds) return res.json({ connected: false });
  return res.json({ connected: true, tokens: { hasRefreshToken: !!creds.refresh_token } });
};

exports.uploadBackup = async (req, res) => {
  try {
    console.log('Upload backup request received:', req.body);
    
    const { fileName } = req.body || {};
    if (!fileName) return res.status(400).json({ message: 'fileName is required' });

    const filePath = path.join(BACKUP_DIR, fileName);
    console.log('Checking file path:', filePath);
    
    if (!fs.existsSync(filePath)) {
      console.log('File not found:', filePath);
      return res.status(404).json({ message: 'Backup file not found' });
    }

    // Check if Google Drive is configured
    const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI;
    
    console.log('Drive credentials check:', { 
      hasClientId: !!clientId, 
      hasClientSecret: !!clientSecret, 
      hasRedirectUri: !!redirectUri 
    });
    
    if (!clientId || !clientSecret || !redirectUri) {
      return res.status(400).json({ 
        success: false,
        message: 'Google Drive is not configured. Please add GOOGLE_DRIVE_CLIENT_ID, GOOGLE_DRIVE_CLIENT_SECRET, and GOOGLE_DRIVE_REDIRECT_URI to your environment variables.' 
      });
    }

    const oauth2Client = getOAuthClient();
    const creds = loadCredentials();
    console.log('Credentials loaded:', !!creds);
    
    if (!creds) {
      return res.status(400).json({ 
        success: false,
        message: 'Google Drive not connected. Please connect your Google Drive account first.' 
      });
    }
    oauth2Client.setCredentials(creds);

    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    const fileMetadata = { name: fileName };
    const media = { mimeType: 'application/json', body: fs.createReadStream(filePath) };

    console.log('Uploading to Google Drive...');
    const response = await drive.files.create({
      resource: fileMetadata,
      media,
      fields: 'id,name,webViewLink'
    });

    console.log('Upload successful:', response.data);
    return res.json({ success: true, file: response.data });
  } catch (err) {
    console.error('Drive upload error:', err);
    return res.status(500).json({ success: false, message: 'Failed to upload to Google Drive', error: err.message });
  }
};
