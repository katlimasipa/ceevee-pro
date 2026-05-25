import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function callAI(prompt: string, system: string): Promise<string> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("AI not configured");
  const res = await fetch(LOVABLE_AI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(`AI ${res.status}`);
  const j = await res.json();
  return j.choices?.[0]?.message?.content?.trim() ?? "";
}

export const generateSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { titles: string[]; experience: string; skills: string }) =>
    z
      .object({
        titles: z.array(z.string()).max(10),
        experience: z.string().max(4000),
        skills: z.string().max(2000),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const text = await callAI(
      `Titles: ${data.titles.join(", ")}\nExperience snippets: ${data.experience}\nSkills: ${data.skills}`,
      "You write concise, ATS-safe professional CV summaries. Output 3 sentences max, 50-75 words, third-person omitted, no first-person pronouns, action-led, industry keywords woven in naturally. Return only the summary text — no preamble.",
    );
    return { summary: text };
  });

export const generateBullets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { position: string; company: string; context?: string }) =>
    z
      .object({
        position: z.string().min(1).max(200),
        company: z.string().max(200).optional().default(""),
        context: z.string().max(2000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const text = await callAI(
      `Role: ${data.position}${data.company ? ` at ${data.company}` : ""}${data.context ? `\nContext: ${data.context}` : ""}`,
      "Generate 5 ATS-friendly resume bullet points. Each starts with a strong action verb, includes a measurable outcome where possible (numbers, percentages, counts), no first-person, max ~22 words each. Return as plain lines, one bullet per line, no numbering, no leading dashes.",
    );
    const bullets = text
      .split(/\n+/)
      .map((l) => l.replace(/^[-•\d.\s]+/, "").trim())
      .filter(Boolean)
      .slice(0, 5);
    return { bullets };
  });
