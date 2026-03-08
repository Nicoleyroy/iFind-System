const mongoose = require('mongoose');

// Load local .env file in development — on Render, env vars come from the dashboard
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config({ path: './config.env' });
}

// Support both MONGO_URI (Render convention) and MONGODB_URI
const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

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