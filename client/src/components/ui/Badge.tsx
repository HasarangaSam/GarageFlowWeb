import type { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  className?: string;
}

const variantClasses = {
  default: "bg-slate-100 text-slate-700 border border-slate-200/80",
  success: "bg-emerald-50 text-emerald-700 border border-emerald-200/80",
  warning: "bg-amber-50 text-amber-700 border border-amber-200/80",
  danger: "bg-rose-50 text-rose-700 border border-rose-200/80",
  info: "bg-indigo-50 text-indigo-700 border border-indigo-200/80",
};

export default function Badge({
  children,
  variant = "default",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
