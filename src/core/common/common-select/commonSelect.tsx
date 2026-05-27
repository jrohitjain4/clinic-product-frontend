import React, { useEffect, useState } from "react";
import Select from "react-select";

export type Option = {
  value: string;
  label: string;
};

export interface SelectProps {
  options: Option[];
  defaultValue?: Option;
  /** Controlled value — use with onChange for dependent dropdowns */
  value?: Option | null;
  className?: string;
  styles?: any;
  placeholder?: string;
  isDisabled?: boolean;
  onChange?: (option: Option | null) => void;
}

const CommonSelect: React.FC<SelectProps> = ({
  options,
  defaultValue,
  value,
  className,
  placeholder = "Select",
  isDisabled = false,
  onChange,
}) => {
  const isControlled = value !== undefined;
  const [selectedOption, setSelectedOption] = useState<Option | undefined>(defaultValue);

  const customStyles = {
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

  const handleChange = (option: Option | null) => {
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
      styles={customStyles}
      options={options}
      value={displayValue}
      onChange={handleChange}
      placeholder={placeholder}
      isDisabled={isDisabled}
      isClearable
    />
  );
};

export default CommonSelect;
