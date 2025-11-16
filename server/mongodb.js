const mongoose = require('mongoose');
const uri = 'mongodb+srv://2301104852_db_user:LGOxiXneAqMqGI3D@ifind-test.c8i1gaf.mongodb.net/ifind-test?retryWrites=true&w=majority';

const localDB = 'mongodb://localhost:27017/'

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