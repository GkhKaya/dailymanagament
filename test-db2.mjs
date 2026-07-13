import mongoose from 'mongoose';
import fs from 'fs';
import { User } from './src/models/User.ts';

const env = fs.readFileSync('.env.local', 'utf8');
const uri = env.split('\n').find(l => l.startsWith('MONGODB_URI=')).substring(12).replace(/"/g, '').replace(/'/g, '').trim();

async function run() {
  await mongoose.connect(uri);
  const user = await mongoose.connection.db.collection('user').findOne({ email: 'gokhanraw3@gmail.com' });
  console.log(user);
  await mongoose.disconnect();
}

run().catch(console.error);
