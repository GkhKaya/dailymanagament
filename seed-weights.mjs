import mongoose from 'mongoose';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const uri = env.split('\n').find(l => l.startsWith('MONGODB_URI=')).substring(12).replace(/"/g, '').replace(/'/g, '').trim();

async function run() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  
  // Get latest session user
  const sessions = await db.collection('session').find().sort({createdAt:-1}).limit(1).toArray();
  const userId = sessions[0].userId.toString();
  
  // Seed past 7 days
  const now = new Date();
  now.setUTCHours(0,0,0,0);
  
  const seedLogs = [];
  let weight = 83.5; // Starting weight a week ago
  
  for (let i = 7; i > 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    
    seedLogs.push({
      user_id: userId,
      date: d,
      weight_kg: weight,
      created_at: new Date()
    });
    
    // Simulate losing weight gradually
    weight -= (Math.random() * 0.4 + 0.1); 
    weight = Math.round(weight * 10) / 10;
  }
  
  // delete any old fake logs if exist
  await db.collection('weightlogs').deleteMany({
    user_id: userId,
    date: { $lt: now }
  });
  
  await db.collection('weightlogs').insertMany(seedLogs);
  console.log("Seeded past 7 days weight logs!");
  
  await mongoose.disconnect();
}

run().catch(console.error);
