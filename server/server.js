require('dotenv').config();
const express = require('express')
//const connectDB = require('./db')
const cors = require('cors');
let OAuth2Client = null;
try {
  OAuth2Client = require('google-auth-library').OAuth2Client;
} catch (err) {
  console.warn('google-auth-library not installed. Google OAuth endpoints will be disabled until you run `npm install` in the server folder.');
}
let nodemailer = null;
try {
  nodemailer = require('nodemailer');
} catch (err) {
  console.warn('nodemailer not installed. Email sending will be disabled until you run `npm install` in the server folder.');
}
const app = express()
const connectToDB = require('./mongodb')
const UserModel = require('./src/models/user')
const ItemModel = require('./src/models/item')
connectToDB()

app.use(cors());
app.use(express.json({ extended: true }))

// Google OAuth2 client (optional - requires SERVER env vars)
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
let oauth2Client = null;
if (GOOGLE_CLIENT_ID && OAuth2Client) {
  oauth2Client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET || undefined);
}

// SMTP / Nodemailer setup (optional)
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
let mailTransport = null;
if (nodemailer && SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
  mailTransport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT, 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
  // verify transporter (helpful for dev/debugging)
  mailTransport.verify()
    .then(() => console.log('Mail transport configured and ready'))
    .catch((err) => console.warn('Mail transport verification failed:', err && err.message ? err.message : err));
}

// In-memory store for reset codes (email -> { code, expires, validated })
const resetCodes = new Map();

//routes

app.post('/user', async (req,res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'body input is invalid' })
  }
  try {
    const user = await UserModel.create({ name, email, password });
    res.json({ data: user, message: 'User created' })
  } catch(err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
})

// Items API
// Create item (lost or found)
app.post('/items', async (req, res) => {
  try {
    const { name, location, date, contactInfo, description, type, imageUrl } = req.body || {};
    if (!name || !type || !['lost', 'found'].includes(type)) {
      return res.status(400).json({ message: 'Missing or invalid fields' });
    }
    let parsedDate = undefined;
    if (date) {
      const d = new Date(date);
      if (!isNaN(d.getTime())) parsedDate = d;
    }
    const item = await ItemModel.create({
      name,
      location,
      date: parsedDate,
      contactInfo,
      description,
      type,
      imageUrl,
    });
    return res.json({ data: item });
  } catch (err) {
    console.error('POST /items failed', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// List items with optional type filter
app.get('/items', async (req, res) => {
  try {
    const { type } = req.query;
    const filter = {};
    if (type && ['lost', 'found'].includes(type)) filter.type = type;
    const items = await ItemModel.find(filter).sort({ createdAt: -1 }).lean();
    return res.json({ data: items });
  } catch (err) {
    console.error('GET /items failed', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }
  try {
    const user = await UserModel.findOne({ email, password });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    res.json({ message: 'Login successful', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Forgot password: generate code and email it
app.post('/forgot', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Missing email' });
  try {
    const user = await UserModel.findOne({ email });
    if (!user) return res.status(404).json({ error: 'No user with that email' });

    // generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 1000 * 60 * 15; // 15 minutes
    resetCodes.set(email, { code, expires, validated: false });

    if (!mailTransport) {
      console.warn('Mail transport not configured; skipping send');
      // Log code to server console to help development debugging
      console.log(`Password reset code for ${email}: ${code} (expires ${new Date(expires).toISOString()})`);
      // In non-production dev environments, return the code in the response so the developer can test the flow without SMTP configured.
      if (process.env.NODE_ENV !== 'production') {
        return res.json({ ok: true, message: 'Code generated (email not sent in dev)', devCode: code });
      }
      return res.json({ ok: true, message: 'Code generated (email not sent in dev)' });
    }

    const mail = {
      from: process.env.SMTP_FROM || `no-reply@${req.hostname}`,
      to: email,
      subject: 'iFind Password Reset Code',
      text: `Your password reset code is: ${code}. It expires in 15 minutes.`,
      html: `<p>Your password reset code is: <strong>${code}</strong>. It expires in 15 minutes.</p>`,
    };

    await mailTransport.sendMail(mail);
    return res.json({ ok: true });
  } catch (err) {
    console.error('Error in /forgot', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Verify code
app.post('/verify-code', async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: 'Missing params' });
  const entry = resetCodes.get(email);
  if (!entry) return res.status(400).json({ error: 'No code for this email' });
  if (Date.now() > entry.expires) return res.status(400).json({ error: 'Code expired' });
  if (entry.code !== String(code)) return res.status(400).json({ error: 'Invalid code' });
  entry.validated = true;
  resetCodes.set(email, entry);
  return res.json({ ok: true });
});

// Reset password using code
app.post('/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) return res.status(400).json({ error: 'Missing params' });
  const entry = resetCodes.get(email);
  if (!entry) return res.status(400).json({ error: 'No code for this email' });
  if (Date.now() > entry.expires) return res.status(400).json({ error: 'Code expired' });
  if (entry.code !== String(code)) return res.status(400).json({ error: 'Invalid code' });
  if (!entry.validated) return res.status(400).json({ error: 'Code not verified' });

  try {
    const user = await UserModel.findOne({ email });
    if (!user) return res.status(404).json({ error: 'No user with that email' });
    user.password = newPassword;
    await user.save();
    resetCodes.delete(email);
    return res.json({ ok: true });
  } catch (err) {
    console.error('Error in /reset-password', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// simple API health route used by client during development
app.get('/api', (req, res) => {
  res.json({ status: 'ok', server: 'iFind System', timestamp: Date.now() });
});

// Debug endpoint (safe): reports whether Google env vars are configured.
// Returns a boolean only, never reveals secret values.
app.get('/debug/env', (req, res) => {
  res.json({ googleConfigured: !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) });
});

// Dev-only: send a test email using configured mail transport
// Use only in development. This helps verify SMTP credentials (e.g., Gmail App Password).
app.post('/dev/send-test-email', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Not allowed in production' });
  }
  const { to } = req.body || {};
  if (!mailTransport) return res.status(500).json({ error: 'Mail transport not configured' });
  if (!to) return res.status(400).json({ error: 'Missing "to" email in body' });
  try {
    const info = await mailTransport.sendMail({
      from: process.env.SMTP_FROM || `no-reply@${req.hostname}`,
      to,
      subject: 'iFind SMTP test',
      text: 'This is a test email from iFind (development). If you received this, SMTP is configured correctly.',
      html: '<p>This is a <strong>test</strong> email from iFind (development).</p>',
    });
    return res.json({ ok: true, info });
  } catch (err) {
    console.error('Error sending test email', err);
    return res.status(500).json({ error: 'Failed to send test email', details: err && err.message });
  }
});

// Verify ID token (credential) sent from client
app.post('/auth/google', async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ error: 'Missing credential (id_token)' });
  try {
    if (!GOOGLE_CLIENT_ID) return res.status(500).json({ error: 'Server GOOGLE_CLIENT_ID not set' });
    if (!OAuth2Client) return res.status(501).json({ error: 'Server missing google-auth-library dependency' });
    const client = new OAuth2Client(GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    // TODO: find or create user in DB, create session/token
    return res.json({ ok: true, payload });
  } catch (err) {
    console.error('Failed to verify Google credential', err);
    return res.status(400).json({ error: 'Invalid Google credential', details: err.message });
  }
});

// Exchange authorization code (from popup) for tokens server-side
app.post('/auth/google/code', async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Missing code' });
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.warn('Google client id/secret not configured on server');
    return res.status(501).json({ error: 'Server not configured for Google code exchange. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.' });
  }
  if (!oauth2Client) {
    return res.status(501).json({ error: 'Server missing google-auth-library dependency' });
  }
  try {
    const r = await oauth2Client.getToken({ code, redirect_uri: 'postmessage' });
    // r.tokens contains id_token, access_token, refresh_token (if requested)
    // TODO: verify id_token and create session
    return res.json({ ok: true, tokens: r.tokens });
  } catch (err) {
    console.error('Error exchanging Google code', err);
    return res.status(400).json({ error: 'Code exchange failed', details: err.message });
  }
});




app.listen(4000, () => {
    console.log("Server started on port 4000")
})  