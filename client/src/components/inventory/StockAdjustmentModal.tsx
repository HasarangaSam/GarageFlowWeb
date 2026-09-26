/* eslint-disable react-hooks/set-state-in-effect -- The modal intentionally resets its local draft when opened. */
import { useState, useEffect } from "react";
import {
  AlertCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  PackagePlus,
  RefreshCw,
} from "lucide-react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Modal from "../ui/Modal";
import type { Part } from "../../types/part";
import { useAdjustStock } from "../../hooks/useParts";
import { getErrorMessage } from "../../utils/errorMessage";

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  part: Part | null;
}

export default function StockAdjustmentModal({
  isOpen,
  onClose,
  part,
}: StockAdjustmentModalProps) {
  const adjustMutation = useAdjustStock();

  const [type, setType] = useState<
    "PURCHASE" | "ADJUSTMENT" | "RETURN" | "DAMAGE"
  >("PURCHASE");
  const [quantity, setQuantity] = useState<number>(5);
  const [adjustmentDirection, setAdjustmentDirection] = useState<"add" | "sub">(
    "add",
  );
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setType("PURCHASE");
      setQuantity(5);
      setAdjustmentDirection("add");
      setReason("");
      setError(null);
    }
  }, [isOpen, part]);

  if (!part) return null;

  const currentStock = part.quantity;

  // Compute delta and projected stock
  let delta = 0;
  if (type === "PURCHASE" || type === "RETURN") {
    delta = Math.abs(quantity);
  } else if (type === "DAMAGE") {
    delta = -Math.abs(quantity);
  } else if (type === "ADJUSTMENT") {
    delta = adjustmentDirection === "add" ? Math.abs(quantity) : -Math.abs(quantity);
  }

  const projectedStock = currentStock + delta;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) {
      setError("Quantity must be greater than zero");
      return;
    }
    if (projectedStock < 0) {
      setError(
        `Cannot reduce stock below zero. Current stock is ${currentStock}.`,
      );
      return;
    }

    try {
      await adjustMutation.mutateAsync({
        id: part.id,
        data: {
          type,
          quantity: delta,
          reason: reason.trim() || undefined,
        },
      });
      onClose();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to adjust stock"));
    }
  };

  const isSubmitting = adjustMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Adjust Stock: ${part.name}`}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Part summary card */}
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs">
          <div>
            <p className="font-mono font-medium text-gray-500">{part.sku}</p>
            <p className="font-medium text-gray-800">{part.name}</p>
          </div>
          <div className="text-right">
            <span className="text-gray-500">Current Stock</span>
            <p className="text-base font-bold text-gray-900">
              {part.quantity} units
            </p>
          </div>
        </div>

        {/* Action Type */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Adjustment Type
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <button
              type="button"
              onClick={() => setType("PURCHASE")}
              className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-xs font-medium transition ${
                type === "PURCHASE"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600"
                  : "border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <PackagePlus size={16} />
              <span>Restock</span>
            </button>

            <button
              type="button"
              onClick={() => setType("ADJUSTMENT")}
              className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-xs font-medium transition ${
                type === "ADJUSTMENT"
                  ? "border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600"
                  : "border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <RefreshCw size={16} />
              <span>Recount</span>
            </button>

            <button
              type="button"
              onClick={() => setType("DAMAGE")}
              className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-xs font-medium transition ${
                type === "DAMAGE"
                  ? "border-rose-600 bg-rose-50 text-rose-700 ring-1 ring-rose-600"
                  : "border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <ArrowDownCircle size={16} />
              <span>Damage</span>
            </button>

            <button
              type="button"
              onClick={() => setType("RETURN")}
              className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-xs font-medium transition ${
                type === "RETURN"
                  ? "border-purple-600 bg-purple-50 text-purple-700 ring-1 ring-purple-600"
                  : "border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <ArrowUpCircle size={16} />
              <span>Return</span>
            </button>
          </div>
        </div>

        {/* If recount/adjustment, allow add or subtract */}
        {type === "ADJUSTMENT" && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Discrepancy Direction
            </label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="direction"
                  checked={adjustmentDirection === "add"}
                  onChange={() => setAdjustmentDirection("add")}
                  className="text-blue-600"
                />
                <span>Add surplus (+ units found)</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="direction"
                  checked={adjustmentDirection === "sub"}
                  onChange={() => setAdjustmentDirection("sub")}
                  className="text-rose-600"
                />
                <span>Subtract shortage (- units missing)</span>
              </label>
            </div>
          </div>
        )}

        {/* Quantity */}
        <div>
          <label className="block text-xs font-medium text-gray-700">
            {type === "PURCHASE"
              ? "Units Received"
              : type === "DAMAGE"
              ? "Units Damaged / Scrapped"
              : type === "RETURN"
              ? "Units Returned"
              : "Units to Adjust"}
          </label>
          <Input
            type="number"
            min={1}
            step={1}
            value={quantity}
            onChange={(e) => {
              setQuantity(Math.max(1, parseInt(e.target.value) || 1));
              setError(null);
            }}
            disabled={isSubmitting}
          />
        </div>

        {/* Projected stock preview */}
        <div className="rounded-lg border border-blue-100 bg-blue-50/70 p-3 text-xs flex items-center justify-between">
          <span className="text-gray-600">Projected stock after adjustment:</span>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 line-through">{currentStock}</span>
            <span className="text-gray-400">→</span>
            <span
              className={`font-bold text-sm ${
                projectedStock === 0
                  ? "text-rose-600"
                  : projectedStock <= part.minimumStock
                  ? "text-amber-600"
                  : "text-emerald-700"
              }`}
            >
              {projectedStock} units
            </span>
          </div>
        </div>

        {/* Reason / Reference */}
        <div>
          <label className="block text-xs font-medium text-gray-700">
            Reason / Supplier PO / Note (optional)
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Supplier PO #4092 or End-of-month recount"
            disabled={isSubmitting}
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700 border border-rose-200">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-3 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || projectedStock < 0}>
            {isSubmitting ? "Applying..." : "Confirm Adjustment"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
