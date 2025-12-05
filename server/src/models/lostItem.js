const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const LostItemSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    category: {
      type: String,
      default: '',
      trim: true,
    },
    location: {
      type: String,
      default: '',
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    contactInfo: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    images: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: {
        values: ['Active', 'Archived', 'Deleted', 'Unclaimed', 'Pending', 'Claimed', 'Returned'],
        message: 'Status must be Active, Archived, Deleted, Unclaimed, Pending, Claimed, or Returned',
      },
      default: 'Active',
    },
    // persisted flag to indicate the item was ever marked returned (even if later archived)
    wasReturned: {
      type: Boolean,
      default: false,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
  },
  { timestamps: true }
);

const LostItemModel = mongoose.model('LostItem', LostItemSchema);
module.exports = LostItemModel;
