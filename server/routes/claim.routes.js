const express = require('express');
const router = express.Router();
const claimController = require('../controllers/claim.controller');

// Claim routes for lost and found items
router.post('/lost-items/:id/claim', claimController.createClaimRequest);
router.post('/found-items/:id/claim', claimController.createClaimRequest);

router.get('/claims', claimController.getClaims);
router.get('/claims/analytics', claimController.getAnalytics);
router.get('/claims/:id', claimController.getClaimById);
router.put('/claims/:id', claimController.updateClaimStatus);
router.delete('/claims/:id', claimController.deleteClaim);

module.exports = router;

