const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
  },
  password: {
    type: String,
    // Make password optional for Google-authenticated users
    minlength: [6, 'Password must be at least 6 characters long'],
    // Only require password if user doesn't have Google ID
    required: function() {
      return !this.googleId;
    },
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple null values
    trim: true,
  },
  phoneNumber: {
    type: String,
    trim: true,
  },
  profilePicture: {
    type: String,
    trim: true,
  },
  role: {
    type: String,
    enum: ['user', 'moderator', 'admin'],
    default: 'user',
  },
  accountStatus: {
    type: String,
    enum: ['active', 'suspended', 'banned'],
    default: 'active',
  },
}, {
  timestamps: true,
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new) and exists
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  
  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password for login
UserSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Cascade delete: Remove all items posted by user when user is deleted
UserSchema.pre('findOneAndDelete', async function(next) {
  try {
    const userId = this.getQuery()._id;
    
    // Delete all lost items by this user
    const LostItemModel = require('./lostItem');
    await LostItemModel.deleteMany({ userId: userId });
    
    // Delete all found items by this user
    const FoundItemModel = require('./foundItem');
    await FoundItemModel.deleteMany({ userId: userId });
    
    next();
  } catch (error) {
    next(error);
  }
});

const UserModel = mongoose.model('User', UserSchema);
module.exports = UserModel;