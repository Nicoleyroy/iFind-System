const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const ItemSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Item name is required'],
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
    type: {
      type: String,
      enum: {
        values: ['lost', 'found'],
        message: 'Type must be either "lost" or "found"',
      },
      required: [true, 'Item type is required'],
    },
    imageUrl: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: ['Unclaimed', 'Pending', 'Claimed'],
        message: 'Status must be Unclaimed, Pending, or Claimed',
      },
      default: 'Unclaimed',
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Optional for backward compatibility
    },
  },
  { timestamps: true }
);

const ItemModel = mongoose.model('Item', ItemSchema);
module.exports = ItemModel;
