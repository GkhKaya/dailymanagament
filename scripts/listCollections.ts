// @ts-nocheck
import mongoose from "mongoose";

async function run() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const db = mongoose.connection.db;
  const all = await db.listCollections().toArray();
  console.log("Collections:", all.map((c) => c.name).sort());
  for (const c of all) {
    if (c.name.toLowerCase().includes("weight")) {
      const count = await db.collection(c.name).countDocuments();
      console.log(`  ${c.name} -> ${count} docs`);
    }
  }
  await mongoose.disconnect();
}
run();
