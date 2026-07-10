import mongoose from "mongoose";
import { DailyLog } from "../src/models/DailyLog";
import { Transaction } from "../src/models/Transaction";
import { Account } from "../src/models/Account";

async function run() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log("Connected to MongoDB");

  const userId = new mongoose.Types.ObjectId("6a4e88d36dd2bf30516ce5f0");

  // Update DailyLog food names
  const logs = await DailyLog.find({ user_id: userId });
  for (const log of logs) {
    if (log.meals.breakfast && log.meals.breakfast.length > 0) {
      log.meals.breakfast[0].food_name = "Gerçek MongoDB Yulafı (LIVE)";
    }
    if (log.meals.lunch && log.meals.lunch.length > 0) {
      log.meals.lunch[0].food_name = "Gerçek MongoDB Tavuğu (LIVE)";
    }
    await log.save();
  }
  
  // Update Transactions
  const txs = await Transaction.find({ user_id: userId });
  for (const tx of txs) {
    if (tx.description === "Migros Alışverişi") {
      tx.description = "MongoDB Migros (Canlı Veri)";
      await tx.save();
    }
  }

  // Update Account names
  const accs = await Account.find({ user_id: userId });
  for (const acc of accs) {
    if (acc.name === "Nakit Cüzdan") {
      acc.name = "Gerçek Nakit Cüzdan";
      await acc.save();
    }
  }

  console.log("Updated data to prove it is from MongoDB!");
  await mongoose.disconnect();
}
run();
