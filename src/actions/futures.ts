"use server";

import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { FuturesTrade, IFuturesTrade, FuturesMarket, FuturesSide, FuturesStatus } from "@/models/FuturesTrade";
import { calculateFuturesPnl, calculateFuturesSummary } from "@/lib/futures-engine";
import { revalidatePath } from "next/cache";

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

export interface FuturesTradeDTO {
  id: string;
  symbol: string;
  market: FuturesMarket;
  side: FuturesSide;
  leverage: number;
  entry_price: number;
  exit_price?: number;
  size: number;
  margin: number;
  stop_loss?: number;
  take_profit?: number;
  status: FuturesStatus;
  pnl: number;
  pnl_percent: number;
  notes?: string;
  entry_date: string;
  close_date?: string;
  created_at: string;
}

export interface FuturesDashboardDTO {
  trades: FuturesTradeDTO[];
  summary: {
    totalRealizedPnl: number;
    openPositionsCount: number;
    totalActiveMargin: number;
    closedTradesCount: number;
    winningTradesCount: number;
    losingTradesCount: number;
    winRate: number;
    longCount: number;
    shortCount: number;
  };
}

function mapTradeToDTO(t: any): FuturesTradeDTO {
  return {
    id: t._id.toString(),
    symbol: t.symbol,
    market: t.market || 'crypto',
    side: t.side,
    leverage: t.leverage || 1,
    entry_price: t.entry_price,
    exit_price: t.exit_price ?? undefined,
    size: t.size,
    margin: t.margin,
    stop_loss: t.stop_loss ?? undefined,
    take_profit: t.take_profit ?? undefined,
    status: t.status,
    pnl: t.pnl || 0,
    pnl_percent: t.pnl_percent || 0,
    notes: t.notes || '',
    entry_date: t.entry_date ? new Date(t.entry_date).toISOString() : new Date().toISOString(),
    close_date: t.close_date ? new Date(t.close_date).toISOString() : undefined,
    created_at: t.created_at ? new Date(t.created_at).toISOString() : new Date().toISOString()
  };
}

/**
 * Fetches all futures trades for the user and computes summary metrics.
 */
export async function getFuturesDashboardAction(): Promise<{
  success: boolean;
  data?: FuturesDashboardDTO;
  error?: string;
}> {
  try {
    await connectDB();
    const userId = await getUserId();

    const trades = await FuturesTrade.find({ user_id: userId })
      .sort({ entry_date: -1, created_at: -1 })
      .lean();

    const dtos = trades.map(mapTradeToDTO);

    const summary = calculateFuturesSummary(
      dtos.map(t => ({
        status: t.status,
        side: t.side,
        margin: t.margin,
        pnl: t.pnl
      }))
    );

    return {
      success: true,
      data: {
        trades: dtos,
        summary
      }
    };
  } catch (e: unknown) {
    const err = e as Error;
    console.error("getFuturesDashboardAction error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Creates a new futures trade / position.
 */
export async function createFuturesTradeAction(input: {
  symbol: string;
  market?: FuturesMarket;
  side: FuturesSide;
  leverage: number;
  entry_price: number;
  size?: number;
  margin?: number;
  stop_loss?: number;
  take_profit?: number;
  status?: FuturesStatus;
  exit_price?: number;
  notes?: string;
  entry_date?: string;
  close_date?: string;
}): Promise<{
  success: boolean;
  trade?: FuturesTradeDTO;
  error?: string;
}> {
  try {
    await connectDB();
    const userId = await getUserId();

    const cleanSymbol = input.symbol?.trim().toUpperCase();
    if (!cleanSymbol) {
      return { success: false, error: "Sembol adı zorunludur." };
    }

    const entryPrice = Number(input.entry_price);
    if (!entryPrice || entryPrice <= 0) {
      return { success: false, error: "Geçerli bir giriş fiyatı giriniz." };
    }

    const leverage = Math.max(1, Number(input.leverage) || 1);
    const side = input.side === 'short' ? 'short' : 'long';
    const status = input.status || 'open';

    let margin = Number(input.margin) || 0;
    let size = Number(input.size) || 0;

    if (margin > 0 && (!size || size <= 0)) {
      size = margin * leverage;
    } else if (size > 0 && (!margin || margin <= 0)) {
      margin = size / leverage;
    }

    if (margin <= 0 || size <= 0) {
      return { success: false, error: "Geçerli bir teminat veya pozisyon büyüklüğü giriniz." };
    }

    let pnl = 0;
    let pnl_percent = 0;
    let exitPrice: number | undefined = undefined;

    if (status === 'closed') {
      exitPrice = Number(input.exit_price);
      if (exitPrice !== undefined && exitPrice > 0) {
        const computed = calculateFuturesPnl({
          side,
          entryPrice,
          exitPrice,
          leverage,
          margin,
          size
        });
        pnl = computed.pnl;
        pnl_percent = computed.pnlPercent;
      }
    }

    const newTrade = await FuturesTrade.create({
      user_id: userId,
      symbol: cleanSymbol,
      market: input.market || 'crypto',
      side,
      leverage,
      entry_price: entryPrice,
      exit_price: exitPrice,
      size: Number(size.toFixed(4)),
      margin: Number(margin.toFixed(2)),
      stop_loss: input.stop_loss ? Number(input.stop_loss) : undefined,
      take_profit: input.take_profit ? Number(input.take_profit) : undefined,
      status,
      pnl,
      pnl_percent,
      notes: input.notes?.trim() || '',
      entry_date: input.entry_date ? new Date(input.entry_date) : new Date(),
      close_date: status === 'closed' ? (input.close_date ? new Date(input.close_date) : new Date()) : undefined
    });

    revalidatePath('/dashboard');
    return { success: true, trade: mapTradeToDTO(newTrade) };
  } catch (e: unknown) {
    const err = e as Error;
    console.error("createFuturesTradeAction error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Closes an open position with an exit price, calculating realized PnL and ROI.
 */
export async function closeFuturesPositionAction(
  tradeId: string,
  input: {
    exit_price: number;
    close_date?: string;
    notes?: string;
  }
): Promise<{
  success: boolean;
  trade?: FuturesTradeDTO;
  error?: string;
}> {
  try {
    await connectDB();
    const userId = await getUserId();

    const trade = await FuturesTrade.findOne({ _id: tradeId, user_id: userId });
    if (!trade) {
      return { success: false, error: "İşlem bulunamadı." };
    }

    const exitPrice = Number(input.exit_price);
    if (!exitPrice || exitPrice <= 0) {
      return { success: false, error: "Geçerli bir çıkış fiyatı giriniz." };
    }

    const computed = calculateFuturesPnl({
      side: trade.side,
      entryPrice: trade.entry_price,
      exitPrice,
      leverage: trade.leverage,
      margin: trade.margin,
      size: trade.size
    });

    trade.status = 'closed';
    trade.exit_price = exitPrice;
    trade.pnl = computed.pnl;
    trade.pnl_percent = computed.pnlPercent;
    trade.close_date = input.close_date ? new Date(input.close_date) : new Date();

    if (input.notes !== undefined) {
      const combinedNotes = trade.notes 
        ? `${trade.notes}\n[Kapanış Notu]: ${input.notes.trim()}`
        : input.notes.trim();
      trade.notes = combinedNotes;
    }

    await trade.save();

    revalidatePath('/dashboard');
    return { success: true, trade: mapTradeToDTO(trade) };
  } catch (e: unknown) {
    const err = e as Error;
    console.error("closeFuturesPositionAction error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Updates a trade's details (SL, TP, notes, prices).
 */
export async function updateFuturesTradeAction(
  tradeId: string,
  input: {
    symbol?: string;
    market?: FuturesMarket;
    side?: FuturesSide;
    leverage?: number;
    entry_price?: number;
    exit_price?: number;
    size?: number;
    margin?: number;
    stop_loss?: number;
    take_profit?: number;
    status?: FuturesStatus;
    notes?: string;
    entry_date?: string;
    close_date?: string;
  }
): Promise<{
  success: boolean;
  trade?: FuturesTradeDTO;
  error?: string;
}> {
  try {
    await connectDB();
    const userId = await getUserId();

    const trade = await FuturesTrade.findOne({ _id: tradeId, user_id: userId });
    if (!trade) {
      return { success: false, error: "İşlem bulunamadı." };
    }

    if (input.symbol) trade.symbol = input.symbol.trim().toUpperCase();
    if (input.market) trade.market = input.market;
    if (input.side) trade.side = input.side;
    if (input.leverage) trade.leverage = Math.max(1, Number(input.leverage));
    if (input.entry_price) trade.entry_price = Number(input.entry_price);
    if (input.size) trade.size = Number(input.size);
    if (input.margin) trade.margin = Number(input.margin);
    if (input.stop_loss !== undefined) trade.stop_loss = input.stop_loss ? Number(input.stop_loss) : undefined;
    if (input.take_profit !== undefined) trade.take_profit = input.take_profit ? Number(input.take_profit) : undefined;
    if (input.status) trade.status = input.status;
    if (input.notes !== undefined) trade.notes = input.notes.trim();
    if (input.entry_date) trade.entry_date = new Date(input.entry_date);
    if (input.close_date) trade.close_date = new Date(input.close_date);

    if (input.exit_price !== undefined) {
      trade.exit_price = input.exit_price ? Number(input.exit_price) : undefined;
    }

    // Recalculate PnL if closed and exit price exists
    if (trade.status === 'closed' && trade.exit_price && trade.exit_price > 0) {
      const computed = calculateFuturesPnl({
        side: trade.side,
        entryPrice: trade.entry_price,
        exitPrice: trade.exit_price,
        leverage: trade.leverage,
        margin: trade.margin,
        size: trade.size
      });
      trade.pnl = computed.pnl;
      trade.pnl_percent = computed.pnlPercent;
    }

    await trade.save();

    revalidatePath('/dashboard');
    return { success: true, trade: mapTradeToDTO(trade) };
  } catch (e: unknown) {
    const err = e as Error;
    console.error("updateFuturesTradeAction error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Deletes a futures trade.
 */
export async function deleteFuturesTradeAction(tradeId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await connectDB();
    const userId = await getUserId();

    const result = await FuturesTrade.deleteOne({ _id: tradeId, user_id: userId });
    if (result.deletedCount === 0) {
      return { success: false, error: "İşlem silinemedi veya bulunamadı." };
    }

    revalidatePath('/dashboard');
    return { success: true };
  } catch (e: unknown) {
    const err = e as Error;
    console.error("deleteFuturesTradeAction error:", err);
    return { success: false, error: err.message };
  }
}
