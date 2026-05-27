import { Link } from "react-router";
import { useState } from "react";
import type { AwardEntry } from "../../types/doctorProfile";

const emptyRow = (): AwardEntry => ({
  id: Date.now() + Math.random(),
  name: "",
  description: "",
  year: "",
});

interface RewardsFormsProps {
  initialRows?: AwardEntry[];
  onChange?: (rows: AwardEntry[]) => void;
}

const RewardsForms = ({ initialRows, onChange }: RewardsFormsProps) => {
  const [rows, setRows] = useState<AwardEntry[]>(
    initialRows?.length ? initialRows : [emptyRow()]
  );

  const emit = (next: AwardEntry[]) => {
    setRows(next);
    onChange?.(next);
  };

  const updateRow = (id: number, field: keyof AwardEntry, value: string) => {
    emit(rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const handleAddRow = (row: AwardEntry) => {
    const idx = rows.findIndex((r) => r.id === row.id);
    const next = [...rows];
    next.splice(idx + 1, 0, emptyRow());
    emit(next);
  };

  const handleDeleteRow = (id: number) => {
    emit(rows.filter((r) => r.id !== id));
  };

  return (
    <div>
      {rows.map((row) => (
        <div className="row align-items-end" key={row.id}>
          <div className="col-lg-11">
            <div className="row">
              <div className="col-lg-5">
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={row.name}
                    onChange={(e) => updateRow(row.id, "name", e.target.value)}
                    placeholder="Award or certification title"
                  />
                </div>
              </div>
              <div className="col-lg-2">
                <div className="mb-3">
                  <label className="form-label">Year</label>
                  <input
                    type="text"
                    className="form-control"
                    value={row.year}
                    onChange={(e) => updateRow(row.id, "year", e.target.value)}
                    placeholder="2024"
                  />
                </div>
              </div>
              <div className="col-lg-5">
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <input
                    type="text"
                    className="form-control"
                    value={row.description}
                    onChange={(e) => updateRow(row.id, "description", e.target.value)}
                    placeholder="Short description"
                  />
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

export default RewardsForms;
