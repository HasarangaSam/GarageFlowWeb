import {
  ArrowDownRight,
  ArrowUpRight,
  History,
} from "lucide-react";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import type { InventoryTransactionType, Part } from "../../types/part";
import { usePartTransactions } from "../../hooks/useParts";
import { formatCurrency } from "../../utils/formatters";

interface PartDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  part: Part | null;
  onOpenAdjust?: (part: Part) => void;
  canManage?: boolean;
}

export default function PartDetailsModal({
  isOpen,
  onClose,
  part,
  onOpenAdjust,
  canManage = false,
}: PartDetailsModalProps) {
  const { data: transactionData, isLoading } = usePartTransactions(
    isOpen && part ? part.id : null,
  );

  if (!part) return null;

  const cost = Number(part.costPrice) || 0;
  const sell = Number(part.sellingPrice) || 0;
  const profit = sell - cost;
  const margin = sell > 0 ? ((profit / sell) * 100).toFixed(1) : "0.0";

  const getBadgeStyle = (type: InventoryTransactionType) => {
    switch (type) {
      case "PURCHASE":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "JOB_USAGE":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "DAMAGE":
        return "bg-rose-100 text-rose-700 border-rose-200";
      case "RETURN":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "ADJUSTMENT":
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getTransactionSign = (type: InventoryTransactionType) => {
    switch (type) {
      case "PURCHASE":
      case "RETURN":
        return { sign: "+", color: "text-emerald-600", Icon: ArrowUpRight };
      case "JOB_USAGE":
      case "DAMAGE":
        return { sign: "-", color: "text-rose-600", Icon: ArrowDownRight };
      case "ADJUSTMENT":
      default:
        return { sign: "±", color: "text-blue-600", Icon: History };
    }
  };

  const transactions = transactionData?.transactions || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Part Details & Stock History"
      size="xl"
    >
      <div className="space-y-5">
        {/* Header summary */}
        <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-gray-200 text-gray-800">
                {part.sku}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  part.quantity === 0
                    ? "bg-rose-100 text-rose-700"
                    : part.quantity <= part.minimumStock
                    ? "bg-amber-100 text-amber-700"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {part.quantity === 0
                  ? "Out of Stock"
                  : part.quantity <= part.minimumStock
                  ? `Low Stock (${part.quantity}/${part.minimumStock})`
                  : `In Stock (${part.quantity})`}
              </span>
            </div>
            <h3 className="mt-1 text-lg font-bold text-gray-900">{part.name}</h3>
            {part.description && (
              <p className="mt-1 text-xs text-gray-500">{part.description}</p>
            )}
          </div>

          {canManage && onOpenAdjust && (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                onClick={() => {
                  onClose();
                  onOpenAdjust(part);
                }}
              >
                Adjust / Restock
              </Button>
            </div>
          )}
        </div>

        {/* Key stats breakdown */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <span className="text-gray-500">Cost Price</span>
            <p className="text-base font-bold text-gray-900">{formatCurrency(cost)}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <span className="text-gray-500">Selling Price</span>
            <p className="text-base font-bold text-gray-900">{formatCurrency(sell)}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <span className="text-gray-500">Unit Profit</span>
            <p
              className={`text-base font-bold ${
                profit >= 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {formatCurrency(profit)}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <span className="text-gray-500">Gross Margin</span>
            <p
              className={`text-base font-bold ${
                Number(margin) >= 30 ? "text-emerald-600" : "text-amber-600"
              }`}
            >
              {margin}%
            </p>
          </div>
        </div>

        {/* Transaction History Log */}
        <div>
          <div className="flex items-center justify-between pb-2 border-b">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <History size={16} className="text-gray-500" />
              <span>Stock Movement Audit Log</span>
            </div>
            <span className="text-xs text-gray-500">
              {transactions.length} recorded events
            </span>
          </div>

          <div className="mt-3 max-h-64 overflow-y-auto">
            {isLoading ? (
              <div className="py-8 text-center text-xs text-gray-400 animate-pulse">
                Loading audit history...
              </div>
            ) : transactions.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-500">
                No inventory transactions recorded yet for this part.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-gray-50 text-gray-500 border-b">
                  <tr>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3 text-right">Quantity</th>
                    <th className="py-2 px-3">Reference / Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.map((tx) => {
                    const { sign, color, Icon } = getTransactionSign(tx.type);
                    const formattedDate = new Date(
                      tx.createdAt,
                    ).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <tr key={tx.id} className="hover:bg-gray-50/80">
                        <td className="py-2.5 px-3 text-gray-600 whitespace-nowrap">
                          {formattedDate}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 font-medium text-[11px] ${getBadgeStyle(
                              tx.type,
                            )}`}
                          >
                            {tx.type.replace("_", " ")}
                          </span>
                        </td>
                        <td
                          className={`py-2.5 px-3 text-right font-semibold whitespace-nowrap ${color}`}
                        >
                          <span className="inline-flex items-center gap-1">
                            <Icon size={12} />
                            {sign}
                            {tx.quantity} units
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-gray-500 truncate max-w-xs">
                          {tx.referenceType || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
