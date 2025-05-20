import mongoose from "mongoose";

const connectMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB sudah terhubung untuk Log Aktivitas");
  } catch (error) {
    console.error("❌ Gagal koneksi MongoDB:", error);
    process.exit(1);
  }
};

export default connectMongoDB;
