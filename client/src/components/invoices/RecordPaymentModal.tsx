import { useEffect, useState } from "react";
import {
  AlertCircle,
  Banknote,
  Building2,
  CreditCard,
  HelpCircle,
} from "lucide-react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Modal from "../ui/Modal";
import type { Invoice, PaymentMethod } from "../../types/invoice";
import { useRecordPayment } from "../../hooks/useInvoices";
import { formatCurrency } from "../../utils/formatters";

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
}

export default function RecordPaymentModal({
  isOpen,
  onClose,
  invoice,
}: RecordPaymentModalProps) {
  const recordMutation = useRecordPayment();

  const [amount, setAmount] = useState<number>(0);
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [reference, setReference] = useState("");
  const [error, setError] = useState<string | null>(null);

  const total = invoice ? Number(invoice.total) || 0 : 0;
  const alreadyPaid = invoice
    ? (invoice.payments || []).reduce(
        (sum, p) => sum + (Number(p.amount) || 0),
        0,
      )
    : 0;
  const remainingBalance = Math.max(0, total - alreadyPaid);

  useEffect(() => {
    if (isOpen && invoice) {
      setAmount(Number(remainingBalance.toFixed(2)));
      setMethod("CASH");
      setReference("");
      setError(null);
    }
  }, [isOpen, invoice]);

  if (!invoice) return null;

  const numAmount = Number(amount) || 0;
  const projectedBalance = Math.max(0, remainingBalance - numAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) {
      setError("Payment amount must be greater than zero");
      return;
    }

    if (numAmount > remainingBalance) {
      setError(
        `Payment amount cannot exceed the remaining balance of ${formatCurrency(remainingBalance)}`,
      );
      return;
    }

    try {
      await recordMutation.mutateAsync({
        invoiceId: invoice.id,
        data: {
          amount: numAmount,
          method,
          reference: reference.trim() || undefined,
        },
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to record payment");
    }
  };

  const isSubmitting = recordMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Record Payment for ${invoice.invoiceNumber}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Balance Overview Box */}
        <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 text-xs space-y-2">
          <div className="flex justify-between text-gray-500">
            <span>Customer:</span>
            <span className="font-semibold text-gray-900">
              {invoice.customer.firstName} {invoice.customer.lastName}
            </span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Total Invoiced:</span>
            <span className="font-semibold text-gray-900">
              {formatCurrency(total)}
            </span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Already Paid:</span>
            <span className="font-semibold text-emerald-600">
              {formatCurrency(alreadyPaid)}
            </span>
          </div>
          <div className="flex justify-between pt-2 border-t text-sm font-bold text-gray-900">
            <span>Remaining Due:</span>
            <span className="text-amber-600 font-bold">
              {formatCurrency(remainingBalance)}
            </span>
          </div>
        </div>

        {/* Payment Amount */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-gray-700">
              Payment Amount (Rs.) <span className="text-rose-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setAmount(Number(remainingBalance.toFixed(2)))}
              className="text-[11px] font-semibold text-blue-600 hover:text-blue-700"
            >
              Pay Full Remaining ({formatCurrency(remainingBalance)})
            </button>
          </div>
          <Input
            type="number"
            min={0.01}
            max={remainingBalance}
            step="0.01"
            value={amount}
            onChange={(e) => {
              setAmount(parseFloat(e.target.value) || 0);
              setError(null);
            }}
            disabled={isSubmitting}
          />
        </div>

        {/* Payment Method Selector */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Payment Method
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <button
              type="button"
              onClick={() => setMethod("CASH")}
              className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-xs font-medium transition ${
                method === "CASH"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600"
                  : "border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Banknote size={16} />
              <span>Cash</span>
            </button>

            <button
              type="button"
              onClick={() => setMethod("CARD")}
              className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-xs font-medium transition ${
                method === "CARD"
                  ? "border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600"
                  : "border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <CreditCard size={16} />
              <span>Card</span>
            </button>

            <button
              type="button"
              onClick={() => setMethod("BANK_TRANSFER")}
              className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-xs font-medium transition ${
                method === "BANK_TRANSFER"
                  ? "border-purple-600 bg-purple-50 text-purple-700 ring-1 ring-purple-600"
                  : "border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Building2 size={16} />
              <span>Transfer</span>
            </button>

            <button
              type="button"
              onClick={() => setMethod("OTHER")}
              className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-xs font-medium transition ${
                method === "OTHER"
                  ? "border-gray-600 bg-gray-100 text-gray-800 ring-1 ring-gray-600"
                  : "border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <HelpCircle size={16} />
              <span>Other</span>
            </button>
          </div>
        </div>

        {/* Reference / Notes */}
        <div>
          <label className="block text-xs font-medium text-gray-700">
            Transaction Reference / Notes (Optional)
          </label>
          <Input
            placeholder="e.g. Receipt #, Cheque #, or POS terminal auth code"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        {/* Projected Outcome Pill */}
        <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-3 text-xs flex items-center justify-between">
          <span className="text-gray-600">Balance after this payment:</span>
          <span
            className={`font-bold ${
              projectedBalance === 0 ? "text-emerald-600" : "text-amber-600"
            }`}
          >
            {projectedBalance === 0
              ? "Fully Settled (Rs. 0.00)"
              : `${formatCurrency(projectedBalance)} remaining`}
          </span>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700 border border-rose-200">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-3 border-t">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || numAmount <= 0 || numAmount > remainingBalance}
          >
            {isSubmitting ? "Recording..." : "Record Payment"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
