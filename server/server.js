require('dotenv').config();
const express = require('express');
const cors = require('./config/cors');
const connectToDB = require('./mongodb');
const routes = require('./routes');
const config = require('./config');
const emailService = require('./services/email.service');

const app = express();

// Connect to database
connectToDB().catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Middleware
app.use(cors);
app.use(express.json({ extended: true }));

// Routes
app.use(routes);

// Dev-only: send a test email using configured mail transport
if (config.NODE_ENV !== 'production') {
  app.post('/dev/send-test-email', async (req, res) => {
    const { to } = req.body || {};
    if (!to) return res.status(400).json({ error: 'Missing "to" email in body' });
    try {
      const info = await emailService.sendTestEmail(to, req.hostname);
      return res.json({ ok: true, info });
    } catch (err) {
      console.error('Error sending test email', err);
      return res.status(500).json({ 
        error: 'Failed to send test email', 
        details: err?.message 
      });
    }
  });
}

// Start server
app.listen(config.PORT, config.HOST, () => {
  console.log(`Server started on ${config.HOST}:${config.PORT}`);
});
