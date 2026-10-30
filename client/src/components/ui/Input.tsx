import { forwardRef, type InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, helperText, id, className = "", ...props },
  ref,
) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}

          {props.required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      <input
        ref={ref}
        id={id}
        className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:disabled:bg-slate-800/40 dark:disabled:text-slate-500 ${
          error
            ? "border-red-400 focus:border-red-500 focus:ring-red-100 dark:border-red-500/80 dark:focus:ring-red-950/40"
            : "border-slate-300 focus:border-indigo-500 focus:ring-indigo-100 dark:border-slate-700/80 dark:focus:border-indigo-500 dark:focus:ring-indigo-500/20"
        } ${className}`}
        aria-invalid={Boolean(error)}
        aria-describedby={
          error ? `${id}-error` : helperText ? `${id}-helper` : undefined
        }
        {...props}
      />

      {error && (
        <p id={`${id}-error`} className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {!error && helperText && (
        <p id={`${id}-helper`} className="text-xs text-slate-500 dark:text-slate-400">
          {helperText}
        </p>
      )}
    </div>
  );
});

export default Input;
