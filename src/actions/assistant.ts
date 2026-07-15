"use server";

import { GoogleGenAI, Type } from "@google/genai";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { User } from "@/models/User";
import { Account } from "@/models/Account";
import { Category } from "@/models/Category";
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
Eğer işlem yemek ise 'health_data' objesini MUTLAKA oluştur. Öğün türünü ve yenilen yemeklerin adını ve miktarını bul. Gramaj, adet, dilim, porsiyon gibi birimleri 'unit' alanına, sayıyı 'quantity' alanına yaz (ör: "4 tane yumurta" -> quantity: 4, unit: "tane"). Yemek isimlerini 'name_tr' (Türkçe) ve 'name_en' (İngilizce çevirisi) olarak ayırarak yaz.
Kullanıcının söylediği: "${text}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema as any,
        temperature: 0.1,
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
      const baseUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
      
      for (const food of result.health_data.foods) {
         // Kendi API'mizi kullanarak Türkçe arama yapıyoruz (Manuel ekleme ile aynı rota)
         const searchRes = await fetch(`${baseUrl}/api/fatsecret/search?query=${encodeURIComponent(food.name)}`, {
             headers: {
                 cookie: `next-auth.session-token=mock`
             }
         });
         
         if (searchRes.ok) {
             const searchData = await searchRes.json();
             if (searchData.foods && searchData.foods.length > 0) {
                 const bestMatch = searchData.foods[0];
                 
                 // Makro detaylarını getir
                 const detailsRes = await fetch(`${baseUrl}/api/fatsecret/details?foodId=${bestMatch.food_id}`);
                 if (detailsRes.ok) {
                     const detailsData = await detailsRes.json();
                     let targetServing = null;
                     let ratio = 1;
                     
                     // `details` API route already returns the servings array or empty array
                     const servings = Array.isArray(detailsData.servings) ? detailsData.servings : [];

                     if (servings.length > 0) {
                         const isUnit = food.unit.match(/adet|tane|dilim|porsiyon|bardak|kase|fincan/i);
                         if (isUnit) {
                             // Adet/Porsiyon bazlı serving bulmaya çalış (genellikle 100g dışındakiler)
                             targetServing = servings.find((s: any) => s.measurement_description !== '100 g') || servings[0];
                             ratio = food.quantity / parseFloat(targetServing.number_of_units || "1");
                         } else {
                             // Gram bazlı serving bul (varsayılan)
                             targetServing = servings.find((s: any) => s.metric_serving_unit === 'g' && s.measurement_description === '100 g') || servings.find((s: any) => s.metric_serving_unit === 'g') || servings[0];
                             ratio = food.quantity / parseFloat(targetServing.metric_serving_amount || "100");
                         }

                         const cals = parseFloat(targetServing.calories || "0") * ratio;
                         const carbs = parseFloat(targetServing.carbohydrate || "0") * ratio;
                         const protein = parseFloat(targetServing.protein || "0") * ratio;
                         const fat = parseFloat(targetServing.fat || "0") * ratio;

                         await addMealAction({
                             date: new Date().toISOString(),
                             type: result.health_data.meal_type,
                             food_name: bestMatch.food_name || food.name,
                             serving_description: `${food.quantity} ${food.unit}`,
                             quantity: food.quantity,
                             calories: Math.round(cals),
                             protein_g: Math.round(protein * 10) / 10,
                             carbs_g: Math.round(carbs * 10) / 10,
                             fat_g: Math.round(fat * 10) / 10,
                             fatsecret_food_id: bestMatch.food_id
                         });
                         addedFoods.push(`${food.quantity} ${food.unit} ${bestMatch.food_name || food.name}`);
                     }
                 }
             }
         }
      }

      if (addedFoods.length > 0) {
        return { success: true, message: `✅ Öğüne eklendi: ${addedFoods.join(", ")}` };
      } else {
        return { success: false, error: "Besinler FatSecret üzerinde bulunamadı." };
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
