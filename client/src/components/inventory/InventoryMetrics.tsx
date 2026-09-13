import {
  AlertTriangle,
  Boxes,
  DollarSign,
  TrendingUp,
  XCircle,
} from "lucide-react";
import type { InventorySummary } from "../../types/part";
import { formatCurrency } from "../../utils/formatters";

interface InventoryMetricsProps {
  summary?: InventorySummary;
  isLoading: boolean;
  activeFilter: "all" | "inStock" | "lowStock" | "outOfStock";
  onSelectFilter: (
    filter: "all" | "inStock" | "lowStock" | "outOfStock",
  ) => void;
}

export default function InventoryMetrics({
  summary,
  isLoading,
  activeFilter,
  onSelectFilter,
}: InventoryMetricsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total SKUs */}
      <button
        type="button"
        onClick={() => onSelectFilter("all")}
        className={`flex flex-col justify-between rounded-xl border p-5 text-left transition-all hover:shadow-md ${
          activeFilter === "all"
            ? "border-blue-500 bg-blue-50/40 ring-1 ring-blue-500"
            : "border-gray-200 bg-white hover:border-gray-300"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">
            Total Catalog
          </span>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            <Boxes size={20} />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold text-gray-900">
            {summary?.totalSkus ?? 0}
            <span className="ml-2 text-xs font-normal text-gray-500">
              unique SKUs
            </span>
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {summary?.totalItems ?? 0} units total in inventory
          </p>
        </div>
      </button>

      {/* In Stock & Valuation */}
      <button
        type="button"
        onClick={() => onSelectFilter("inStock")}
        className={`flex flex-col justify-between rounded-xl border p-5 text-left transition-all hover:shadow-md ${
          activeFilter === "inStock"
            ? "border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500"
            : "border-gray-200 bg-white hover:border-gray-300"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">
            Inventory Valuation
          </span>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
            <DollarSign size={20} />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(summary?.totalValuation)}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <TrendingUp size={13} />
            <span>Retail val: {formatCurrency(summary?.totalRetailValue)}</span>
          </div>
        </div>
      </button>

      {/* Low Stock Alerts */}
      <button
        type="button"
        onClick={() => onSelectFilter("lowStock")}
        className={`flex flex-col justify-between rounded-xl border p-5 text-left transition-all hover:shadow-md ${
          activeFilter === "lowStock"
            ? "border-amber-500 bg-amber-50/40 ring-1 ring-amber-500"
            : "border-gray-200 bg-white hover:border-gray-300"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">
            Low Stock Warning
          </span>
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              (summary?.lowStockCount ?? 0) > 0
                ? "bg-amber-100 text-amber-600 animate-pulse"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            <AlertTriangle size={20} />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold text-gray-900">
            {summary?.lowStockCount ?? 0}
            <span className="ml-2 text-xs font-normal text-gray-500">
              SKUs below min
            </span>
          </p>
          <p className="mt-1 text-xs text-amber-600 font-medium">
            {(summary?.lowStockCount ?? 0) > 0
              ? "Reordering recommended"
              : "All stock at healthy levels"}
          </p>
        </div>
      </button>

      {/* Out of Stock */}
      <button
        type="button"
        onClick={() => onSelectFilter("outOfStock")}
        className={`flex flex-col justify-between rounded-xl border p-5 text-left transition-all hover:shadow-md ${
          activeFilter === "outOfStock"
            ? "border-rose-500 bg-rose-50/40 ring-1 ring-rose-500"
            : "border-gray-200 bg-white hover:border-gray-300"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">
            Out of Stock
          </span>
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              (summary?.outOfStockCount ?? 0) > 0
                ? "bg-rose-100 text-rose-600"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            <XCircle size={20} />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold text-gray-900">
            {summary?.outOfStockCount ?? 0}
            <span className="ml-2 text-xs font-normal text-gray-500">
              items depleted
            </span>
          </p>
          <p className="mt-1 text-xs text-rose-600 font-medium">
            {(summary?.outOfStockCount ?? 0) > 0
              ? "Critical: cannot assign to jobs"
              : "No stockouts currently"}
          </p>
        </div>
      </button>
    </div>
  );
}
