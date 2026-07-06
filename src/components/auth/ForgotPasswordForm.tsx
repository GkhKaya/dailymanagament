"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { t } from "@/lib/i18n";
import { useForgotPasswordViewModel } from "@/viewmodels/useForgotPasswordViewModel";

export function ForgotPasswordForm() {
  const {
    email,
    setEmail,
    handleResetPassword,
  } = useForgotPasswordViewModel();

  return (
    <form onSubmit={handleResetPassword}>
      <p className="text-body text-[var(--on-surface-variant)] mb-8">
        {t("auth.forgotPasswordSubtitle")}
      </p>

      <TextInput
        id="email"
        type="email"
        label={t("auth.emailPlaceholder")}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="mb-8"
      />

      <Button type="submit" withArrow>
        {t("auth.resetPasswordButton")}
      </Button>

      {/* Giriş Ekranına Dön */}
      <div style={{ marginTop: 28, textAlign: "center" }}>
        <Link
          href="/"
          className="text-body"
          style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 500 }}
        >
          &larr; {t("auth.backToLogin")}
        </Link>
      </div>
    </form>
  );
}
