import { TimePicker } from "antd";
import dayjs from "dayjs";
import { Link } from "react-router";
import CommonSelect from "../common-select/commonSelect";
import { Session } from "../selectOption";
import { useState } from "react";
import type { RowType } from "./duplicateForms.types";

export type { RowType } from "./duplicateForms.types";

const createRow = (row?: RowType): RowType => ({
  id: Date.now() + Math.random(),
  session: row ? row.session : Session[0]?.value || "",
  from: row?.from ? dayjs(row.from) : dayjs("00:00:00", "HH:mm:ss"),
  to: row?.to ? dayjs(row.to) : dayjs("00:00:00", "HH:mm:ss"),
});

/** Deep clone rows (new ids) for Apply All */
export const cloneScheduleRows = (source: RowType[]): RowType[] =>
  source.map((r) => ({
    id: Date.now() + Math.random(),
    session: r.session,
    from: r.from ? dayjs(r.from) : dayjs("00:00:00", "HH:mm:ss"),
    to: r.to ? dayjs(r.to) : dayjs("00:00:00", "HH:mm:ss"),
  }));

interface DuplicateFormsProps {
  /** Parent-controlled rows (e.g. after Apply All) */
  initialRows?: RowType[];
  onChange?: (rows: RowType[]) => void;
}

const DuplicateForms: React.FC<DuplicateFormsProps> = ({ initialRows, onChange }) => {
  const [rows, setRows] = useState<RowType[]>(() =>
    initialRows?.length ? cloneScheduleRows(initialRows) : [createRow()]
  );

  const handleAddRow = (row: RowType) => {
    const idx = rows.findIndex((r) => r.id === row.id);
    const newRows = [...rows];
    newRows.splice(idx + 1, 0, createRow(row));
    setRows(newRows);
    if (onChange) onChange(newRows);
  };

  const handleDeleteRow = (id: number) => {
    const newRows = rows.filter((row) => row.id !== id);
    setRows(newRows);
    if (onChange) onChange(newRows);
  };

  const handleTimeChange = (
    id: number,
    field: "from" | "to",
    time: Dayjs | null
  ) => {
    const newRows = rows.map((row) => (row.id === id ? { ...row, [field]: time } : row));
    setRows(newRows);
    if (onChange) onChange(newRows);
  };

  const handleSessionChange = (id: number, session: string) => {
    const newRows = rows.map((row) => (row.id === id ? { ...row, session } : row));
    setRows(newRows);
    if (onChange) onChange(newRows);
  };

  return (
    <div>
      {rows.map((row) => (
        <div className="row gx-3" key={row.id}>
          <div className="col-lg-5">
            <div className="mb-3">
              <label className="form-label">Session</label>
              <CommonSelect
                options={Session}
                className="select"
                defaultValue={Session.find((s) => s.value === row.session) || Session[0]}
                onChange={(opt: any) => handleSessionChange(row.id, opt?.value || "")}
              />
            </div>
          </div>
          <div className="col-lg-7">
            <div className="row align-items-end gx-3">
              <div className="col-lg-9">
                <div className="row gx-3">
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label">From</label>
                      <div className="input-icon-end position-relative">
                        <TimePicker
                          className="form-control"
                          value={row.from}
                          onChange={(time) => handleTimeChange(row.id, "from", time)}
                          defaultOpenValue={dayjs("00:00:00", "HH:mm:ss")}
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
                          defaultOpenValue={dayjs("00:00:00", "HH:mm:ss")}
                        />
                        <span className="input-icon-addon">
                          <i className="ti ti-clock-hour-10" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-3">
                <div className="mb-3 d-flex">
                  <Link
                    to="#"
                    onClick={() => handleAddRow(row)}
                    className="add-schedule-btn p-2 bg-light btn-icon text-dark rounded d-flex align-items-center justify-content-center"
                    style={{ marginRight: 8 }}
                  >
                    <i className="ti ti-plus fs-16" />
                  </Link>
                  {rows.length > 1 && (
                    <Link
                      to="#"
                      onClick={() => handleDeleteRow(row.id)}
                      className="remove-schedule-btn p-2 bg-soft-danger btn-icon text-danger rounded d-flex align-items-center justify-content-center"
                    >
                      <i className="ti ti-trash fs-16" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DuplicateForms;
