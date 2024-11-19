import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const connect = await mongoose.connect(process.env.MONGO_URI);
    const connection = mongoose.connection;
    connection.on("connected", () => {
      console.log(`MongoDB Connected: ${connect.connection.host}`);
    });

    connection.on("error", (err) => {
      console.log(`something is wrong in connectiong database!`);
      process.exit(1);
    });
  } catch (err) {
    console.log(`Err connection to MongoDB:`, err.message);
    process.exit(1);
  }
};

export default connectDB;