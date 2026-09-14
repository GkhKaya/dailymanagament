import React from 'react';
import {
  // Shopping & Daily
  ShoppingCart, ShoppingBag, Utensils, Coffee, Pizza, Apple, Cake, Wine,
  // Transport & Travel
  Car, Fuel, Bus, Train, Plane, Bike, Navigation, Wrench, MapPin,
  // Home & Bills
  Home, Zap, Droplet, Flame, Wifi, Phone, Tv, Shield, Hammer,
  // Personal & Health
  Heart, Activity, Dumbbell, Pill, Stethoscope, Sparkles, Scissors, Shirt, Watch, Baby, PawPrint,
  // Entertainment & Culture
  Film, Music, Gamepad2, Book, Camera, Ticket, Smile,
  // Work, Tech & Education
  Briefcase, Laptop, Cpu, GraduationCap, Newspaper, Building2, Printer,
  // Finance, Money & Wealth
  Wallet, CreditCard, Banknote, TrendingUp, Coins, PiggyBank, Landmark, Gift, Award, Percent, BadgeDollarSign, Tag
} from 'lucide-react';

export interface CategoryIconItem {
  id: string;
  name: string;
  group: 'daily' | 'transport' | 'home' | 'health' | 'entertainment' | 'work' | 'finance';
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
}

export const CATEGORY_ICON_LIST: CategoryIconItem[] = [
  // Daily & Food
  { id: 'cart', name: 'Market', group: 'daily', icon: ShoppingCart },
  { id: 'shopping-bag', name: 'Alışveriş', group: 'daily', icon: ShoppingBag },
  { id: 'food', name: 'Yemek / Restoran', group: 'daily', icon: Utensils },
  { id: 'coffee', name: 'Kahve / Kafe', group: 'daily', icon: Coffee },
  { id: 'pizza', name: 'Fast Food', group: 'daily', icon: Pizza },
  { id: 'apple', name: 'Manav / Meyve', group: 'daily', icon: Apple },
  { id: 'cake', name: 'Tatlı / Pastane', group: 'daily', icon: Cake },
  { id: 'wine', name: 'İçecek / Bar', group: 'daily', icon: Wine },

  // Transport & Auto
  { id: 'car', name: 'Araba / Ulaşım', group: 'transport', icon: Car },
  { id: 'fuel', name: 'Akaryakıt / Benzin', group: 'transport', icon: Fuel },
  { id: 'bus', name: 'Otobüs', group: 'transport', icon: Bus },
  { id: 'train', name: 'Metro / Tren', group: 'transport', icon: Train },
  { id: 'plane', name: 'Uçak / Seyahat', group: 'transport', icon: Plane },
  { id: 'bike', name: 'Bisiklet / Scooter', group: 'transport', icon: Bike },
  { id: 'navigation', name: 'Taksi / Navigasyon', group: 'transport', icon: Navigation },
  { id: 'wrench', name: 'Tamir / Servis', group: 'transport', icon: Wrench },
  { id: 'map-pin', name: 'Gezi / Konum', group: 'transport', icon: MapPin },

  // Home & Bills
  { id: 'home', name: 'Ev / Kira', group: 'home', icon: Home },
  { id: 'zap', name: 'Elektrik', group: 'home', icon: Zap },
  { id: 'droplet', name: 'Su', group: 'home', icon: Droplet },
  { id: 'flame', name: 'Doğalgaz / Isınma', group: 'home', icon: Flame },
  { id: 'wifi', name: 'İnternet', group: 'home', icon: Wifi },
  { id: 'phone', name: 'Telefon / GSM', group: 'home', icon: Phone },
  { id: 'tv', name: 'Televizyon / Yayın', group: 'home', icon: Tv },
  { id: 'shield', name: 'Sigorta / Kasko', group: 'home', icon: Shield },
  { id: 'hammer', name: 'Tadilat / Yapı Market', group: 'home', icon: Hammer },

  // Health & Personal Care
  { id: 'heart', name: 'Sağlık / Eczane', group: 'health', icon: Heart },
  { id: 'activity', name: 'Spor / Egzersiz', group: 'health', icon: Activity },
  { id: 'dumbbell', name: 'Fitness / Vücut Geliştirme', group: 'health', icon: Dumbbell },
  { id: 'pill', name: 'İlaç / Medikal', group: 'health', icon: Pill },
  { id: 'stethoscope', name: 'Doktor / Muayene', group: 'health', icon: Stethoscope },
  { id: 'sparkles', name: 'Güzellik / Bakım', group: 'health', icon: Sparkles },
  { id: 'scissors', name: 'Kuaför / Berber', group: 'health', icon: Scissors },
  { id: 'shirt', name: 'Giyim / Kıyafet', group: 'health', icon: Shirt },
  { id: 'watch', name: 'Aksesuar', group: 'health', icon: Watch },
  { id: 'baby', name: 'Bebek / Çocuk', group: 'health', icon: Baby },
  { id: 'paw-print', name: 'Evcil Hayvan', group: 'health', icon: PawPrint },

  // Entertainment & Fun
  { id: 'film', name: 'Sinema / Dizi', group: 'entertainment', icon: Film },
  { id: 'music', name: 'Müzik / Konser', group: 'entertainment', icon: Music },
  { id: 'gamepad-2', name: 'Oyun / Gaming', group: 'entertainment', icon: Gamepad2 },
  { id: 'book', name: 'Kitap / Hobi', group: 'entertainment', icon: Book },
  { id: 'camera', name: 'Fotoğrafçılık / Sanat', group: 'entertainment', icon: Camera },
  { id: 'ticket', name: 'Etkinlik / Bilet', group: 'entertainment', icon: Ticket },
  { id: 'smile', name: 'Eğlence / Sosyal', group: 'entertainment', icon: Smile },

  // Work & Tech & Education
  { id: 'briefcase', name: 'İş / Kariyer', group: 'work', icon: Briefcase },
  { id: 'laptop', name: 'Bilgisayar / Elektronik', group: 'work', icon: Laptop },
  { id: 'tech', name: 'Teknoloji', group: 'work', icon: Cpu },
  { id: 'graduation-cap', name: 'Eğitim / Kurs', group: 'work', icon: GraduationCap },
  { id: 'newspaper', name: 'Haber / Basın', group: 'work', icon: Newspaper },
  { id: 'building-2', name: 'Ofis / Kurumsal', group: 'work', icon: Building2 },
  { id: 'printer', name: 'Kırtasiye / Yazıcı', group: 'work', icon: Printer },

  // Finance, Income & Savings
  { id: 'wallet', name: 'Cüzdan / Nakit', group: 'finance', icon: Wallet },
  { id: 'credit-card', name: 'Kredi Kartı', group: 'finance', icon: CreditCard },
  { id: 'banknote', name: 'Maaş / Nakit Gelir', group: 'finance', icon: Banknote },
  { id: 'trending', name: 'Yatırım / Borsa', group: 'finance', icon: TrendingUp },
  { id: 'coins', name: 'Altın / Kripto / Döviz', group: 'finance', icon: Coins },
  { id: 'piggy-bank', name: 'Birikim / Kasa', group: 'finance', icon: PiggyBank },
  { id: 'landmark', name: 'Banka / Faiz', group: 'finance', icon: Landmark },
  { id: 'gift', name: 'Hediye / Bağış', group: 'finance', icon: Gift },
  { id: 'award', name: 'Prim / Ödül', group: 'finance', icon: Award },
  { id: 'percent', name: 'Vergi / Komisyon', group: 'finance', icon: Percent },
  { id: 'badge-dollar-sign', name: 'Gelir / Kar Payı', group: 'finance', icon: BadgeDollarSign },
  { id: 'tag', name: 'Genel / Diğer', group: 'finance', icon: Tag },
];

// Mapping for aliases to handle various stored keys
const ALIAS_MAP: Record<string, React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>> = {
  'cart': ShoppingCart,
  'shopping-cart': ShoppingCart,
  'shopping_cart': ShoppingCart,
  'shopping-bag': ShoppingBag,
  'shopping_bag': ShoppingBag,
  'food': Utensils,
  'utensils': Utensils,
  'coffee': Coffee,
  'car': Car,
  'film': Film,
  'home': Home,
  'zap': Zap,
  'heart': Heart,
  'gift': Gift,
  'briefcase': Briefcase,
  'wallet': Wallet,
  'trending': TrendingUp,
  'trending-up': TrendingUp,
  'trending_up': TrendingUp,
  'tech': Cpu,
  'cpu': Cpu,
  'music': Music,
  'book': Book,
  'gamepad': Gamepad2,
  'gamepad-2': Gamepad2,
  'gamepad_2': Gamepad2,
  'paw': PawPrint,
  'paw-print': PawPrint,
  'paw_print': PawPrint,
  'tag': Tag,
  'tags': Tag,
  'dollar': BadgeDollarSign,
  'badge-dollar-sign': BadgeDollarSign,
  'piggy': PiggyBank,
  'piggy-bank': PiggyBank,
  'piggy_bank': PiggyBank,
  'graduation': GraduationCap,
  'graduation-cap': GraduationCap,
  'graduation_cap': GraduationCap,
  'credit-card': CreditCard,
  'credit_card': CreditCard,
  'banknote': Banknote,
  'coins': Coins,
  'landmark': Landmark,
  'activity': Activity,
  'dumbbell': Dumbbell,
  'pill': Pill,
  'stethoscope': Stethoscope,
  'sparkles': Sparkles,
  'scissors': Scissors,
  'shirt': Shirt,
  'watch': Watch,
  'baby': Baby,
  'bus': Bus,
  'train': Train,
  'plane': Plane,
  'bike': Bike,
  'fuel': Fuel,
  'wrench': Wrench,
  'navigation': Navigation,
  'map-pin': MapPin,
  'droplet': Droplet,
  'flame': Flame,
  'wifi': Wifi,
  'phone': Phone,
  'tv': Tv,
  'shield': Shield,
  'hammer': Hammer,
  'camera': Camera,
  'ticket': Ticket,
  'smile': Smile,
  'laptop': Laptop,
  'newspaper': Newspaper,
  'building-2': Building2,
  'printer': Printer,
  'award': Award,
  'percent': Percent,
  'pizza': Pizza,
  'apple': Apple,
  'cake': Cake,
  'wine': Wine,
};

export const CATEGORY_PALETTE = [
  '#ef4444', // Red
  '#f43f5e', // Rose
  '#f97316', // Orange
  '#ea580c', // Dark Orange
  '#f59e0b', // Amber
  '#eab308', // Yellow
  '#84cc16', // Lime
  '#22c55e', // Green
  '#10b981', // Emerald
  '#14b8a6', // Teal
  '#06b6d4', // Cyan
  '#0284c7', // Sky
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#a855f7', // Purple
  '#d946ef', // Fuchsia
  '#ec4899', // Pink
  '#64748b', // Slate
  '#9ca3af', // Gray
];

export function getCategoryIcon(
  iconId?: string | null,
  size: number = 20,
  className?: string,
  fallback?: React.ReactNode
): React.ReactNode {
  if (!iconId) {
    return fallback ?? React.createElement(ShoppingCart, { size, className });
  }

  const normalized = iconId.trim().toLowerCase();
  const IconComponent = ALIAS_MAP[normalized];

  if (IconComponent) {
    return React.createElement(IconComponent, { size, className });
  }

  // Check direct find in list
  const found = CATEGORY_ICON_LIST.find(item => item.id.toLowerCase() === normalized);
  if (found) {
    return React.createElement(found.icon, { size, className });
  }

  return fallback ?? React.createElement(ShoppingCart, { size, className });
}
