const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contact.controller');

// Mediated contact endpoint for items (both lost and found)
router.post('/api/items/:itemId/contact', contactController.sendContactMessage);

module.exports = router;
