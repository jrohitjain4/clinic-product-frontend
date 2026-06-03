import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'text';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  isIconButton?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  icon,
  iconPosition = 'left',
  isIconButton = false,
  className = '',
  ...props
}) => {
  const getVariantClass = () => {
    switch(variant) {
      case 'primary': return 'btn-primary';
      case 'secondary': return 'btn-light';
      case 'success': return 'btn-success';
      case 'danger': return 'btn-danger';
      case 'outline': return 'btn-outline-primary';
      case 'text': return 'btn-link';
      default: return 'btn-primary';
    }
  };

  const getSizeClass = () => {
    switch(size) {
      case 'small': return 'btn-sm';
      case 'large': return 'btn-lg';
      case 'medium': 
      default: return '';
    }
  };

  const baseClass = 'btn';
  const variantClass = getVariantClass();
  const sizeClass = getSizeClass();
  const iconOnlyClass = isIconButton ? 'btn-icon' : '';

  return (
    <button
      className={`${baseClass} ${variantClass} ${sizeClass} ${iconOnlyClass} ${className}`.trim()}
      {...props}
    >
      {icon && iconPosition === 'left' && <span className="btn-icon-left">{icon}</span>}
      {!isIconButton && children}
      {icon && iconPosition === 'right' && <span className="btn-icon-right">{icon}</span>}
    </button>
  );
};
