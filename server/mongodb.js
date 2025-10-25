const mongoose = require('mongoose');
const uri = "mongodb+srv://Nyx:nicoleyroy@ifind.srcyztd.mongodb.net/?retryWrites=true&w=majority&appName=ifind";
const localDB = 'mongodb://localhost:27017/'

const connectToDB = async () => {
    try {
        await mongoose.connect(localDB);
        console.log('Connected to database successfully')
    } catch (error) {
        console.error('Failed to connect to mongoDB', error);
        process.exit(0)
    }
}

module.exports = connectToDB;