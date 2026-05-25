import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Sign in — CeeVeeForYou" }] }),
});

function LoginPage() {
  const nav = useNavigate();
  const { user } = useAuth();
  useEffect(() => {
    if (user) nav({ to: "/dashboard", replace: true });
  }, [user, nav]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    nav({ to: "/dashboard" });
  }

  return <AuthShell title="Welcome back." sub="Sign in to continue building.">
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Email"><input className="ipt" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
      <Field label="Password"><input className="ipt" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
      <button disabled={busy} className="btn-primary w-full">{busy ? "Signing in…" : "Sign in"}</button>
      <p className="text-center text-sm text-muted-foreground">No account? <Link to="/signup" className="text-foreground underline">Create one</Link></p>
    </form>
  </AuthShell>;
}

export function AuthShell({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden lg:block bg-foreground text-background p-12 relative overflow-hidden">
        <Link to="/" className="font-display text-2xl">CeeVeeForYou</Link>
        <div className="absolute inset-x-12 bottom-12">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] opacity-70">Built for success</p>
          <h2 className="mt-4 font-display text-5xl leading-tight">A résumé that<br/><span className="italic opacity-80">reads beautifully.</span></h2>
        </div>
      </div>
      <div className="flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="font-display text-xl lg:hidden">CeeVeeForYou</Link>
          <h1 className="mt-10 font-display text-4xl lg:mt-0">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{sub}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
      <style>{`
        .ipt { width: 100%; padding: 10px 12px; border: 1px solid var(--color-border); background: var(--color-paper); font-size: 14px; outline: none; }
        .ipt:focus { border-color: var(--color-foreground); }
        .btn-primary { background: var(--color-foreground); color: var(--color-background); padding: 11px 16px; font-size: 14px; font-weight: 500; transition: opacity .15s; }
        .btn-primary:hover { opacity: .9; }
        .btn-primary:disabled { opacity: .5; }
      `}</style>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
