const express = require('express');
const router = express.Router();
const config = require('../config');

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const itemRoutes = require('./item.routes');
const lostItemRoutes = require('./lostItem.routes');
const foundItemRoutes = require('./foundItem.routes');
const claimRoutes = require('./claim.routes');
const notificationRoutes = require('./notification.routes');
const passwordResetRoutes = require('./password-reset.routes');
const auditLogRoutes = require('./auditLog.routes');

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
router.use(itemRoutes);
router.use(lostItemRoutes);
router.use(foundItemRoutes);
router.use(claimRoutes);
router.use(notificationRoutes);
router.use(passwordResetRoutes);
router.use(auditLogRoutes);

module.exports = router;

