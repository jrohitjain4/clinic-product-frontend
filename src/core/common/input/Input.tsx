import React from 'react';
import './Input.scss';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  leftAddon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  required,
  leftAddon,
  rightIcon,
  error,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || props.name;

  return (
    <div className={`docyori-input-group ${className}`}>
      {label && (
        <label htmlFor={inputId} className="docyori-label">
          {label} {required && <span className="docyori-required">*</span>}
        </label>
      )}
      <div className={`docyori-input-wrapper ${error ? 'has-error' : ''}`}>
        {leftAddon && <div className="docyori-input-addon-left">{leftAddon}</div>}
        <input id={inputId} className="docyori-input" required={required} {...props} />
        {rightIcon && <div className="docyori-input-icon-right">{rightIcon}</div>}
      </div>
      {error && <span className="docyori-error-text">{error}</span>}
    </div>
  );
};

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  required,
  error,
  className = '',
  id,
  ...props
}) => {
  const textareaId = id || props.name;

  return (
    <div className={`docyori-input-group ${className}`}>
      {label && (
        <label htmlFor={textareaId} className="docyori-label">
          {label} {required && <span className="docyori-required">*</span>}
        </label>
      )}
      <div className={`docyori-input-wrapper ${error ? 'has-error' : ''}`}>
        <textarea id={textareaId} className="docyori-textarea" required={required} {...props} />
      </div>
      {error && <span className="docyori-error-text">{error}</span>}
    </div>
  );
};
