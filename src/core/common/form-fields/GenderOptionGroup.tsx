import React from "react";
import "./GenderOptionGroup.scss";

export type GenderValue = "Male" | "Female" | "Others" | "";

export interface GenderOptionGroupProps {
  value?: string;
  onChange: (value: GenderValue) => void;
  required?: boolean;
  className?: string;
  /** Show "Gender *" label above the group */
  showLabel?: boolean;
  id?: string;
}

const OPTIONS: { value: GenderValue; label: string; icon: string }[] = [
  { value: "Male", label: "Male", icon: "ti ti-gender-male" },
  { value: "Female", label: "Female", icon: "ti ti-gender-female" },
  { value: "Others", label: "Other", icon: "ti ti-gender-genderqueer" },
];

function normalizeGender(value?: string): GenderValue {
  if (!value) return "";
  const v = value.trim().toLowerCase();
  if (v === "male") return "Male";
  if (v === "female") return "Female";
  if (v === "other" || v === "others") return "Others";
  return "";
}

const GenderOptionGroup: React.FC<GenderOptionGroupProps> = ({
  value,
  onChange,
  required,
  className = "",
  showLabel = false,
  id = "gender-option-group",
}) => {
  const current = normalizeGender(value);

  return (
    <div className={`gender-option-group ${className}`.trim()}>
      {showLabel && (
        <label className="form-label mb-1 fw-medium" htmlFor={id}>
          Gender{required ? <span className="text-danger ms-1">*</span> : null}
        </label>
      )}
      <div className="gender-option-row" role="radiogroup" aria-label="Gender" id={id}>
        {OPTIONS.map((opt) => {
          const selected = current === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected}
              className={`gender-option-card ${selected ? "is-selected" : ""}`}
              onClick={() => onChange(opt.value)}
            >
              <span className={`gender-radio ${selected ? "is-checked" : ""}`} aria-hidden>
                {selected ? <span className="gender-radio-dot" /> : null}
              </span>
              <i className={`${opt.icon} gender-option-icon`} aria-hidden />
              <span className="gender-option-label">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default GenderOptionGroup;
