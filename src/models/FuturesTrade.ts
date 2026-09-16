import mongoose, { Schema, Document, Model } from 'mongoose';

export type FuturesMarket = 'crypto' | 'viop' | 'forex' | 'us' | 'other';
export type FuturesSide = 'long' | 'short';
export type FuturesStatus = 'open' | 'closed' | 'limit';

export interface IFuturesTrade extends Document {
  user_id: string;
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
  pnl?: number;
  pnl_percent?: number;
  notes?: string;
  entry_date: Date;
  close_date?: Date;
  created_at: Date;
  updated_at: Date;
}

const FuturesTradeSchema = new Schema<IFuturesTrade>({
  user_id: { type: String, required: true, index: true },
  symbol: { type: String, required: true, uppercase: true, trim: true },
  market: { type: String, enum: ['crypto', 'viop', 'forex', 'us', 'other'], default: 'crypto' },
  side: { type: String, enum: ['long', 'short'], required: true },
  leverage: { type: Number, required: true, default: 1, min: 1 },
  entry_price: { type: Number, required: true, min: 0 },
  exit_price: { type: Number, min: 0 },
  size: { type: Number, required: true, min: 0 },
  margin: { type: Number, required: true, min: 0 },
  stop_loss: { type: Number, min: 0 },
  take_profit: { type: Number, min: 0 },
  status: { type: String, enum: ['open', 'closed', 'limit'], default: 'open', index: true },
  pnl: { type: Number, default: 0 },
  pnl_percent: { type: Number, default: 0 },
  notes: { type: String, trim: true },
  entry_date: { type: Date, default: Date.now },
  close_date: { type: Date }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

FuturesTradeSchema.index({ user_id: 1, status: 1, entry_date: -1 });
FuturesTradeSchema.index({ user_id: 1, symbol: 1 });

export const FuturesTrade: Model<IFuturesTrade> =
  mongoose.models.FuturesTrade || mongoose.model<IFuturesTrade>('FuturesTrade', FuturesTradeSchema);
