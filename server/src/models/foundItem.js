const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const FoundItemSchema = new Schema(
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
    status: {
      type: String,
      enum: {
        values: ['Active', 'Archived', 'Deleted', 'Unclaimed', 'Pending', 'Claimed'],
        message: 'Status must be Active, Archived, Deleted, Unclaimed, Pending, or Claimed',
      },
      default: 'Active',
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
  },
  { timestamps: true }
);

const FoundItemModel = mongoose.model('FoundItem', FoundItemSchema);
module.exports = FoundItemModel;
