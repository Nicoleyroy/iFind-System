const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const AuditLogSchema = new Schema(
  {
    moderatorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Moderator ID is required'],
    },
    action: {
      type: String,
      enum: {
        values: ['claim_approved', 'claim_rejected', 'item_verified', 'item_deleted', 'user_banned'],
        message: 'Invalid action type',
      },
      required: [true, 'Action is required'],
    },
    targetType: {
      type: String,
      enum: {
        values: ['ClaimRequest', 'Item', 'User'],
        message: 'Invalid target type',
      },
      required: [true, 'Target type is required'],
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Target ID is required'],
    },
    details: {
      type: String,
      default: '',
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// Index for faster queries
AuditLogSchema.index({ moderatorId: 1, createdAt: -1 });
AuditLogSchema.index({ targetId: 1, targetType: 1 });

const AuditLogModel = mongoose.model('AuditLog', AuditLogSchema);
module.exports = AuditLogModel;
