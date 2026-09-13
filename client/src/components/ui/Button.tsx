import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const variantClasses = {
  primary:
    "bg-slate-900 text-white shadow-xs hover:bg-slate-800 disabled:bg-slate-300",

  secondary:
    "border border-slate-200/80 bg-white text-slate-700 shadow-xs hover:bg-slate-50 hover:text-slate-900 disabled:bg-slate-100",

  danger: "bg-rose-600 text-white shadow-xs hover:bg-rose-700 disabled:bg-rose-300",

  ghost:
    "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:bg-transparent",
};

const sizeClasses = {
  sm: "px-3 py-1.5 text-xs font-medium",
  md: "px-4 py-2 text-xs font-semibold",
  lg: "px-5 py-2.5 text-sm font-semibold",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {loading && (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      )}

      {children}
    </button>
  );
}
