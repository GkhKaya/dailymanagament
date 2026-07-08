const mongoose = require('mongoose');

async function test() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("no uri");
  console.log("URI starts with:", uri.substring(0, 15));
  
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 });
    console.log("Mongoose connected successfully!");
    const db = mongoose.connection.getClient().db();
    await db.command({ ping: 1 });
    console.log("Ping successful through Mongoose!");
  } catch (e) {
    console.error("Mongoose error:", e.message);
  } finally {
    await mongoose.disconnect();
  }
}
test();
