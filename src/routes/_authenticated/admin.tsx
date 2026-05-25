import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/admin")({
  component: Admin,
  head: () => ({ meta: [{ title: "Admin — CeeVeeForYou" }] }),
});

function Admin() {
  const { user } = useAuth();
  const { data: role } = useQuery({
    queryKey: ["role", user?.id], enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user!.id).eq("role", "admin").maybeSingle();
      return data?.role ?? null;
    },
  });
  const isAdmin = role === "admin";

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"], enabled: isAdmin,
    queryFn: async () => {
      const [{ count: users }, { count: cvs }, { data: events }] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("cvs").select("*", { count: "exact", head: true }),
        supabase.from("cv_events").select("event_type, created_at").order("created_at", { ascending: false }).limit(500),
      ]);
      const downloads = events?.filter((e: any) => e.event_type === "download").length ?? 0;
      const creates = events?.filter((e: any) => e.event_type === "create").length ?? 0;
      return { users: users ?? 0, cvs: cvs ?? 0, downloads, creates };
    },
  });

  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-20 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">Restricted</p>
        <h1 className="mt-3 font-display text-5xl">Admin only.</h1>
        <p className="mt-3 text-sm text-muted-foreground">You don't have access to this page.</p>
        <Link to="/dashboard" className="mt-6 inline-block underline">Back to dashboard</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">Usage analytics</p>
      <h1 className="mt-2 font-display text-5xl">Admin.</h1>
      <div className="mt-10 grid gap-px bg-border sm:grid-cols-4">
        {[
          ["Total users", stats?.users],
          ["CVs created", stats?.cvs],
          ["AI / build events", stats?.creates],
          ["PDF downloads", stats?.downloads],
        ].map(([l, v]) => (
          <div key={l as string} className="bg-card p-8">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{l}</div>
            <div className="mt-2 font-display text-5xl">{v ?? "—"}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
