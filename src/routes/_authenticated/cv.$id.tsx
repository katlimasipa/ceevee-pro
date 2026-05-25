import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { CVDocument } from "@/components/CVDocument";
import { camelFileName, type CVData, type ExperienceItem, type EducationItem } from "@/lib/cv-types";
import { generateSummary, generateBullets } from "@/lib/ai.functions";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/cv/$id")({
  component: CVBuilder,
  head: () => ({ meta: [{ title: "Edit CV — CeeVeeForYou" }] }),
});

function CVBuilder() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [cv, setCv] = useState<CVData | null>(null);
  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("idle");
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const aiSummary = useServerFn(generateSummary);
  const aiBullets = useServerFn(generateBullets);

  // Load
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data, error } = await supabase.from("cvs").select("*").eq("id", id).single();
      if (error) { toast.error(error.message); nav({ to: "/dashboard" }); return; }
      if (!alive) return;
      setCv({
        id: data.id,
        title: data.title,
        personal_info: (data.personal_info as any) ?? {},
        summary: data.summary ?? "",
        education: (data.education as any) ?? [],
        experience: (data.experience as any) ?? [],
        skills: (data.skills as any) ?? [],
        settings: (data.settings as any) ?? { showDates: false, onePage: true },
      });
    })();
    return () => { alive = false; };
  }, [id, nav]);

  // Autosave (debounced)
  useEffect(() => {
    if (!cv) return;
    setSaving("saving");
    const t = setTimeout(async () => {
      const { error } = await supabase.from("cvs").update({
        title: cv.title,
        personal_info: cv.personal_info as any,
        summary: cv.summary,
        education: cv.education as any,
        experience: cv.experience as any,
        skills: cv.skills as any,
        settings: cv.settings as any,
      }).eq("id", id);
      if (error) toast.error(error.message);
      else setSaving("saved");
    }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(cv)]);

  const update = <K extends keyof CVData>(k: K, v: CVData[K]) => setCv((c) => c && ({ ...c, [k]: v }));

  const downloadPdf = async () => {
    if (!cv) return;
    const filename = camelFileName(cv.personal_info.fullName, cv.personal_info.titles?.[0]);
    document.title = filename;
    try {
      if (user) await supabase.from("cv_events").insert({ user_id: user.id, cv_id: id, event_type: "download" });
    } catch {}
    window.print();
  };

  if (!cv) {
    return <div className="grid min-h-[60vh] place-items-center text-sm text-muted-foreground">Loading CV…</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <input
            value={cv.title} onChange={(e) => update("title", e.target.value)}
            className="border-b border-transparent bg-transparent font-display text-3xl outline-none focus:border-foreground sm:text-4xl"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {saving === "saving" ? "Saving…" : "All changes saved"} · One-page mode {cv.settings.onePage ? "on" : "off"}
          </p>
        </div>
        <div className="flex gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={cv.settings.showDates} onChange={(e) => update("settings", { ...cv.settings, showDates: e.target.checked })}/>
            Show dates
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={cv.settings.onePage} onChange={(e) => update("settings", { ...cv.settings, onePage: e.target.checked })}/>
            One-page
          </label>
          <button onClick={downloadPdf} className="rounded-sm bg-foreground px-4 py-2 text-sm font-medium text-background">Download PDF</button>
        </div>
      </div>

      {/* Mobile tabs */}
      <div className="mb-4 flex gap-2 lg:hidden">
        {(["edit", "preview"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 rounded-sm border px-3 py-2 text-sm ${tab === t ? "border-foreground bg-foreground text-background" : "border-border"}`}>{t === "edit" ? "Edit" : "Preview"}</button>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        {/* Editor */}
        <div className={`${tab === "preview" ? "hidden lg:block" : ""}`}>
          <Editor cv={cv} update={update} aiSummary={aiSummary} aiBullets={aiBullets} />
        </div>

        {/* Preview */}
        <div className={`${tab === "edit" ? "hidden lg:block" : ""}`}>
          <div className="sticky top-24">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Live preview · A4</div>
            <div className="mt-3 overflow-auto rounded-sm bg-accent/40 p-4 sm:p-8">
              <div className="origin-top-left scale-[0.5] sm:scale-[0.7] xl:scale-[0.85] cv-print-root">
                <CVDocument data={cv} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Editor({
  cv, update, aiSummary, aiBullets,
}: {
  cv: CVData;
  update: <K extends keyof CVData>(k: K, v: CVData[K]) => void;
  aiSummary: ReturnType<typeof useServerFn<typeof generateSummary>>;
  aiBullets: ReturnType<typeof useServerFn<typeof generateBullets>>;
}) {
  const p = cv.personal_info;
  const setP = (patch: Partial<typeof p>) => update("personal_info", { ...p, ...patch });

  const [genSum, setGenSum] = useState(false);
  const doGenSummary = async () => {
    setGenSum(true);
    try {
      const expSnips = cv.experience.map((e) => `${e.position} @ ${e.company}: ${e.bullets.slice(0, 2).join(" ")}`).join(" | ");
      const skSnips = cv.skills.flatMap((g) => g.items).join(", ");
      const { summary } = await aiSummary({ data: { titles: p.titles, experience: expSnips, skills: skSnips } });
      update("summary", summary);
    } catch (e: any) { toast.error(e?.message ?? "AI failed"); } finally { setGenSum(false); }
  };

  return (
    <div className="space-y-10">
      {/* Personal */}
      <Section title="Personal information">
        <div className="grid gap-3 sm:grid-cols-2">
          <In label="Full name" value={p.fullName} onChange={(v) => setP({ fullName: v })} />
          <In label="Location" value={p.location} onChange={(v) => setP({ location: v })} />
          <In label="Email" value={p.email} onChange={(v) => setP({ email: v })} />
          <In label="Phone" value={p.phone} onChange={(v) => setP({ phone: v })} />
          <In label="LinkedIn" value={p.linkedin ?? ""} onChange={(v) => setP({ linkedin: v })} />
          <In label="Website" value={p.website ?? ""} onChange={(v) => setP({ website: v })} />
        </div>
        <In label="Professional titles (separate with | )" value={(p.titles ?? []).join(" | ")} onChange={(v) => setP({ titles: v.split("|").map((x) => x.trim()).filter(Boolean) })} />
      </Section>

      {/* Summary */}
      <Section title="Summary" action={
        <button onClick={doGenSummary} disabled={genSum} className="text-xs underline-offset-4 hover:underline disabled:opacity-50">
          {genSum ? "Generating…" : "✦ Generate with AI"}
        </button>
      }>
        <textarea
          value={cv.summary} onChange={(e) => update("summary", e.target.value)}
          rows={5} className="w-full resize-y border border-border bg-paper p-3 text-sm outline-none focus:border-foreground"
          placeholder="A concise ATS-safe summary."
        />
      </Section>

      {/* Education */}
      <Section title="Education" action={
        <button onClick={() => update("education", [...cv.education, { institution: "", degree: "" }])} className="text-xs underline-offset-4 hover:underline">+ Add</button>
      }>
        <div className="space-y-4">
          {cv.education.map((e, i) => (
            <RepeaterCard key={i} onRemove={() => update("education", cv.education.filter((_, j) => j !== i))}>
              <div className="grid gap-3 sm:grid-cols-2">
                <In label="Institution" value={e.institution} onChange={(v) => updateAt<EducationItem>(cv.education, i, { institution: v }, (arr) => update("education", arr))} />
                <In label="Location" value={e.location ?? ""} onChange={(v) => updateAt<EducationItem>(cv.education, i, { location: v }, (arr) => update("education", arr))} />
                <In label="Degree" value={e.degree} onChange={(v) => updateAt<EducationItem>(cv.education, i, { degree: v }, (arr) => update("education", arr))} />
                <In label="Dates (optional)" value={e.dates ?? ""} onChange={(v) => updateAt<EducationItem>(cv.education, i, { dates: v }, (arr) => update("education", arr))} />
              </div>
            </RepeaterCard>
          ))}
        </div>
      </Section>

      {/* Experience */}
      <Section title="Work experience" action={
        <button onClick={() => update("experience", [...cv.experience, { company: "", position: "", bullets: [""] }])} className="text-xs underline-offset-4 hover:underline">+ Add role</button>
      }>
        <div className="space-y-5">
          {cv.experience.map((x, i) => (
            <ExperienceCard key={i} item={x} onChange={(patch) => updateAt<ExperienceItem>(cv.experience, i, patch, (arr) => update("experience", arr))} onRemove={() => update("experience", cv.experience.filter((_, j) => j !== i))} aiBullets={aiBullets} />
          ))}
        </div>
      </Section>

      {/* Skills */}
      <Section title="Skills & competencies" action={
        <button onClick={() => update("skills", [...cv.skills, { group: "", items: [] }])} className="text-xs underline-offset-4 hover:underline">+ Add group</button>
      }>
        <div className="space-y-4">
          {cv.skills.map((g, i) => (
            <RepeaterCard key={i} onRemove={() => update("skills", cv.skills.filter((_, j) => j !== i))}>
              <In label="Group name" value={g.group} onChange={(v) => updateAt(cv.skills, i, { group: v }, (arr) => update("skills", arr))} />
              <In label="Skills (separate with | )" value={g.items.join(" | ")} onChange={(v) => updateAt(cv.skills, i, { items: v.split("|").map((s) => s.trim()).filter(Boolean) }, (arr) => update("skills", arr))} />
            </RepeaterCard>
          ))}
        </div>
      </Section>
    </div>
  );
}

function updateAt<T>(arr: T[], i: number, patch: Partial<T>, set: (arr: T[]) => void) {
  set(arr.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
}

function ExperienceCard({
  item, onChange, onRemove, aiBullets,
}: {
  item: ExperienceItem;
  onChange: (patch: Partial<ExperienceItem>) => void;
  onRemove: () => void;
  aiBullets: ReturnType<typeof useServerFn<typeof generateBullets>>;
}) {
  const [busy, setBusy] = useState(false);
  const gen = async () => {
    if (!item.position) return toast.error("Add a role first");
    setBusy(true);
    try {
      const { bullets } = await aiBullets({ data: { position: item.position, company: item.company, context: item.bullets.join(" ") } });
      onChange({ bullets: bullets.length ? bullets : item.bullets });
    } catch (e: any) { toast.error(e?.message ?? "AI failed"); } finally { setBusy(false); }
  };
  return (
    <RepeaterCard onRemove={onRemove}>
      <div className="grid gap-3 sm:grid-cols-2">
        <In label="Company" value={item.company} onChange={(v) => onChange({ company: v })} />
        <In label="Location" value={item.location ?? ""} onChange={(v) => onChange({ location: v })} />
        <In label="Position" value={item.position} onChange={(v) => onChange({ position: v })} />
        <In label="Dates (optional)" value={item.dates ?? ""} onChange={(v) => onChange({ dates: v })} />
      </div>
      <div className="mt-3">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Bullet points</span>
          <div className="flex gap-3 text-xs">
            <button onClick={gen} disabled={busy} className="underline-offset-4 hover:underline disabled:opacity-50">{busy ? "Generating…" : "✦ AI bullets"}</button>
            <button onClick={() => onChange({ bullets: [...item.bullets, ""] })} className="underline-offset-4 hover:underline">+ Add bullet</button>
          </div>
        </div>
        <div className="space-y-2">
          {item.bullets.map((b, j) => (
            <div key={j} className="flex gap-2">
              <textarea value={b} onChange={(e) => onChange({ bullets: item.bullets.map((x, k) => (k === j ? e.target.value : x)) })} rows={1} className="w-full resize-none border border-border bg-paper p-2 text-sm outline-none focus:border-foreground" />
              <button onClick={() => onChange({ bullets: item.bullets.filter((_, k) => k !== j) })} className="text-xs text-muted-foreground hover:text-destructive">×</button>
            </div>
          ))}
        </div>
      </div>
    </RepeaterCard>
  );
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between border-b border-border pb-2">
        <h2 className="font-display text-2xl">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function In({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full border border-border bg-paper p-2 text-sm outline-none focus:border-foreground" />
    </label>
  );
}

function RepeaterCard({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <div className="relative border border-border bg-card p-4">
      <button onClick={onRemove} className="absolute right-2 top-2 text-xs text-muted-foreground hover:text-destructive">Remove</button>
      {children}
    </div>
  );
}
