import { DatePicker } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { Link } from "react-router";
import { useState } from "react";
import type { EducationEntry } from "../../types/doctorProfile";

const emptyRow = (): EducationEntry => ({
  id: Date.now() + Math.random(),
  degree: "",
  university: "",
  from: "",
  to: "",
});

interface EducationFormsProps {
  initialRows?: EducationEntry[];
  onChange?: (rows: EducationEntry[]) => void;
}

const EducationForms = ({ initialRows, onChange }: EducationFormsProps) => {
  const [rows, setRows] = useState<EducationEntry[]>(
    initialRows?.length ? initialRows : [emptyRow()]
  );

  const emit = (next: EducationEntry[]) => {
    setRows(next);
    onChange?.(next);
  };

  const updateRow = (id: number, field: keyof EducationEntry, value: string) => {
    emit(rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const handleAddRow = (row: EducationEntry) => {
    const idx = rows.findIndex((r) => r.id === row.id);
    const next = [...rows];
    next.splice(idx + 1, 0, { ...emptyRow() });
    emit(next);
  };

  const handleDeleteRow = (id: number) => {
    emit(rows.filter((r) => r.id !== id));
  };

  const getModalContainer = () =>
    document.getElementById("modal-datepicker") || document.body;

  const parseDate = (s: string) => (s ? dayjs(s) : null);

  return (
    <div>
      {rows.map((row) => (
        <div className="row align-items-end" key={row.id}>
          <div className="col-lg-11">
            <div className="row">
              <div className="col-lg-3">
                <div className="mb-3">
                  <label className="form-label">Educational Degree</label>
                  <input
                    type="text"
                    className="form-control"
                    value={row.degree}
                    onChange={(e) => updateRow(row.id, "degree", e.target.value)}
                    placeholder="e.g. MD"
                  />
                </div>
              </div>
              <div className="col-lg-3">
                <div className="mb-3">
                  <label className="form-label">University</label>
                  <input
                    type="text"
                    className="form-control"
                    value={row.university}
                    onChange={(e) => updateRow(row.id, "university", e.target.value)}
                    placeholder="e.g. Harvard Medical School"
                  />
                </div>
              </div>
              <div className="col-lg-3">
                <div className="mb-3">
                  <label className="form-label">From</label>
                  <div className="input-icon-end position-relative">
                    <DatePicker
                      className="form-control datetimepicker w-100"
                      format="DD MMM YYYY"
                      value={parseDate(row.from)}
                      onChange={(d: Dayjs | null) =>
                        updateRow(row.id, "from", d ? d.format("YYYY-MM-DD") : "")
                      }
                      getPopupContainer={getModalContainer}
                      placeholder="DD-MM-YYYY"
                    />
                    <span className="input-icon-addon">
                      <i className="ti ti-calendar" />
                    </span>
                  </div>
                </div>
              </div>
              <div className="col-lg-3">
                <div className="mb-3">
                  <label className="form-label">To</label>
                  <div className="input-icon-end position-relative">
                    <DatePicker
                      className="form-control datetimepicker w-100"
                      format="DD MMM YYYY"
                      value={parseDate(row.to)}
                      onChange={(d: Dayjs | null) =>
                        updateRow(row.id, "to", d ? d.format("YYYY-MM-DD") : "")
                      }
                      getPopupContainer={getModalContainer}
                      placeholder="DD-MM-YYYY"
                    />
                    <span className="input-icon-addon">
                      <i className="ti ti-calendar" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-1">
            <div className="mb-3 d-flex">
              <Link
                to="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleAddRow(row);
                }}
                className="add-schedule-btn p-2 bg-light btn-icon text-dark rounded d-flex align-items-center justify-content-center"
                style={{ marginRight: 8 }}
              >
                <i className="ti ti-plus fs-16" />
              </Link>
              {rows.length > 1 && (
                <Link
                  to="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleDeleteRow(row.id);
                  }}
                  className="remove-schedule-btn p-2 bg-soft-danger btn-icon text-danger rounded d-flex align-items-center justify-content-center"
                >
                  <i className="ti ti-trash fs-16" />
                </Link>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EducationForms;
