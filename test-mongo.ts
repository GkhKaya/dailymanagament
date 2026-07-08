import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function test() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("no uri");
  console.log("URI present, starts with:", uri.substring(0, 15));
  
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("MongoClient connected successfully!");
    await client.db().command({ ping: 1 });
    console.log("Ping successful!");
  } catch (e) {
    console.error("MongoClient error:", e);
  } finally {
    await client.close();
  }
}
test();
