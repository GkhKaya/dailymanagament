import mongoose, { Schema, Document } from 'mongoose';

export interface IStockPosition extends Document {
  user_id: string;
  symbol: string;
  name?: string;
  asset_type: 'stock' | 'fund' | 'crypto';
  market?: 'bist' | 'us' | 'crypto';
  currency?: string;
  total_lots: number;
  average_cost: number;
  total_cost: number;
  current_price?: number;
  open_price?: number;
  close_price?: number;
  day_change_percent?: number;
  price_updated_at?: Date;
  current_value?: number;
  unrealized_pnl?: number;
  unrealized_pnl_percent?: number;
  last_trade_date?: Date;
  updated_at: Date;
}

const StockPositionSchema: Schema = new Schema({
  user_id: { type: String, ref: 'User', required: true },
  symbol: { type: String, required: true, uppercase: true, trim: true },
  name: { type: String, trim: true },
  asset_type: { type: String, enum: ['stock', 'fund', 'crypto'], default: 'stock', required: true },
  market: { type: String, enum: ['bist', 'us', 'crypto'], default: 'bist' },
  currency: { type: String, default: 'TRY' },
  total_lots: { type: Number, required: true, default: 0 },
  average_cost: { type: Number, required: true, default: 0 },
  total_cost: { type: Number, required: true, default: 0 },
  current_price: { type: Number, default: 0 },
  open_price: { type: Number, default: 0 },
  close_price: { type: Number, default: 0 },
  day_change_percent: { type: Number, default: 0 },
  price_updated_at: { type: Date },
  current_value: { type: Number, default: 0 },
  unrealized_pnl: { type: Number, default: 0 },
  unrealized_pnl_percent: { type: Number, default: 0 },
  last_trade_date: { type: Date }
}, {
  timestamps: { createdAt: false, updatedAt: 'updated_at' }
});

StockPositionSchema.index({ user_id: 1, symbol: 1 }, { unique: true });
StockPositionSchema.index({ user_id: 1, total_lots: -1 });

export const StockPosition = mongoose.models.StockPosition || mongoose.model<IStockPosition>('StockPosition', StockPositionSchema);
