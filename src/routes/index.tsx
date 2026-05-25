import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { CVDocument } from "@/components/CVDocument";
import { blankCV } from "@/lib/cv-types";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    meta: [
      { title: "CeeVeeForYou — Professional CVs Built For Success" },
      { name: "description", content: "AI-powered, ATS-friendly CV builder. Elegant one-page resumes in minutes. Mobile-first and installable." },
    ],
  }),
});

const sampleCV = (() => {
  const c = blankCV();
  c.personal_info = {
    fullName: "Alex Morgan",
    email: "alex@morgan.co",
    phone: "+1 (415) 000 0000",
    location: "San Francisco, CA",
    titles: ["Product Designer", "Brand Strategist", "Design Lead"],
  };
  c.summary = "Senior product designer with a record of shipping refined, conversion-led interfaces across consumer and enterprise products. Combines editorial typographic sensibility with rigorous design-system thinking. Known for compressing ambiguous briefs into shippable, opinionated work.";
  c.education = [
    { institution: "Royal College of Art", degree: "MA, Visual Communication", location: "London, UK" },
    { institution: "Rhode Island School of Design", degree: "BFA, Graphic Design", location: "Providence, RI" },
  ];
  c.experience = [
    {
      company: "Northbeam Studio",
      position: "Design Lead",
      location: "San Francisco, CA",
      bullets: [
        "Led the rebrand and product redesign that lifted activation 38% within two quarters.",
        "Built a 60-component design system adopted across three product surfaces.",
        "Hired and mentored a team of four designers across product and brand.",
      ],
    },
    {
      company: "Forma Labs",
      position: "Senior Product Designer",
      location: "Remote",
      bullets: [
        "Owned the end-to-end checkout redesign, reducing drop-off by 22%.",
        "Partnered with engineering on a tokenized theming system shipped in eight weeks.",
      ],
    },
  ];
  c.skills = [
    { group: "Design", items: ["Product", "Brand", "Editorial", "Motion", "Systems"] },
    { group: "Tools", items: ["Figma", "Framer", "After Effects", "Notion"] },
  ];
  return c;
})();

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="font-display text-xl tracking-tight">
            CeeVee<span className="italic">For</span>You
          </Link>
          <nav className="hidden gap-8 text-sm text-muted-foreground sm:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <Link to="/login" className="text-muted-foreground hover:text-foreground">Sign in</Link>
            <Link to="/signup" className="rounded-sm bg-foreground px-3 py-1.5 text-background">Start free</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-24 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:pt-24">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground"
          >
            An AI-powered résumé studio
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.05 }}
            className="mt-5 font-display text-[clamp(2.6rem,6vw,5.2rem)] leading-[0.95]"
          >
            Professional CVs,<br />
            <span className="italic text-muted-foreground">built for success.</span>
          </motion.h1>
          <p className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
            CeeVeeForYou writes, formats, and compresses your résumé into a pixel-perfect, ATS-safe single page — set in Arial, ready for any applicant tracking system.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link to="/signup" className="rounded-sm bg-foreground px-6 py-3 text-sm font-medium text-background">Create my CV →</Link>
            <Link to="/login" className="text-sm underline-offset-4 hover:underline">I already have an account</Link>
          </div>
          <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-border pt-6 text-sm">
            <div><dt className="text-muted-foreground">Format</dt><dd className="mt-1 font-medium">A4 · Arial</dd></div>
            <div><dt className="text-muted-foreground">Pages</dt><dd className="mt-1 font-medium">One, always</dd></div>
            <div><dt className="text-muted-foreground">ATS</dt><dd className="mt-1 font-medium">100% safe</dd></div>
          </dl>
        </div>

        {/* CV mock */}
        <motion.div
          initial={{ opacity: 0, y: 24, rotate: -1.5 }}
          animate={{ opacity: 1, y: 0, rotate: -1.5 }}
          transition={{ duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
          className="relative mx-auto"
          style={{ maxWidth: 480 }}
        >
          <div className="origin-top scale-[0.62] sm:scale-[0.75]">
            <CVDocument data={sampleCV} />
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-6xl gap-px bg-border px-0 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["One-page optimiser", "Auto-tunes spacing, font weight, and bullet density to keep your CV on a single page."],
            ["ATS-safe by default", "No tables, no columns, no icons in the export. Just clean Arial that every parser reads."],
            ["AI writing assistant", "Generate summaries and achievement-led bullets that sound like you — only sharper."],
            ["Offline PWA", "Install on iOS or Android. Edit and review your last CV with no signal."],
          ].map(([t, d]) => (
            <div key={t} className="bg-card p-8">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">— Feature</div>
              <h3 className="mt-3 font-display text-2xl">{t}</h3>
              <p className="mt-3 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-6 py-24">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">How it works</p>
        <h2 className="mt-3 font-display text-4xl sm:text-5xl">Three steps. No filler.</h2>
        <ol className="mt-12 grid gap-10 sm:grid-cols-3">
          {[
            ["01", "Enter your details", "Type or paste. The editor mirrors the final document live."],
            ["02", "Let AI sharpen it", "Generate a summary and rewrite bullets with measurable outcomes."],
            ["03", "Download as PDF", "Exports Arial, A4, with a camelCase filename ready to send."],
          ].map(([n, t, d]) => (
            <li key={n}>
              <div className="font-display text-5xl text-muted-foreground">{n}</div>
              <h3 className="mt-3 font-display text-2xl">{t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-border bg-card">
        <div className="mx-auto max-w-3xl px-6 py-24">
          <h2 className="font-display text-4xl">Questions, answered.</h2>
          <div className="mt-10 divide-y divide-border">
            {[
              ["Is it really ATS-friendly?", "Yes. The export uses Arial, semantic structure, no tables or images, and a single column — the four things every modern parser depends on."],
              ["Will my CV fit on one page?", "The one-page optimiser tightens spacing and typography until it does. You can also toggle this off."],
              ["Do I need to add dates?", "No — dates are optional everywhere. Toggle them per-CV from the settings."],
              ["Does it work offline?", "Once installed as a PWA, your dashboard and last-opened CVs are available without a connection."],
            ].map(([q, a]) => (
              <details key={q} className="group py-5">
                <summary className="flex cursor-pointer items-center justify-between font-medium">
                  {q}
                  <span className="font-mono text-muted-foreground group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-6 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center">
          <div className="font-display text-lg text-foreground">CeeVeeForYou</div>
          <div>Built by <span className="text-foreground">Architeq Web Agency</span></div>
        </div>
      </footer>
    </div>
  );
}
