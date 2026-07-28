import React from "react";
import { getFieldIcon } from "./fieldIcons";
import "./IconField.scss";

export interface IconFormControlProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Tabler icon class, e.g. "ti ti-home". If omitted, derived from fieldLabel. */
  icon?: string;
  /** Used to look up icon when `icon` is not passed. */
  fieldLabel?: string;
  /** Extra class on the outer wrapper */
  wrapperClassName?: string;
}

/**
 * Bootstrap form-control with optional left Tabler icon in a colorful box.
 * Uses flex layout (not absolute) so global form-control padding cannot cover text.
 */
const IconFormControl = React.forwardRef<HTMLInputElement, IconFormControlProps>(
  (
    {
      icon,
      fieldLabel,
      wrapperClassName = "",
      className = "",
      style,
      disabled,
      ...props
    },
    ref
  ) => {
    const resolvedIcon = icon ?? getFieldIcon(fieldLabel);

    if (!resolvedIcon) {
      return (
        <input
          ref={ref}
          className={`form-control ${className}`.trim()}
          style={style}
          disabled={disabled}
          {...props}
        />
      );
    }

    return (
      <div
        className={`icon-field-shell ${disabled ? "is-disabled" : ""} ${wrapperClassName}`.trim()}
      >
        <span className="icon-field-box" aria-hidden>
          <i className={resolvedIcon} />
        </span>
        <input
          ref={ref}
          className={`form-control icon-field-input ${className}`.trim()}
          style={style}
          disabled={disabled}
          {...props}
        />
      </div>
    );
  }
);

IconFormControl.displayName = "IconFormControl";

export interface IconTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  icon?: string;
  fieldLabel?: string;
  wrapperClassName?: string;
}

export const IconTextarea = React.forwardRef<HTMLTextAreaElement, IconTextareaProps>(
  ({ icon, fieldLabel, wrapperClassName = "", className = "", style, disabled, ...props }, ref) => {
    const resolvedIcon = icon ?? getFieldIcon(fieldLabel);

    if (!resolvedIcon) {
      return (
        <textarea
          ref={ref}
          className={`form-control ${className}`.trim()}
          style={style}
          disabled={disabled}
          {...props}
        />
      );
    }

    return (
      <div
        className={`icon-field-shell icon-textarea-shell ${disabled ? "is-disabled" : ""} ${wrapperClassName}`.trim()}
      >
        <span className="icon-field-box" aria-hidden>
          <i className={resolvedIcon} />
        </span>
        <textarea
          ref={ref}
          className={`form-control icon-field-input ${className}`.trim()}
          style={style}
          disabled={disabled}
          {...props}
        />
      </div>
    );
  }
);

IconTextarea.displayName = "IconTextarea";

export default IconFormControl;
