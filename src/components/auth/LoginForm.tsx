"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { Checkbox } from "@/components/ui/Checkbox";
import { t } from "@/lib/i18n";
import { useLoginViewModel } from "@/viewmodels/useLoginViewModel";

export function LoginForm() {
  const {
    email,
    setEmail,
    password,
    setPassword,
    rememberMe,
    setRememberMe,
    handleLogin,
    loading,
    error,
  } = useLoginViewModel();

  return (
    <form onSubmit={handleLogin}>
      <TextInput
        id="email"
        type="email"
        label={t("auth.emailPlaceholder")}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <TextInput
        id="password"
        type="password"
        label={t("auth.passwordPlaceholder")}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      {/* Beni hatırla + Şifremi Unuttum */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 28,
        }}
      >
        <Checkbox
          id="remember"
          label={t("auth.rememberMe")}
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
        />
        <Link
          href="/forgot-password"
          className="text-caption"
          style={{ color: "var(--primary)", textDecoration: "none" }}
        >
          {t("auth.forgotPassword")}
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
          {error}
        </div>
      )}

      <Button type="submit" withArrow disabled={loading}>
        {loading ? "Giriş yapılıyor..." : t("auth.login")}
      </Button>

      {/* Hesabınız yok mu? */}
      <div style={{ marginTop: 28, textAlign: "center" }}>
        <span className="text-body" style={{ color: "var(--on-surface-variant)" }}>
          {t("auth.noAccount")}{" "}
        </span>
        <Link
          href="/register"
          className="text-body"
          style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 500 }}
        >
          {t("auth.signUp")}
        </Link>
      </div>
    </form>
  );
}
