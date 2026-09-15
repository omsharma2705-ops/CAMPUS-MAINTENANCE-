const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus_maintenance';
  try {
    const conn = await mongoose.connect(primaryUri);
    isConnected = true;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`⚠️ MongoDB primary connection error: ${err.message}`);
    // If running in development and primary URI failed, attempt local fallback
    if (process.env.NODE_ENV !== 'production' && primaryUri !== 'mongodb://127.0.0.1:27017/campus_maintenance') {
      try {
        console.log('🔄 Attempting local fallback: mongodb://127.0.0.1:27017/campus_maintenance');
        const fallbackConn = await mongoose.connect('mongodb://127.0.0.1:27017/campus_maintenance');
        isConnected = true;
        console.log(`✅ Local Fallback MongoDB Connected: ${fallbackConn.connection.host}`);
        return;
      } catch (fallbackErr) {
        console.error(`⚠️ Local fallback also failed: ${fallbackErr.message}`);
      }
    }
    // Do not crash the entire process so server stays alive and reports health status
    console.warn('⚠️ Server will stay online, but DB operations will fail until connection is restored.');
  }
};

module.exports = connectDB;

