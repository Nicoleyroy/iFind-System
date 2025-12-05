const FoundItemModel = require('../src/models/foundItem');
const LostItemModel = require('../src/models/lostItem');
const UserModel = require('../src/models/user');
const NotificationModel = require('../src/models/notification');
const emailService = require('../services/email.service');

// POST /api/items/:itemId/contact
const sendContactMessage = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { message, senderId } = req.body || {};

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Try to find the item in found or lost collections
    let item = await FoundItemModel.findById(itemId).lean();
    let itemType = 'found';
    if (!item) {
      item = await LostItemModel.findById(itemId).lean();
      itemType = 'lost';
    }

    if (!item) return res.status(404).json({ message: 'Item not found' });

    const ownerId = item.userId;
    if (!ownerId) return res.status(400).json({ message: 'Item has no owner information' });

    const owner = await UserModel.findById(ownerId).lean();
    if (!owner) return res.status(404).json({ message: 'Owner not found' });

    // Create a notification record for the owner
    await NotificationModel.create({
      userId: owner._id,
      type: 'contact_request',
      title: `New contact about your ${itemType} item`,
      message: message,
      relatedItemId: item._id,
      meta: { senderId: senderId || null },
    });

    // Attempt to email the owner if they have an email
    if (owner.email) {
      try {
        const subject = `Someone contacted you about your item "${item.name || 'Item'}"`;
        const text = `Message from iFind user${senderId ? ` (id: ${senderId})` : ''}:\n\n${message}\n\nView the item in the app to reply.`;
        await emailService.sendGenericEmail(owner.email, subject, text);
      } catch (emailErr) {
        console.warn('Failed to send contact email to owner', emailErr?.message || emailErr);
      }
    }

    return res.json({ message: 'Contact request sent' });
  } catch (err) {
    console.error('POST /api/items/:itemId/contact failed', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  sendContactMessage,
};
