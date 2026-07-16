import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { MongoClient } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined");
}

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET is not defined");
}

/**
 * Extract the database name from the MongoDB URI.
 * If no database name is present in the URI (e.g. mongodb://host:port/?...),
 * fall back to MONGODB_DB_NAME env var or 'dailymanagament'.
 *
 * Having an explicit database name is critical — without it, the MongoDB
 * Node.js driver falls back to the 'test' database, causing all writes to
 * go to a completely different place than what Mongoose uses.
 */
function extractDbName(uri: string): string {
  try {
    const url = new URL(uri);
    // pathname is like "/dbname" — strip the leading slash
    const dbName = url.pathname.replace(/^\//, '').split('?')[0];
    return dbName || process.env.MONGODB_DB_NAME || 'dailymanagament';
  } catch {
    return process.env.MONGODB_DB_NAME || 'dailymanagament';
  }
}

const dbName = extractDbName(process.env.MONGODB_URI);

// Singleton pattern: reuse the same MongoClient across hot-reloads in dev
const globalWithMongo = global as typeof globalThis & { _mongoAuthClient?: MongoClient };

let client: MongoClient;

if (process.env.NODE_ENV === "production") {
  client = new MongoClient(process.env.MONGODB_URI);
  client.connect().catch((err) => console.error("Better Auth MongoDB connect error:", err));
} else {
  if (!globalWithMongo._mongoAuthClient) {
    globalWithMongo._mongoAuthClient = new MongoClient(process.env.MONGODB_URI);
    globalWithMongo._mongoAuthClient
      .connect()
      .catch((err) => console.error("Better Auth MongoDB connect error:", err));
  }
  client = globalWithMongo._mongoAuthClient;
}

// Use explicit database name so Better Auth and Mongoose always target the same DB
const db = client.db(dbName);

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
          console.log(`\n=== SIFRE SIFIRLAMA TALEBI ===\nEmail: ${user.email}\nSifirlama Linki: ${url}\n==============================\n`);
        }
    },
});
