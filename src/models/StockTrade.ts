import mongoose, { Schema, Document } from 'mongoose';
import { StockTradeType } from './Enums';

export interface IStockTrade extends Document {
  user_id: string;
  symbol: string;
  name?: string;
  asset_type: 'stock' | 'fund' | 'crypto';
  market?: 'bist' | 'us' | 'crypto';
  currency?: string;
  type: StockTradeType;
  lots: number;
  price: number;
  total_amount: number;
  date: Date;
  notes?: string;
  cost_basis?: number;
  total_cost?: number;
  realized_pnl?: number;
  realized_pnl_percent?: number;
  created_at: Date;
  updated_at: Date;
}

const StockTradeSchema: Schema = new Schema({
  user_id: { type: String, ref: 'User', required: true },
  symbol: { type: String, required: true, uppercase: true, trim: true },
  name: { type: String, trim: true },
  asset_type: { type: String, enum: ['stock', 'fund', 'crypto'], default: 'stock', required: true },
  market: { type: String, enum: ['bist', 'us', 'crypto'], default: 'bist' },
  currency: { type: String, default: 'TRY' },
  type: { type: String, enum: Object.values(StockTradeType), required: true },
  lots: { type: Number, required: true, min: 0.0001 },
  price: { type: Number, required: true, min: 0 },
  total_amount: { type: Number, required: true, min: 0 },
  date: { type: Date, required: true, default: Date.now },
  notes: { type: String, trim: true },
  cost_basis: { type: Number, default: 0 },
  total_cost: { type: Number, default: 0 },
  realized_pnl: { type: Number, default: 0 },
  realized_pnl_percent: { type: Number, default: 0 }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

StockTradeSchema.index({ user_id: 1, symbol: 1, date: 1 });
StockTradeSchema.index({ user_id: 1, type: 1, date: -1 });

export const StockTrade = mongoose.models.StockTrade || mongoose.model<IStockTrade>('StockTrade', StockTradeSchema);
