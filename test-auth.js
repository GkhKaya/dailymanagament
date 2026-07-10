const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });
async function test() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db();
  const users = await db.collection('user').find().toArray();
  console.log('Users in better-auth collection:', users.map(u => ({ id: u._id, type: typeof u._id, constructor: u._id.constructor.name })));
  const categories = await db.collection('categories').find().toArray();
  console.log('Categories count:', categories.length);
  process.exit(0);
}
test();
