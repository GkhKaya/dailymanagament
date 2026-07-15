"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Mic, Loader2, Bot, X } from 'lucide-react';
import { processAssistantVoiceAction } from '@/actions/assistant';
import toast from 'react-hot-toast';

export function VoiceAssistantFAB({ onSuccess }: { onSuccess?: () => void }) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Component mount check if needed, but we init SpeechRecognition on click now.
  }, []);

  const toggleListening = () => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Tarayıcınız sesli komutları desteklemiyor.");
      return;
    }

    setTranscript('');
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
      if (event.error === 'not-allowed') {
        toast.error("Mikrofon erişimine izin verilmedi. Lütfen tarayıcı ayarlarından izin verin.");
      } else if (event.error !== 'aborted') {
        toast.error("Ses anlaşılamadı. Lütfen tekrar deneyin.");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    
    try {
      recognition.start();
    } catch (e) {
      console.error("Speech recognition start error", e);
      setIsListening(false);
    }
  };

  const handleProcessAction = async (text: string) => {
    if (!text.trim()) return;
    
    setIsProcessing(true);
    setIsOpen(true);
    
    try {
      const result = await processAssistantVoiceAction(text);
      if (result.success) {
        toast.success(result.message || "İşlem başarılı");
        if (onSuccess) onSuccess();
        setTimeout(() => setIsOpen(false), 3000); // Auto close after success
      } else {
        toast.error(result.error || "İşlem başarısız oldu.");
      }
    } catch (error) {
      toast.error("Bir hata oluştu.");
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
          
          <div className="bg-[rgba(0,0,0,0.3)] rounded-lg p-3 min-h-[60px] flex items-center justify-center text-sm text-[var(--on-surface-variant)] text-center">
            {isListening ? (
              <div className="flex flex-col items-center gap-2">
                <span className="animate-pulse text-[var(--primary)]">Dinliyorum...</span>
                <span className="text-white font-medium">"{transcript}"</span>
              </div>
            ) : isProcessing ? (
              <div className="flex flex-col items-center gap-2 text-white">
                <Loader2 size={18} className="animate-spin text-[var(--primary)]" />
                İşleniyor: "{transcript}"
              </div>
            ) : transcript ? (
              <span className="text-white">"{transcript}"</span>
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
