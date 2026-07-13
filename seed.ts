import { MongoClient, ObjectId } from "mongodb";

const MONGODB_URI = "mongodb://127.0.0.1:27017/dailymanagement";
const USER_ID = new ObjectId("6a4e88d36dd2bf30516ce5f0");

async function main() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db();

  console.log("Connected to DB");
  
  // 1. Update User to add age, height, weight, gender, target_calories
  await db.collection("user").updateOne(
    { email: "gkhkaya00@gmail.com" },
    {
      $set: {
        _id: USER_ID,
        name: "gokhanraw",
        email: "gkhkaya00@gmail.com",
        age: 26,
        weight: 75,
        height: 180,
        gender: "Male",
        targetCalories: 2500,
        targetSleepMinutes: 480, // 8 hours
        targetWaterMl: 2500
      }
    },
    { upsert: true }
  );
  
  console.log("User updated.");

  // Clear existing mock data for this user
  await db.collection("accounts").deleteMany({ user_id: USER_ID });
  await db.collection("transactions").deleteMany({ user_id: USER_ID });
  await db.collection("categories").deleteMany({ user_id: USER_ID });
  await db.collection("debts").deleteMany({ user_id: USER_ID });
  await db.collection("subscriptions").deleteMany({ user_id: USER_ID });
  await db.collection("meals").deleteMany({ user_id: USER_ID });
  await db.collection("exercises").deleteMany({ user_id: USER_ID });
  await db.collection("sleeps").deleteMany({ user_id: USER_ID });
  
  // Insert Categories
  const catIncomeId = new ObjectId();
  const catExpenseId1 = new ObjectId();
  const catExpenseId2 = new ObjectId();
  
  await db.collection("categories").insertMany([
    { _id: catIncomeId, user_id: USER_ID, name: "Maaş", icon: "briefcase", color: "#4ade80", type: "income", created_at: new Date() },
    { _id: catExpenseId1, user_id: USER_ID, name: "Market", icon: "cart", color: "#f87171", type: "expense", created_at: new Date() },
    { _id: catExpenseId2, user_id: USER_ID, name: "Ulaşım", icon: "car", color: "#60a5fa", type: "expense", created_at: new Date() }
  ]);
  
  // Insert Accounts
  const account1Id = new ObjectId();
  const account2Id = new ObjectId();
  
  await db.collection("accounts").insertMany([
    { _id: account1Id, user_id: USER_ID, name: "Akbank Maaş", type: "bank", balance: 15500, currency: "TRY", icon: "wallet", color: "#ef4444", include_in_total: true, created_at: new Date() },
    { _id: account2Id, user_id: USER_ID, name: "Nakit", type: "cash", balance: 500, currency: "TRY", icon: "wallet", color: "#22c55e", include_in_total: true, created_at: new Date() }
  ]);
  
  // Insert Transactions
  await db.collection("transactions").insertMany([
    { user_id: USER_ID, account_id: account1Id, category_id: catIncomeId, type: "income", amount: 20000, date: new Date(), description: "Maaş Ödemesi", created_at: new Date() },
    { user_id: USER_ID, account_id: account1Id, category_id: catExpenseId1, type: "expense", amount: 1500, date: new Date(), description: "Market Alışverişi", created_at: new Date() },
    { user_id: USER_ID, account_id: account2Id, category_id: catExpenseId2, type: "expense", amount: 300, date: new Date(), description: "Benzin", created_at: new Date() }
  ]);
  
  // Insert Debts
  await db.collection("debts").insertMany([
    { user_id: USER_ID, person_name: "Ali Veli", direction: "given", amount: 500, date: new Date(), due_date: new Date(new Date().setDate(new Date().getDate() + 10)), status: "active", created_at: new Date() },
    { user_id: USER_ID, person_name: "Kredi Kartı", direction: "taken", amount: 4500, date: new Date(), due_date: new Date(new Date().setDate(new Date().getDate() + 5)), status: "active", created_at: new Date() }
  ]);
  
  // Insert Subscriptions
  await db.collection("subscriptions").insertMany([
    { user_id: USER_ID, name: "Netflix", amount: 200, frequency: "monthly", category_id: catExpenseId1, account_id: account1Id, billing_day: 15, is_active: true, created_at: new Date() }
  ]);

  // Insert Health (Meals)
  await db.collection("meals").insertMany([
    { user_id: USER_ID, date: new Date(), type: "breakfast", food_name: "Yulaf Lapası", serving_description: "1 porsiyon", quantity: 1, calories: 350, created_at: new Date() },
    { user_id: USER_ID, date: new Date(), type: "lunch", food_name: "Tavuk Salata", serving_description: "1 porsiyon", quantity: 1, calories: 420, created_at: new Date() }
  ]);
  
  // Insert Health (Exercises)
  await db.collection("exercises").insertMany([
    { user_id: USER_ID, date: new Date(), exercise_type: "Koşu", duration_minutes: 45, burned_calories: 400, created_at: new Date() }
  ]);
  
  // Insert Health (Sleeps)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  await db.collection("sleeps").insertMany([
    { user_id: USER_ID, date: yesterday, duration_minutes: 420, quality: "İyi", created_at: new Date() }
  ]);

  console.log("Mock data inserted successfully.");
  await client.close();
}

main().catch(console.error);
