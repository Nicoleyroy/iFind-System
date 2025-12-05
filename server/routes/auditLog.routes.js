const express = require('express');
const router = express.Router();
const AuditLogModel = require('../src/models/auditLog');
const UserModel = require('../src/models/user');
const LostItemModel = require('../src/models/lostItem');
const FoundItemModel = require('../src/models/foundItem');

// Get all audit logs with filtering
router.get('/audit-logs', async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    
    const filter = {};
    
    // Filter by action type
    if (type && type !== 'all') {
      filter.action = type;
    }
    
    // Filter by date range
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    
    const logs = await AuditLogModel.find(filter)
      .populate('moderatorId', 'name email')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    
    // Enrich logs with additional information
    const enrichedLogs = await Promise.all(logs.map(async (log) => {
      let targetInfo = null;
      
      // Get target information based on targetType
      if (log.targetType === 'User') {
        targetInfo = await UserModel.findById(log.targetId).select('name email').lean();
      } else if (log.targetType === 'Item') {
        // Try to find in both LostItem and FoundItem
        targetInfo = await LostItemModel.findById(log.targetId).select('name').lean();
        if (!targetInfo) {
          targetInfo = await FoundItemModel.findById(log.targetId).select('name').lean();
        }
      }
      
      return {
        ...log,
        targetInfo,
      };
    }));
    
    return res.json({ data: enrichedLogs });
  } catch (err) {
    console.error('GET /audit-logs failed', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get activity summary statistics
router.get('/audit-logs/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);
    
    const [todayCount, weekCount, totalCount, byAction] = await Promise.all([
      AuditLogModel.countDocuments({ createdAt: { $gte: today } }),
      AuditLogModel.countDocuments({ createdAt: { $gte: thisWeek } }),
      AuditLogModel.countDocuments(),
      AuditLogModel.aggregate([
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 }
          }
        }
      ])
    ]);
    
    return res.json({
      data: {
        todayCount,
        weekCount,
        totalCount,
        byAction: byAction.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      }
    });
  } catch (err) {
    console.error('GET /audit-logs/stats failed', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
