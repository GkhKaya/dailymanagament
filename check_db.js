const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config({ path: '.env.local' });
(async () => {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db();
  const user = await db.collection('user').findOne();
  console.log(user);
  if (user) {
     console.log("ID TYPE:", typeof user._id, user._id instanceof ObjectId ? "ObjectId" : "String/Other");
  }
  await client.close();
})();
