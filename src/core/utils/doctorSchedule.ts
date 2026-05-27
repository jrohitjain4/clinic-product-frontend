import dayjs, { Dayjs } from "dayjs";
import type { RowType } from "../common/duplicate-forms/duplicateForms.types";

type ScheduleSlot = { session?: string; from: string; to: string };

export const parseSchedulesFromApi = (
  raw: Record<string, ScheduleSlot[]> | null | undefined
): Record<string, RowType[]> => {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, RowType[]> = {};
  for (const [day, slots] of Object.entries(raw)) {
    if (!Array.isArray(slots) || !slots.length) continue;
    out[day] = slots.map((s) => ({
      id: Date.now() + Math.random(),
      session: s.session || "",
      from: s.from ? dayjs(s.from, "HH:mm:ss") : dayjs("00:00:00", "HH:mm:ss"),
      to: s.to ? dayjs(s.to, "HH:mm:ss") : dayjs("00:00:00", "HH:mm:ss"),
    }));
  }
  return out;
};

export const toEducationEntries = (data: unknown) => {
  const rows = Array.isArray(data) ? data : [];
  return rows.map((r: Record<string, string>, i: number) => ({
    id: Date.now() + i,
    degree: r.degree || "",
    university: r.university || "",
    from: r.from || "",
    to: r.to || "",
  }));
};

export const toAwardEntries = (data: unknown) => {
  const rows = Array.isArray(data) ? data : [];
  return rows.map((r: Record<string, string>, i: number) => ({
    id: Date.now() + i + 1000,
    name: r.name || "",
    description: r.description || "",
    year: r.year || "",
  }));
};

export const findSelectOption = (
  options: { value: string; label: string }[],
  val?: string | null
) => options.find((o) => o.value === val) ?? null;
