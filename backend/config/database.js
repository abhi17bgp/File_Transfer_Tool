const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Check if MONGODB_URI is provided
    if (!process.env.MONGODB_URI) {
      console.warn('⚠️  MONGODB_URI not found. Using local MongoDB...');
      process.env.MONGODB_URI = 'mongodb://localhost:27017/file-transfer';
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('💡 Make sure MongoDB is running or check your connection string');
    console.error('💡 For local development, install MongoDB or use MongoDB Atlas');
    
    // Don't exit the process, just log the error
    // This allows the server to start without MongoDB for testing
    return null;
  }
};

module.exports = connectDB;
