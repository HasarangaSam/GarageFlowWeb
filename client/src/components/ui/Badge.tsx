import type { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  className?: string;
}

const variantClasses = {
  default:
    "bg-slate-100 text-slate-700 border border-slate-200/80 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700/60",
  success:
    "bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30",
  warning:
    "bg-amber-50 text-amber-700 border border-amber-200/80 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30",
  danger:
    "bg-rose-50 text-rose-700 border border-rose-200/80 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30",
  info:
    "bg-indigo-50 text-indigo-700 border border-indigo-200/80 dark:bg-indigo-500/15 dark:text-indigo-400 dark:border-indigo-500/30",
};

export default function Badge({
  children,
  variant = "default",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
