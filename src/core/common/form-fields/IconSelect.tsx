import React from "react";
import CommonSelect from "../common-select/commonSelect";
import type { SelectProps } from "../common-select/commonSelect";
import { getFieldIcon } from "./fieldIcons";
import "./IconField.scss";

export interface IconSelectProps extends SelectProps {
  icon?: string;
  fieldLabel?: string;
}

/**
 * Force-match global `.form-control` look:
 * height 46px, radius 12px, purple border #6366f1, text weight 500
 */
const formControlSelectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    minHeight: "46px",
    height: "46px",
    borderRadius: "12px",
    borderWidth: "1.5px",
    borderStyle: "solid",
    borderColor: state.isDisabled
      ? "#cbd5e1"
      : state.isFocused
        ? "#4f46e5"
        : "#6366f1",
    boxShadow: state.isFocused ? "0 4px 15px rgba(99, 102, 241, 0.25)" : "none",
    backgroundColor: state.isDisabled ? "#f8fafc" : "#fff",
    fontSize: "15px",
    fontWeight: 500,
    paddingTop: 0,
    paddingRight: 8,
    paddingBottom: 0,
    paddingLeft: 8,
    transition: "all 0.2s ease-in-out",
    cursor: state.isDisabled ? "not-allowed" : "pointer",
    "&:hover": {
      borderColor: state.isDisabled
        ? "#cbd5e1"
        : state.isFocused
          ? "#4f46e5"
          : "#6366f1",
    },
  }),
  valueContainer: (base: any) => ({
    ...base,
    padding: "0 8px",
    height: "44px",
    display: "flex",
    alignItems: "center",
  }),
  indicatorsContainer: (base: any) => ({
    ...base,
    height: "44px",
  }),
  dropdownIndicator: (base: any) => ({
    ...base,
    padding: "8px",
    color: "#94a3b8",
  }),
  clearIndicator: (base: any) => ({
    ...base,
    padding: "8px",
    color: "#94a3b8",
  }),
  indicatorSeparator: () => ({
    display: "none",
  }),
  placeholder: (base: any) => ({
    ...base,
    color: "#94a3b8",
    fontWeight: 500,
    fontSize: "15px",
  }),
  singleValue: (base: any, state: any) => ({
    ...base,
    color: state.isDisabled ? "#0f172a" : "#475569",
    fontWeight: 500,
    fontSize: "15px",
  }),
  input: (base: any) => ({
    ...base,
    margin: 0,
    padding: 0,
    color: "#475569",
    fontWeight: 500,
    fontSize: "15px",
  }),
};

/** CommonSelect with optional left colorful boxed icon. */
const IconSelect: React.FC<IconSelectProps> = ({
  icon,
  fieldLabel,
  className = "",
  styles,
  ...props
}) => {
  const resolvedIcon = icon ?? getFieldIcon(fieldLabel);

  const mergedStyles = {
    ...formControlSelectStyles,
    ...styles,
    control: (base: any, state: any) => {
      const matched = formControlSelectStyles.control(base, state);
      const prev = styles?.control ? styles.control(matched, state) : matched;
      return {
        ...prev,
        ...(resolvedIcon ? { paddingLeft: 56 } : null),
      };
    },
    valueContainer: (base: any, state: any) => {
      const matched = formControlSelectStyles.valueContainer(base);
      return styles?.valueContainer ? styles.valueContainer(matched, state) : matched;
    },
    indicatorsContainer: (base: any, state: any) => {
      const matched = formControlSelectStyles.indicatorsContainer(base);
      return styles?.indicatorsContainer
        ? styles.indicatorsContainer(matched, state)
        : matched;
    },
    dropdownIndicator: (base: any, state: any) => {
      const matched = formControlSelectStyles.dropdownIndicator(base);
      return styles?.dropdownIndicator
        ? styles.dropdownIndicator(matched, state)
        : matched;
    },
    clearIndicator: (base: any, state: any) => {
      const matched = formControlSelectStyles.clearIndicator(base);
      return styles?.clearIndicator
        ? styles.clearIndicator(matched, state)
        : matched;
    },
    indicatorSeparator: () => formControlSelectStyles.indicatorSeparator(),
    placeholder: (base: any, state: any) => {
      const matched = formControlSelectStyles.placeholder(base);
      return styles?.placeholder ? styles.placeholder(matched, state) : matched;
    },
    singleValue: (base: any, state: any) => {
      const matched = formControlSelectStyles.singleValue(base, state);
      return styles?.singleValue ? styles.singleValue(matched, state) : matched;
    },
    input: (base: any, state: any) => {
      const matched = formControlSelectStyles.input(base);
      return styles?.input ? styles.input(matched, state) : matched;
    },
  };

  if (!resolvedIcon) {
    return (
      <CommonSelect
        className={`icon-select ${className}`.trim()}
        styles={mergedStyles}
        {...props}
      />
    );
  }

  return (
    <div className="icon-field-start icon-select-wrap position-relative">
      <span className="icon-field-addon">
        <span className="icon-field-box">
          <i className={resolvedIcon} />
        </span>
      </span>
      <CommonSelect
        className={`select icon-select ${className}`.trim()}
        styles={mergedStyles}
        {...props}
      />
    </div>
  );
};

export default IconSelect;
