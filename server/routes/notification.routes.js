const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');

router.get('/notifications', notificationController.getNotifications);
router.get('/notifications/unread-count', notificationController.getUnreadCount);
router.put('/notifications/:id/read', notificationController.markAsRead);
router.put('/notifications/read-all', notificationController.markAllAsRead);

module.exports = router;

