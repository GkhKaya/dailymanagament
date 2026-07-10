import mongoose from "mongoose";
import { User } from "../src/models/User";
import { Account } from "../src/models/Account";
import { Category } from "../src/models/Category";
import { Transaction } from "../src/models/Transaction";
import { DailyLog } from "../src/models/DailyLog";
import { WeightLog } from "../src/models/WeightLog";
import { Subscription } from "../src/models/Subscription";
import { Debt } from "../src/models/Debt";
import { 
  Gender, ActivityLevel, BmrFormula, AccountType, CategoryType, 
  TransactionType, TransactionSource, MealType, ExerciseSource,
  SubscriptionFrequency, DebtDirection, DebtStatus
} from "../src/models/Enums";


const USER_ID = "6a4e88d36dd2bf30516ce5f0";
const EMAIL = "gkhkaya00@gmail.com";

async function runSeed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("No MONGODB_URI in .env.local");

  console.log("Connecting to MongoDB...");
  await mongoose.connect(uri);
  console.log("Connected!");

  try {
    const userObjectId = new mongoose.Types.ObjectId(USER_ID);

    // 1. User Profile
    await User.findByIdAndDelete(userObjectId); // Clear if exists
    const user = new User({
      _id: userObjectId,
      email: EMAIL,
      password_hash: "hashed",
      profile: {
        name: "Gökhan Kaya",
        birth_date: new Date("1995-01-01"),
        gender: Gender.MALE,
        height_cm: 180,
        activity_level: ActivityLevel.MODERATE,
        bmr_formula: BmrFormula.MIFFLIN_ST_JEOR
      },
      current_weight_kg: 75,
      settings: {
        daily_calorie_goal: 2400,
        currency: "TRY"
      }
    });
    await user.save();
    console.log("✅ User created.");

    // Clear old data for user
    await Account.deleteMany({ user_id: userObjectId });
    await Category.deleteMany({ user_id: userObjectId });
    await Transaction.deleteMany({ user_id: userObjectId });
    await DailyLog.deleteMany({ user_id: userObjectId });
    await WeightLog.deleteMany({ user_id: userObjectId });
    await Subscription.deleteMany({ user_id: userObjectId });
    await Debt.deleteMany({ user_id: userObjectId });
    
    // 2. Accounts
    const cashAccount = await Account.create({
      user_id: userObjectId,
      name: "Nakit Cüzdan",
      type: AccountType.CASH,
      balance: mongoose.Types.Decimal128.fromString("1500"),
    });

    const creditCard = await Account.create({
      user_id: userObjectId,
      name: "Garanti Bonus",
      type: AccountType.CREDIT_CARD,
      balance: mongoose.Types.Decimal128.fromString("-4500"),
      credit_card_details: {
        total_limit: mongoose.Types.Decimal128.fromString("50000"),
        current_debt: mongoose.Types.Decimal128.fromString("4500"),
        statement_day: 15,
        payment_due_day: 25
      }
    });

    const bankAccount = await Account.create({
      user_id: userObjectId,
      name: "Enpara Maaş",
      type: AccountType.BANK_ACCOUNT,
      balance: mongoose.Types.Decimal128.fromString("37500"),
    });
    console.log("✅ Accounts created.");

    // 3. Categories
    const catSalary = await Category.create({ user_id: userObjectId, name: "Maaş", type: CategoryType.INCOME, icon: "banknotes", color: "#22c55e" });
    const catMarket = await Category.create({ user_id: userObjectId, name: "Market", type: CategoryType.EXPENSE, icon: "shopping-cart", color: "#ef4444" });
    const catFun = await Category.create({ user_id: userObjectId, name: "Eğlence", type: CategoryType.EXPENSE, icon: "film", color: "#8b5cf6" });
    console.log("✅ Categories created.");

    // 4. Transactions
    await Transaction.create({
      user_id: userObjectId,
      type: TransactionType.INCOME,
      amount: mongoose.Types.Decimal128.fromString("45000"),
      date: new Date(new Date().setDate(1)), // 1st of the month
      description: "Maaş Ödemesi",
      category_id: catSalary._id,
      account_id: bankAccount._id,
      source: TransactionSource.MANUAL,
    });

    await Transaction.create({
      user_id: userObjectId,
      type: TransactionType.EXPENSE,
      amount: mongoose.Types.Decimal128.fromString("450"),
      date: new Date(new Date().setHours(14, 30)),
      description: "Migros Alışverişi",
      category_id: catMarket._id,
      account_id: creditCard._id,
      source: TransactionSource.MANUAL,
    });
    
    await Transaction.create({
      user_id: userObjectId,
      type: TransactionType.EXPENSE,
      amount: mongoose.Types.Decimal128.fromString("150"),
      date: new Date(new Date().setDate(new Date().getDate() - 1)),
      description: "Netflix Aboneliği",
      category_id: catFun._id,
      account_id: creditCard._id,
      source: TransactionSource.SUBSCRIPTION,
    });
    console.log("✅ Transactions created.");

    // 5. DailyLog (Today and Yesterday)
    const today = new Date();
    today.setUTCHours(0,0,0,0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const commonFood = {
      entry_id: new mongoose.Types.ObjectId(),
      food_name: "Yulaf & Süt",
      serving_description: "1 porsiyon",
      quantity: 1,
      nutrition_snapshot: { calories: 320, protein_g: 15, carbs_g: 45, fat_g: 10 }
    };
    const dinnerFood = {
      entry_id: new mongoose.Types.ObjectId(),
      food_name: "Tavuk Salata",
      serving_description: "1 porsiyon",
      quantity: 1,
      nutrition_snapshot: { calories: 450, protein_g: 45, carbs_g: 10, fat_g: 20 }
    };

    await DailyLog.create({
      user_id: userObjectId,
      date: today,
      meals: {
        breakfast: [commonFood],
        lunch: [dinnerFood],
        dinner: [],
        snacks: []
      },
      sleep: { duration_minutes: 420, calories_burned: 300 },
      exercises: [
        { name: "Koşu", duration_minutes: 45, calories_burned: 450, source: ExerciseSource.MANUAL }
      ],
      totals: {
        calories_consumed: 770,
        calories_burned_exercise: 450,
        calories_burned_sleep: 300,
        protein_g: 60,
        carbs_g: 55,
        fat_g: 30
      }
    });

    await DailyLog.create({
      user_id: userObjectId,
      date: yesterday,
      meals: {
        breakfast: [commonFood],
        lunch: [dinnerFood],
        dinner: [commonFood],
        snacks: []
      },
      sleep: { duration_minutes: 480, calories_burned: 320 },
      exercises: [],
      totals: {
        calories_consumed: 1090,
        calories_burned_exercise: 0,
        calories_burned_sleep: 320,
        protein_g: 75,
        carbs_g: 100,
        fat_g: 40
      }
    });
    console.log("✅ DailyLogs created.");

    // 6. WeightLog
    await WeightLog.create({
      user_id: userObjectId,
      date: today,
      weight_kg: 74.8,
      note: "Sabah aç karnına"
    });
    console.log("✅ WeightLogs created.");

    // 7. Subscriptions & Debts
    await Subscription.create({
      user_id: userObjectId,
      name: "Netflix",
      amount: mongoose.Types.Decimal128.fromString("150"),
      frequency: SubscriptionFrequency.MONTHLY,
      category_id: catFun._id,
      account_id: creditCard._id,
      next_run_date: new Date(new Date().setDate(today.getDate() + 5)),
      billing_day: new Date().getDate()
    });

    await Debt.create({
      user_id: userObjectId,
      person_name: "Ali",
      direction: DebtDirection.GIVEN,
      original_amount: mongoose.Types.Decimal128.fromString("2000"),
      remaining_amount: mongoose.Types.Decimal128.fromString("1000"),
      date: today,
      due_date: new Date(new Date().setDate(today.getDate() + 10)),
      status: DebtStatus.PARTIALLY_PAID
    });
    console.log("✅ Subscriptions & Debts created.");
    
    console.log("🚀 All mock data seeded successfully!");
  } catch (err) {
    console.error("Seeding Error:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
}

runSeed();
