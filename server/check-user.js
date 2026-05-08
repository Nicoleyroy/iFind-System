require('dotenv').config();
const mongoose = require('mongoose');

async function checkUser() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ifind';
    console.log('Connecting to:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
    
    const User = require('./src/models/user');
    
    const email = '2301104852@student.buksu.edu.ph';
    const user = await User.findOne({ email: email });
    
    if (!user) {
      console.log('❌ User NOT found in database');
      console.log('Available users:');
      const allUsers = await User.find({}, { email: 1, name: 1 }).limit(5);
      allUsers.forEach(u => console.log(`  - ${u.email} (${u.name})`));
    } else {
      console.log('✅ User found in database');
      console.log('Email:', user.email);
      console.log('Name:', user.name);
      console.log('Has password:', !!user.password);
      console.log('Password is hashed:', user.password ? user.password.startsWith('$2') : false);
      console.log('Role:', user.role);
      console.log('Account Status:', user.accountStatus);
      
      // Test password comparison
      if (user.password) {
        const testPassword = 'test123'; // Replace with the password you're trying
        const isMatch = await user.comparePassword(testPassword);
        console.log(`Password "${testPassword}" matches:`, isMatch);
      }
    }
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkUser();
