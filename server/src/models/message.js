const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['contact_us', 'item_contact'],
      required: true,
    },
    senderName: {
      type: String,
      required: true,
      trim: true,
    },
    senderEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    subject: {
      type: String,
      trim: true,
      default: '',
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    relatedItemId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'itemModel',
      default: null,
    },
    itemModel: {
      type: String,
      enum: ['FoundItem', 'LostItem', null],
      default: null,
    },
    itemOwnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['unread', 'read', 'replied', 'archived'],
      default: 'unread',
    },
    readBy: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      readAt: {
        type: Date,
        default: Date.now,
      },
    }],
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Indexes for faster queries
messageSchema.index({ type: 1, status: 1, createdAt: -1 });
messageSchema.index({ senderEmail: 1 });
messageSchema.index({ itemOwnerId: 1 });

module.exports = mongoose.model('Message', messageSchema);
