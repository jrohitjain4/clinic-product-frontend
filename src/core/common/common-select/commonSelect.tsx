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
      backgroundColor: "white",
      border: state.isFocused ? "1.5px solid #6366f1" : "1.5px solid #6366f1",
      boxShadow: "none",
      borderRadius: "12px",
      minHeight: "46px",
      fontSize: "15px",
      fontWeight: "500",
      padding: "2px 8px",
      transition: "all 0.2s ease-in-out",
      "&:hover": {
        border: "1.5px solid #6366f1",
      },
    }),
    option: (base: any, state: any) => ({
      ...base,
      color: "#6C7688",
      backgroundColor: state.isSelected ? "#ddd" : "white",
      cursor: "pointer",
      "&:hover": {
        backgroundColor: state.isFocused ? "#2e37a4" : "white",
        color: state.isFocused ? "#fff" : "#2e37a4",
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
        menuPortal: (base: any) => ({ ...base, zIndex: 9999 }),
      }}
    />
  );
};

export default CommonSelect;
