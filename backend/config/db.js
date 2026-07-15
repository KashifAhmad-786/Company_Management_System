const mongoose = require('mongoose');

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  const mongoUri = process.env.MONGO_URI || 'mongodb+srv://ka8285900_db_user:kashif167@cluster0.3g1awhu.mongodb.net/companymanagement?appName=Cluster0';

  try {
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    console.error('The backend will continue starting so Vercel can handle errors gracefully.');
    return null;
  }
};

module.exports = connectDB;
