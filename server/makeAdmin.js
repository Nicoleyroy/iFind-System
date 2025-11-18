const mongoose = require('mongoose');
const UserModel = require('./src/models/user');

const uri = 'mongodb+srv://2301104852_db_user:LGOxiXneAqMqGI3D@ifind-test.c8i1gaf.mongodb.net/ifind-test?retryWrites=true&w=majority';

const makeAdmin = async (email) => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    console.log('Connected successfully');

    const user = await UserModel.findOne({ email: email });
    
    if (!user) {
      console.log('❌ User not found with email:', email);
      console.log('Please register this user first through the application.');
      process.exit(1);
    }

    console.log('\nFound user:');
    console.log('- Name:', user.name);
    console.log('- Email:', user.email);
    console.log('- Current Role:', user.role || 'user');

    user.role = 'admin';
    await user.save();

    console.log('\n✅ User updated successfully!');
    console.log('- New Role:', user.role);

    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

// Get email from command line argument or use default
const email = process.argv[2] || 'nicole072420@gmail.com';
makeAdmin(email);
