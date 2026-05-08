const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contact.controller');

// Contact us form endpoint
router.post('/api/contact-us', contactController.sendContactUsMessage);

// Mediated contact endpoint for items (both lost and found)
router.post('/api/items/:itemId/contact', contactController.sendContactMessage);

// Get all messages (moderators only)
router.get('/api/messages', contactController.getMessages);

// Update message status (moderators only)
router.patch('/api/messages/:messageId', contactController.updateMessageStatus);

module.exports = router;
