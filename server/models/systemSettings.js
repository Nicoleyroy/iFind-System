const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const SystemSettingsSchema = new Schema({
  siteName: {
    type: String,
    required: true,
    default: 'iFind Lost & Found',
    trim: true,
  },
  siteDescription: {
    type: String,
    required: true,
    default: 'Campus Lost and Found Management System',
    trim: true,
  },
  maintenanceMode: {
    type: Boolean,
    default: false,
  },
  allowRegistration: {
    type: Boolean,
    default: true,
  },
  requireEmailVerification: {
    type: Boolean,
    default: true,
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Ensure only one settings document exists
SystemSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

SystemSettingsSchema.statics.updateSettings = async function(updates, userId) {
  let settings = await this.findOne();
  if (!settings) {
    settings = new this(updates);
    settings.updatedBy = userId;
  } else {
    Object.assign(settings, updates);
    settings.updatedBy = userId;
  }
  await settings.save();
  return settings;
};

module.exports = mongoose.model('SystemSettings', SystemSettingsSchema);
