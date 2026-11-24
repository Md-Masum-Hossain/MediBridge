import mongoose from 'mongoose';

const connectDB = async (customUri) => {
  try {
    const uri =
      customUri ||
      process.env.MONGO_URI ||
      process.env.MONGODB_URI ||
      'mongodb://127.0.0.1:27017/medibridge';

    const conn = await mongoose.connect(uri, {
      autoIndex: true, // Ensure 2dsphere and text indexes are built
    });

    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[Database Error] Connection Failed: ${error.message}`);
    throw error;
  }
};

export default connectDB;
