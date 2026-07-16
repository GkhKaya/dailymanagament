const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });
(async () => {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db();
  
  const user = await db.collection('user').findOne();
  if (!user) {
    console.log("No user found in DB");
    process.exit(0);
  }
  
  console.log("Found user ID:", user._id, "Type:", typeof user._id, user._id.constructor.name);
  
  const result = await db.collection('user').updateOne(
    { _id: user._id.toString() },
    { $set: { current_weight_kg: 99 } }
  );
  
  console.log("Update result with String:", result.matchedCount, result.modifiedCount);
  
  process.exit(0);
})();
