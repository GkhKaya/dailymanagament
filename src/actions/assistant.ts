"use server";

import { GoogleGenAI, Type } from "@google/genai";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { User } from "@/models/User";
import { Account } from "@/models/Account";
import { Category } from "@/models/Category";
import { SavedFood } from "@/models/SavedFood";
import { addTransactionAction } from "@/actions/finance";
import { addMealAction } from "@/actions/health";
import mongoose from "mongoose";

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

export async function processAssistantVoiceAction(text: string) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return { success: false, error: "Lütfen .env.local dosyasına GEMINI_API_KEY ekleyin." };
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const userId = await getUserId();
    await connectDB();

    // Kullanıcının kendi kategorilerini çekip yapay zekaya veriyoruz ki uydurmasın.
    const userCategories = await Category.find({ user_id: userId }).lean();
    const categoryNames = userCategories.map(c => c.name).join(", ");

    const schema = {
      type: Type.OBJECT,
      properties: {
        type: {
          type: Type.STRING,
          enum: ['finance', 'health', 'unknown'],
          description: "Mümkün olan değerler: 'finance', 'health', 'unknown'. Ne yapılacağını belirtir."
        },
        finance_data: {
          type: Type.OBJECT,
          nullable: true,
          properties: {
            transaction_type: {
              type: Type.STRING,
              description: "'expense' veya 'income'"
            },
            amount: {
              type: Type.NUMBER
            },
            account_keyword: {
              type: Type.STRING,
              description: "Örn: 'nakit', 'kredi kartı'"
            },
            category_keyword: {
              type: Type.STRING,
              description: "Örn: 'market', 'fatura'"
            },
            description: {
              type: Type.STRING,
              description: "Kullanıcının yaptığı işlemi özetleyen 2-3 kelimelik kısa açıklama (Örn: 'otobüs parası', 'akşam yemeği')"
            }
          }
        },
        health_data: {
          type: Type.OBJECT,
          nullable: true,
          properties: {
            meal_type: {
              type: Type.STRING,
              enum: ['breakfast', 'lunch', 'dinner', 'snack'],
              description: "'breakfast', 'lunch', 'dinner', veya 'snack'"
            },
            foods: {
              type: Type.ARRAY,
              description: "Öğünde tüketilen yiyecek/içeceklerin listesi",
              items: {
                type: Type.OBJECT,
                properties: {
                  name: {
                    type: Type.STRING,
                    description: "Yemeğin Türkçe adı (Örn: yumurta, süt, tam buğday ekmeği)"
                  },
                  quantity: {
                    type: Type.NUMBER,
                    description: "Yemeğin miktarı (sayı olarak)"
                  },
                  unit: {
                    type: Type.STRING,
                    description: "Birimi (Örn: 'gram', 'adet', 'tane', 'porsiyon', 'dilim', 'bardak')"
                  },
                  calories_per_serving: {
                    type: Type.NUMBER,
                    description: "Bir porsiyon/100g başına kalori"
                  },
                  protein_g_per_serving: {
                    type: Type.NUMBER,
                    description: "Bir porsiyon/100g başına protein (gram)"
                  },
                  carbs_g_per_serving: {
                    type: Type.NUMBER,
                    description: "Bir porsiyon/100g başına karbohidrat (gram)"
                  },
                  fat_g_per_serving: {
                    type: Type.NUMBER,
                    description: "Bir porsiyon/100g başına yağ (gram)"
                  },
                  serving_reference: {
                    type: Type.STRING,
                    description: "Besin bilgisinin referansı (örn: '100g' veya '1 adet')"
                  }
                }
              }
            }
          }
        }
      }
    };

    const prompt = `Sen kişisel finans ve sağlık takibi uygulaması için akıllı bir asistansın.
Kullanıcının Türkçe metnindeki niyeti çıkarıp ya bir finans (harcama/gelir) işlemine ya da yemek günlüğüne çevir.
Eğer işlem finans ise 'finance_data' objesini MUTLAKA oluştur. Miktarı, hesabı, kategoriyi ve kısa bir açıklamayı belirle. Açıklama 2-3 kelimeyi geçmesin (Örn: "otobüs parası", "kahve", "maaş"). 
DİKKAT: Kullanıcının kayıtlı kategorileri şunlardır: [${categoryNames}]. Lütfen işlemi MUTLAKA bu kategorilerden en uygun olanına eşleştir. Bulduğun kategorinin adını birebir aynı yaz! Başka kelime uydurma.

Eğer işlem yemek ise 'health_data' objesini MUTLAKA oluştur. Öğün türünü ve yenilen yemeklerin adını, miktarını ve BEY BİLGİSİNİ bul.
ÖNEMLİ: Gramaj, adet, dilim, porsiyon gibi birimleri 'unit' alanına, sayıyı 'quantity' alanına yaz (ör: "4 tane yumurta" -> quantity: 4, unit: "tane").

BESIN HESAPLAMA KÜLLİYATI:
- Eğer kullanıcı gram belirtmişse: 100g olarak normalize et (100g başına kalori, protein, carbs, fat) ve serving_reference olarak "100g" belirt.
- Eğer kullanıcı adet/porsiyon belirtmişse: 1 adet/porsiyon başına nutrient değerleri sağla ve serving_reference olarak "1 adet" veya "1 porsiyon" belirt.
- Yemek isimlerini Türkçe yazıya göre standartlaştır (örn: "yumurta" yerine "tavuk yumurtası", "beyaz ekmek" yerine "beyaz buğday ekmeği").
- Kalori ve besin bilgilerini EN DOĞRU ŞEKİLDE sağla (yanlış bilgi verme, emin olmadığında gerçekçi tahminler yap).

Örnekler:
- Kullanıcı: "3 tane yumurta yedim"
  Çıktı: quantity: 3, unit: "tane", name: "tavuk yumurtası", calories_per_serving: 70, protein_g_per_serving: 6.3, carbs_g_per_serving: 0.4, fat_g_per_serving: 5, serving_reference: "1 adet"
  
- Kullanıcı: "200g çiçek broccoli yedim"
  Çıktı: quantity: 2, unit: "gram", name: "brokkoli (çiçek)", calories_per_serving: 34, protein_g_per_serving: 2.8, carbs_g_per_serving: 7, fat_g_per_serving: 0.4, serving_reference: "100g"

Kullanıcının söylediği: "${text}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }],
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    if (!response.text) {
       return { success: false, error: "Yapay zekadan yanıt alınamadı." };
    }

    const result = JSON.parse(response.text);
    console.log("AI Result:", JSON.stringify(result, null, 2));

    if (result.type === "unknown") {
      return { success: false, error: "Ne dediğinizi tam olarak anlayamadım. Lütfen daha net bir komut verin." };
    }

    if (result.type === "finance" && result.finance_data) {
      // Hesap Bulma
      const accounts = await Account.find({ user_id: userId });
      let matchedAccount = accounts.find(a => a.name.toLowerCase().includes(result.finance_data.account_keyword.toLowerCase()) || result.finance_data.account_keyword.toLowerCase().includes(a.name.toLowerCase()));
      
      if (!matchedAccount && accounts.length > 0) {
        matchedAccount = accounts[0]; // fallback
      }

      // Kategori Bulma
      const categories = await Category.find({ user_id: userId, type: result.finance_data.transaction_type });
      let matchedCategory = categories.find(c => c.name.toLowerCase().includes(result.finance_data.category_keyword.toLowerCase()) || result.finance_data.category_keyword.toLowerCase().includes(c.name.toLowerCase()));
      
      if (!matchedCategory && categories.length > 0) {
          matchedCategory = categories[0]; // fallback
      }

      if (!matchedCategory || !matchedAccount) {
         return { success: false, error: "Uygun kategori veya hesap bulunamadı." };
      }

      const txResult = await addTransactionAction({
        type: result.finance_data.transaction_type,
        amount: result.finance_data.amount,
        account_id: matchedAccount._id.toString(),
        category_id: matchedCategory._id.toString(),
        date: new Date().toISOString(),
        description: result.finance_data.description || "",
        source: "manual"
      });

      if (txResult.success) {
        return { 
            success: true, 
            message: `✅ ${matchedCategory.name} kategorisine ${result.finance_data.amount} TL eklendi. (${matchedAccount.name})` 
        };
      } else {
        return { success: false, error: txResult.error };
      }
    }

    if (result.type === "health" && result.health_data) {
      let addedFoods = [];
      
      for (const food of result.health_data.foods) {
        try {
          // 1. SavedFood'da yemeği ara (user_id ve normalized food_name'e göre)
          const normalizedFoodName = food.name.toLowerCase().trim();
          let existingFood = await SavedFood.findOne({
            user_id: userId,
            food_name: { $regex: `^${normalizedFoodName}$`, $options: 'i' }
          }).lean();

          let caloriesPerServing = food.calories_per_serving;
          let proteinPerServing = food.protein_g_per_serving;
          let carbsPerServing = food.carbs_g_per_serving;
          let fatPerServing = food.fat_g_per_serving;

          // 2. Eğer SavedFood'da yemek varsa, besin bilgilerini oradan al
          if (existingFood) {
            // Normalize etme: SavedFood'da 1 birim başına kayıtlı olduğunu varsayıyoruz
            // Ama quantity farklı olabilir, yani SavedFood'un quantity'si ve referanstaki quantity'si eşleşmeyebilir
            // Biz SavedFood'dan kalori, protein, carbs, fat'ı 1 birim başına normalize ederek alalım
            caloriesPerServing = existingFood.calories / existingFood.quantity;
            proteinPerServing = existingFood.protein_g / existingFood.quantity;
            carbsPerServing = existingFood.carbs_g / existingFood.quantity;
            fatPerServing = existingFood.fat_g / existingFood.quantity;
          }

          // 3. Total besin bilgisini hesapla (quantity'ye göre çarp)
          const totalCalories = Math.round(caloriesPerServing * food.quantity);
          const totalProtein = Math.round(proteinPerServing * food.quantity * 10) / 10;
          const totalCarbs = Math.round(carbsPerServing * food.quantity * 10) / 10;
          const totalFat = Math.round(fatPerServing * food.quantity * 10) / 10;

          // 4. Eğer SavedFood'da yok ise, Gemini'nin verdiği bilgilere göre yeni SavedFood ekle
          if (!existingFood) {
            await SavedFood.create({
              user_id: userId,
              food_name: food.name,
              serving_description: `${food.quantity} ${food.unit}`,
              quantity: food.quantity,
              calories: totalCalories,
              protein_g: totalProtein,
              carbs_g: totalCarbs,
              fat_g: totalFat
            });
          }

          // 5. addMealAction'a gönder
          await addMealAction({
            date: new Date().toISOString(),
            type: result.health_data.meal_type,
            food_name: food.name,
            serving_description: `${food.quantity} ${food.unit}`,
            quantity: food.quantity,
            calories: totalCalories,
            protein_g: totalProtein,
            carbs_g: totalCarbs,
            fat_g: totalFat
          });

          addedFoods.push(`${food.quantity} ${food.unit} ${food.name}`);
        } catch (foodError) {
          console.error(`Error processing food ${food.name}:`, foodError);
        }
      }

      if (addedFoods.length > 0) {
        return { success: true, message: `✅ Öğüne eklendi: ${addedFoods.join(", ")}` };
      } else {
        return { success: false, error: "Besinler işlenemedi." };
      }
    }

    if (result.type === "health" && !result.health_data) {
        return { success: false, error: "Yemeğin adını veya miktarını tam olarak anlayamadım." };
    }

    if (result.type === "finance" && !result.finance_data) {
        return { success: false, error: "Harcamanın miktarını veya detaylarını tam olarak anlayamadım." };
    }

    return { success: false, error: "İşlem anlaşılamadı. Lütfen 'Nakit hesabımdan 100 TL market harcaması yaptım' veya 'Kahvaltıda 1 elma yedim' gibi net ifadeler kullanın." };

  } catch (error: any) {
    console.error("Assistant Error:", error);
    
    // Rate limit / Quota / Overloaded hatası kontrolü
    const errorMsg = error?.message?.toLowerCase() || "";
    if (errorMsg.includes("429") || errorMsg.includes("rate limit") || errorMsg.includes("quota") || errorMsg.includes("too many requests") || errorMsg.includes("resource has been exhausted") || errorMsg.includes("503") || errorMsg.includes("overloaded") || errorMsg.includes("service unavailable")) {
      return { success: false, error: "Şuan sesli asistanımız çok yoğun, lütfen daha sonra tekrar deneyin." };
    }

    return { success: false, error: error.message };
  }
}
