// @ts-nocheck
import mongoose from "mongoose";
import { WeightLog } from "../src/models/WeightLog";

async function run() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log("Connected");

  const userId = "6a66243a58ffb24483000612";
  const targetDate = new Date("2026-07-28T00:00:00.000Z");
  const thirtyDaysAgo = new Date(targetDate);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  console.log("Query:", { user_id: userId, date: { $gte: thirtyDaysAgo, $lte: targetDate } });

  // dashboard.ts:49-52 sorgusunu simüle et
  const logs = await WeightLog.find({
    user_id: userId,
    date: { $gte: thirtyDaysAgo, $lte: targetDate }
  }).sort({ date: 1 }).lean();

  console.log("Found:", logs.length, "logs");
  console.log(logs);

  await mongoose.disconnect();
}
run().catch((e) => { console.error(e); process.exit(1); });
