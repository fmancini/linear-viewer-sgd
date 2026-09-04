import { redirect } from "next/navigation";
import { getAuthorizedSession, isAuthConfigured } from "@/lib/auth";
import { AuthButton } from "@/components/AuthButton";
import { ThemeToggle } from "@/components/ThemeToggle";

export const dynamic = "force-dynamic";

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await getAuthorizedSession()) redirect("/");
  const { error } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <section className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h1 className="text-xl font-bold text-foreground">Acceso al tablero</h1>
          <ThemeToggle />
        </div>
        <p className="text-sm text-muted mb-6">
          Inicia sesión con tu cuenta de Google autorizada para consultar el proyecto.
        </p>
        {error && (
          <p role="alert" className="text-sm text-muted mb-6">
            No se pudo autorizar el acceso. Usa una cuenta permitida o contacta al administrador.
          </p>
        )}
        {isAuthConfigured() ? (
          <AuthButton action="login" />
        ) : (
          <p role="alert" className="text-sm text-muted">
            El acceso todavía no está configurado. Contacta al administrador.
          </p>
        )}
      </section>
    </main>
  );
}
