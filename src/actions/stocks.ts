"use server";

import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { StockTrade } from "@/models/StockTrade";
import { StockPosition } from "@/models/StockPosition";
import { StockTradeType } from "@/models/Enums";
import { calculateStockPortfolio, RawTrade } from "@/lib/stock-engine";
import { StockPortfolioDTO, StockPositionDTO, StockTradeDTO } from "@/models/DashboardTypes";
import { revalidatePath } from "next/cache";

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

/**
 * Synchronizes positions and calculates the complete portfolio for a user
 */
async function syncAndCalculatePortfolio(userId: string): Promise<StockPortfolioDTO> {
  await connectDB();

  // Fetch all trades for user
  const rawTrades = await StockTrade.find({ user_id: userId })
    .sort({ date: 1, created_at: 1 })
    .lean();

  // Fetch existing position records to preserve any manually entered current prices
  const existingPositions = await StockPosition.find({ user_id: userId }).lean();
  const currentPriceMap: Record<string, number> = {};
  for (const pos of existingPositions) {
    if (pos.current_price && pos.current_price > 0) {
      currentPriceMap[pos.symbol] = pos.current_price;
    }
  }

  // Format raw trades for computation
  const formattedRaw: RawTrade[] = rawTrades.map((t: any) => ({
    _id: t._id.toString(),
    id: t._id.toString(),
    symbol: t.symbol,
    name: t.name,
    type: t.type as 'buy' | 'sell',
    lots: Number(t.lots),
    price: Number(t.price),
    total_amount: Number(t.total_amount),
    date: t.date,
    notes: t.notes,
    created_at: t.created_at,
  }));

  const calc = calculateStockPortfolio(formattedRaw, currentPriceMap);

  // Update StockTrade documents with computed cost basis and realized P/L
  const bulkTradeOps = calc.computedTrades.map((ct) => ({
    updateOne: {
      filter: { _id: new mongoose.Types.ObjectId(ct._id || ct.id) },
      update: {
        $set: {
          cost_basis: ct.cost_basis,
          total_cost: ct.total_cost,
          realized_pnl: ct.realized_pnl,
          realized_pnl_percent: ct.realized_pnl_percent,
        },
      },
    },
  }));

  if (bulkTradeOps.length > 0) {
    await StockTrade.bulkWrite(bulkTradeOps);
  }

  // Update StockPosition documents
  const allPositions = [...calc.openPositions, ...calc.closedPositions];
  for (const pos of allPositions) {
    await StockPosition.findOneAndUpdate(
      { user_id: userId, symbol: pos.symbol },
      {
        $set: {
          name: pos.name,
          total_lots: pos.total_lots,
          average_cost: pos.average_cost,
          total_cost: pos.total_cost,
          current_price: pos.current_price,
          current_value: pos.current_value,
          unrealized_pnl: pos.unrealized_pnl,
          unrealized_pnl_percent: pos.unrealized_pnl_percent,
          last_trade_date: pos.last_trade_date ? new Date(pos.last_trade_date) : undefined,
        },
      },
      { upsert: true, new: true }
    );
  }

  // Format DTOs
  const positionsDTO: StockPositionDTO[] = calc.openPositions.map((p) => ({
    id: p.symbol,
    symbol: p.symbol,
    name: p.name,
    total_lots: p.total_lots,
    average_cost: p.average_cost,
    total_cost: p.total_cost,
    current_price: p.current_price,
    current_value: p.current_value,
    unrealized_pnl: p.unrealized_pnl,
    unrealized_pnl_percent: p.unrealized_pnl_percent,
    last_trade_date: p.last_trade_date,
  }));

  const closedPositionsDTO: StockPositionDTO[] = calc.closedPositions.map((p) => ({
    id: p.symbol,
    symbol: p.symbol,
    name: p.name,
    total_lots: p.total_lots,
    average_cost: p.average_cost,
    total_cost: p.total_cost,
    current_price: p.current_price,
    current_value: p.current_value,
    unrealized_pnl: p.unrealized_pnl,
    unrealized_pnl_percent: p.unrealized_pnl_percent,
    last_trade_date: p.last_trade_date,
  }));

  const realizedTradesDTO: StockTradeDTO[] = calc.realizedTrades.map((t) => ({
    id: t._id || t.id,
    symbol: t.symbol,
    name: t.name,
    type: t.type,
    lots: t.lots,
    price: t.price,
    total_amount: t.total_amount || 0,
    date: new Date(t.date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    rawDate: new Date(t.date).toISOString(),
    notes: t.notes,
    cost_basis: t.cost_basis,
    total_cost: t.total_cost,
    realized_pnl: t.realized_pnl,
    realized_pnl_percent: t.realized_pnl_percent,
  }));

  const allTradesDTO: StockTradeDTO[] = calc.computedTrades
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((t) => ({
      id: t._id || t.id,
      symbol: t.symbol,
      name: t.name,
      type: t.type,
      lots: t.lots,
      price: t.price,
      total_amount: t.total_amount || 0,
      date: new Date(t.date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      rawDate: new Date(t.date).toISOString(),
      notes: t.notes,
      cost_basis: t.cost_basis,
      total_cost: t.total_cost,
      realized_pnl: t.realized_pnl,
      realized_pnl_percent: t.realized_pnl_percent,
    }));

  return {
    positions: positionsDTO,
    closedPositions: closedPositionsDTO,
    realizedTrades: realizedTradesDTO,
    allTrades: allTradesDTO,
    totals: calc.totals,
  };
}

/**
 * Get entire stock portfolio with realized P/L and position calculations
 */
export async function getStockPortfolioAction(): Promise<{ success: boolean; data?: StockPortfolioDTO; error?: string }> {
  try {
    const userId = await getUserId();
    const portfolio = await syncAndCalculatePortfolio(userId);
    return { success: true, data: portfolio };
  } catch (error: any) {
    console.error("getStockPortfolioAction error:", error);
    return { success: false, error: error.message || "Borsa verileri alınamadı." };
  }
}

/**
 * Add a Buy or Sell stock order
 */
export async function addStockTradeAction(data: {
  symbol: string;
  name?: string;
  type: 'buy' | 'sell';
  lots: number;
  price: number;
  date?: string;
  notes?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await connectDB();
    const userId = await getUserId();

    const symbol = data.symbol?.trim().toUpperCase();
    if (!symbol) {
      return { success: false, error: "Hisse sembolü zorunludur (örn: THYAO)." };
    }

    const lots = Number(data.lots);
    const price = Number(data.price);

    if (!Number.isFinite(lots) || lots <= 0) {
      return { success: false, error: "Geçerli bir lot sayısı girin." };
    }

    if (!Number.isFinite(price) || price <= 0) {
      return { success: false, error: "Geçerli bir fiyat girin." };
    }

    const tradeDate = data.date ? new Date(data.date) : new Date();
    const totalAmount = Math.round(lots * price * 100) / 100;

    // Check if sell order is valid against current open lots
    if (data.type === 'sell') {
      const currentPos = await StockPosition.findOne({ user_id: userId, symbol }).lean();
      const currentLots = currentPos?.total_lots || 0;
      if (lots > currentLots + 0.0001) {
        return {
          success: false,
          error: `Yetersiz bakiye! Elinizde ${currentLots} lot ${symbol} var, ${lots} lot satamazsınız.`,
        };
      }
    }

    await StockTrade.create({
      user_id: userId,
      symbol,
      name: data.name?.trim() || undefined,
      type: data.type === 'sell' ? StockTradeType.SELL : StockTradeType.BUY,
      lots,
      price,
      total_amount: totalAmount,
      date: tradeDate,
      notes: data.notes?.trim() || undefined,
    });

    await syncAndCalculatePortfolio(userId);
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error("addStockTradeAction error:", error);
    return { success: false, error: error.message || "İşlem kaydedilemedi." };
  }
}

/**
 * Update an existing stock trade
 */
export async function updateStockTradeAction(
  tradeId: string,
  data: {
    symbol: string;
    name?: string;
    type: 'buy' | 'sell';
    lots: number;
    price: number;
    date: string;
    notes?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await connectDB();
    const userId = await getUserId();

    const symbol = data.symbol?.trim().toUpperCase();
    const lots = Number(data.lots);
    const price = Number(data.price);

    if (!symbol || lots <= 0 || price <= 0) {
      return { success: false, error: "Geçerli sembol, lot ve fiyat girin." };
    }

    const trade = await StockTrade.findOne({ _id: tradeId, user_id: userId });
    if (!trade) {
      return { success: false, error: "İşlem bulunamadı." };
    }

    trade.symbol = symbol;
    trade.name = data.name?.trim() || undefined;
    trade.type = data.type === 'sell' ? StockTradeType.SELL : StockTradeType.BUY;
    trade.lots = lots;
    trade.price = price;
    trade.total_amount = Math.round(lots * price * 100) / 100;
    trade.date = new Date(data.date);
    trade.notes = data.notes?.trim() || undefined;
    await trade.save();

    await syncAndCalculatePortfolio(userId);
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error("updateStockTradeAction error:", error);
    return { success: false, error: error.message || "İşlem güncellenemedi." };
  }
}

/**
 * Delete a stock trade
 */
export async function deleteStockTradeAction(tradeId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await connectDB();
    const userId = await getUserId();

    const trade = await StockTrade.findOneAndDelete({ _id: tradeId, user_id: userId });
    if (!trade) {
      return { success: false, error: "İşlem bulunamadı." };
    }

    await syncAndCalculatePortfolio(userId);
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error("deleteStockTradeAction error:", error);
    return { success: false, error: error.message || "İşlem silinemedi." };
  }
}

/**
 * Update current market price of an open stock position
 */
export async function updateStockCurrentPriceAction(
  symbol: string,
  currentPrice: number
): Promise<{ success: boolean; error?: string }> {
  try {
    await connectDB();
    const userId = await getUserId();
    const cleanSymbol = symbol.trim().toUpperCase();
    const price = Number(currentPrice);

    if (price < 0) {
      return { success: false, error: "Fiyat 0 veya daha büyük olmalıdır." };
    }

    await StockPosition.findOneAndUpdate(
      { user_id: userId, symbol: cleanSymbol },
      { $set: { current_price: price } },
      { upsert: true }
    );

    await syncAndCalculatePortfolio(userId);
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error("updateStockCurrentPriceAction error:", error);
    return { success: false, error: error.message || "Güncel fiyat kaydedilemedi." };
  }
}
