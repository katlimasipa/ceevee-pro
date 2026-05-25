import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { blankCV } from "@/lib/cv-types";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard — CeeVeeForYou" }] }),
});

function Dashboard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const nav = useNavigate();

  const { data: cvs = [], isLoading } = useQuery({
    queryKey: ["cvs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cvs").select("id, title, updated_at, personal_info")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const base = blankCV();
      const { data, error } = await supabase
        .from("cvs")
        .insert({ user_id: user!.id, title: base.title, personal_info: base.personal_info as any, summary: base.summary, education: base.education as any, experience: base.experience as any, skills: base.skills as any, settings: base.settings as any })
        .select("id").single();
      if (error) throw error;
      await supabase.from("cv_events").insert({ user_id: user!.id, cv_id: data.id, event_type: "create" });
      return data.id;
    },
    onSuccess: (id) => { qc.invalidateQueries({ queryKey: ["cvs"] }); nav({ to: "/cv/$id", params: { id } }); },
    onError: (e: any) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cvs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cvs"] }),
  });

  const dupMut = useMutation({
    mutationFn: async (id: string) => {
      const { data: orig, error } = await supabase.from("cvs").select("*").eq("id", id).single();
      if (error) throw error;
      const { id: _i, created_at, updated_at, ...rest } = orig as any;
      const { data: created, error: ce } = await supabase.from("cvs").insert({ ...rest, title: `${orig.title} (copy)` }).select("id").single();
      if (ce) throw ce;
      return created.id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cvs"] }),
  });

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">Your résumés</p>
          <h1 className="mt-2 font-display text-5xl">Dashboard.</h1>
        </div>
        <button onClick={() => createMut.mutate()} disabled={createMut.isPending} className="rounded-sm bg-foreground px-5 py-2.5 text-sm font-medium text-background">
          {createMut.isPending ? "Creating…" : "+ New CV"}
        </button>
      </div>

      <div className="mt-10">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : cvs.length === 0 ? (
          <div className="rounded-sm border border-dashed border-border p-16 text-center">
            <p className="font-display text-3xl">No CVs yet.</p>
            <p className="mt-2 text-sm text-muted-foreground">Create your first résumé to get started.</p>
            <button onClick={() => createMut.mutate()} className="mt-6 rounded-sm bg-foreground px-5 py-2.5 text-sm text-background">Create my first CV</button>
          </div>
        ) : (
          <ul className="divide-y divide-border border-y border-border">
            {cvs.map((cv: any) => (
              <li key={cv.id} className="flex flex-wrap items-center justify-between gap-3 py-5">
                <div>
                  <Link to="/cv/$id" params={{ id: cv.id }} className="font-display text-2xl hover:underline">{cv.title}</Link>
                  <p className="text-xs text-muted-foreground">{cv.personal_info?.fullName || "Untitled"} · Updated {new Date(cv.updated_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2 text-sm">
                  <Link to="/cv/$id" params={{ id: cv.id }} className="rounded-sm border border-border px-3 py-1.5 hover:bg-accent">Edit</Link>
                  <button onClick={() => dupMut.mutate(cv.id)} className="rounded-sm border border-border px-3 py-1.5 hover:bg-accent">Duplicate</button>
                  <button onClick={() => confirm("Delete this CV?") && delMut.mutate(cv.id)} className="rounded-sm border border-border px-3 py-1.5 text-destructive hover:bg-accent">Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
