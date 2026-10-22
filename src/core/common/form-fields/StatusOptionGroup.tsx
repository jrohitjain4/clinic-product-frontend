import React from "react";
import "./StatusOptionGroup.scss";

export type PatientStatusValue = "Active" | "Inactive" | "";

export interface StatusOptionGroupProps {
  value?: string;
  onChange: (value: PatientStatusValue) => void;
  required?: boolean;
  className?: string;
  showLabel?: boolean;
  id?: string;
}

const OPTIONS: {
  value: PatientStatusValue;
  label: string;
  tone: "success" | "muted";
}[] = [
  {
    value: "Active",
    label: "Available",
    tone: "success",
  },
  {
    value: "Inactive",
    label: "Unavailable",
    tone: "muted",
  },
];

function normalizeStatus(value?: string): PatientStatusValue {
  if (!value) return "";
  const v = value.trim().toLowerCase();
  if (v === "active" || v === "available") return "Active";
  if (v === "inactive" || v === "unavailable") return "Inactive";
  return "";
}

const StatusOptionGroup: React.FC<StatusOptionGroupProps> = ({
  value,
  onChange,
  required,
  className = "",
  showLabel = false,
  id = "status-option-group",
}) => {
  const current = normalizeStatus(value);

  return (
    <div className={`status-option-group ${className}`.trim()}>
      {showLabel && (
        <label className="form-label mb-1 fw-medium" htmlFor={id}>
          Status{required ? <span className="text-danger ms-1">*</span> : null}
        </label>
      )}
      <div className="status-option-row" role="radiogroup" aria-label="Status" id={id}>
        {OPTIONS.map((opt) => {
          const selected = current === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected}
              className={`status-option-card tone-${opt.tone} ${selected ? "is-selected" : ""}`}
              onClick={() => onChange(opt.value)}
            >
              <span
                className={`status-radio ${selected ? "is-checked" : ""}`}
                aria-hidden
              >
                {selected ? <i className="ti ti-check status-radio-check" /> : null}
              </span>
              <span className="status-option-label">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StatusOptionGroup;
