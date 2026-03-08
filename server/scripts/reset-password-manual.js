require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function resetUserPassword() {
  try {
    const mongoUri = 'mongodb+srv://2301104852_db_user:LGOxiXneAqMqGI3D@ifind-test.c8i1gaf.mongodb.net/ifind-test?retryWrites=true&w=majority';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected!');
    
    const User = require('../models/user');
    
    const email = '2301104852@student.buksu.edu.ph';
    const newPassword = '123123';
    
    const user = await User.findOne({ email: email });
    
    if (!user) {
      console.log('User NOT found');
      process.exit(1);
    }
    
    console.log('User found:', user.email);
    console.log('Current password hash:', user.password ? user.password.substring(0, 30) + '...' : 'none');
    
    // Manually hash the password using bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    console.log('Hashed password:', hashedPassword.substring(0, 30) + '...');
    
    // Update user password directly with hashed value
    await User.updateOne(
      { email: email },
      { $set: { password: hashedPassword } }
    );
    
    console.log('Password updated successfully!');
    console.log('New password:', newPassword);
    
    // Reload user from database to ensure we have the saved version
    const reloadedUser = await User.findOne({ email: email });
    console.log('Reloaded hash:', reloadedUser.password ? reloadedUser.password.substring(0, 30) + '...' : 'none');
    
    // Test the password
    const isMatch = await reloadedUser.comparePassword(newPassword);
    console.log('Password verification:', isMatch ? 'Correct' : 'Failed');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

resetUserPassword();
