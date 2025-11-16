const express = require('express');
const router = express.Router();
const itemController = require('../controllers/item.controller');

router.post('/items', itemController.createItem);
router.post('/items/export-pdf', itemController.exportPdf);
router.get('/items', itemController.getItems);
router.put('/items/:id', itemController.updateItem);
router.patch('/items/:id/delete', itemController.softDeleteItem);
router.delete('/items/:id', itemController.deleteItem);

module.exports = router;

