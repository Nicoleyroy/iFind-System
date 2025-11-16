const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const NotificationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    type: {
      type: String,
      enum: {
        values: ['claim_approved', 'claim_rejected', 'item_claimed', 'new_claim_request'],
        message: 'Invalid notification type',
      },
      required: [true, 'Notification type is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
    },
    relatedItemId: {
      type: Schema.Types.ObjectId,
      ref: 'Item',
      required: false,
    },
    relatedClaimId: {
      type: Schema.Types.ObjectId,
      ref: 'ClaimRequest',
      required: false,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const NotificationModel = mongoose.model('Notification', NotificationSchema);
module.exports = NotificationModel;

