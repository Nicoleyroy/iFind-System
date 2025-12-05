const NotificationModel = require('../src/models/notification');

const getNotifications = async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    const notifications = await NotificationModel.find({ userId })
      .populate('relatedItemId', 'name imageUrl')
      .sort({ createdAt: -1 })
      .lean();
    
    return res.json({ data: notifications });
  } catch (err) {
    console.error('GET /notifications failed', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    const count = await NotificationModel.countDocuments({ userId, read: false });
    
    return res.json({ data: { count } });
  } catch (err) {
    console.error('GET /notifications/unread-count failed', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await NotificationModel.findById(id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    notification.read = true;
    await notification.save();
    
    return res.json({ data: notification, message: 'Notification marked as read' });
  } catch (err) {
    console.error('PUT /notifications/:id/read failed', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    const result = await NotificationModel.updateMany(
      { userId, read: false },
      { read: true }
    );
    
    return res.json({ data: { updated: result.modifiedCount }, message: 'All notifications marked as read' });
  } catch (err) {
    console.error('PUT /notifications/read-all failed', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};

