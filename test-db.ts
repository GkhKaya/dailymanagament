import mongoose from 'mongoose';
import { User } from './src/models/User';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log("Connected to MongoDB.");
  
  // Try finding with string
  const userStr = await mongoose.connection.db.collection('user').findOne({ _id: "6a552f77a1b36be28fce26f2" });
  console.log("Found with String:", !!userStr);
  
  // Try finding with ObjectId
  const userObjId = await mongoose.connection.db.collection('user').findOne({ _id: new mongoose.Types.ObjectId("6a552f77a1b36be28fce26f2") });
  console.log("Found with ObjectId:", !!userObjId);
  
  await mongoose.disconnect();
}
run().catch(console.error);
