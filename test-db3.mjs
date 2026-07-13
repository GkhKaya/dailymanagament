import mongoose from 'mongoose';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const uri = env.split('\n').find(l => l.startsWith('MONGODB_URI=')).substring(12).replace(/"/g, '').replace(/'/g, '').trim();

async function run() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const sessions = await db.collection('session').find().toArray();
  console.log("SESSIONS COUNT:", sessions.length);
  if (sessions.length > 0) {
    console.log("LAST SESSION:", sessions[sessions.length - 1]);
  }
  await mongoose.disconnect();
}

run().catch(console.error);
