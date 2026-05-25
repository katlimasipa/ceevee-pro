import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AuthShell, Field } from "./login";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
  head: () => ({ meta: [{ title: "Create account — CeeVeeForYou" }] }),
});

function SignupPage() {
  const nav = useNavigate();
  const { user } = useAuth();
  useEffect(() => {
    if (user) nav({ to: "/dashboard", replace: true });
  }, [user, nav]);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName }, emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) { setBusy(false); return toast.error(error.message); }
    // Auto-confirm is on — try sign-in immediately
    const { error: signErr } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (signErr) return toast.error(signErr.message);
    nav({ to: "/dashboard" });
  }

  return <AuthShell title="Start free." sub="No verification. No friction.">
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Full name"><input className="ipt" required value={fullName} onChange={(e) => setFullName(e.target.value)} /></Field>
      <Field label="Email"><input className="ipt" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
      <Field label="Password"><input className="ipt" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
      <button disabled={busy} className="btn-primary w-full">{busy ? "Creating…" : "Create account"}</button>
      <p className="text-center text-sm text-muted-foreground">Have an account? <Link to="/login" className="text-foreground underline">Sign in</Link></p>
    </form>
  </AuthShell>;
}
