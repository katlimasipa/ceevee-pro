import type { CVData } from "@/lib/cv-types";

export function CVDocument({ data }: { data: CVData }) {
  const { personal_info: p, summary, education, experience, skills, settings } = data;
  const showDates = settings.showDates;

  return (
    <div className={`cv-doc ${settings.onePage ? "cv-compact" : ""}`}>
      <div className="cv-page">
        {/* Header */}
        <header className="text-center">
          <h1 className="text-[18pt] font-bold uppercase tracking-[0.06em]">
            {p.fullName || "YOUR NAME"}
          </h1>
          <div className="mt-1 text-[10pt]">
            {[p.email, p.phone, p.location].filter(Boolean).join(" | ")}
          </div>
          {p.titles?.length > 0 && (
            <div className="mt-1 text-[10pt] font-semibold">{p.titles.join(" | ")}</div>
          )}
          {(p.linkedin || p.website) && (
            <div className="mt-1 text-[9.5pt]">
              {[p.linkedin, p.website].filter(Boolean).join(" | ")}
            </div>
          )}
        </header>

        {/* Summary */}
        {summary && (
          <section>
            <h2 className="cv-section-title">SUMMARY</h2>
            <p className="text-justify">{summary}</p>
          </section>
        )}

        {/* Education */}
        {education.length > 0 && (
          <section>
            <h2 className="cv-section-title">EDUCATION</h2>
            {education.map((e, i) => (
              <div key={i} className="flex justify-between gap-4 mt-1">
                <div>
                  <div className="font-bold">{e.institution}</div>
                  <div className="italic">{e.degree}</div>
                </div>
                <div className="text-right shrink-0">
                  {e.location && <div className="font-bold">{e.location}</div>}
                  {showDates && e.dates && <div className="italic">{e.dates}</div>}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <section>
            <h2 className="cv-section-title">WORK EXPERIENCE</h2>
            {experience.map((x, i) => (
              <div key={i} className="mt-1">
                <div className="flex justify-between gap-4">
                  <div>
                    <div className="font-bold">{x.company}</div>
                    <div className="italic">{x.position}</div>
                  </div>
                  <div className="text-right shrink-0">
                    {x.location && <div className="font-bold">{x.location}</div>}
                    {showDates && x.dates && <div className="italic">{x.dates}</div>}
                  </div>
                </div>
                {x.bullets.length > 0 && (
                  <ul className="cv-bullets">
                    {x.bullets.map((b, j) => (
                      <li key={j}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <section>
            <h2 className="cv-section-title">SKILLS AND CORE COMPETENCIES</h2>
            {skills.map((g, i) => (
              <div key={i} className="mt-0.5">
                <span className="font-bold">{g.group}: </span>
                <span>{g.items.join(" | ")}</span>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
