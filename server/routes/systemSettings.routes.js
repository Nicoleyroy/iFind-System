const express = require('express');
const router = express.Router();
const systemSettingsController = require('../controllers/systemSettings.controller');

// Get system settings (public - needed for maintenance mode check)
router.get('/api/system-settings', systemSettingsController.getSystemSettings);

// Update system settings (admin only - frontend should restrict)
router.put('/api/system-settings', systemSettingsController.updateSystemSettings);

module.exports = router;
