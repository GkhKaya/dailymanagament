import mongoose from 'mongoose';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const uri = env.split('\n').find(l => l.startsWith('MONGODB_URI=')).substring(12).replace(/"/g, '').replace(/'/g, '').trim();

async function run() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const sessions = await db.collection('session').find().sort({createdAt:-1}).limit(1).toArray();
  const userId = sessions[0].userId.toString();
  console.log("LATEST USER ID:", userId);
  
  const weightLogs = await db.collection('weightlogs').find({ user_id: userId }).toArray();
  console.log("WEIGHT LOGS FOR THIS USER:", weightLogs);
  
  await mongoose.disconnect();
}

run().catch(console.error);
