import React from 'react';
import './Radio.scss';

export interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Radio: React.FC<RadioProps> = ({
  label,
  className = '',
  id,
  ...props
}) => {
  const radioId = id || props.name + '-' + props.value;

  return (
    <label className={`docyori-radio-wrapper ${className}`} htmlFor={radioId}>
      <input 
        type="radio" 
        id={radioId} 
        className="docyori-radio-input" 
        {...props} 
      />
      <span className="docyori-radio-custom"></span>
      <span className="docyori-radio-label">{label}</span>
    </label>
  );
};

export interface RadioGroupProps {
  label?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  label,
  required,
  children,
  className = ''
}) => {
  return (
    <div className={`docyori-radio-group-container ${className}`}>
      {label && (
        <label className="docyori-label">
          {label} {required && <span className="docyori-required">*</span>}
        </label>
      )}
      <div className="docyori-radio-group">
        {children}
      </div>
    </div>
  );
};
