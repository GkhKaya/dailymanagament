import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { MongoClient } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined");
}

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db();

export const auth = betterAuth({
    database: mongodbAdapter(db),
    emailAndPassword: {
        enabled: true,
        sendResetPassword: async ({ user, url }) => {
          // Geliştirme aşamasında konsola yazdırıyoruz. 
          // Production ortamında buraya Resend veya Nodemailer entegrasyonu gelecek.
          console.log(`\n=== SIFRE SIFIRLAMA TALEBI ===\nEmail: ${user.email}\nSifirlama Linki: ${url}\n==============================\n`);
        }
    },
});
