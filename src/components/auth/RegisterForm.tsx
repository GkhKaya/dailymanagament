"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { t } from "@/lib/i18n";
import { useRegisterViewModel } from "@/viewmodels/useRegisterViewModel";

export function RegisterForm() {
  const {
    email,
    setEmail,
    password,
    setPassword,
    username,
    setUsername,
    age,
    setAge,
    handleRegister,
    loading,
  } = useRegisterViewModel();

  return (
    <form onSubmit={handleRegister}>
      <TextInput
        id="username"
        type="text"
        label={t("auth.usernamePlaceholder")}
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />

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

      <TextInput
        id="age"
        type="number"
        label={t("auth.agePlaceholder")}
        value={age}
        onChange={(e) => setAge(e.target.value)}
        required
      />

      <Button type="submit" withArrow className="mt-8" disabled={loading}>
        {loading ? "Kayıt olunuyor..." : t("auth.registerTitle")}
      </Button>

      {/* Zaten hesabınız var mı? */}
      <div style={{ marginTop: 28, textAlign: "center" }}>
        <span className="text-body" style={{ color: "var(--on-surface-variant)" }}>
          {t("auth.hasAccount")}{" "}
        </span>
        <Link
          href="/"
          className="text-body"
          style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 500 }}
        >
          {t("auth.signIn")}
        </Link>
      </div>
    </form>
  );
}
