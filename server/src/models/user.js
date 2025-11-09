const mongoose = require('mongoose');

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
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
  },
  phoneNumber: {
    type: String,
    trim: true,
  },
  profilePicture: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

const UserModel = mongoose.model('User', UserSchema);
module.exports = UserModel;