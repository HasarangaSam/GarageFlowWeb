import { useState } from "react";
import {
  AlertTriangle,
  Boxes,
  Edit2,
  Eye,
  PackagePlus,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import Loading from "../components/ui/Loading";
import InventoryMetrics from "../components/inventory/InventoryMetrics";
import { formatCurrency } from "../utils/formatters";
import PartFormModal from "../components/inventory/PartFormModal";
import StockAdjustmentModal from "../components/inventory/StockAdjustmentModal";
import PartDetailsModal from "../components/inventory/PartDetailsModal";
import {
  useDeletePart,
  useInventorySummary,
  useParts,
} from "../hooks/useParts";
import { useAuth } from "../hooks/useAuth";
import type { Part } from "../types/part";

export default function InventoryPage() {
  const { user } = useAuth();
  const canManage = user?.role === "OWNER" || user?.role === "MANAGER";

  // Filter state
  const [activeFilter, setActiveFilter] = useState<
    "all" | "inStock" | "lowStock" | "outOfStock"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  // Queries
  const {
    data: summaryData,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
  } = useInventorySummary();

  const {
    data: partsData,
    isLoading: isPartsLoading,
    isFetching: isPartsFetching,
    refetch: refetchParts,
  } = useParts({
    page,
    limit: 25,
    search: searchTerm || undefined,
    status: activeFilter,
  });

  const deleteMutation = useDeletePart();

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [partToEdit, setPartToEdit] = useState<Part | null>(null);

  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [partToAdjust, setPartToAdjust] = useState<Part | null>(null);

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [partToView, setPartToView] = useState<Part | null>(null);

  const [partToDelete, setPartToDelete] = useState<Part | null>(null);

  const handleRefresh = () => {
    refetchSummary();
    refetchParts();
  };

  const handleOpenCreate = () => {
    setPartToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (part: Part) => {
    setPartToEdit(part);
    setIsFormOpen(true);
  };

  const handleOpenAdjust = (part: Part) => {
    setPartToAdjust(part);
    setIsAdjustOpen(true);
  };

  const handleOpenDetails = (part: Part) => {
    setPartToView(part);
    setIsDetailsOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (partToDelete) {
      await deleteMutation.mutateAsync(partToDelete.id);
      setPartToDelete(null);
    }
  };

  const parts = partsData?.parts || [];
  const pagination = partsData?.pagination;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-slate-100">
            Inventory Management
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Real-time stock tracking, automated reorder alerts, and warehouse
            pricing
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            disabled={isPartsFetching}
            className="flex items-center gap-1.5"
          >
            <RefreshCw
              size={14}
              className={isPartsFetching ? "animate-spin text-indigo-600" : ""}
            />
            <span>Refresh</span>
          </Button>

          {canManage && (
            <Button
              size="sm"
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5"
            >
              <Plus size={15} />
              <span>Add Part</span>
            </Button>
          )}
        </div>
      </div>

      {/* Metrics Overview Cards */}
      <InventoryMetrics
        summary={summaryData}
        isLoading={isSummaryLoading}
        activeFilter={activeFilter}
        onSelectFilter={(filter) => {
          setActiveFilter(filter);
          setPage(1);
        }}
      />

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs md:flex-row md:items-center md:justify-between dark:border-slate-800/80 dark:bg-slate-900/60">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search by SKU or part name..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-slate-200/80 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-900 transition focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700/80 dark:bg-slate-800/80 dark:text-slate-200 dark:focus:bg-slate-800 dark:placeholder-slate-400"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-slate-200/80 bg-slate-50 p-1 dark:border-slate-800/80 dark:bg-slate-800/50">
          <button
            type="button"
            onClick={() => {
              setActiveFilter("all");
              setPage(1);
            }}
            className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition ${
              activeFilter === "all"
                ? "bg-white text-gray-900 shadow-sm dark:bg-slate-800 dark:text-slate-100 dark:shadow-slate-950/20"
                : "text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            All Parts
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveFilter("inStock");
              setPage(1);
            }}
            className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition ${
              activeFilter === "inStock"
                ? "bg-white text-emerald-700 shadow-sm dark:bg-slate-800 dark:text-emerald-300 dark:shadow-slate-950/20"
                : "text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            In Stock
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveFilter("lowStock");
              setPage(1);
            }}
            className={`cursor-pointer flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
              activeFilter === "lowStock"
                ? "bg-white text-amber-700 shadow-sm dark:bg-slate-800 dark:text-amber-300 dark:shadow-slate-950/20"
                : "text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <span>Low Stock</span>
            {(summaryData?.lowStockCount ?? 0) > 0 && (
              <span className="rounded-full bg-amber-100 px-1.5 py-0.2 text-[10px] font-bold text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                {summaryData?.lowStockCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveFilter("outOfStock");
              setPage(1);
            }}
            className={`cursor-pointer flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
              activeFilter === "outOfStock"
                ? "bg-white text-rose-700 shadow-sm dark:bg-slate-800 dark:text-rose-300 dark:shadow-slate-950/20"
                : "text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <span>Out of Stock</span>
            {(summaryData?.outOfStockCount ?? 0) > 0 && (
              <span className="rounded-full bg-rose-100 px-1.5 py-0.2 text-[10px] font-bold text-rose-700 dark:bg-rose-950/50 dark:text-rose-400">
                {summaryData?.outOfStockCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Parts Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800/80 dark:bg-slate-900/60">
        {isPartsLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loading />
          </div>
        ) : parts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-slate-800 dark:text-slate-500">
              <Boxes size={24} />
            </div>
            <h3 className="mt-3 text-base font-semibold text-gray-900 dark:text-slate-100">
              No parts found
            </h3>
            <p className="mt-1 max-w-sm text-xs text-gray-500 dark:text-slate-400">
              {searchTerm
                ? `No parts match your search query "${searchTerm}". Try resetting the search.`
                : activeFilter !== "all"
                  ? `No parts currently match the "${activeFilter}" filter.`
                  : "Your garage inventory catalog is currently empty."}
            </p>
            {searchTerm || activeFilter !== "all" ? (
              <Button
                variant="secondary"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setSearchTerm("");
                  setActiveFilter("all");
                }}
              >
                Clear Filters
              </Button>
            ) : (
              canManage && (
                <Button size="sm" className="mt-4" onClick={handleOpenCreate}>
                  <Plus size={15} className="mr-1.5" />
                  Add First Part
                </Button>
              )
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50/75 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="py-3.5 px-4">Part / SKU</th>
                  <th className="py-3.5 px-4">Stock Status</th>
                  <th className="py-3.5 px-4 text-right">Cost</th>
                  <th className="py-3.5 px-4 text-right">Selling Price</th>
                  <th className="py-3.5 px-4 text-right">Margin</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {parts.map((part) => {
                  const cost = Number(part.costPrice) || 0;
                  const sell = Number(part.sellingPrice) || 0;
                  const profit = sell - cost;
                  const margin =
                    sell > 0 ? ((profit / sell) * 100).toFixed(0) : "0";

                  const isOutOfStock = part.quantity === 0;
                  const isLowStock =
                    !isOutOfStock && part.quantity <= part.minimumStock;

                  return (
                    <tr
                      key={part.id}
                      className="transition-colors hover:bg-gray-50/70 dark:hover:bg-slate-800/50"
                    >
                      {/* Part info */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900 dark:text-slate-100">
                            {part.name}
                          </span>
                          <span className="font-mono text-xs text-gray-500 dark:text-slate-400">
                            {part.sku}
                          </span>
                          {part.description && (
                            <span className="mt-0.5 line-clamp-1 text-xs text-gray-400 dark:text-slate-400">
                              {part.description}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Stock status */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                isOutOfStock
                                  ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                                  : isLowStock
                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                              }`}
                            >
                              {isOutOfStock ? (
                                "Out of Stock"
                              ) : isLowStock ? (
                                <>
                                  <AlertTriangle size={11} />
                                  <span>Low Stock</span>
                                </>
                              ) : (
                                "In Stock"
                              )}
                            </span>
                            <span className="font-bold text-gray-800 text-sm dark:text-slate-200">
                              {part.quantity} units
                            </span>
                          </div>
                          <span className="text-[11px] text-gray-400 dark:text-slate-500">
                            Min threshold: {part.minimumStock} units
                          </span>
                        </div>
                      </td>

                      {/* Cost */}
                      <td className="py-3 px-4 text-right font-medium text-gray-600 dark:text-slate-300">
                        {formatCurrency(cost)}
                      </td>

                      {/* Selling */}
                      <td className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-slate-100">
                        {formatCurrency(sell)}
                      </td>

                      {/* Margin */}
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`rounded px-1.5 py-0.5 text-xs font-semibold ${
                            Number(margin) >= 30
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                              : Number(margin) > 0
                                ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                                : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                          }`}
                        >
                          {margin}%
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View details / audit history */}
                          <button
                            type="button"
                            title="View details and audit log"
                            onClick={() => handleOpenDetails(part)}
                            className="cursor-pointer rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                          >
                            <Eye size={16} />
                          </button>

                          {canManage && (
                            <>
                              {/* Restock / Adjust */}
                              <button
                                type="button"
                                title="Adjust stock or restock"
                                onClick={() => handleOpenAdjust(part)}
                                className="cursor-pointer rounded-lg p-1.5 text-blue-600 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40 dark:hover:text-blue-300"
                              >
                                <PackagePlus size={16} />
                              </button>

                              {/* Edit */}
                              <button
                                type="button"
                                title="Edit part details"
                                onClick={() => handleOpenEdit(part)}
                                className="cursor-pointer rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                              >
                                <Edit2 size={15} />
                              </button>

                              {/* Delete */}
                              <button
                                type="button"
                                title="Delete part"
                                onClick={() => setPartToDelete(part)}
                                className="cursor-pointer rounded-lg p-1.5 text-rose-500 transition hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
                              >
                                <Trash2 size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6 dark:border-slate-800">
            <span className="text-xs text-gray-500 dark:text-slate-400">
              Showing page {pagination.page} of {pagination.totalPages} (
              {pagination.total} total items)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Part Create/Edit Modal */}
      <PartFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        partToEdit={partToEdit}
      />

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={isAdjustOpen}
        onClose={() => setIsAdjustOpen(false)}
        part={partToAdjust}
      />

      {/* Part Details & History Modal */}
      <PartDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        part={partToView}
        onOpenAdjust={handleOpenAdjust}
        canManage={canManage}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(partToDelete)}
        onClose={() => setPartToDelete(null)}
        title="Confirm Part Deletion"
        size="md"
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-slate-300">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-gray-900 dark:text-slate-100">
              {partToDelete?.name}
            </span>{" "}
            ({partToDelete?.sku})?
          </p>
          <p className="text-xs text-rose-600 dark:text-rose-400">
            Note: Parts that have already been installed in repair jobs cannot
            be deleted to preserve job accounting.
          </p>
          <div className="flex justify-end gap-3 pt-3">
            <Button
              variant="secondary"
              onClick={() => setPartToDelete(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Part"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
