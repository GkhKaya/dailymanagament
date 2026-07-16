import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { MongoClient } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined");
}

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET is not defined");
}

// Singleton pattern: reuse the same MongoClient across hot-reloads in dev
const globalWithMongo = global as typeof globalThis & { _mongoAuthClient?: MongoClient };

let client: MongoClient;

if (process.env.NODE_ENV === "production") {
  // In production, always create a fresh client
  client = new MongoClient(process.env.MONGODB_URI);
  client.connect().catch((err) => console.error("Better Auth MongoDB connect error:", err));
} else {
  // In development, reuse the client to avoid too many connections
  if (!globalWithMongo._mongoAuthClient) {
    globalWithMongo._mongoAuthClient = new MongoClient(process.env.MONGODB_URI);
    globalWithMongo._mongoAuthClient.connect().catch((err) =>
      console.error("Better Auth MongoDB connect error:", err)
    );
  }
  client = globalWithMongo._mongoAuthClient;
}

const db = client.db();

export const auth = betterAuth({
    database: mongodbAdapter(db),
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL,
    rateLimit: {
        window: 60,
        max: 10000
    },
    advanced: {
        defaultCookieAttributes: {
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
        },
    },
    trustedOrigins: [
        ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
        ...(process.env.NEXT_PUBLIC_APP_URL ? [process.env.NEXT_PUBLIC_APP_URL] : []),
    ].filter(Boolean),
    emailAndPassword: {
        enabled: true,
        sendResetPassword: async ({ user, url }) => {
          // Geliştirme aşamasında konsola yazdırıyoruz. 
          // Production ortamında buraya Resend veya Nodemailer entegrasyonu gelecek.
          console.log(`\n=== SIFRE SIFIRLAMA TALEBI ===\nEmail: ${user.email}\nSifirlama Linki: ${url}\n==============================\n`);
        }
    },
});
