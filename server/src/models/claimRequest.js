const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const ClaimRequestSchema = new Schema(
  {
    itemId: {
      type: Schema.Types.ObjectId,
      ref: 'Item',
      required: [true, 'Item ID is required'],
    },
    claimantId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Claimant ID is required'],
    },
    proofOfOwnership: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['Pending', 'Approved', 'Rejected'],
        message: 'Status must be Pending, Approved, or Rejected',
      },
      default: 'Pending',
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    reviewNotes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true }
);

const ClaimRequestModel = mongoose.model('ClaimRequest', ClaimRequestSchema);
module.exports = ClaimRequestModel;

