const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const connectDB = async () => {
    try {
        const connect = await mongoose.connect(process.env.DB_STRING);
        console.log('Database Connected')
    }
    catch (err) {
        console.log(err);
    }
}
module.exports = connectDB;