"use client";

import { signIn, signOut } from "next-auth/react";
import { useState } from "react";

export function AuthButton({ action }: { action: "login" | "logout" }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  async function handleClick() {
    setPending(true);
    setError(false);
    try {
      if (action === "login") await signIn("google", { callbackUrl: "/" });
      else await signOut({ callbackUrl: "/login" });
    } catch {
      setError(true);
      setPending(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="text-sm font-medium px-4 py-2 rounded-lg border border-border bg-card text-foreground hover:bg-surface focus-visible:outline-2 focus-visible:outline-indigo-500 disabled:opacity-50 cursor-pointer"
      >
        {pending ? "Procesando…" : action === "login" ? "Iniciar sesión con Google" : "Cerrar sesión"}
      </button>
      {error && <p role="alert" className="mt-2 text-sm text-muted">No se pudo completar la operación. Intenta de nuevo.</p>}
    </div>
  );
}
