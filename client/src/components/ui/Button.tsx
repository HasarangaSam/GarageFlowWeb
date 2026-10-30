import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const variantClasses = {
  primary:
    "bg-slate-900 text-white shadow-xs hover:bg-slate-800 disabled:bg-slate-300 dark:bg-indigo-600 dark:hover:bg-indigo-500 dark:text-white dark:disabled:bg-indigo-950/40 dark:shadow-indigo-950/50",

  secondary:
    "border border-slate-200/80 bg-white text-slate-700 shadow-xs hover:bg-slate-50 hover:text-slate-900 disabled:bg-slate-100 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-700/80 dark:hover:text-white dark:disabled:bg-slate-800/40",

  danger:
    "bg-rose-600 text-white shadow-xs hover:bg-rose-700 disabled:bg-rose-300 dark:bg-rose-600 dark:hover:bg-rose-500 dark:disabled:bg-rose-950/40",

  ghost:
    "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:bg-transparent dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100 dark:disabled:bg-transparent",
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
      className={`inline-flex items-center justify-center gap-2 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
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
