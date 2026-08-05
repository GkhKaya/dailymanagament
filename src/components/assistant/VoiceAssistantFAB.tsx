"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Mic, Loader2, Bot, X } from 'lucide-react';
import { confirmAssistantFinanceAction, processAssistantVoiceAction } from '@/actions/assistant';
import toast from 'react-hot-toast';

interface FinanceDraft {
  transaction_type: 'expense' | 'income';
  amount: number;
  description: string;
  date: string;
  account_id: string | null;
  category_id: string | null;
  accounts: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string }>;
}

export function VoiceAssistantFAB({ onSuccess, currentDate }: { onSuccess?: () => void; currentDate?: string }) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [financeDraft, setFinanceDraft] = useState<FinanceDraft | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopMediaTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    // Component mount check if needed, but we init SpeechRecognition on click now.
    return () => {
      stopMediaTracks();
    };
  }, []);

  const toggleListening = async () => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      stopMediaTracks();
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Tarayıcınız sesli komutları desteklemiyor.");
      return;
    }

    setTranscript('');
    setFinanceDraft(null);
    setIsOpen(true);
    setIsListening(true);

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'tr-TR';

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      handleProcessAction(text);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      stopMediaTracks();
      if (event.error === 'not-allowed') {
        toast.error("Mikrofon erişimine izin verilmedi. Lütfen tarayıcı ayarlarından izin verin.");
      } else if (event.error !== 'aborted') {
        toast.error("Ses anlaşılamadı. Lütfen tekrar deneyin.");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
      stopMediaTracks();
    };

    recognitionRef.current = recognition;
    
    try {
      // Force get media stream to properly control microphone lifecycle (especially for Safari)
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      recognition.start();
    } catch (e) {
      console.error("Speech recognition start error", e);
      setIsListening(false);
      stopMediaTracks();
    }
  };

  const handleProcessAction = async (text: string) => {
    if (!text.trim()) return;
    
    setIsProcessing(true);
    setIsOpen(true);
    
    try {
      const result = await processAssistantVoiceAction(text, currentDate);
      if (result.success) {
        if (result.action === 'finance_preview') {
          setFinanceDraft(result.draft);
        } else {
          toast.success(result.message || "Öğün eklendi.");
          onSuccess?.();
          setTimeout(() => setIsOpen(false), 3000);
        }
      } else {
        toast.error(result.error || "İşlem başarısız oldu.");
      }
    } catch (error) {
      toast.error("Bir hata oluştu.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmFinance = async () => {
    if (!financeDraft) return;
    setIsProcessing(true);
    try {
      const result = await confirmAssistantFinanceAction(financeDraft);
      if (!result.success) {
        toast.error(result.error || 'Finans işlemi kaydedilemedi.');
        return;
      }
      toast.success('Finans işlemi eklendi.');
      setFinanceDraft(null);
      onSuccess?.();
      setTimeout(() => setIsOpen(false), 1500);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-[100] flex flex-col items-start">
      {/* Dialog Bubble */}
      {isOpen && (
        <div 
          className="bg-black border border-[var(--outline)] rounded-2xl p-4 shadow-2xl mb-4 w-72 sm:w-80 animate-fade-in origin-bottom-left relative z-[101]"
          style={{ backgroundColor: '#121212' }}
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-white font-bold flex items-center gap-2">
              <Bot size={18} className="text-[var(--primary)]" />
              Yapay Zeka Asistanı
            </h3>
            <button onClick={() => setIsOpen(false)} className="text-[var(--on-surface-variant)] hover:text-white">
              <X size={18} />
            </button>
          </div>
          {financeDraft ? (
            <div className="flex flex-col gap-3">
              <div className="bg-[rgba(0,0,0,0.3)] rounded-lg p-3 text-sm text-white">
                <div className="font-semibold">{financeDraft.transaction_type === 'income' ? 'Gelir' : 'Gider'} onayı</div>
                <div className="text-[var(--on-surface-variant)] mt-1">Sesli komut: &ldquo;{transcript}&rdquo;</div>
              </div>
              <label className="text-xs text-[var(--on-surface-variant)]">Tutar
                <input type="number" min="0.01" step="0.01" value={financeDraft.amount} onChange={(event) => setFinanceDraft({ ...financeDraft, amount: Number(event.target.value) })} className="mt-1 w-full bg-[rgba(255,255,255,0.05)] border border-[var(--outline)] rounded-lg px-3 py-2 text-white" />
              </label>
              <label className="text-xs text-[var(--on-surface-variant)]">Hesap
                <select value={financeDraft.account_id || ''} onChange={(event) => setFinanceDraft({ ...financeDraft, account_id: event.target.value || null })} className="mt-1 w-full bg-[var(--surface-container)] border border-[var(--outline)] rounded-lg px-3 py-2 text-white">
                  <option value="">Hesap seçin</option>
                  {financeDraft.accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
                </select>
              </label>
              <label className="text-xs text-[var(--on-surface-variant)]">Kategori
                <select value={financeDraft.category_id || ''} onChange={(event) => setFinanceDraft({ ...financeDraft, category_id: event.target.value || null })} className="mt-1 w-full bg-[var(--surface-container)] border border-[var(--outline)] rounded-lg px-3 py-2 text-white">
                  <option value="">Kategori seçin</option>
                  {financeDraft.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </label>
              <label className="text-xs text-[var(--on-surface-variant)]">Açıklama
                <input value={financeDraft.description} onChange={(event) => setFinanceDraft({ ...financeDraft, description: event.target.value })} className="mt-1 w-full bg-[rgba(255,255,255,0.05)] border border-[var(--outline)] rounded-lg px-3 py-2 text-white" />
              </label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setFinanceDraft(null)} className="flex-1 py-2 rounded-lg bg-white/5 text-white">İptal</button>
                <button type="button" disabled={isProcessing || !financeDraft.account_id || !financeDraft.category_id || financeDraft.amount <= 0} onClick={handleConfirmFinance} className="flex-1 py-2 rounded-lg bg-[var(--primary)] text-black font-semibold disabled:opacity-40">Onayla</button>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-[rgba(0,0,0,0.3)] rounded-lg p-3 min-h-[60px] flex items-center justify-center text-sm text-[var(--on-surface-variant)] text-center">
                {isListening ? (
              <div className="flex flex-col items-center gap-2">
                <span className="animate-pulse text-[var(--primary)]">Dinliyorum...</span>
                <span className="text-white font-medium">&ldquo;{transcript}&rdquo;</span>
              </div>
            ) : isProcessing ? (
              <div className="flex flex-col items-center gap-2 text-white">
                <Loader2 size={18} className="animate-spin text-[var(--primary)]" />
                İşleniyor: &ldquo;{transcript}&rdquo;
              </div>
            ) : transcript ? (
              <span className="text-white">&ldquo;{transcript}&rdquo;</span>
            ) : (
              "Nakit hesabından 100 TL market harcaması yaptım diyebilirsiniz."
                )}
              </div>
              <div className="mt-3 flex items-center gap-2">
            <input 
              type="text" 
              placeholder="Veya komutunuzu yazın..." 
              className="flex-1 bg-[rgba(255,255,255,0.05)] border border-[var(--outline)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--primary)]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  const val = e.currentTarget.value.trim();
                  setTranscript(val);
                  handleProcessAction(val);
                  e.currentTarget.value = '';
                }
              }}
            />
              </div>
            </>
          )}
        </div>
      )}

      {/* FAB Button */}
      <button 
        onClick={() => {
           if (!isOpen && !isListening) setIsOpen(true);
           toggleListening();
        }}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-[var(--primary)] text-black'}`}
      >
        {isProcessing ? <Loader2 className="animate-spin" size={24} /> : <Mic size={24} />}
      </button>
    </div>
  );
}
