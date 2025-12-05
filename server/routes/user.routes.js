const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

router.get('/users', userController.getAllUsers);
router.get('/user/:id', userController.getUserById);
router.put('/user/:id', userController.updateUser);
router.put('/user/:id/password', userController.changePassword);
router.delete('/user/:id', userController.deleteUser);

module.exports = router;

