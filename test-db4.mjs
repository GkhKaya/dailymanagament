import mongoose from 'mongoose';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const uri = env.split('\n').find(l => l.startsWith('MONGODB_URI=')).substring(12).replace(/"/g, '').replace(/'/g, '').trim();

async function run() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const weightLogs = await db.collection('weightlogs').find().toArray();
  console.log("WEIGHT LOGS COUNT:", weightLogs.length);
  if (weightLogs.length > 0) {
    console.log("LAST LOG:", weightLogs[weightLogs.length - 1]);
  }
  
  // also check collections just in case
  const collections = await db.listCollections().toArray();
  console.log("COLLECTIONS:", collections.map(c => c.name));
  
  await mongoose.disconnect();
}

run().catch(console.error);
