import { TimePicker } from "antd";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import CommonSelect from "../common-select/commonSelect";
import { Session } from "../selectOption";
import { useState, useEffect } from "react";
import type { RowType } from "./duplicateForms.types";

export type { RowType } from "./duplicateForms.types";

/** Calculate hours and minutes between two dayjs times */
const getTimeDiff = (from: Dayjs | null, to: Dayjs | null): { hours: number; minutes: number } => {
  if (!from || !to) return { hours: 0, minutes: 0 };
  let diffMins = to.diff(from, "minute");
  if (diffMins < 0) diffMins += 24 * 60; // handle overnight
  return { hours: Math.floor(diffMins / 60), minutes: diffMins % 60 };
};

const formatDuration = (h: number, m: number): string => {
  if (h === 0 && m === 0) return "0h";
  if (m === 0) return `${h}h`;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
};

const createRow = (row?: RowType): RowType => ({
  id: Date.now() + Math.random(),
  session: row ? row.session : Session[0]?.value || "",
  from: row?.from ? dayjs(row.from) : dayjs("09:00", "HH:mm"),
  to: row?.to ? dayjs(row.to) : dayjs("18:00", "HH:mm"),
});

/** Deep clone rows (new ids) for Apply All */
export const cloneScheduleRows = (source: RowType[]): RowType[] =>
  source.map((r) => ({
    id: Date.now() + Math.random(),
    session: r.session,
    from: r.from ? dayjs(r.from) : dayjs("09:00", "HH:mm"),
    to: r.to ? dayjs(r.to) : dayjs("18:00", "HH:mm"),
  }));

interface DuplicateFormsProps {
  /** Parent-controlled rows (e.g. after Apply All) */
  initialRows?: RowType[];
  onChange?: (rows: RowType[]) => void;
  disabled?: boolean;
}

const DuplicateForms: React.FC<DuplicateFormsProps> = ({ initialRows, onChange, disabled }) => {
  const [rows, setRows] = useState<RowType[]>(() =>
    initialRows?.length ? cloneScheduleRows(initialRows) : [createRow()]
  );

  // Sync initial state if parent has nothing (fixes validation bug where locked defaults didn't send data)
  useEffect(() => {
    if ((!initialRows || initialRows.length === 0) && onChange) {
      onChange(rows);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddRow = (row: RowType) => {
    if (disabled) return;
    const idx = rows.findIndex((r) => r.id === row.id);
    const newRows = [...rows];
    newRows.splice(idx + 1, 0, createRow(row));
    setRows(newRows);
    if (onChange) onChange(newRows);
  };

  const handleDeleteRow = (id: number) => {
    if (disabled) return;
    const newRows = rows.filter((row) => row.id !== id);
    setRows(newRows);
    if (onChange) onChange(newRows);
  };

  const handleTimeChange = (
    id: number,
    field: "from" | "to",
    time: Dayjs | null
  ) => {
    if (disabled) return;
    const newRows = rows.map((row) => (row.id === id ? { ...row, [field]: time } : row));
    setRows(newRows);
    if (onChange) onChange(newRows);
  };

  const handleSessionChange = (id: number, session: string) => {
    if (disabled) return;
    const newRows = rows.map((row) => (row.id === id ? { ...row, session } : row));
    setRows(newRows);
    if (onChange) onChange(newRows);
  };

  // Calculate total working minutes across all rows
  const totalMins = rows.reduce((sum, row) => {
    const diff = getTimeDiff(row.from, row.to);
    return sum + diff.hours * 60 + diff.minutes;
  }, 0);
  const totalHours = Math.floor(totalMins / 60);
  const totalRemainder = totalMins % 60;

  return (
    <div style={{ pointerEvents: disabled ? 'none' : 'auto', opacity: disabled ? 0.7 : 1 }}>
      {rows.map((row) => {
        const diff = getTimeDiff(row.from, row.to);
        return (
          <div key={row.id}>
            <div className="row gx-3">
              <div className="col-lg-3">
                <div className="mb-3">
                  <label className="form-label">Session</label>
                  <CommonSelect
                    options={Session}
                    className="select"
                    defaultValue={Session.find((s) => s.value === row.session) || Session[0]}
                    onChange={(opt: any) => handleSessionChange(row.id, opt?.value || "")}
                    isDisabled={disabled}
                  />
                </div>
              </div>
              <div className="col-lg-9">
                <div className="row align-items-end gx-3">
                  <div className="col-lg-11">
                    <div className="row gx-3">
                      <div className="col-lg-6">
                        <div className="mb-3">
                          <label className="form-label">From</label>
                          <div className="input-icon-end position-relative">
                            <TimePicker
                              className="form-control"
                              value={row.from}
                              onChange={(time) => handleTimeChange(row.id, "from", time)}
                              format="h:mm a"
                              use12Hours
                              disabled={disabled}
                              placeholder="Select Time"
                            />
                            <span className="input-icon-addon">
                              <i className="ti ti-clock-hour-10" />
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="col-lg-6">
                        <div className="mb-3">
                          <label className="form-label">To</label>
                          <div className="input-icon-end position-relative">
                            <TimePicker
                              className="form-control"
                              value={row.to}
                              onChange={(time) => handleTimeChange(row.id, "to", time)}
                              format="h:mm a"
                              use12Hours
                              disabled={disabled}
                              placeholder="Select Time"
                            />
                            <span className="input-icon-addon">
                              <i className="ti ti-clock-hour-10" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {!disabled && (
                    <div className="col-lg-1">
                      <div className="mb-3 d-flex align-items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleAddRow(row)}
                          className="btn btn-primary d-flex align-items-center justify-content-center p-0 rounded-circle shadow-sm"
                          style={{ width: "32px", height: "32px" }}
                        >
                          <i className="ti ti-plus fs-14" />
                        </button>
                        {rows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(row.id)}
                            className="btn btn-soft-danger d-flex align-items-center justify-content-center p-0 rounded-circle shadow-sm"
                            style={{ width: "32px", height: "32px" }}
                          >
                            <i className="ti ti-trash fs-14 text-danger" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Working hours for this session */}
            {(diff.hours > 0 || diff.minutes > 0) && (
              <div className="mb-3 mt-n2">
                <span className="badge bg-soft-primary text-primary fw-normal fs-12 px-3 py-1">
                  <i className="ti ti-clock me-1" />
                  Working Hours: {formatDuration(diff.hours, diff.minutes)}
                </span>
              </div>
            )}
          </div>
        );
      })}

      {/* Total working hours */}
      {rows.length > 0 && totalMins > 0 && (
        <div className="border-top pt-3 mt-2 d-flex align-items-center gap-2">
          <i className="ti ti-calculator text-primary fs-18" />
          <span className="fw-bold text-dark fs-14">
            Total Working Hours: {formatDuration(totalHours, totalRemainder)}
          </span>
        </div>
      )}
    </div>
  );
};

export default DuplicateForms;
