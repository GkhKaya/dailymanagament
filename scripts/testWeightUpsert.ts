// @ts-nocheck
import mongoose from "mongoose";
import { WeightLog } from "../src/models/WeightLog";

async function run() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log("Connected");

  const userId = "6a66243a58ffb24483000612";
  const targetDate = new Date();
  targetDate.setUTCHours(0, 0, 0, 0);

  console.log("Trying findOneAndUpdate upsert with:", { user_id: userId, date: targetDate });

  try {
    const result = await WeightLog.findOneAndUpdate(
      { user_id: userId, date: targetDate },
      { $set: { weight_kg: 84.5 } },
      { upsert: true, returnDocument: "after" }
    );
    console.log("Result:", JSON.stringify(result, null, 2));
  } catch (e) {
    console.error("ERROR:", e.message, e);
  }

  const all = await mongoose.connection.db.collection("weightlog").find({}).toArray();
  console.log("\nweightlog kaydi sayisi:", all.length);
  console.log(all);

  await mongoose.disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
