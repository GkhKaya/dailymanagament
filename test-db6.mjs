import mongoose from 'mongoose';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const uri = env.split('\n').find(l => l.startsWith('MONGODB_URI=')).substring(12).replace(/"/g, '').replace(/'/g, '').trim();

async function run() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const sessions = await db.collection('session').find().sort({createdAt:-1}).limit(1).toArray();
  const userId = sessions[0].userId.toString();
  
  const targetDate = new Date();
  targetDate.setUTCHours(0,0,0,0);
  
  const thirtyDaysAgo = new Date(targetDate);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const weightLogs = await db.collection('weightlogs').find({
    user_id: userId,
    date: { $gte: thirtyDaysAgo, $lte: targetDate }
  }).sort({ date: 1 }).toArray();
  
  const weightHistory = weightLogs.map(log => ({
    date: log.date.toISOString(),
    weight: log.weight_kg
  }));
  
  console.log("TEST getHealthDataAction simulation:");
  console.log("Target Date:", targetDate);
  console.log("User ID:", userId);
  console.log("Weight Logs length:", weightLogs.length);
  console.log("Weight History length:", weightHistory.length);
  console.log("Weight History:", weightHistory);
  
  await mongoose.disconnect();
}

run().catch(console.error);
