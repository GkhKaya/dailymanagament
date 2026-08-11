"use client";

import React, { useState, FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Alert } from "@/lib/alerts";
import { updateUsernameAction } from "@/actions/profile";

export function UpdateUsernameForm({ 
  onClose, 
  onSuccess, 
  initialUsername 
}: { 
  onClose: () => void;
  onSuccess: () => void;
  initialUsername: string;
}) {
  const [username, setUsername] = useState(initialUsername || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      Alert.error("Kullanıcı adı boş bırakılamaz.");
      return;
    }

    setLoading(true);
    try {
      const res = await updateUsernameAction(username);
      if (res.success) {
        Alert.success("Kullanıcı adı başarıyla güncellendi.");
        onSuccess();
      } else {
        Alert.error(res.error || "Güncelleme başarısız.");
      }
    } catch (err: any) {
      Alert.error(err.message || "Beklenmedik bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-[var(--space-3)] pt-[var(--space-2)]">
      <TextInput
        id="username"
        type="text"
        label="Yeni Kullanıcı Adı"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />

      <div className="flex gap-[var(--space-2)] mt-[var(--space-2)]">
        <Button type="button" onClick={onClose} className="flex-1 bg-transparent border border-[var(--outline)] text-white">
          İptal
        </Button>
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading ? "Kaydediliyor..." : "Kaydet"}
        </Button>
      </div>
    </form>
  );
}
