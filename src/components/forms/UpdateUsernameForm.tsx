"use client";

import React, { useState, FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Alert } from "@/lib/alerts";
import { updateUsernameAction } from "@/actions/profile";
import { useTranslation } from "@/hooks/useTranslation";

export function UpdateUsernameForm({ 
  onClose, 
  onSuccess, 
  initialUsername 
}: { 
  onClose: () => void; 
  onSuccess: () => void; 
  initialUsername: string; 
}) {
  const { locale, isAbroad } = useTranslation();
  const isEn = isAbroad || locale === 'en';

  const [username, setUsername] = useState(initialUsername || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      Alert.error(isEn ? "Username cannot be empty." : "Kullanıcı adı boş bırakılamaz.");
      return;
    }

    setLoading(true);
    try {
      const res = await updateUsernameAction(username);
      if (res.success) {
        Alert.success(isEn ? "Username updated successfully." : "Kullanıcı adı başarıyla güncellendi.");
        onSuccess();
      } else {
        Alert.error(res.error || (isEn ? "Update failed." : "Güncelleme başarısız."));
      }
    } catch (err: any) {
      Alert.error(err.message || (isEn ? "An unexpected error occurred." : "Beklenmedik bir hata oluştu."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-[var(--space-3)] pt-[var(--space-2)]">
      <TextInput
        id="username"
        type="text"
        label={isEn ? "New Username" : "Yeni Kullanıcı Adı"}
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />

      <div className="flex gap-[var(--space-2)] mt-[var(--space-2)]">
        <Button type="button" onClick={onClose} className="flex-1 bg-transparent border border-[var(--outline)] text-white">
          {isEn ? "Cancel" : "İptal"}
        </Button>
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading ? (isEn ? "Saving..." : "Kaydediliyor...") : (isEn ? "Save" : "Kaydet")}
        </Button>
      </div>
    </form>
  );
}
