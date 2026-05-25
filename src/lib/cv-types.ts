export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  website?: string;
  titles: string[]; // e.g. ["Training Coordinator", "Skills Instructor"]
}

export interface EducationItem {
  institution: string;
  degree: string;
  location?: string;
  dates?: string; // optional / can be omitted
}

export interface ExperienceItem {
  company: string;
  position: string;
  location?: string;
  dates?: string; // optional
  bullets: string[];
}

export interface CVSettings {
  showDates: boolean;
  onePage: boolean;
}

export interface CVData {
  id?: string;
  title: string;
  personal_info: PersonalInfo;
  summary: string;
  education: EducationItem[];
  experience: ExperienceItem[];
  skills: { group: string; items: string[] }[];
  settings: CVSettings;
}

export const blankCV = (): CVData => ({
  title: "Untitled CV",
  personal_info: {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    titles: [],
  },
  summary: "",
  education: [],
  experience: [],
  skills: [],
  settings: { showDates: false, onePage: true },
});

export function camelFileName(fullName: string, title?: string): string {
  const clean = (s: string) =>
    s
      .normalize("NFKD")
      .replace(/[^\w\s]/g, "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
  const parts = [...clean(fullName), ...(title ? clean(title) : [])];
  if (parts.length === 0) return "myCv";
  return (
    parts[0].toLowerCase() +
    parts
      .slice(1)
      .map((p) => p[0].toUpperCase() + p.slice(1).toLowerCase())
      .join("")
  );
}
