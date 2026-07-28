// @ts-nocheck
import mongoose from "mongoose";

async function run() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log("Connected to MongoDB");

  const db = mongoose.connection.db;

  const weightLogs = await db.collection("weightlog").find({}).sort({ date: -1 }).limit(20).toArray();
  console.log("\n=== WeightLog kayitlari (son 20) ===");
  for (const w of weightLogs) {
    console.log({
      _id: w._id.toString(),
      user_id: w.user_id?.toString(),
      date: w.date,
      date_type: w.date instanceof Date ? "Date" : typeof w.date,
      weight_kg: w.weight_kg,
    });
  }
  console.log(`\nToplam WeightLog kaydi: ${await db.collection("weightlog").countDocuments()}`);

  const users = await db.collection("user").find({}).limit(5).toArray();
  console.log("\n=== User kayitlari ===");
  for (const u of users) {
    console.log({
      _id: u._id?.toString(),
      email: u.email,
      current_weight_kg: u.current_weight_kg,
      target_weight_kg: u.target_weight_kg,
      target_weight_date: u.target_weight_date,
      "profile.height_cm": u.profile?.height_cm,
      "profile.birth_date": u.profile?.birth_date,
      "profile.gender": u.profile?.gender,
      "profile.activity_level": u.profile?.activity_level,
      "settings.daily_calorie_goal": u.settings?.daily_calorie_goal,
    });
  }

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error("ERROR:", e);
  process.exit(1);
});
