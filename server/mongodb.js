const mongoose = require('mongoose');
const uri = 'mongodb+srv://2301104852_db_user:LGOxiXneAqMqGI3D@ifind-test.c8i1gaf.mongodb.net/ifind-test?retryWrites=true&w=majority';

const localDB = 'mongodb://localhost:27017/'

const connectToDB = async () => {
    try {
        await mongoose.connect(uri);
        console.log('Connected to database successfully')
    } catch (error) {
        console.error('Failed to connect to mongoDB', error);
        process.exit(0)
    }
}

module.exports = connectToDB;