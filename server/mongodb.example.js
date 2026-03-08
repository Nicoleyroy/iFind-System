const mongoose = require('mongoose');
require('dotenv').config({ path: './config.env' });

// Get connection string from environment variable
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ifind-test';

const connectToDB = async () => {
    try {
        console.log('Attempting to connect to MongoDB...');
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log('Connected to database successfully')
    } catch (error) {
        console.error('Failed to connect to mongoDB', error);
        console.error('Connection string:', uri.replace(/\/\/.*:.*@/, '//[CREDENTIALS]@'));
        process.exit(1)
    }
}

module.exports = connectToDB;
