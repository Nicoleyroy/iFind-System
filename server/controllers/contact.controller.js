const FoundItemModel = require('../models/foundItem');
const LostItemModel = require('../models/lostItem');
const UserModel = require('../models/user');
const NotificationModel = require('../models/notification');
const MessageModel = require('../models/message');
const emailService = require('../services/email.service');

// POST /api/items/:itemId/contact
const sendContactMessage = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { message, senderId, senderName, senderEmail } = req.body || {};

    const normalizedMessage = String(message || '').trim();
    if (!normalizedMessage) {
      return res.status(400).json({ message: 'Message is required.' });
    }
    if (normalizedMessage.length > 500) {
      return res.status(400).json({ message: 'Message is too long.' });
    }

    // Validate sender name
    if (!senderName || !String(senderName).trim()) {
      return res.status(400).json({ message: 'Full Name is required.' });
    }

    // Validate sender email
    if (!senderEmail || !String(senderEmail).trim()) {
      return res.status(400).json({ message: 'Email Address is required.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(senderEmail).trim())) {
      return res.status(400).json({ message: 'Invalid email format.' });
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
      message: normalizedMessage,
      relatedItemId: item._id,
      meta: { 
        senderId: senderId || null,
        senderName: String(senderName).trim(),
        senderEmail: String(senderEmail).trim()
      },
    });

    // Store the message in the Message collection
    await MessageModel.create({
      type: 'item_contact',
      senderName: String(senderName).trim(),
      senderEmail: String(senderEmail).trim(),
      senderId: senderId || null,
      message: normalizedMessage,
      relatedItemId: item._id,
      itemModel: itemType === 'found' ? 'FoundItem' : 'LostItem',
      itemOwnerId: owner._id,
      status: 'unread',
    });

    // Notify all moderators about the message
    try {
      const moderators = await UserModel.find({ role: { $in: ['moderator', 'admin'] } }).lean();
      for (const mod of moderators) {
        await NotificationModel.create({
          userId: mod._id,
          type: 'contact_request',
          title: `New message about ${itemType} item: ${item.name || 'Item'}`,
          message: `${String(senderName).trim()} sent a message to the item owner.`,
          relatedItemId: item._id,
          meta: {
            senderId: senderId || null,
            senderName: String(senderName).trim(),
            senderEmail: String(senderEmail).trim(),
            itemOwnerId: owner._id,
          },
        });
      }
    } catch (notifyErr) {
      console.warn('Failed to notify moderators', notifyErr?.message || notifyErr);
    }

    // Attempt to email the owner if they have an email
    if (owner.email) {
      try {
        const subject = `Someone contacted you about your item "${item.name || 'Item'}"`;
        const senderInfo = `From: ${String(senderName).trim()} (${String(senderEmail).trim()})`;
        const text = `You have a new message from iFind user:\n\n${senderInfo}\n\nMessage:\n${normalizedMessage}\n\nView the item in the app to reply.`;
        await emailService.sendGenericEmail(owner.email, subject, text);
      } catch (emailErr) {
        console.warn('Failed to send contact email to owner', emailErr?.message || emailErr);
      }
    }

    return res.json({ message: 'Your message has been sent.' });
  } catch (err) {
    console.error('POST /api/items/:itemId/contact failed', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/contact-us
const sendContactUsMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body || {};

    // Validate name
    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: 'Full Name is required.' });
    }

    // Validate email
    if (!email || !String(email).trim()) {
      return res.status(400).json({ message: 'Email Address is required.' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(email).trim())) {
      return res.status(400).json({ message: 'Invalid email format.' });
    }

    // Validate subject
    if (!subject || !String(subject).trim()) {
      return res.status(400).json({ message: 'Subject is required.' });
    }

    // Validate message
    const normalizedMessage = String(message || '').trim();
    if (!normalizedMessage) {
      return res.status(400).json({ message: 'Message is required.' });
    }
    if (normalizedMessage.length > 500) {
      return res.status(400).json({ message: 'Message is too long.' });
    }

    // Store the message in the Message collection
    await MessageModel.create({
      type: 'contact_us',
      senderName: String(name).trim(),
      senderEmail: String(email).trim(),
      subject: String(subject).trim(),
      message: normalizedMessage,
      status: 'unread',
    });

    // Notify all moderators about the contact us message
    try {
      const moderators = await UserModel.find({ role: { $in: ['moderator', 'admin'] } }).lean();
      for (const mod of moderators) {
        await NotificationModel.create({
          userId: mod._id,
          type: 'contact_request',
          title: 'New Contact Us Message',
          message: `${String(name).trim()} sent a message: ${String(subject).trim()}`,
          meta: {
            senderName: String(name).trim(),
            senderEmail: String(email).trim(),
            subject: String(subject).trim(),
            messageType: 'contact_us',
          },
        });
      }
    } catch (notifyErr) {
      console.warn('Failed to notify moderators', notifyErr?.message || notifyErr);
    }

    // Optionally send email to moderators/admin
    try {
      const adminEmails = await UserModel.find({ role: { $in: ['moderator', 'admin'] } })
        .select('email')
        .lean();
      
      for (const admin of adminEmails) {
        if (admin.email) {
          const emailSubject = `New Contact Us Message: ${String(subject).trim()}`;
          const emailText = `A new contact us message has been received:\n\nFrom: ${String(name).trim()} (${String(email).trim()})\nSubject: ${String(subject).trim()}\n\nMessage:\n${normalizedMessage}`;
          await emailService.sendGenericEmail(admin.email, emailSubject, emailText);
        }
      }
    } catch (emailErr) {
      console.warn('Failed to send email to moderators', emailErr?.message || emailErr);
    }

    return res.json({ message: 'Thank you for contacting us. We will get back to you soon.' });
  } catch (err) {
    console.error('POST /api/contact-us failed', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/messages - Get all messages (moderators only)
const getMessages = async (req, res) => {
  try {
    const { type, status, page = 1, limit = 50 } = req.query;
    
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;

    const messages = await MessageModel.find(filter)
      .populate('senderId', 'name email profilePicture')
      .populate('itemOwnerId', 'name email')
      .populate('relatedItemId', 'name category status')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    const total = await MessageModel.countDocuments(filter);

    return res.json({
      success: true,
      data: messages,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('GET /api/messages failed', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PATCH /api/messages/:messageId - Update message status (moderators only)
const updateMessageStatus = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { status, notes, userId } = req.body || {};

    if (!['unread', 'read', 'replied', 'archived'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value.' });
    }

    const update = { status };
    if (notes !== undefined) update.notes = String(notes || '').trim();
    
    // Add to readBy array if status is read and userId provided
    if (status === 'read' && userId) {
      update.$push = {
        readBy: {
          userId,
          readAt: new Date(),
        },
      };
    }

    const message = await MessageModel.findByIdAndUpdate(
      messageId,
      update,
      { new: true }
    ).lean();

    if (!message) {
      return res.status(404).json({ message: 'Message not found.' });
    }

    return res.json({
      success: true,
      message: 'Message updated successfully.',
      data: message,
    });
  } catch (err) {
    console.error('PATCH /api/messages/:messageId failed', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  sendContactMessage,
  sendContactUsMessage,
  getMessages,
  updateMessageStatus,
};
