const mongoose = require('mongoose');
require('dotenv').config({ path: './config.env' });

const uri = process.env.MONGODB_URI;

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