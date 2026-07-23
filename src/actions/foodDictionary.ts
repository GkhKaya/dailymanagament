"use server";

import { connectDB } from "@/lib/db";
import { LocalFood } from "@/models/LocalFood";
import { GoogleGenAI } from "@google/genai";

// Simple in-memory rate limiter for Gemini
const requestTimestamps: number[] = [];

async function applyRateLimit() {
  const now = Date.now();
  const oneMinuteAgo = now - 60000;
  
  // Clean up old timestamps
  while (requestTimestamps.length > 0 && requestTimestamps[0] < oneMinuteAgo) {
    requestTimestamps.shift();
  }

  // If we have made 3 or more requests in the last minute, delay execution
  if (requestTimestamps.length >= 3) {
    const oldest = requestTimestamps[0];
    const waitTime = 60000 - (now - oldest);
    console.log(`[Rate Limit] Delaying Gemini request by ${waitTime}ms to prevent exceeding quota.`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  // Add new timestamp
  requestTimestamps.push(Date.now());
}

export async function searchLocalFoodsAction(query: string) {
  try {
    await connectDB();
    if (!query || query.length < 2) return { success: true, foods: [] };

    // Regex search for auto-complete (case-insensitive)
    const regex = new RegExp(query, 'i');
    const foods = await LocalFood.find({ name: { $regex: regex } }).limit(20).lean();
    
    // Map to plain objects so they can be serialized
    return { 
      success: true, 
      foods: foods.map((f: any) => ({
        id: f._id.toString(),
        name: f.name,
        units: f.units.map((u: any) => ({
          unit_name: u.unit_name,
          calories: u.calories,
          protein_g: u.protein_g,
          carbs_g: u.carbs_g,
          fat_g: u.fat_g
        }))
      }))
    };
  } catch (error: any) {
    console.error("Local Food Search Error:", error);
    return { success: false, error: error.message };
  }
}

export async function fetchFromGeminiAction(foodName: string, unit: string) {
  try {
    await connectDB();
    await applyRateLimit();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Gemini API key is not configured.");
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `
Lütfen "${foodName}" isimli yiyeceğin 1 "${unit}" (örneğin 1 gram, 1 adet, 1 tabak) miktarı için tahmini besin değerlerini (kalori, protein, karbonhidrat, yağ) ver.
Yanıtın sadece geçerli bir JSON objesi olmalı ve markdown veya açıklama içermemeli.
Format şu şekilde olmalı:
{
  "calories": sayi,
  "protein_g": sayi,
  "carbs_g": sayi,
  "fat_g": sayi
}
Eğer birim "gram" ise, lütfen tam olarak 1 gramının değerini ver (100 gramın değil, 1 gramın!).
Eğer birim "adet" veya "tabak" ise, standart bir adetin veya tabağın ortalama değerini ver.
    `.trim();

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
    });

    const text = response.text();
    if (!text) throw new Error("Gemini empty response");

    const parsed = JSON.parse(text);
    
    // Validate response
    if (typeof parsed.calories !== 'number' || 
        typeof parsed.protein_g !== 'number' || 
        typeof parsed.carbs_g !== 'number' || 
        typeof parsed.fat_g !== 'number') {
      throw new Error("Invalid response format from Gemini");
    }

    // Save to Local DB
    let localFood = await LocalFood.findOne({ name: { $regex: new RegExp(`^${foodName}$`, 'i') } });
    
    if (!localFood) {
      localFood = new LocalFood({
        name: foodName, // Capitalize the first letter could be good, but we keep what user searched or maybe lowercase it
        units: []
      });
    }

    // Check if unit already exists
    const existingUnitIndex = localFood.units.findIndex((u: any) => u.unit_name === unit);
    if (existingUnitIndex >= 0) {
      // Update
      localFood.units[existingUnitIndex] = {
        unit_name: unit,
        calories: parsed.calories,
        protein_g: parsed.protein_g,
        carbs_g: parsed.carbs_g,
        fat_g: parsed.fat_g
      };
    } else {
      // Add
      localFood.units.push({
        unit_name: unit,
        calories: parsed.calories,
        protein_g: parsed.protein_g,
        carbs_g: parsed.carbs_g,
        fat_g: parsed.fat_g
      });
    }

    await localFood.save();

    return { 
      success: true, 
      unit: {
        unit_name: unit,
        calories: parsed.calories,
        protein_g: parsed.protein_g,
        carbs_g: parsed.carbs_g,
        fat_g: parsed.fat_g
      }
    };
  } catch (error: any) {
    console.error("Gemini Fetch Error:", error);
    return { success: false, error: error.message };
  }
}
