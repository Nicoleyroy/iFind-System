const express = require('express');
const router = express.Router();
const foundItemController = require('../controllers/foundItem.controller');

router.post('/found-items', foundItemController.createFoundItem);
router.post('/found-items/export-pdf', foundItemController.exportFoundItemsPdf);
router.get('/found-items', foundItemController.getFoundItems);
router.get('/found-items/:id', foundItemController.getFoundItemById);
router.put('/found-items/:id', foundItemController.updateFoundItem);
router.patch('/found-items/:id/delete', foundItemController.softDeleteFoundItem);
router.delete('/found-items/:id', foundItemController.deleteFoundItem);

module.exports = router;
