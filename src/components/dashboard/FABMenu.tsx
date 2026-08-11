"use client";

import React, { useState } from "react";
import { Plus, Utensils, Activity, DollarSign, X } from "lucide-react";
import { t } from "@/lib/i18n";
import { DashboardMode } from "@/models/DashboardTypes";

interface FABMenuProps {
  mode: DashboardMode;
  onOpenSheet: (type: string) => void;
}

export function FABMenu({ mode, onOpenSheet }: FABMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleAction = (type: string) => {
    onOpenSheet(type);
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      {/* Menu Options */}
      <div 
        className={`flex flex-col items-end gap-3 transition-all duration-300 ease-out origin-bottom ${
          isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-10 pointer-events-none'
        }`}
      >
        <button 
          onClick={() => handleAction('transaction')}
          className="flex items-center gap-3 bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.12)] border border-[rgba(255,255,255,0.05)] backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-lg transition-transform hover:scale-105"
        >
          <span className="font-medium text-sm">{t("dashboard.fab.addExpense")} / {t("dashboard.fab.addIncome")}</span>
          <div className="w-8 h-8 rounded-full bg-[rgba(73,75,214,0.3)] flex items-center justify-center text-[#c0c1ff]">
            <DollarSign size={16} />
          </div>
        </button>

        <button 
          onClick={() => handleAction('exercise')}
          className="flex items-center gap-3 bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.12)] border border-[rgba(255,255,255,0.05)] backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-lg transition-transform hover:scale-105"
        >
          <span className="font-medium text-sm">{t("dashboard.fab.addExercise")}</span>
          <div className="w-8 h-8 rounded-full bg-[rgba(217,119,33,0.3)] flex items-center justify-center text-orange-400">
            <Activity size={16} />
          </div>
        </button>

        <button 
          onClick={() => handleAction('meal')}
          className="flex items-center gap-3 bg-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.12)] border border-[rgba(255,255,255,0.05)] backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-lg transition-transform hover:scale-105"
        >
          <span className="font-medium text-sm">{t("dashboard.fab.addMeal")}</span>
          <div className="w-8 h-8 rounded-full bg-[rgba(33,196,93,0.3)] flex items-center justify-center text-[#4ade80]">
            <Utensils size={16} />
          </div>
        </button>
      </div>

      {/* Main FAB */}
      <button 
        onClick={toggleMenu}
        className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-300 z-50 relative ${
          isOpen 
            ? 'bg-[rgba(255,255,255,0.1)] text-white rotate-90 border border-[rgba(255,255,255,0.1)]' 
            : 'bg-[var(--primary)] text-white hover:bg-[#3d3fb3] hover:scale-105 hover:shadow-[0_0_20px_rgba(73,75,214,0.4)]'
        }`}
      >
        {isOpen ? <X size={24} /> : <Plus size={24} />}
      </button>
    </div>
  );
}
