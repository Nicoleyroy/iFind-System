const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router.post('/user', authController.register);
router.post('/login', authController.login);
router.post('/auth/google', authController.verifyGoogleToken);
router.post('/auth/google/code', authController.exchangeGoogleCode);
router.get('/auth/google/code', authController.exchangeGoogleCodeGet);

module.exports = router;

