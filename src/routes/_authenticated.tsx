import { createFileRoute, Outlet, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useEffect } from "react";

export const Route = createFileRoute("/_authenticated")({
  component: AuthGate,
});

function AuthGate() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [loading, user, nav]);
  if (loading) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading…</div>;
  }
  if (!user) return null;
  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Outlet />
    </div>
  );
}

function TopBar() {
  const { user, signOut } = useAuth();
  return (
    <header className="border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/dashboard" className="font-display text-xl">CeeVee<span className="italic">For</span>You</Link>
        <div className="flex items-center gap-4 text-sm">
          <span className="hidden text-muted-foreground sm:inline">{user?.email}</span>
          <button onClick={signOut} className="rounded-sm border border-border px-3 py-1.5 text-sm hover:bg-accent">Sign out</button>
        </div>
      </div>
    </header>
  );
}
