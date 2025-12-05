const express = require('express');
const router = express.Router();
const config = require('../config');

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const lostItemRoutes = require('./lostItem.routes');
const foundItemRoutes = require('./foundItem.routes');
const claimRoutes = require('./claim.routes');
const notificationRoutes = require('./notification.routes');
const contactRoutes = require('./contact.routes');
const passwordResetRoutes = require('./password-reset.routes');
const auditLogRoutes = require('./auditLog.routes');
const backupRoutes = require('./backup.routes');

// Health check endpoint
router.get('/api', (req, res) => {
  res.json({ status: 'ok', server: 'iFind System', timestamp: Date.now() });
});

// Debug endpoint - reports whether Google env vars are configured
router.get('/debug/env', (req, res) => {
  res.json({ 
    googleConfigured: !!(config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET) 
  });
});

// Use all route modules
router.use(authRoutes);
router.use(userRoutes);
router.use(lostItemRoutes);
router.use(foundItemRoutes);
router.use(claimRoutes);
router.use(notificationRoutes);
router.use(contactRoutes);
router.use(passwordResetRoutes);
router.use(auditLogRoutes);
router.use(backupRoutes);

module.exports = router;

