import type { Dayjs } from "dayjs";

export interface RowType {
  id: number;
  session: string;
  from: Dayjs | null;
  to: Dayjs | null;
}
