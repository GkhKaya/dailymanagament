"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { useResetPasswordViewModel } from "@/viewmodels/useResetPasswordViewModel";

function ResetPasswordFormContent() {
  const {
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    handleResetPassword,
    loading,
    success,
    hasToken,
  } = useResetPasswordViewModel();

  if (!hasToken) {
    return (
      <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
        Geçersiz şifre sıfırlama bağlantısı. Lütfen e-postanızdaki bağlantıyı kontrol edin veya yeniden şifre sıfırlama talebinde bulunun.
      </div>
    );
  }

  return (
    <form onSubmit={handleResetPassword}>
      <p className="text-body text-[var(--on-surface-variant)] mb-8">
        Lütfen yeni şifrenizi belirleyin.
      </p>

      <TextInput
        id="password"
        type="password"
        label="Yeni Şifre"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="mb-4"
      />

      <TextInput
        id="confirmPassword"
        type="password"
        label="Yeni Şifre (Tekrar)"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        className="mb-8"
      />

      

      {success && (
        <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 text-sm">
          Şifreniz başarıyla güncellendi. Giriş ekranına yönlendiriliyorsunuz...
        </div>
      )}

      <Button type="submit" withArrow disabled={loading || success}>
        {loading ? "Kaydediliyor..." : "Şifreyi Kaydet"}
      </Button>

      {/* Giriş Ekranına Dön */}
      <div style={{ marginTop: 28, textAlign: "center" }}>
        <Link
          href="/"
          className="text-body"
          style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 500 }}
        >
          &larr; Giriş Ekranına Dön
        </Link>
      </div>
    </form>
  );
}

export function ResetPasswordForm() {
  return (
    <Suspense fallback={<div className="text-white">Yükleniyor...</div>}>
      <ResetPasswordFormContent />
    </Suspense>
  );
}
