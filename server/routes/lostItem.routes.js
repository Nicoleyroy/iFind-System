const express = require('express');
const router = express.Router();
const lostItemController = require('../controllers/lostItem.controller');

router.post('/lost-items', lostItemController.createLostItem);
router.post('/lost-items/export-pdf', lostItemController.exportLostItemsPdf);
router.get('/lost-items', lostItemController.getLostItems);
router.get('/lost-items/:id', lostItemController.getLostItemById);
router.put('/lost-items/:id', lostItemController.updateLostItem);
router.patch('/lost-items/:id/delete', lostItemController.softDeleteLostItem);
router.delete('/lost-items/:id', lostItemController.deleteLostItem);

module.exports = router;
