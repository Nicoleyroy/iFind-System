const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backup.controller');
const driveController = require('../controllers/drive.controller');

// Note: In production, these routes should be protected with admin authentication middleware
// Example: router.post('/api/backup/create', authMiddleware, adminMiddleware, backupController.createBackup);

// Create a new backup
router.post('/api/backup/create', backupController.createBackup);

// Get backup history
router.get('/api/backup/history', backupController.getBackupHistory);

// Get backup statistics
router.get('/api/backup/stats', backupController.getBackupStats);

// Restore from backup
router.post('/api/backup/restore', backupController.restoreBackup);

// Delete a backup
router.delete('/api/backup/:fileName', backupController.deleteBackup);

// Google Drive OAuth/connect endpoints
router.get('/api/backup/drive/connect', driveController.connect);
router.get('/api/backup/drive/callback', driveController.callback);
router.get('/api/backup/drive/status', driveController.getStatus);
router.post('/api/backup/drive/upload', driveController.uploadBackup);

module.exports = router;
