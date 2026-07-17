# Mimari Rehber: MongoDB, Server Actions ve Better Auth Entegrasyonu

Bu projede veritabanı olarak **MongoDB**, backend işlemleri için **Next.js Server Actions** ve kimlik doğrulama için **Better Auth** kullanıyoruz. Bu üç teknolojinin birbirine nasıl bağlandığını aşağıdaki kod örnekleriyle inceleyebilirsiniz.

---

## 1. Veritabanı (MongoDB / Mongoose)

Projeye MongoDB bağlantısı `mongoose` kullanılarak sağlanıyor. Bağlantı nesnesi global olarak önbelleğe (cache) alınıyor ve uygulamanın performanslı çalışması sağlanıyor.

### Veritabanı Bağlantısı (`src/lib/db.ts`)
```typescript
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

let cached = (global as any).mongoose;
if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export const connectDB = async () => {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI!).then((mongoose) => mongoose);
  }
  
  cached.conn = await cached.promise;
  return cached.conn;
};
```

---

## 2. Kimlik Doğrulama (Better Auth)

**Better Auth**, projenin yetkilendirme (authentication) mekanizmasını sağlıyor. MongoDB adaptörü ile mevcut veritabanımıza bağlanıyor ve kullanıcı session (oturum) yönetimini üstleniyor.

### Auth Tanımlaması (`src/lib/auth.ts`)
```typescript
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI!);
const db = client.db();

export const auth = betterAuth({
    database: mongodbAdapter(db),
    emailAndPassword: {
        enabled: true,
        sendResetPassword: async ({ user, url }) => {
          console.log(`Reset link: ${url}`);
        }
    },
});
```

---

## 3. Server Actions ile İş Akışı

Next.js Server Actions (`"use server";`) sayesinde client (tarayıcı) tarafında API yazmadan direkt backend fonksiyonlarını tetikleyebiliyoruz. Server Action'larımızın genel akışı şöyledir:

1. `auth.api.getSession()` ile aktif kullanıcı session'ı çekilir.
2. `connectDB()` ile veritabanı bağlantısı sağlanır.
3. İlgili `Mongoose` modeli (örn. `User`) kullanılarak veritabanında işlem yapılır.

### Örnek Bir Server Action (`src/actions/user.ts`)

```typescript
"use server";

import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { User } from "@/models/User";

// 1. Session ve Kullanıcı IDsini getiren yardımcı fonksiyon
async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

// 2. Asıl Server Action Fonksiyonu
export async function updateUserHealthProfileAction(data: {
  weight: number;
  height: number;
}) {
  try {
    // Veritabanına bağlan
    await connectDB();
    
    // Oturumdan user_id'yi al ve ObjectId'ye çevir
    const userIdStr = await getUserId();
    const userId = new mongoose.Types.ObjectId(userIdStr);

    // Mongoose kullanarak DB'yi güncelle
    await User.updateOne(
      { _id: userId },
      {
        $set: {
          current_weight_kg: data.weight,
          "profile.height_cm": data.height,
        }
      }
    );

    // Başarı durumunu dön
    return { success: true };
  } catch (e: unknown) {
    const err = e as Error;
    // Hata durumunu yönet
    return { success: false, error: err.message };
  }
}
```

### Client Tarafından Kullanımı (ViewModel üzerinden)

Client tarafında Server Action'lar asenkron bir fonksiyonmuş gibi çağrılır. Biz bu projede UI bileşenlerini temiz tutmak için mantığı *ViewModel* pattern'i kullanarak ayırıyoruz.

```typescript
// Örn: src/viewmodels/useOnboardingViewModel.ts
import { updateUserHealthProfileAction } from '@/actions/user';

export function useOnboardingViewModel() {
  const saveHealth = async () => {
    // Server action'ı sanki normal bir fonksiyonmuş gibi çağırıyoruz
    const res = await updateUserHealthProfileAction({
      weight: 75,
      height: 180,
    });

    if (res.success) {
      console.log("Başarıyla kaydedildi!");
    } else {
      console.error("Hata oluştu:", res.error);
    }
  };

  return { saveHealth };
}
```
