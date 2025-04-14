import mongoose from 'mongoose';
const dotenv = await import('dotenv');
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    // await mongoose.connect('mongodb://127.0.0.1:27017/testdb');
    console.log(`MongoDB is connected`);
  } catch (error) {
    console.error(error.message);
  }
};

export default connectDB;
