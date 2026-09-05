'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Key, Mail, Wallet, ArrowRight, ChevronRight, Star, Dumbbell, Plus, Edit2, ChevronDown, ChevronUp, Download, Upload, Info, HelpCircle, PlayCircle, ExternalLink } from 'lucide-react';
import { getExerciseVideoUrl } from '@/lib/workout-utils';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { ManageCategoriesForm } from '@/components/forms/ManageCategoriesForm';
import { ManageDebtsForm } from '@/components/forms/ManageDebtsForm';
import { ManageSubscriptionsForm } from '@/components/forms/ManageSubscriptionsForm';
import { AddAccountForm } from '@/components/forms/AddAccountForm';
import { UpdateEmailForm } from '@/components/forms/UpdateEmailForm';
import { UpdateUsernameForm } from '@/components/forms/UpdateUsernameForm';
import { UpdatePasswordForm } from '@/components/forms/UpdatePasswordForm';
import { UpdateWeightForm } from '@/components/forms/UpdateWeightForm';
import { UpdateAgeForm } from '@/components/forms/UpdateAgeForm';
import { ManageAccountsForm } from '@/components/forms/ManageAccountsForm';
import { EditAccountForm } from '@/components/forms/EditAccountForm';
import { EditSubscriptionForm } from '@/components/forms/EditSubscriptionForm';
import { EditDebtForm } from '@/components/forms/EditDebtForm';
import { ManageWorkoutRoutineForm } from '@/components/forms/ManageWorkoutRoutineForm';
import { ManageMarketsForm } from '@/components/forms/ManageMarketsForm';
import { getWorkoutRoutineAction, importWorkoutRoutineAction } from '@/actions/workout';
import { FinanceDataDTO } from '@/models/DashboardTypes';
import toast from 'react-hot-toast';
import { PrayerView } from '@/components/profile/PrayerView';
import { useTranslation } from '@/hooks/useTranslation';

export function ProfileView({ initialUser, financeData }: { initialUser: { name: string, email: string, image?: string, current_weight_kg?: number, target_weight_kg?: number, target_weight_date?: string, height_cm?: number, age?: number }, financeData?: FinanceDataDTO | null }) {
  const router = useRouter();
  const { locale, isAbroad } = useTranslation();
  const isEn = isAbroad || locale === 'en';

  const [activeSheet, setActiveSheet] = useState<string | null>(null);
  const [workoutDays, setWorkoutDays] = useState<any[]>([]);
  const [expandedWorkoutDays, setExpandedWorkoutDays] = useState<string[]>([]);
  const [selectedWorkoutDay, setSelectedWorkoutDay] = useState<any>(null);
  const [jsonText, setJsonText] = useState('');

  const fetchWorkoutRoutine = () => {
    getWorkoutRoutineAction().then(res => {
      if (res.success && res.days) {
        setWorkoutDays(res.days);
      }
    });
  };

  const handleDownloadTemplate = () => {
    let template: any;
    if (workoutDays.length > 0) {
      template = workoutDays.map((day: any) => ({
        day_name: day.day_name,
        exercises: (day.exercises || []).map((ex: any) => ({
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          weight_kg: ex.weight_kg || 0
        }))
      }));
    } else {
      template = [
        {
          day_name: isEn ? "Monday - Chest" : "Pazartesi - Göğüs",
          exercises: [
            { name: "Bench Press", sets: 4, reps: "10-12", weight_kg: 60 },
            { name: "Incline Dumbbell Press", sets: 3, reps: "12", weight_kg: 20 }
          ]
        },
        {
          day_name: isEn ? "Wednesday - Back" : "Çarşamba - Sırt",
          exercises: [
            { name: "Pull Up", sets: 3, reps: "Max", weight_kg: 0 }
          ]
        }
      ];
    }
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = workoutDays.length > 0 ? (isEn ? 'my_workout_routine.json' : 'antrenman_programim.json') : (isEn ? 'workout_template.json' : 'antrenman_sablonu.json');
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text);
        
        const res = await importWorkoutRoutineAction(data);
        if (res.success) {
          toast.success(isEn ? "Workout routine imported successfully!" : "Antrenman programı başarıyla içe aktarıldı!");
          fetchWorkoutRoutine();
        } else {
          toast.error(res.error || (isEn ? "Error importing routine." : "İçe aktarılırken hata oluştu."));
        }
      } catch (err) {
        toast.error(isEn ? "Invalid JSON file. Please check the template." : "Geçersiz JSON dosyası. Lütfen şablonu inceleyin.");
      }
      e.target.value = ''; // reset input
    };
    reader.readAsText(file);
  };

  const handlePasteJSONSubmit = async () => {
    try {
      const data = JSON.parse(jsonText);
      const res = await importWorkoutRoutineAction(data);
      if (res.success) {
        toast.success(isEn ? "Workout routine added successfully!" : "Antrenman programı başarıyla eklendi!");
        fetchWorkoutRoutine();
        setActiveSheet(null);
        setJsonText('');
      } else {
        toast.error(res.error || (isEn ? "Error importing routine." : "İçe aktarılırken hata oluştu."));
      }
    } catch(err) {
      toast.error(isEn ? "Invalid JSON format! Please check the code." : "Geçersiz JSON formatı! Lütfen kodu kontrol edin.");
    }
  };

  useEffect(() => {
    fetchWorkoutRoutine();
  }, [activeSheet]);

  const toggleWorkoutDay = (dayId: string) => {
    setExpandedWorkoutDays(prev =>
      prev.includes(dayId) ? prev.filter(id => id !== dayId) : [...prev, dayId]
    );
  };

  const handleSuccess = () => {
    setActiveSheet(null);
    setSelectedWorkoutDay(null);
    fetchWorkoutRoutine();
    router.refresh();
  };

  const renderSheetContent = () => {
    if (activeSheet?.startsWith('editAccount_')) {
      const id = activeSheet.replace('editAccount_', '');
      const data = financeData?.accounts.find(a => a.id === id);
      return <EditAccountForm onSuccess={handleSuccess} initialData={data} accounts={financeData?.accounts || []} />;
    }
    if (activeSheet?.startsWith('editSubscription_')) {
      const id = activeSheet.replace('editSubscription_', '');
      const data = financeData?.subscriptions.find(s => s.id === id);
      const subData = data ? { id: data.id, name: data.name, amount: data.amount, billingDay: new Date(data.nextBillingDate).getDate() } : undefined;
      return <EditSubscriptionForm onClose={() => setActiveSheet('subscriptions')} onSuccess={handleSuccess} initialData={subData} />;
    }
    if (activeSheet?.startsWith('editDebt_')) {
      const id = activeSheet.replace('editDebt_', '');
      const data = financeData?.debts.find(d => d.id === id);
      return <EditDebtForm onClose={() => setActiveSheet('debts')} onSuccess={handleSuccess} initialData={data} />;
    }

    switch (activeSheet) {
      case 'manageAccounts': return (
        <ManageAccountsForm 
          onClose={() => setActiveSheet(null)} 
          onOpenAdd={() => setActiveSheet('addAccount')}
          onOpenEdit={(id) => { setActiveSheet(`editAccount_${id}`) }}
          accounts={financeData?.accounts || []} 
        />
      );
      case 'addAccount': return <AddAccountForm onClose={() => setActiveSheet('manageAccounts')} onSuccess={handleSuccess} />;
      case 'categories': return <ManageCategoriesForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} categories={financeData?.categories || []} />;
      case 'debts': return <ManageDebtsForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} onOpenEdit={(id) => { setActiveSheet(`editDebt_${id}`) }} debts={financeData?.debts || []} />;
      case 'subscriptions': return <ManageSubscriptionsForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} onOpenEdit={(id) => { setActiveSheet(`editSubscription_${id}`) }} subscriptions={financeData?.subscriptions || []} categories={financeData?.categories || []} accounts={financeData?.accounts || []} />;
      case 'email': return <UpdateEmailForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} initialEmail={initialUser.email} />;
      case 'username': return <UpdateUsernameForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} initialUsername={initialUser.name} />;
      case 'password': return <UpdatePasswordForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} />;
      case 'weight':
        return <UpdateWeightForm 
          onClose={() => setActiveSheet(null)} 
          onSuccess={() => { setActiveSheet(null); window.location.reload(); }} 
          initialWeight={initialUser.current_weight_kg}
          initialTargetWeight={initialUser.target_weight_kg}
          initialTargetDate={initialUser.target_weight_date as any}
        />;
      case 'age': return <UpdateAgeForm onClose={() => setActiveSheet(null)} onSuccess={handleSuccess} />;
      case 'markets': return <ManageMarketsForm onClose={() => setActiveSheet(null)} onSuccess={() => setActiveSheet(null)} />;
      case 'manageWorkoutRoutine': return <ManageWorkoutRoutineForm onClose={() => { setActiveSheet(null); setSelectedWorkoutDay(null); }} onSuccess={handleSuccess} initialData={selectedWorkoutDay} />;
      default: return (
        <div className="p-8 text-center text-[var(--on-surface-variant)]">
          {isEn ? "This form is under construction." : "Bu form yapım aşamasındadır."}
        </div>
      );
    }
  };

  const getSheetTitle = () => {
    if (activeSheet?.startsWith('editAccount_')) return isEn ? 'Edit Account' : 'Hesabı Düzenle';
    if (activeSheet?.startsWith('editSubscription_')) return isEn ? 'Edit Subscription' : 'Aboneliği Düzenle';
    if (activeSheet?.startsWith('editDebt_')) return isEn ? 'Edit Debt / Receivable' : 'Borç/Alacak Düzenle';

    switch (activeSheet) {
      case 'password': return isEn ? 'Update Password' : 'Şifre Güncelle';
      case 'email': return isEn ? 'Change Email' : 'E-posta Değiştir';
      case 'username': return isEn ? 'Change Username' : 'Kullanıcı Adı Değiştir';
      case 'weight': return isEn ? 'Update Weight' : 'Kilo Bilgisini Güncelle';
      case 'age': return isEn ? 'Update Age' : 'Yaş Bilgisini Güncelle';
      case 'manageAccounts': return isEn ? 'Manage Accounts' : 'Mevcut Hesaplar';
      case 'addAccount': return isEn ? 'Create Account' : 'Hesap Oluştur';
      case 'debts': return isEn ? 'Debt Management' : 'Borç Yönetimi';
      case 'subscriptions': return isEn ? 'Subscription Management' : 'Abonelik Yönetimi';
      case 'markets': return isEn ? 'Active Investment Markets' : 'Aktif Borsa & Piyasalar';
      case 'manageWorkoutRoutine': return selectedWorkoutDay?.id ? (isEn ? 'Edit Workout Day' : 'Antrenman Gününü Düzenle') : (isEn ? 'Add Workout Routine' : 'Antrenman Programı Ekle');
      default: return isEn ? 'Management' : 'Yönetim';
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] py-8 px-4 sm:px-6 lg:px-8 flex justify-center">
      <div className="w-full max-w-[1600px] animate-fade-in">
        
        {/* Header */}
        <div className="flex flex-col mb-10">
          <div className="flex items-center gap-4 mb-2">
            <button 
              onClick={() => router.push('/dashboard')}
              className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] flex items-center justify-center transition-colors text-white shrink-0"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              {isEn ? "Profile & Settings" : "Profil & Ayarlar"}
            </h1>
          </div>
          <p className="text-[var(--on-surface-variant)] text-sm sm:text-base ml-[56px]">
            {isEn 
              ? "Manage your credentials, physical stats, and financial preferences." 
              : "Kimlik bilgilerinizi, fiziksel verilerinizi ve finansal ayarlarınızı yönetin."}
          </p>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Kişisel Bilgiler Card */}
            <div className="bg-[var(--surface-container-low)] border border-[var(--outline)] rounded-xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-6">
                {isEn ? "Personal Information" : "Kişisel Bilgiler"}
              </h3>
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-full border border-[var(--primary)] bg-[rgba(74,222,128,0.05)] flex items-center justify-center text-[var(--primary)] mb-4 shadow-[0_0_20px_rgba(74,222,128,0.15)]">
                  <User size={40} />
                </div>
                <h2 className="text-xl font-bold text-white">{initialUser.name || initialUser.email?.split('@')[0]}</h2>
                <p className="text-sm text-[var(--on-surface-variant)]">{initialUser.email}</p>
                <button 
                  onClick={() => setActiveSheet('email')}
                  className="mt-6 w-full py-2.5 rounded-md border border-[var(--outline)] text-[var(--primary)] font-bold text-xs tracking-wider uppercase hover:bg-[rgba(255,255,255,0.03)] transition-colors"
                >
                  {isEn ? "Edit Profile" : "Profili Düzenle"}
                </button>
              </div>
            </div>

            {/* Finans Yönetimi Card */}
            <div className="bg-[var(--surface-container-low)] border border-[var(--primary)]/20 rounded-xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-[var(--primary)]/10 blur-3xl rounded-full pointer-events-none"></div>
              
              <div className="flex justify-between items-center mb-6 relative z-10">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  {isEn ? "Finance Management" : "Finans Yönetimi"}
                </h3>
                <Star size={16} className="text-[var(--primary)]" />
              </div>
              
              <div className="flex flex-col gap-2 relative z-10">
                <button onClick={() => setActiveSheet('manageAccounts')} className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-container)] hover:bg-[#27272a] transition-colors group">
                  <div className="flex flex-col text-left">
                    <span className="text-white font-bold text-sm group-hover:text-[var(--primary)] transition-colors">
                      {isEn ? "Account Management" : "Hesap Yönetimi"}
                    </span>
                    <span className="text-xs text-[var(--on-surface-variant)]">
                      {isEn ? "Bank and cash accounts" : "Banka ve nakit"}
                    </span>
                  </div>
                  <ArrowRight size={16} className="text-[var(--on-surface-variant)] group-hover:text-white transition-colors" />
                </button>
                <button onClick={() => setActiveSheet('subscriptions')} className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-container)] hover:bg-[#27272a] transition-colors group">
                  <div className="flex flex-col text-left">
                    <span className="text-white font-bold text-sm group-hover:text-[var(--primary)] transition-colors">
                      {isEn ? "Subscription Management" : "Abonelik Yönetimi"}
                    </span>
                    <span className="text-xs text-[var(--on-surface-variant)]">
                      {isEn ? "Recurring bills" : "Aylık kesintiler"}
                    </span>
                  </div>
                  <ArrowRight size={16} className="text-[var(--on-surface-variant)] group-hover:text-white transition-colors" />
                </button>
                <button onClick={() => setActiveSheet('debts')} className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-container)] hover:bg-[#27272a] transition-colors group">
                  <div className="flex flex-col text-left">
                    <span className="text-white font-bold text-sm group-hover:text-[var(--primary)] transition-colors">
                      {isEn ? "Debt Management" : "Borç Yönetimi"}
                    </span>
                    <span className="text-xs text-[var(--on-surface-variant)]">
                      {isEn ? "Payables & Receivables list" : "Verecek/Alacak listesi"}
                    </span>
                  </div>
                  <ArrowRight size={16} className="text-[var(--on-surface-variant)] group-hover:text-white transition-colors" />
                </button>
                <button onClick={() => setActiveSheet('markets')} className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-container)] hover:bg-[#27272a] transition-colors group">
                  <div className="flex flex-col text-left">
                    <span className="text-white font-bold text-sm group-hover:text-[var(--primary)] transition-colors">
                      {isEn ? "Active Markets & Stock Settings" : "Piyasa & Borsa Tercihleri"}
                    </span>
                    <span className="text-xs text-[var(--on-surface-variant)]">
                      {isEn ? "BIST, US Stocks & Crypto selection" : "BIST, ABD ve Kripto seçimi"}
                    </span>
                  </div>
                  <ArrowRight size={16} className="text-[var(--on-surface-variant)] group-hover:text-white transition-colors" />
                </button>
              </div>
            </div>

          </div>

          {/* Right Column */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Prayer Times Card - Only for authorized account */}
            {initialUser?.email?.toLowerCase() === 'gkhkaya0000@gmail.com' && (
              <PrayerView />
            )}

            {/* Fiziksel Veriler Card */}
            <div className="bg-[var(--surface-container-low)] border border-[var(--outline)] rounded-xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-6">
                {isEn ? "Physical Data" : "Fiziksel Veriler"}
              </h3>
              
              <div className="flex flex-wrap items-center gap-8 md:gap-16 pb-2">
                {/* Age */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-[var(--on-surface-variant)] uppercase tracking-widest">
                    {isEn ? "AGE" : "YAŞ"}
                  </span>
                  <div className="text-3xl font-extrabold text-white">{initialUser.age || '-'}</div>
                </div>
                
                {/* Height Placeholder */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-[var(--on-surface-variant)] uppercase tracking-widest">
                    {isEn ? "HEIGHT" : "BOY"}
                  </span>
                  <div className="text-3xl font-extrabold text-white">
                    {initialUser.height_cm || '-'}<span className="text-base text-white/50 font-medium ml-1">cm</span>
                  </div>
                </div>

                {/* Weight */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-[var(--on-surface-variant)] uppercase tracking-widest">
                    {isEn ? "CURRENT WEIGHT" : "GÜNCEL KİLO"}
                  </span>
                  <div className="text-3xl font-extrabold text-[var(--primary)]">
                    {initialUser.current_weight_kg || '-'}
                    <span className="text-base text-[var(--primary)]/70 font-medium ml-1">kg</span>
                  </div>
                </div>

                {/* Target Weight Placeholder */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-[var(--on-surface-variant)] uppercase tracking-widest">
                    {isEn ? "TARGET WEIGHT" : "HEDEF KİLO"}
                  </span>
                  <div className="flex flex-col">
                    <div className="text-3xl font-extrabold text-white">
                      {initialUser.target_weight_kg || '-'}<span className="text-base text-white/50 font-medium ml-1">kg</span>
                    </div>
                    {initialUser.target_weight_date && (
                      <span className="text-[10px] text-[var(--on-surface-variant)] mt-1">
                        {isEn ? "Target: " : "Hedef: "}
                        {new Date(initialUser.target_weight_date).toLocaleDateString(isEn ? 'en-US' : 'tr-TR')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Antrenman Programım Card */}
            <div className="bg-[var(--surface-container-low)] border border-[var(--outline)] rounded-xl p-6 shadow-xl flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Dumbbell className="text-[var(--primary)]" size={20} />
                  <h3 className="text-lg font-bold text-white">
                    {isEn ? "Workout Routine" : "Antrenman Programım"}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadTemplate}
                    className="p-1.5 rounded-lg border border-[var(--on-surface-variant)] text-[var(--on-surface-variant)] hover:text-white hover:border-white transition-colors"
                    title={isEn ? "Download Sample Template" : "Örnek Şablon İndir"}
                  >
                    <Download size={14} />
                  </button>
                  <button
                    onClick={() => setActiveSheet('pasteWorkoutJson')}
                    className="p-1.5 rounded-lg border border-[var(--on-surface-variant)] text-[var(--on-surface-variant)] hover:text-white hover:border-white transition-colors"
                    title={isEn ? "Paste from Code" : "Koddan Yapıştır"}
                  >
                    <Edit2 size={14} />
                  </button>
                  <label className="p-1.5 rounded-lg border border-[var(--on-surface-variant)] text-[var(--on-surface-variant)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors cursor-pointer" title={isEn ? "Import JSON" : "JSON İçeri Aktar"}>
                    <Upload size={14} />
                    <input type="file" accept=".json" className="hidden" onChange={handleImportJSON} />
                  </label>
                  <button
                    onClick={() => { setSelectedWorkoutDay(null); setActiveSheet('manageWorkoutRoutine'); }}
                    className="px-3.5 py-1.5 rounded-lg border border-[var(--primary)] text-[var(--primary)] font-bold text-xs hover:bg-[var(--primary)] hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <Plus size={14} /> {isEn ? "+ Add Day / Split" : "+ Gün / Program Ekle"}
                  </button>
                </div>
              </div>

              {workoutDays.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-6 border border-dashed border-[rgba(255,255,255,0.1)] rounded-xl gap-3 text-center bg-[rgba(255,255,255,0.01)]">
                  <Dumbbell size={32} className="text-[var(--on-surface-variant)] opacity-40" />
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-white">
                      {isEn ? "No workout routine added yet" : "Henüz antrenman programı girilmedi"}
                    </span>
                    <span className="text-xs text-[var(--on-surface-variant)]">
                      {isEn 
                        ? "Manage your workout days (e.g. Monday, Push Day) and exercise sets here." 
                        : "Günlerinizi (Pazartesi, Bacak Günü vb.) ve hareketlerin set sayılarını buradan kaydedip yönetebilirsiniz."}
                    </span>
                  </div>
                  <button
                    onClick={() => { setSelectedWorkoutDay(null); setActiveSheet('manageWorkoutRoutine'); }}
                    className="mt-1 px-4 py-2 bg-[var(--primary)] text-white font-bold text-xs rounded-lg hover:bg-[var(--primary-hover)] transition-all"
                  >
                    {isEn ? "+ Add Workout Routine" : "+ Antrenman Programı Ekle"}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {workoutDays.map((day) => {
                    const isExpanded = expandedWorkoutDays.includes(day.id);
                    const totalSets = (day.exercises || []).reduce((acc: number, ex: any) => acc + (Number(ex.sets) || 0), 0);

                    return (
                      <div key={day.id} className="flex flex-col bg-[var(--surface-container)] border border-[rgba(255,255,255,0.06)] rounded-xl overflow-hidden hover:border-[rgba(255,255,255,0.12)] transition-all">
                        {/* Day Header */}
                        <div
                          className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-[rgba(255,255,255,0.03)] transition-colors"
                          onClick={() => toggleWorkoutDay(day.id)}
                        >
                          <div className="flex flex-col min-w-0 pr-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white truncate">{day.day_name}</span>
                              {isExpanded ? <ChevronUp size={16} className="text-[var(--on-surface-variant)]" /> : <ChevronDown size={16} className="text-[var(--on-surface-variant)]" />}
                            </div>
                            <span className="text-xs text-[var(--on-surface-variant)] mt-0.5">
                              {day.exercises?.length || 0} {isEn ? "Exercises" : "Hareket"} — <strong className="text-emerald-400">{totalSets} {isEn ? "Total Sets" : "Toplam Set"}</strong>
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedWorkoutDay(day);
                                setActiveSheet('manageWorkoutRoutine');
                              }}
                              className="p-1.5 text-[var(--on-surface-variant)] hover:text-white hover:bg-[rgba(255,255,255,0.08)] rounded-lg transition-colors"
                              title={isEn ? "Edit Day" : "Günü Düzenle"}
                            >
                              <Edit2 size={15} />
                            </button>
                          </div>
                        </div>

                        {/* Expanded Exercises */}
                        {isExpanded && day.exercises && day.exercises.length > 0 && (
                          <div className="flex flex-col border-t border-[rgba(255,255,255,0.06)] bg-[#12121D] p-3 gap-2">
                            <div className="flex items-center gap-1.5 px-1 pb-1 text-[10px] text-[var(--on-surface-variant)] font-medium">
                              <PlayCircle size={12} className="text-[var(--primary)]" />
                              <span>{isEn ? "Click an exercise to open video tutorial" : "Videolu yapılış anlatımını açmak için harekete tıklayın"}</span>
                            </div>
                            {day.exercises.map((ex: any, idx: number) => (
                              <a
                                key={ex.id || idx}
                                href={getExerciseVideoUrl(ex.name)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-2.5 bg-[#181826] hover:bg-[#202032] rounded-lg border border-[rgba(255,255,255,0.04)] hover:border-[var(--primary)]/40 transition-all group/ex cursor-pointer"
                                title={isEn ? `Watch video for "${ex.name}"` : `"${ex.name}" hareketinin videosunu izle`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                  <span className="w-6 h-6 rounded-md bg-[var(--primary)]/15 text-[var(--primary)] text-xs font-bold flex items-center justify-center shrink-0">
                                    {idx + 1}
                                  </span>
                                  <span className="text-xs font-semibold text-white truncate group-hover/ex:text-[var(--primary)] transition-colors">
                                    {ex.name}
                                  </span>
                                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[var(--primary)] bg-[var(--primary)]/10 px-1.5 py-0.5 rounded opacity-75 group-hover/ex:opacity-100 transition-opacity shrink-0">
                                    <PlayCircle size={11} /> Video
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                    {ex.sets} {isEn ? "Set" : "Set"} {ex.reps ? `x ${ex.reps}` : ''}
                                  </span>
                                  {ex.weight_kg ? (
                                    <span className="text-[11px] text-[var(--on-surface-variant)] font-medium">
                                      ({ex.weight_kg} kg)
                                    </span>
                                  ) : null}
                                  <ExternalLink size={13} className="text-[var(--on-surface-variant)] group-hover/ex:text-white transition-colors ml-0.5" />
                                </div>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Hedefler & Tercihler Card */}
            <div className="bg-[var(--surface-container-low)] border border-[var(--outline)] rounded-xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-4">
                {isEn ? "Data Updates & Preferences" : "Veri Güncelleme & Tercihler"}
              </h3>
              
              <div className="flex flex-col">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 border-b border-[var(--outline)] gap-4 sm:gap-0">
                  <div className="flex flex-col">
                    <span className="text-white font-medium">
                      {isEn ? "Weight Information" : "Kilo Bilgisi"}
                    </span>
                    <span className="text-sm text-[var(--on-surface-variant)]">
                      {isEn ? "Update your current weight" : "Güncel kilonuzu değiştirin"}
                    </span>
                  </div>
                  <button onClick={() => setActiveSheet('weight')} className="px-5 py-2 rounded-md border border-[var(--outline)] text-[var(--primary)] font-bold text-sm bg-[var(--background)] hover:bg-[#27272a] transition-colors min-w-[120px] flex justify-center">
                    {initialUser.current_weight_kg || '0'} kg
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 border-b border-[var(--outline)] gap-4 sm:gap-0">
                  <div className="flex flex-col">
                    <span className="text-white font-medium">
                      {isEn ? "Age Information" : "Yaş Bilgisi"}
                    </span>
                    <span className="text-sm text-[var(--on-surface-variant)]">
                      {isEn ? "Required for calorie goals" : "Hedefler için gerekli"}
                    </span>
                  </div>
                  <button onClick={() => setActiveSheet('age')} className="px-5 py-2 rounded-md border border-[var(--outline)] text-white font-bold text-sm bg-[var(--background)] hover:bg-[#27272a] transition-colors min-w-[120px] flex justify-center">
                    {initialUser.age || '0'} {isEn ? "Years old" : "Yaş"}
                  </button>
                </div>
              </div>
            </div>

            {/* Hesap ve Güvenlik Card */}
            <div className="bg-[var(--surface-container-low)] border border-[var(--outline)] rounded-xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-4">
                {isEn ? "Account & Security" : "Hesap ve Güvenlik"}
              </h3>
              
              <div className="flex flex-col gap-2">
                <button onClick={() => setActiveSheet('username')} className="flex items-center justify-between p-4 bg-[var(--surface-container)] hover:bg-[#27272a] rounded-lg transition-colors group border border-transparent hover:border-[var(--outline)]">
                  <div className="flex items-center gap-3">
                    <User size={18} className="text-[var(--on-surface-variant)] group-hover:text-white transition-colors" />
                    <span className="text-white text-sm font-medium">
                      {isEn ? "Change Username" : "Kullanıcı Adı Değiştir"}
                    </span>
                  </div>
                  <ChevronRight size={16} className="text-[var(--on-surface-variant)] group-hover:text-white transition-colors" />
                </button>

                <button onClick={() => setActiveSheet('password')} className="flex items-center justify-between p-4 bg-[var(--surface-container)] hover:bg-[#27272a] rounded-lg transition-colors group border border-transparent hover:border-[var(--outline)]">
                  <div className="flex items-center gap-3">
                    <Key size={18} className="text-[var(--on-surface-variant)] group-hover:text-white transition-colors" />
                    <span className="text-white text-sm font-medium">
                      {isEn ? "Change Password" : "Şifre Değiştir"}
                    </span>
                  </div>
                  <ChevronRight size={16} className="text-[var(--on-surface-variant)] group-hover:text-white transition-colors" />
                </button>

                <button onClick={() => setActiveSheet('email')} className="flex items-center justify-between p-4 bg-[var(--surface-container)] hover:bg-[#27272a] rounded-lg transition-colors group border border-transparent hover:border-[var(--outline)]">
                  <div className="flex items-center gap-3">
                    <Mail size={18} className="text-[var(--on-surface-variant)] group-hover:text-white transition-colors" />
                    <span className="text-white text-sm font-medium">
                      {isEn ? "Change Email" : "E-posta Değiştir"}
                    </span>
                  </div>
                  <ChevronRight size={16} className="text-[var(--on-surface-variant)] group-hover:text-white transition-colors" />
                </button>
              </div>
            </div>

            {/* Diğer Card */}
            <div className="bg-[var(--surface-container-low)] border border-[var(--outline)] rounded-xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-4">
                {isEn ? "Other" : "Diğer"}
              </h3>
              
              <div className="flex flex-col gap-2">
                <button onClick={() => router.push('/dashboard?tour=1')} className="flex items-center justify-between p-4 bg-[var(--surface-container)] hover:bg-[#27272a] rounded-lg transition-colors group border border-transparent hover:border-[var(--outline)]">
                  <div className="flex items-center gap-3">
                    <HelpCircle size={18} className="text-[var(--primary)] group-hover:text-white transition-colors" />
                    <span className="text-white text-sm font-medium">
                      {isEn ? "Start App Tour" : "Uygulama Tanıtım Turunu Başlat"}
                    </span>
                  </div>
                  <ChevronRight size={16} className="text-[var(--on-surface-variant)] group-hover:text-white transition-colors" />
                </button>

                <button onClick={() => router.push('/profile/about')} className="flex items-center justify-between p-4 bg-[var(--surface-container)] hover:bg-[#27272a] rounded-lg transition-colors group border border-transparent hover:border-[var(--outline)]">
                  <div className="flex items-center gap-3">
                    <Info size={18} className="text-[var(--on-surface-variant)] group-hover:text-white transition-colors" />
                    <span className="text-white text-sm font-medium">
                      {isEn ? "About App" : "Uygulama Hakkında"}
                    </span>
                  </div>
                  <ChevronRight size={16} className="text-[var(--on-surface-variant)] group-hover:text-white transition-colors" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      <BottomSheet isOpen={!!activeSheet} onClose={() => setActiveSheet(null)} title={getSheetTitle()}>
        {renderSheetContent()}
      </BottomSheet>

      <BottomSheet isOpen={activeSheet === 'pasteWorkoutJson'} onClose={() => setActiveSheet(null)} title={isEn ? "Add Routine via JSON" : "JSON ile Program Ekle"}>
        <div className="flex flex-col gap-4">
          <p className="text-sm text-[var(--on-surface-variant)]">
            {isEn 
              ? "You can paste the workout routine in the app format here." 
              : "Buraya uygulamanın kullandığı formattaki antrenman JSON kodunu yapıştırabilirsiniz."}
          </p>
          <textarea
            className="w-full h-48 bg-[#1A1A26] border border-[rgba(255,255,255,0.1)] rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[var(--primary)] font-mono resize-y"
            placeholder="[{ &quot;day_name&quot;: &quot;...&quot;, &quot;exercises&quot;: [...] }]"
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
          />
          <button
            onClick={handlePasteJSONSubmit}
            disabled={!jsonText.trim()}
            className="w-full py-3 bg-[var(--primary)] text-white rounded-xl font-bold text-sm hover:bg-[var(--primary-hover)] transition-all disabled:opacity-50"
          >
            {isEn ? "Save JSON" : "JSON Kaydet"}
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
