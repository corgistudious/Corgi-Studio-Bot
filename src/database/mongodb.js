const mongoose = require("mongoose");

async function connectDatabase() {
  try {
    console.log("⏳ Đang kết nối MongoDB...");

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("✅ MongoDB đã kết nối");
  } catch (error) {
    console.error("❌ Không thể kết nối MongoDB:");
    console.error(error);

    process.exit(1);
  }
}

module.exports = connectDatabase;