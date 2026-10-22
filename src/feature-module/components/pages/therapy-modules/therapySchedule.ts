/** Shared helpers to build therapy session dates for preview / print. */

const isDateAvailable = (date: Date, availability: any): boolean => {
  if (!availability) return true;

  const dayOfWeek = date.getDay();
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayName = dayNames[dayOfWeek];

  const clinicOffDays = availability.clinicWorkingDays || [0];
  if (clinicOffDays.includes(dayOfWeek)) return false;

  const daySchedule = availability.schedules?.[dayName];
  const isWorking = Array.isArray(daySchedule) && daySchedule.length > 0;
  if (!isWorking) return false;

  const time = date.getTime();
  const isHoliday = availability.holidays?.some((h: any) => {
    const start = new Date(h.date);
    start.setHours(0, 0, 0, 0);
    const end = h.endDate ? new Date(h.endDate) : new Date(h.date);
    end.setHours(23, 59, 59, 999);
    return time >= start.getTime() && time <= end.getTime();
  });
  if (isHoliday) return false;

  const isLeave = availability.leaves?.some((l: any) => {
    const s = new Date(l.start);
    s.setHours(0, 0, 0, 0);
    const e = new Date(l.end);
    e.setHours(23, 59, 59, 999);
    return time >= s.getTime() && time <= e.getTime();
  });
  if (isLeave) return false;

  return true;
};

export const getNextAvailableDate = (startDate: Date, availability: any): Date => {
  const date = new Date(startDate);
  for (let i = 0; i < 365; i++) {
    if (isDateAvailable(date, availability)) return date;
    date.setDate(date.getDate() + 1);
  }
  return date;
};

export type TherapySchedulePlanInput = {
  therapyName?: string;
  totalSessions?: number | string;
  startDate?: string;
  scheduleType?: string;
  sessionTime?: string;
};

export type TherapyScheduleEntry = { day: number; date: Date };

export type TherapyScheduleBlock = {
  therapyName: string;
  scheduleType: string;
  sessionTime: string;
  sessionCount: number;
  totalDays: number;
  entries: TherapyScheduleEntry[];
};

export const buildTherapyScheduleBlocks = (
  plans: TherapySchedulePlanInput[],
  availability?: any
): TherapyScheduleBlock[] => {
  return (plans || []).map((plan, idx) => {
    const sessionCount = Number(plan.totalSessions) || 0;
    const startDt = plan.startDate ? new Date(plan.startDate) : null;
    const entries: TherapyScheduleEntry[] = [];

    if (startDt && !Number.isNaN(startDt.getTime()) && sessionCount > 0) {
      let current = new Date(startDt);
      for (let s = 0; s < sessionCount; s++) {
        current = getNextAvailableDate(current, availability);
        entries.push({ day: s + 1, date: new Date(current) });
        const type = String(plan.scheduleType || "daily").toLowerCase();
        if (type === "alternate") {
          current.setDate(current.getDate() + 1);
          const skipped = getNextAvailableDate(current, availability);
          current = new Date(skipped);
          current.setDate(current.getDate() + 1);
        } else if (type === "weekly") {
          current.setDate(current.getDate() + 7);
        } else {
          current.setDate(current.getDate() + 1);
        }
      }
    }

    const totalDays =
      entries.length >= 2
        ? Math.ceil(
            (entries[entries.length - 1].date.getTime() - entries[0].date.getTime()) /
              (1000 * 60 * 60 * 24)
          ) + 1
        : sessionCount;

    return {
      therapyName: plan.therapyName || `Plan ${idx + 1}`,
      scheduleType: plan.scheduleType || "daily",
      sessionTime: plan.sessionTime || "Any available",
      sessionCount,
      totalDays,
      entries,
    };
  });
};
