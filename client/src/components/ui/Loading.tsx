interface LoadingProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

const sizeClasses = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-4",
};

export default function Loading({
  size = "md",
  text,
  className = "",
}: LoadingProps) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      <span
        className={`animate-spin rounded-full border-gray-200 border-t-gray-900 ${sizeClasses[size]}`}
        aria-label="Loading"
      />

      {text && <span className="text-sm text-gray-500">{text}</span>}
    </div>
  );
}
