'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { 
  Calendar, StickyNote, Plus, ChevronDown, ChevronUp, Edit3, 
  Trash2, Check, Clock, Sparkles, RefreshCw, Loader2 
} from 'lucide-react';
import { 
  getWorkoutNoteHeadersAction, 
  getWorkoutNoteDetailAction, 
  saveWorkoutNoteAction, 
  deleteWorkoutNoteAction,
  WorkoutNoteHeaderDTO,
  WorkoutNoteDetailDTO 
} from '@/actions/workout-notes';
import toast from 'react-hot-toast';

interface WorkoutNotesSectionProps {
  isEn: boolean;
}

export function WorkoutNotesSection({ isEn }: WorkoutNotesSectionProps) {
  const todayStr = React.useMemo(() => new Date().toISOString().split('T')[0], []);
  
  // Headers list for past dates (fetched on initial mount of this section)
  const [headers, setHeaders] = useState<WorkoutNoteHeaderDTO[]>([]);
  const [isLoadingHeaders, setIsLoadingHeaders] = useState(true);

  // Lazy-loaded note details map: date -> WorkoutNoteDetailDTO
  const [loadedDetails, setLoadedDetails] = useState<Record<string, WorkoutNoteDetailDTO>>({});
  const [loadingDates, setLoadingDates] = useState<Record<string, boolean>>({});

  // Which date toggles are open
  const [expandedDates, setExpandedDates] = useState<string[]>([]);

  // Composer state for adding/editing note
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [noteTitle, setNoteTitle] = useState<string>('');
  const [noteContent, setNoteContent] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  // Initial lazy fetch of headers ONLY when this section is rendered
  useEffect(() => {
    let isMounted = true;
    async function loadHeaders() {
      setIsLoadingHeaders(true);
      try {
        const res = await getWorkoutNoteHeadersAction();
        if (isMounted) {
          if (res.success && res.notes) {
            setHeaders(res.notes);
          } else if (res.error) {
            toast.error(res.error);
          }
        }
      } catch (err) {
        console.error('Error fetching workout note headers:', err);
      } finally {
        if (isMounted) setIsLoadingHeaders(false);
      }
    }
    loadHeaders();
    return () => { isMounted = false; };
  }, []);

  // Format date helper (e.g. "15 Eylül 2026, Salı" or "September 15, 2026, Tuesday")
  const formatDateLabel = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const formatted = new Intl.DateTimeFormat(isEn ? 'en-US' : 'tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        weekday: 'long'
      }).format(dateObj);
      return formatted;
    } catch {
      return dateStr;
    }
  };

  // Toggle open/close for a specific date
  // "basınca o günün notu açılsın ben basmadan veriyi çekmesin" -> Fetch content on demand!
  const handleToggleDate = async (date: string) => {
    const isCurrentlyExpanded = expandedDates.includes(date);

    if (isCurrentlyExpanded) {
      setExpandedDates(prev => prev.filter(d => d !== date));
      return;
    }

    // Expanding: add to expandedDates
    setExpandedDates(prev => [...prev, date]);

    // If detail is not loaded yet, fetch it now! (LAZY LOADING)
    if (!loadedDetails[date] && !loadingDates[date]) {
      setLoadingDates(prev => ({ ...prev, [date]: true }));
      try {
        const res = await getWorkoutNoteDetailAction(date);
        if (res.success && res.note) {
          setLoadedDetails(prev => ({ ...prev, [date]: res.note! }));
        } else if (res.error) {
          toast.error(res.error);
        }
      } catch (err) {
        console.error(`Error loading note for ${date}:`, err);
        toast.error(isEn ? 'Could not load note content.' : 'Not içeriği yüklenemedi.');
      } finally {
        setLoadingDates(prev => ({ ...prev, [date]: false }));
      }
    }
  };

  // Start editing a specific note
  const handleEditNote = async (date: string) => {
    setSelectedDate(date);
    setIsComposerOpen(true);

    // If already loaded in details, populate immediately
    if (loadedDetails[date]) {
      setNoteTitle(loadedDetails[date].title || '');
      setNoteContent(loadedDetails[date].content || '');
    } else {
      // Fetch details then populate
      try {
        const res = await getWorkoutNoteDetailAction(date);
        if (res.success && res.note) {
          setLoadedDetails(prev => ({ ...prev, [date]: res.note! }));
          setNoteTitle(res.note.title || '');
          setNoteContent(res.note.content || '');
        }
      } catch {
        // ignore
      }
    }

    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  // Save or update note
  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) {
      toast.error(isEn ? 'Please enter note content.' : 'Lütfen not içeriği girin.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await saveWorkoutNoteAction({
        date: selectedDate,
        title: noteTitle,
        content: noteContent
      });

      if (res.success && res.note) {
        const saved = res.note;
        toast.success(isEn ? 'Workout note saved!' : 'Antrenman notu kaydedildi!');

        // Update local loadedDetails
        setLoadedDetails(prev => ({ ...prev, [saved.date]: saved }));

        // Update headers list
        setHeaders(prev => {
          const filtered = prev.filter(h => h.date !== saved.date);
          const rawContent = saved.content || '';
          const excerpt = rawContent.length > 80 ? rawContent.slice(0, 80) + '...' : rawContent;
          const newHeader: WorkoutNoteHeaderDTO = {
            id: saved.id,
            date: saved.date,
            title: saved.title || '',
            excerpt,
            updated_at: saved.updated_at
          };
          return [newHeader, ...filtered].sort((a, b) => b.date.localeCompare(a.date));
        });

        // Ensure this date is expanded
        if (!expandedDates.includes(saved.date)) {
          setExpandedDates(prev => [...prev, saved.date]);
        }

        // Close composer or clear form
        setIsComposerOpen(false);
        setNoteContent('');
        setNoteTitle('');
      } else {
        toast.error(res.error || (isEn ? 'Failed to save note.' : 'Not kaydedilemedi.'));
      }
    } catch {
      toast.error(isEn ? 'Connection error.' : 'Bağlantı hatası.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete note
  const handleDeleteNote = async (date: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm(isEn ? 'Are you sure you want to delete this note?' : 'Bu notu silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const res = await deleteWorkoutNoteAction(date);
      if (res.success) {
        toast.success(isEn ? 'Note deleted.' : 'Not silindi.');
        setHeaders(prev => prev.filter(h => h.date !== date));
        setExpandedDates(prev => prev.filter(d => d !== date));
        setLoadedDetails(prev => {
          const copy = { ...prev };
          delete copy[date];
          return copy;
        });
      } else {
        toast.error(res.error || (isEn ? 'Failed to delete.' : 'Silinemedi.'));
      }
    } catch {
      toast.error(isEn ? 'Connection error.' : 'Bağlantı hatası.');
    }
  };

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Top Banner & Quick Add Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <StickyNote size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white flex items-center gap-2">
              {isEn ? "Daily Workout Notes" : "Günlük Antrenman Notları"}
            </span>
            <span className="text-xs text-[var(--on-surface-variant)]">
              {isEn 
                ? "Record weights, feelings, PRs and review past daily sessions." 
                : "Günün ağırlıklarını, hislerinizi ve rekorlarınızı dilediğiniz tarihe kaydedip geçmişi inceleyin."}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsComposerOpen(!isComposerOpen);
            if (!isComposerOpen) {
              setSelectedDate(todayStr);
              setNoteTitle('');
              setNoteContent('');
            }
          }}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer self-start sm:self-auto shrink-0"
        >
          {isComposerOpen ? (
            <span>{isEn ? "Close Form" : "Formu Kapat"}</span>
          ) : (
            <>
              <Plus size={15} />
              <span>{isEn ? "+ New Note" : "+ Yeni Not Ekle"}</span>
            </>
          )}
        </button>
      </div>

      {/* Note Composer Panel (Add or Edit for Selected Date) */}
      {isComposerOpen && (
        <form 
          onSubmit={handleSaveNote}
          className="flex flex-col gap-3 p-4 rounded-2xl bg-[#141420] border border-amber-500/30 animate-slide-up shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <Edit3 size={14} />
              {isEn ? "Write Note for Date" : "Tarihe Not Yaz / Düzenle"}
            </span>
            <span className="text-[11px] text-white/50">
              {selectedDate === todayStr ? (isEn ? "Today's Date" : "Bugünün Tarihi") : selectedDate}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Date Input with quick "Bugün" button */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-white/70 flex items-center justify-between">
                <span>{isEn ? "Target Date" : "Not Tarihi"}</span>
                {selectedDate !== todayStr && (
                  <button
                    type="button"
                    onClick={() => setSelectedDate(todayStr)}
                    className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                  >
                    {isEn ? "Set to Today" : "Bugüne Ayarla"}
                  </button>
                )}
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            </div>

            {/* Optional Title Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-white/70">
                {isEn ? "Title / Focus (Optional)" : "Başlık / Odak (İsteğe Bağlı)"}
              </label>
              <input
                type="text"
                placeholder={isEn ? "e.g. Chest & Triceps PR Day" : "Örn: Göğüs & Arka Kol Rekor Günü"}
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors placeholder:text-white/30"
              />
            </div>
          </div>

          {/* Note Free Text Area */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-white/70">
              {isEn ? "General Text Note" : "Antrenman Notu (Serbest Metin)"}
            </label>
            <textarea
              rows={4}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder={isEn 
                ? "Write your notes for this day (e.g. Bench press 90kg 3x5 felt solid, good shoulder pump, increase weight next week)..." 
                : "Bu güne ait antrenman notunuzu buraya yazın (Örn: Bench press 90kg 3x5 rahat çıktı, omuz formu çok iyiydi, haftaya 92.5kg denenecek)..."}
              className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400 transition-all resize-y placeholder:text-white/30 leading-relaxed font-sans"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setIsComposerOpen(false);
                setNoteContent('');
                setNoteTitle('');
              }}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 text-xs font-semibold transition-colors cursor-pointer"
            >
              {isEn ? "Cancel" : "İptal"}
            </button>
            <button
              type="submit"
              disabled={isSaving || !noteContent.trim()}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/20"
            >
              {isSaving ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>{isEn ? "Saving..." : "Kaydediliyor..."}</span>
                </>
              ) : (
                <>
                  <Check size={14} strokeWidth={3} />
                  <span>{isEn ? "Save Note" : "Notu Kaydet"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* PAST NOTES LIST SECTION */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-white/80">
              {isEn ? "Past Workout Notes" : "Geçmiş Notlar"}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/70 font-semibold">
              {headers.length}
            </span>
          </div>

          <span className="text-[11px] text-[var(--on-surface-variant)] hidden sm:inline">
            {isEn ? "Tap on a day to expand note" : "Günün notunu açmak için üzerine tıklayın"}
          </span>
        </div>

        {/* Loading Skeleton */}
        {isLoadingHeaders ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse" />
            ))}
          </div>
        ) : headers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-white/[0.01] border border-dashed border-white/10 text-center gap-2.5">
            <StickyNote size={30} className="text-white/20" />
            <span className="text-sm font-bold text-white/80">
              {isEn ? "No workout notes yet" : "Henüz kaydedilmiş antrenman notu yok"}
            </span>
            <span className="text-xs text-[var(--on-surface-variant)] max-w-sm">
              {isEn 
                ? "Tap '+ New Note' above to record your thoughts, weights, and accomplishments for any workout date." 
                : "Yukarıdaki '+ Yeni Not Ekle' butonuna basarak dilediğiniz tarihe antrenman notunuzu ekleyebilirsiniz."}
            </span>
          </div>
        ) : (
          /* List of past notes in TOGGLE / ACCORDION format */
          <div className="flex flex-col gap-2">
            {headers.map((h) => {
              const isExpanded = expandedDates.includes(h.date);
              const isLoadingThis = Boolean(loadingDates[h.date]);
              const detail = loadedDetails[h.date];
              const isToday = h.date === todayStr;

              return (
                <div
                  key={h.id || h.date}
                  className="flex flex-col rounded-2xl bg-[var(--surface-container)] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.14)] transition-all overflow-hidden"
                >
                  {/* Toggle Header */}
                  <div
                    onClick={() => handleToggleDate(h.date)}
                    className="p-3.5 sm:p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors gap-3 select-none"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isToday 
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                          : 'bg-white/5 text-white/60'
                      }`}>
                        <Calendar size={15} />
                      </div>

                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs sm:text-sm font-bold text-white truncate">
                            {formatDateLabel(h.date)}
                          </span>
                          {isToday && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              {isEn ? "Today" : "Bugün"}
                            </span>
                          )}
                          {h.title && (
                            <span className="text-xs font-medium text-amber-200/80 truncate">
                              • {h.title}
                            </span>
                          )}
                        </div>

                        {!isExpanded && h.excerpt && (
                          <span className="text-[11px] text-white/40 truncate mt-0.5">
                            {h.excerpt}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isExpanded ? (
                        <ChevronUp size={18} className="text-white/60" />
                      ) : (
                        <ChevronDown size={18} className="text-white/40" />
                      )}
                    </div>
                  </div>

                  {/* Toggle Expanded Content: Lazy Loaded on demand */}
                  {isExpanded && (
                    <div className="flex flex-col border-t border-white/[0.06] bg-[#0c0c14] p-4 gap-3 animate-fade-in">
                      {isLoadingThis ? (
                        <div className="flex items-center justify-center py-6 gap-2 text-xs text-white/60">
                          <Loader2 size={16} className="animate-spin text-amber-400" />
                          <span>{isEn ? "Loading note..." : "Not yükleniyor..."}</span>
                        </div>
                      ) : detail ? (
                        <div className="flex flex-col gap-3">
                          {detail.title && (
                            <h4 className="text-sm font-bold text-amber-300">
                              {detail.title}
                            </h4>
                          )}

                          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs sm:text-sm text-white/90 whitespace-pre-wrap leading-relaxed font-sans">
                            {detail.content}
                          </div>

                          {/* Footer Actions */}
                          <div className="flex items-center justify-between pt-1 flex-wrap gap-2 text-[11px] text-white/40">
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {isEn ? "Saved:" : "Kayıt:"} {detail.updated_at ? new Date(detail.updated_at).toLocaleTimeString(isEn ? 'en-US' : 'tr-TR', { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleEditNote(h.date)}
                                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Edit3 size={12} />
                                <span>{isEn ? "Edit" : "Düzenle"}</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => handleDeleteNote(h.date, e)}
                                className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400/80 hover:text-red-300 text-xs transition-colors flex items-center cursor-pointer"
                                title={isEn ? "Delete this note" : "Bu notu sil"}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="py-4 text-center text-xs text-white/50">
                          {isEn ? "No content found for this note." : "Bu nota ait içerik bulunamadı."}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
