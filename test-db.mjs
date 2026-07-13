import mongoose from 'mongoose';
import fs from 'fs';
import { User } from './src/models/User.ts';

const env = fs.readFileSync('.env.local', 'utf8');
const uri = env.split('\n').find(l => l.startsWith('MONGODB_URI=')).substring(12).replace(/"/g, '').replace(/'/g, '').trim();

async function run() {
  await mongoose.connect(uri);
  const userId = new mongoose.Types.ObjectId("6a5531e5a1b36be28fce26ff");
  const res = await User.updateOne(
    { _id: userId },
    { $set: { current_weight_kg: 99 } }
  );
  console.log("UPDATE RESULT:", res);
  await mongoose.disconnect();
}

run().catch(console.error);
