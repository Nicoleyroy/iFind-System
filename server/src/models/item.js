const mongoose = require('mongoose')

const Schema = mongoose.Schema;

const ItemSchema = new Schema(
  {
    name: { type: String, required: true },
    location: { type: String, default: '' },
    date: { type: Date },
    contactInfo: { type: String, default: '' },
    description: { type: String, default: '' },
    type: { type: String, enum: ['lost', 'found'], required: true },
    imageUrl: { type: String, default: '' },
    status: { type: String, enum: ['Unclaimed', 'Pending', 'Claimed'], default: 'Unclaimed' },
  },
  { timestamps: true }
);

const ItemModel = mongoose.model('Item', ItemSchema)
module.exports = ItemModel


