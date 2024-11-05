import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const connect = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${connect.connection.host}`);
    } catch (err) {
        console.log(`Err connection to MongoDB:`, err.message);
        process.exit(1);
    }
}

export default connectDB;