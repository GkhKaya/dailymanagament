"use server";

import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { StockTrade } from "@/models/StockTrade";
import { StockPosition } from "@/models/StockPosition";
import { StockTradeType } from "@/models/Enums";
import { calculateStockPortfolio, RawTrade, POPULAR_BIST_STOCKS } from "@/lib/stock-engine";
import { StockPortfolioDTO, StockPositionDTO, StockTradeDTO, KnownStockDTO } from "@/models/DashboardTypes";
import { fetchMarketQuote, searchBistDirectory, POPULAR_TEFAS_FUNDS, MarketQuote } from "@/lib/market-service";
import { BIST_COMPANIES } from "@/lib/bist-directory";
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

  // Fetch existing position records to preserve any current prices and market metadata
  const existingPositions = await StockPosition.find({ user_id: userId }).lean();
  const currentPriceMap: Record<string, number> = {};
  const existingPositionMap: Record<string, any> = {};
  for (const pos of existingPositions) {
    existingPositionMap[pos.symbol] = pos;
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
    assetType: t.asset_type === 'fund' ? 'fund' : 'stock',
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
          asset_type: pos.assetType,
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
  const positionsDTO: StockPositionDTO[] = calc.openPositions.map((p) => {
    const ex = existingPositionMap[p.symbol];
    return {
      id: p.symbol,
      symbol: p.symbol,
      name: p.name,
      assetType: p.assetType,
      total_lots: p.total_lots,
      average_cost: p.average_cost,
      total_cost: p.total_cost,
      current_price: p.current_price,
      open_price: ex?.open_price || 0,
      close_price: ex?.close_price || 0,
      day_change_percent: ex?.day_change_percent || 0,
      price_updated_at: ex?.price_updated_at ? new Date(ex.price_updated_at).toISOString() : undefined,
      current_value: p.current_value,
      unrealized_pnl: p.unrealized_pnl,
      unrealized_pnl_percent: p.unrealized_pnl_percent,
      last_trade_date: p.last_trade_date,
    };
  });

  const closedPositionsDTO: StockPositionDTO[] = calc.closedPositions.map((p) => {
    const ex = existingPositionMap[p.symbol];
    return {
      id: p.symbol,
      symbol: p.symbol,
      name: p.name,
      assetType: p.assetType,
      total_lots: p.total_lots,
      average_cost: p.average_cost,
      total_cost: p.total_cost,
      current_price: p.current_price,
      open_price: ex?.open_price || 0,
      close_price: ex?.close_price || 0,
      day_change_percent: ex?.day_change_percent || 0,
      price_updated_at: ex?.price_updated_at ? new Date(ex.price_updated_at).toISOString() : undefined,
      current_value: p.current_value,
      unrealized_pnl: p.unrealized_pnl,
      unrealized_pnl_percent: p.unrealized_pnl_percent,
      last_trade_date: p.last_trade_date,
    };
  });

  const sortByNewest = (a: { date: Date | string; created_at?: Date | string }, b: { date: Date | string; created_at?: Date | string }) => {
    const timeDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (timeDiff !== 0) return timeDiff;
    const createA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const createB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return createB - createA;
  };

  const realizedTradesDTO: StockTradeDTO[] = calc.realizedTrades
    .sort(sortByNewest)
    .map((t) => ({
      id: t._id || t.id,
      symbol: t.symbol,
      name: t.name,
      assetType: t.assetType || 'stock',
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
      holding_days: t.holding_days,
      created_at: t.created_at ? new Date(t.created_at).toISOString() : undefined,
    }));

  const allTradesDTO: StockTradeDTO[] = calc.computedTrades
    .sort(sortByNewest)
    .map((t) => ({
      id: t._id || t.id,
      symbol: t.symbol,
      name: t.name,
      assetType: t.assetType || 'stock',
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
      holding_days: t.holding_days,
      created_at: t.created_at ? new Date(t.created_at).toISOString() : undefined,
    }));

  // Build known stocks dictionary: User's historical symbols + Known Funds + Complete BIST Companies
  const userKnownSymbols = new Map<string, string>();
  for (const t of rawTrades) {
    if (t.symbol) {
      const sym = t.symbol.toUpperCase();
      if (t.name) {
        userKnownSymbols.set(sym, t.name);
      } else if (!userKnownSymbols.has(sym)) {
        userKnownSymbols.set(sym, POPULAR_TEFAS_FUNDS[sym] || POPULAR_BIST_STOCKS[sym] || '');
      }
    }
  }

  const knownStocksDTO: KnownStockDTO[] = [];
  
  // 1. First add all symbols user has ever traded
  for (const [sym, nm] of userKnownSymbols.entries()) {
    knownStocksDTO.push({
      symbol: sym,
      name: nm || POPULAR_TEFAS_FUNDS[sym] || POPULAR_BIST_STOCKS[sym] || sym,
      isCustom: true,
    });
  }

  // 2. Add popular TEFAS funds
  for (const [code, title] of Object.entries(POPULAR_TEFAS_FUNDS)) {
    if (!userKnownSymbols.has(code)) {
      knownStocksDTO.push({
        symbol: code,
        name: title,
        isCustom: false,
      });
    }
  }

  // 3. Add all BIST companies from directory
  for (const item of BIST_COMPANIES) {
    if (!userKnownSymbols.has(item.symbol)) {
      knownStocksDTO.push({
        symbol: item.symbol,
        name: item.name,
        isCustom: false,
      });
    }
  }

  return {
    positions: positionsDTO,
    closedPositions: closedPositionsDTO,
    realizedTrades: realizedTradesDTO,
    allTrades: allTradesDTO,
    knownStocks: knownStocksDTO,
    totals: calc.totals,
  };
}

/**
 * Automatically fetch and update latest market quotes for user's open positions
 */
async function refreshOpenPositionPrices(userId: string) {
  try {
    const openPositions = await StockPosition.find({
      user_id: userId,
      total_lots: { $gt: 0 },
    }).lean();

    if (!openPositions || openPositions.length === 0) return;

    for (const pos of openPositions) {
      try {
        const quote = await fetchMarketQuote(pos.symbol, pos.asset_type as 'stock' | 'fund');
        if (quote && quote.currentPrice > 0) {
          const updateFields: any = {
            current_price: quote.currentPrice,
            open_price: quote.openPrice || quote.currentPrice,
            close_price: quote.closePrice || quote.currentPrice,
            day_change_percent: quote.dayChangePercent || 0,
            price_updated_at: new Date(),
          };
          if (!pos.name && quote.name) {
            updateFields.name = quote.name;
          }
          await StockPosition.updateOne(
            { user_id: userId, symbol: pos.symbol },
            { $set: updateFields }
          );
        }
      } catch (err) {
        console.error(`Error refreshing price for ${pos.symbol}:`, err);
      }
    }
  } catch (error) {
    console.error("refreshOpenPositionPrices error:", error);
  }
}

/**
 * Force manual refresh of market prices for all open positions
 */
export async function syncStockMarketPricesAction(): Promise<{ success: boolean; updatedCount?: number; error?: string }> {
  try {
    await connectDB();
    const userId = await getUserId();
    await refreshOpenPositionPrices(userId);
    const portfolio = await syncAndCalculatePortfolio(userId);
    revalidatePath('/');
    return { success: true, updatedCount: portfolio.positions.length };
  } catch (error: any) {
    console.error("syncStockMarketPricesAction error:", error);
    return { success: false, error: error.message || "Piyasa fiyatları güncellenemedi." };
  }
}

/**
 * Fetch a single market quote (for autocomplete / modal autofill)
 */
export async function fetchMarketQuoteAction(
  symbol: string,
  assetType?: 'stock' | 'fund'
): Promise<{ success: boolean; data?: MarketQuote; error?: string }> {
  try {
    const cleanSymbol = symbol?.trim().toUpperCase();
    if (!cleanSymbol) {
      return { success: false, error: "Sembol belirtilmedi." };
    }
    const quote = await fetchMarketQuote(cleanSymbol, assetType);
    if (!quote) {
      return { success: false, error: "Fiyat bilgisi bulunamadı." };
    }
    return { success: true, data: quote };
  } catch (error: any) {
    console.error("fetchMarketQuoteAction error:", error);
    return { success: false, error: error.message || "Fiyat alınamadı." };
  }
}

/**
 * Autocomplete search across 800+ BIST stocks and TEFAS funds
 */
export async function searchBistDirectoryAction(
  query: string
): Promise<{ success: boolean; data: Array<{ symbol: string; name: string; assetType: 'stock' | 'fund' }> }> {
  try {
    const results = searchBistDirectory(query);
    return { success: true, data: results };
  } catch (error: any) {
    console.error("searchBistDirectoryAction error:", error);
    return { success: false, data: [] };
  }
}

/**
 * Update stock company name across all trades and position for a user
 */
export async function updateStockSymbolNameAction(
  symbol: string,
  newName: string,
  assetType: 'stock' | 'fund' = 'stock'
): Promise<{ success: boolean; error?: string }> {
  try {
    await connectDB();
    const userId = await getUserId();
    const cleanSymbol = symbol.trim().toUpperCase();
    const cleanName = newName.trim();

    if (!cleanSymbol) {
      return { success: false, error: "Geçerli bir hisse sembolü girin." };
    }

    await StockTrade.updateMany(
      { user_id: userId, symbol: cleanSymbol },
      { $set: { name: cleanName || undefined, asset_type: assetType } }
    );

    await StockPosition.findOneAndUpdate(
      { user_id: userId, symbol: cleanSymbol },
      { $set: { name: cleanName || undefined, asset_type: assetType } }
    );

    await syncAndCalculatePortfolio(userId);
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error("updateStockSymbolNameAction error:", error);
    return { success: false, error: error.message || "Hisse adı güncellenemedi." };
  }
}

/**
 * Get entire stock portfolio with realized P/L and position calculations
 */
export async function getStockPortfolioAction(): Promise<{ success: boolean; data?: StockPortfolioDTO; error?: string }> {
  try {
    await connectDB();
    const userId = await getUserId();

    // Check if any open positions need price refresh (no current_price, or price_updated_at > 30 minutes ago)
    const stalePositions = await StockPosition.find({
      user_id: userId,
      total_lots: { $gt: 0 },
      $or: [
        { current_price: { $lte: 0 } },
        { current_price: { $exists: false } },
        { price_updated_at: { $exists: false } },
        { price_updated_at: { $lt: new Date(Date.now() - 30 * 60 * 1000) } },
      ],
    }).limit(1).lean();

    if (stalePositions.length > 0) {
      await refreshOpenPositionPrices(userId);
    }

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
  assetType?: 'stock' | 'fund';
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

    // Auto-resolve stock/fund name if not explicitly provided
    let resolvedName = data.name?.trim();
    if (!resolvedName) {
      const bistMatch = BIST_COMPANIES.find(b => b.symbol === symbol);
      if (bistMatch) {
        resolvedName = bistMatch.name;
      } else if (POPULAR_TEFAS_FUNDS[symbol]) {
        resolvedName = POPULAR_TEFAS_FUNDS[symbol];
      }
    }

    await StockTrade.create({
      user_id: userId,
      symbol,
      name: resolvedName || undefined,
      asset_type: data.assetType === 'fund' ? 'fund' : 'stock',
      type: data.type === 'sell' ? StockTradeType.SELL : StockTradeType.BUY,
      lots,
      price,
      total_amount: totalAmount,
      date: tradeDate,
      notes: data.notes?.trim() || undefined,
    });

    // Check if position already has a current market price; if not, fetch it now
    const existingPos = await StockPosition.findOne({ user_id: userId, symbol }).lean();
    if (!existingPos || !existingPos.current_price || existingPos.current_price <= 0) {
      try {
        const quote = await fetchMarketQuote(symbol, data.assetType);
        if (quote && quote.currentPrice > 0) {
          await StockPosition.findOneAndUpdate(
            { user_id: userId, symbol },
            {
              $set: {
                name: resolvedName || quote.name,
                current_price: quote.currentPrice,
                open_price: quote.openPrice || quote.currentPrice,
                close_price: quote.closePrice || quote.currentPrice,
                day_change_percent: quote.dayChangePercent || 0,
                price_updated_at: new Date(),
              }
            },
            { upsert: true }
          );
        }
      } catch (err) {
        console.error(`Could not pre-fetch quote for new trade ${symbol}:`, err);
      }
    }

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
    assetType?: 'stock' | 'fund';
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
    trade.asset_type = data.assetType === 'fund' ? 'fund' : 'stock';
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

/**
 * Delete an entire stock and all its trade history
 */
export async function deleteStockPositionAction(
  symbol: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await connectDB();
    const userId = await getUserId();
    const cleanSymbol = symbol.trim().toUpperCase();

    if (!cleanSymbol) {
      return { success: false, error: "Geçerli bir hisse sembolü belirtin." };
    }

    // Delete all trades for this symbol
    await StockTrade.deleteMany({ user_id: userId, symbol: cleanSymbol });

    // Delete the position record
    await StockPosition.deleteMany({ user_id: userId, symbol: cleanSymbol });

    await syncAndCalculatePortfolio(userId);
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error("deleteStockPositionAction error:", error);
    return { success: false, error: error.message || "Hisse silinemedi." };
  }
}
