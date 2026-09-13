import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";

export interface SearchableOption {
  value: string;
  label: string;
  subLabel?: string;
  badge?: string;
}

interface SearchableSelectProps {
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  id?: string;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  searchPlaceholder = "Type to search...",
  label,
  error,
  disabled = false,
  required = false,
  isLoading = false,
  emptyMessage = "No matching options found.",
  className = "",
  id,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Filter options based on search term
  const filteredOptions = options.filter((opt) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      opt.label.toLowerCase().includes(term) ||
      (opt.subLabel && opt.subLabel.toLowerCase().includes(term)) ||
      (opt.badge && opt.badge.toLowerCase().includes(term))
    );
  });

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearch("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearch("");
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        id={id}
        disabled={disabled || isLoading}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border bg-white px-3.5 py-2.5 text-left text-sm transition-all focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60 ${
          error
            ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
            : isOpen
              ? "border-indigo-500 ring-2 ring-indigo-50"
              : "border-slate-200/80 hover:border-slate-300 focus:border-indigo-500 focus:ring-indigo-50"
        }`}
      >
        <div className="min-w-0 flex-1">
          {isLoading ? (
            <span className="text-xs text-slate-400">Loading options...</span>
          ) : selectedOption ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate font-medium text-slate-900">
                {selectedOption.label}
              </span>
              {selectedOption.badge && (
                <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-700">
                  {selectedOption.badge}
                </span>
              )}
              {selectedOption.subLabel && (
                <span className="truncate text-xs text-slate-400">
                  {selectedOption.subLabel}
                </span>
              )}
            </div>
          ) : (
            <span className="text-sm text-slate-400">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {selectedOption && !disabled && (
            <span
              role="button"
              tabIndex={0}
              aria-label="Clear selection"
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onChange("");
                  setSearch("");
                }
              }}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            >
              <X size={14} />
            </span>
          )}
          <ChevronDown
            size={16}
            className={`text-slate-400 transition-transform duration-150 ${
              isOpen ? "rotate-180 text-indigo-600" : ""
            }`}
          />
        </div>
      </button>

      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 max-h-72 w-full overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xl ring-1 ring-black/5 animate-in fade-in-50 zoom-in-95 duration-100">
          {/* Search Box */}
          <div className="sticky top-0 z-10 border-b border-slate-100 bg-white p-2">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setIsOpen(false);
                  }
                }}
                placeholder={searchPlaceholder}
                className="w-full rounded-lg bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-1 focus:ring-indigo-500"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`group flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-xs transition ${
                      isSelected
                        ? "bg-indigo-50 font-semibold text-indigo-900"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate">{opt.label}</span>
                        {opt.badge && (
                          <span className="inline-flex items-center rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-700">
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      {opt.subLabel && (
                        <p className="truncate text-[11px] text-slate-400 mt-0.5">
                          {opt.subLabel}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <Check size={14} className="shrink-0 text-indigo-600" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
