const ClaimRequestModel = require('../src/models/claimRequest');
const LostItemModel = require('../src/models/lostItem');
const FoundItemModel = require('../src/models/foundItem');
const NotificationModel = require('../src/models/notification');
const AuditLogModel = require('../src/models/auditLog');

const createClaimRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { claimantId, proofOfOwnership, imageUrl } = req.body || {};
    
    if (!claimantId) {
      return res.status(400).json({ message: 'Claimant ID is required' });
    }
    
    // Try to find item in LostItem or FoundItem collections
    let item = await LostItemModel.findById(id);
    let itemType = 'lost';
    
    if (!item) {
      item = await FoundItemModel.findById(id);
      itemType = 'found';
    }
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    const existingRequest = await ClaimRequestModel.findOne({
      itemId: id,
      claimantId: claimantId,
      status: 'Pending',
    });
    
    if (existingRequest) {
      return res.status(400).json({ message: 'You already have a pending claim request for this item' });
    }
    
    const claimRequest = await ClaimRequestModel.create({
      itemId: id,
      claimantId: claimantId,
      proofOfOwnership: proofOfOwnership || '',
      imageUrl: imageUrl || '',
      status: 'Pending',
    });
    
    // Update item status to Pending if it's currently Unclaimed
    if (item.status === 'Unclaimed' || item.status === 'Active') {
      item.status = 'Pending';
      await item.save();
    }
    
    // Create notification for item owner
    if (item.userId && String(item.userId) !== String(claimantId)) {
      await NotificationModel.create({
        userId: item.userId,
        type: 'new_claim_request',
        title: 'New Claim Request',
        message: `Someone has submitted a claim request for your item: ${item.name}`,
        relatedItemId: item._id,
        relatedClaimId: claimRequest._id,
      });
    }
    
    await claimRequest.populate('claimantId', 'name email');
    
    return res.json({ data: claimRequest, message: 'Claim request submitted successfully' });
  } catch (err) {
    console.error('POST /items/:id/claim failed', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getClaims = async (req, res) => {
  try {
    const { status, claimantId } = req.query;
    const filter = {};
    if (status && ['Pending', 'Approved', 'Rejected'].includes(status)) {
      filter.status = status;
    }
    // Optional filter to return claims for a specific claimant
    if (claimantId) {
      filter.claimantId = claimantId;
    }
    
    const claims = await ClaimRequestModel.find(filter)
      .populate('claimantId', 'name email phoneNumber')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();
    
    // Manually populate itemId from LostItem or FoundItem
    for (let claim of claims) {
      if (claim.itemId) {
        // Try to find item in LostItem collection
        let item = await LostItemModel.findById(claim.itemId).lean();
        
        // If not found, try FoundItem collection
        if (!item) {
          item = await FoundItemModel.findById(claim.itemId).lean();
        }
        
        // Attach the found item to the claim
        if (item) {
          claim.itemId = item;
        }
      }
    }
    
    return res.json({ data: claims });
  } catch (err) {
    console.error('GET /claims failed', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getClaimById = async (req, res) => {
  try {
    const { id } = req.params;
    const claim = await ClaimRequestModel.findById(id)
      .populate('claimantId', 'name email phoneNumber')
      .populate('reviewedBy', 'name email')
      .lean();
    
    if (!claim) {
      return res.status(404).json({ message: 'Claim request not found' });
    }
    
    // Manually populate itemId from LostItem or FoundItem
    if (claim.itemId) {
      // Try to find item in LostItem collection
      let item = await LostItemModel.findById(claim.itemId).lean();
      
      // If not found, try FoundItem collection
      if (!item) {
        item = await FoundItemModel.findById(claim.itemId).lean();
      }
      
      // Attach the found item to the claim
      if (item) {
        claim.itemId = item;
      }
    }
    
    return res.json({ data: claim });
  } catch (err) {
    console.error('GET /claims/:id failed', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateClaimStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewedBy, reviewNotes } = req.body || {};
    
    if (!status || !['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be Approved or Rejected' });
    }
    
    const claimRequest = await ClaimRequestModel.findById(id);
    if (!claimRequest) {
      return res.status(404).json({ message: 'Claim request not found' });
    }
    
    if (claimRequest.status !== 'Pending') {
      return res.status(400).json({ message: 'Claim request has already been reviewed' });
    }
    
    claimRequest.status = status;
    if (reviewedBy) claimRequest.reviewedBy = reviewedBy;
    if (reviewNotes) claimRequest.reviewNotes = reviewNotes;
    await claimRequest.save();
    
    // Update item status to Claimed if approved
    if (status === 'Approved') {
      // Try to find and update in LostItem or FoundItem collections
      let item = await LostItemModel.findById(claimRequest.itemId);
      if (!item) item = await FoundItemModel.findById(claimRequest.itemId);
      
      if (item && item.status !== 'Claimed') {
        item.status = 'Claimed';
        await item.save();
      }
    }
    
    // Send notification to claimant
    const notificationType = status === 'Approved' ? 'claim_approved' : 'claim_rejected';
    const notificationTitle = status === 'Approved' ? 'Claim Request Approved' : 'Claim Request Rejected';
    
    // Try to get item name from LostItem or FoundItem collections
    let item = await LostItemModel.findById(claimRequest.itemId);
    if (!item) item = await FoundItemModel.findById(claimRequest.itemId);
    
    const notificationMessage = status === 'Approved' 
      ? `Your claim request for "${item?.name || 'the item'}" has been approved!`
      : `Your claim request for "${item?.name || 'the item'}" has been rejected.`;
    
    await NotificationModel.create({
      userId: claimRequest.claimantId,
      type: notificationType,
      title: notificationTitle,
      message: notificationMessage,
      relatedItemId: claimRequest.itemId,
      relatedClaimId: claimRequest._id,
    });
    
    // Create audit log
    if (reviewedBy) {
      await AuditLogModel.create({
        moderatorId: reviewedBy,
        action: status === 'Approved' ? 'claim_approved' : 'claim_rejected',
        targetType: 'ClaimRequest',
        targetId: claimRequest._id,
        details: reviewNotes || `Claim request ${status.toLowerCase()} for item: ${item?.name || 'Unknown'}`,
        metadata: {
          itemId: claimRequest.itemId,
          claimantId: claimRequest.claimantId,
          status: status,
        },
      });
    }
    
    await claimRequest.populate('claimantId', 'name email');
    await claimRequest.populate('itemId', 'name');
    await claimRequest.populate('reviewedBy', 'name email');
    
    return res.json({ data: claimRequest, message: `Claim request ${status.toLowerCase()} successfully` });
  } catch (err) {
    console.error('PUT /claims/:id failed', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get analytics data for reports dashboard
const getAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    
    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }
    
    // Build status filter
    const statusFilter = status && status !== 'all' ? { status } : {};
    
    const filter = { ...dateFilter, ...statusFilter };
    
    // Get all claims with filters
    const claims = await ClaimRequestModel.find(filter)
      .populate('itemId', 'type category')
      .populate('reviewedBy', 'name')
      .lean();
    
    // Calculate statistics
    const totalClaims = claims.length;
    const pendingClaims = claims.filter(c => c.status === 'Pending').length;
    const approvedClaims = claims.filter(c => c.status === 'Approved').length;
    const rejectedClaims = claims.filter(c => c.status === 'Rejected').length;
    
    // Calculate trends by month (last 6 months)
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    
    const monthlyData = await ClaimRequestModel.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' },
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);
    
    // Format monthly trends
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last6Months.push({
        month: monthNames[date.getMonth()],
        year: date.getFullYear(),
        monthNum: date.getMonth() + 1
      });
    }
    
    const trends = last6Months.map(m => {
      const approved = monthlyData.find(d => 
        d._id.month === m.monthNum && d._id.year === m.year && d._id.status === 'Approved'
      )?.count || 0;
      
      const rejected = monthlyData.find(d => 
        d._id.month === m.monthNum && d._id.year === m.year && d._id.status === 'Rejected'
      )?.count || 0;
      
      const pending = monthlyData.find(d => 
        d._id.month === m.monthNum && d._id.year === m.year && d._id.status === 'Pending'
      )?.count || 0;
      
      return {
        month: m.month,
        approved,
        rejected,
        pending,
        total: approved + rejected + pending
      };
    });
    
    // Calculate item category distribution
    const itemsByCategory = {};
    claims.forEach(claim => {
      const category = claim.itemId?.type || 'Other';
      itemsByCategory[category] = (itemsByCategory[category] || 0) + 1;
    });
    
    // Calculate moderator workload
    const moderatorWorkload = await ClaimRequestModel.aggregate([
      {
        $match: {
          status: { $in: ['Approved', 'Rejected'] },
          reviewedBy: { $ne: null }
        }
      },
      {
        $group: {
          _id: '$reviewedBy',
          claimsReviewed: { $sum: 1 },
          approved: {
            $sum: { $cond: [{ $eq: ['$status', 'Approved'] }, 1, 0] }
          },
          rejected: {
            $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'moderator'
        }
      },
      {
        $unwind: '$moderator'
      },
      {
        $project: {
          moderatorName: '$moderator.name',
          claimsReviewed: 1,
          approved: 1,
          rejected: 1
        }
      },
      {
        $sort: { claimsReviewed: -1 }
      }
    ]);
    
    // Calculate average resolution time (for approved/rejected claims)
    const resolvedClaims = claims.filter(c => c.status !== 'Pending' && c.updatedAt);
    let avgResolutionTime = 0;
    if (resolvedClaims.length > 0) {
      const totalHours = resolvedClaims.reduce((sum, claim) => {
        const diffMs = new Date(claim.updatedAt) - new Date(claim.createdAt);
        return sum + (diffMs / (1000 * 60 * 60)); // Convert to hours
      }, 0);
      avgResolutionTime = totalHours / resolvedClaims.length;
    }
    
    return res.json({
      data: {
        overview: {
          totalClaims,
          pendingClaims,
          approvedClaims,
          rejectedClaims,
          avgResolutionTime: avgResolutionTime.toFixed(1), // in hours
          resolutionRate: totalClaims > 0 ? ((approvedClaims / totalClaims) * 100).toFixed(1) : 0
        },
        trends,
        itemsByCategory,
        moderatorWorkload
      }
    });
  } catch (err) {
    console.error('GET /claims/analytics failed', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const deleteClaim = async (req, res) => {
  try {
    const { id } = req.params;
    
    const claimRequest = await ClaimRequestModel.findById(id);
    if (!claimRequest) {
      return res.status(404).json({ message: 'Claim request not found' });
    }
    
    // Store itemId before deletion for potential item status update
    const itemId = claimRequest.itemId;
    
    // Delete the claim request
    await ClaimRequestModel.findByIdAndDelete(id);
    
    // Check if there are any other pending claims for this item
    const otherPendingClaims = await ClaimRequestModel.findOne({
      itemId: itemId,
      status: 'Pending'
    });
    
    // If no other pending claims, update item status back to Unclaimed/Active
    if (!otherPendingClaims) {
      let item = await LostItemModel.findById(itemId);
      if (!item) item = await FoundItemModel.findById(itemId);
      
      if (item && item.status === 'Pending') {
        item.status = 'Active';
        await item.save();
      }
    }
    
    return res.json({ message: 'Claim request deleted successfully' });
  } catch (err) {
    console.error('DELETE /claims/:id failed', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  createClaimRequest,
  getClaims,
  getClaimById,
  updateClaimStatus,
  getAnalytics,
  deleteClaim,
};

