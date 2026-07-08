import React, { useEffect, useState } from "react";
import Select from "react-select";

export type Option = {
  value: string;
  label: string;
};

export interface SelectProps {
  options: Option[];
  defaultValue?: Option | Option[];
  /** Controlled value — use with onChange for dependent dropdowns */
  value?: Option | Option[] | null;
  className?: string;
  styles?: any;
  placeholder?: string;
  isDisabled?: boolean;
  isMulti?: boolean;
  onChange?: (option: any) => void;
  filterOption?: (option: any, inputValue: string) => boolean;
  formatOptionLabel?: (option: any, formatOptionLabelMeta: any) => React.ReactNode;
  isSearchable?: boolean;
}

const CommonSelect: React.FC<SelectProps> = ({
  options,
  defaultValue,
  value,
  className,
  placeholder = "Select",
  isDisabled = false,
  isMulti = false,
  onChange,
  filterOption,
  formatOptionLabel,
  isSearchable = true,
  styles,
}) => {
  const isControlled = value !== undefined;
  const [selectedOption, setSelectedOption] = useState<any>(defaultValue);
  const [menuSearch, setMenuSearch] = useState("");

  const filteredOptions = menuSearch
    ? options.filter((opt) => opt.label.toLowerCase().includes(menuSearch.toLowerCase()))
    : options;

  const customStyles = {
    control: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isDisabled ? "#f8fafc" : "white",
      border: state.isDisabled 
        ? "1.5px solid #cbd5e1" 
        : state.isFocused 
          ? "1.5px solid #6366f1" 
          : "1.5px solid #6366f1",
      boxShadow: "none",
      borderRadius: "12px",
      minHeight: "46px",
      fontSize: "15px",
      fontWeight: "500",
      padding: "2px 8px",
      transition: "all 0.2s ease-in-out",
      "&:hover": {
        border: state.isDisabled ? "1.5px solid #cbd5e1" : "1.5px solid #6366f1",
      },
    }),
    singleValue: (base: any, state: any) => ({
      ...base,
      color: state.isDisabled ? "#0f172a" : "#475569",
      fontWeight: state.isDisabled ? "700" : "500",
    }),
    option: (base: any, state: any) => ({
      ...base,
      color: state.isDisabled 
        ? "#cbd5e1" 
        : state.isSelected || state.isFocused 
          ? "#fff" 
          : "#6C7688",
      backgroundColor: state.isDisabled
        ? "#f8fafc"
        : state.isSelected || state.isFocused 
          ? "#2e37a4" 
          : "white",
      cursor: state.isDisabled ? "not-allowed" : "pointer",
      "&:hover": {
        backgroundColor: state.isDisabled ? "#f8fafc" : "#2e37a4",
        color: state.isDisabled ? "#cbd5e1" : "#fff",
      },
    }),
  };

  const handleChange = (option: any) => {
    setSelectedOption(option || undefined);
    if (onChange) onChange(option);
  };

  useEffect(() => {
    if (!isControlled) {
      setSelectedOption(defaultValue || undefined);
    }
  }, [defaultValue, isControlled]);

  const displayValue = isControlled ? value : selectedOption;

  return (
    <Select
      classNamePrefix="react-select"
      className={className}
      options={options}
      value={displayValue}
      onChange={handleChange}
      placeholder={placeholder}
      isDisabled={isDisabled}
      isMulti={isMulti}
      isClearable
      filterOption={filterOption}
      formatOptionLabel={formatOptionLabel}
      isSearchable={isSearchable}
      menuPortalTarget={document.body}
      menuPosition="fixed"
      styles={{
        ...customStyles,
        ...styles,
        menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
      }}
    />
  );
};

export default CommonSelect;
