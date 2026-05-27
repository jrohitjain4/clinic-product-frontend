import type { AwardEntry, EducationEntry } from "../types/doctorProfile";

export type StoredEducation = {
  degree?: string;
  university?: string;
  from?: string;
  to?: string;
};

export type StoredAward = {
  name?: string;
  description?: string;
  year?: string;
};

export function parseJsonArray<T>(data: unknown): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as T[];
  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function serializeEducations(rows: EducationEntry[]) {
  const items = rows
    .filter((r) => r.degree?.trim() || r.university?.trim())
    .map(({ degree, university, from, to }) => ({
      degree: degree.trim(),
      university: university.trim(),
      from: from || "",
      to: to || "",
    }));
  return items.length ? items : null;
}

export function serializeAwards(rows: AwardEntry[]) {
  const items = rows
    .filter((r) => r.name?.trim())
    .map(({ name, description, year }) => ({
      name: name.trim(),
      description: description?.trim() || "",
      year: year?.trim() || "",
    }));
  return items.length ? items : null;
}

export const formatProfileDate = (iso?: string) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
};

export const formatEducationRange = (from?: string, to?: string) => {
  const a = formatProfileDate(from);
  const b = formatProfileDate(to);
  if (a && b) return `${a} - ${b}`;
  return a || b || "";
};

export const educationTitle = (e: StoredEducation) => {
  const parts = [e.university, e.degree].filter(Boolean);
  return parts.length ? parts.join(" - ") : "—";
};

export const awardTitle = (a: StoredAward) => {
  const name = a.name?.trim() || "—";
  const year = a.year?.trim();
  return year ? `${name} (${year})` : name;
};
