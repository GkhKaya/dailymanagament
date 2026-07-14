"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global Error Boundary caught:", error);
  }, [error]);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      backgroundColor: "#000",
      color: "#fff",
      padding: "20px",
      textAlign: "center"
    }}>
      <h2 style={{ fontSize: "2rem", marginBottom: "1rem", color: "#ef4444" }}>
        Oops, bir şeyler ters gitti!
      </h2>
      <p style={{ marginBottom: "2rem", color: "var(--on-surface-variant)" }}>
        Beklenmedik bir sistem hatası oluştu. Lütfen sayfayı yenileyin veya tekrar deneyin.
      </p>
      <Button onClick={() => reset()} withArrow>
        Yeniden Dene
      </Button>
    </div>
  );
}
