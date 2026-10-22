type ToastIconProps = {
  type?: string;
  theme?: string;
};

/** Outline/line icons only — no solid filled circle behind them */
const META: Record<string, { color: string; icon: string; label: string }> = {
  success: { color: "#22c55e", icon: "ti-check", label: "Success" },
  error: { color: "#f97316", icon: "ti-exclamation-mark", label: "Error" },
  warning: { color: "#f59e0b", icon: "ti-alert-triangle", label: "Warning" },
  info: { color: "#3b82f6", icon: "ti-info-circle", label: "Info" },
  default: { color: "#6366f1", icon: "ti-bell", label: "Notice" },
};

const ToastIcon = ({ type }: ToastIconProps) => {
  const meta = META[type || "default"] || META.default;
  return (
    <i
      className={`ti ${meta.icon} app-toast-icon`}
      style={{ color: meta.color }}
      aria-label={meta.label}
    />
  );
};

export default ToastIcon;
