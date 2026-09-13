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
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label}

          {props.required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      <input
        ref={ref}
        id={id}
        className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-100 ${
          error
            ? "border-red-400 focus:border-red-500 focus:ring-red-100"
            : "border-gray-300 focus:border-gray-500 focus:ring-gray-100"
        } ${className}`}
        aria-invalid={Boolean(error)}
        aria-describedby={
          error ? `${id}-error` : helperText ? `${id}-helper` : undefined
        }
        {...props}
      />

      {error && (
        <p id={`${id}-error`} className="text-xs text-red-600">
          {error}
        </p>
      )}

      {!error && helperText && (
        <p id={`${id}-helper`} className="text-xs text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
});

export default Input;
