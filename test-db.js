const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db();
  const user = await db.collection('user').findOne({ email: 'gokhanraw2@gmail.com' });
  console.log("USER DOC:");
  console.log(user);
  console.log("ID TYPE:", typeof user._id, user._id.constructor.name);
  await client.close();
}
run().catch(console.error);
