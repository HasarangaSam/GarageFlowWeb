import { useRef } from "react";
import { Printer } from "lucide-react";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import InvoiceStatusBadge from "./InvoiceStatusBadge";
import { formatCurrency } from "../../utils/formatters";
import type { Invoice } from "../../types/invoice";

interface InvoicePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
}

export default function InvoicePrintModal({
  isOpen,
  onClose,
  invoice,
}: InvoicePrintModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!invoice) return null;

  const total = Number(invoice.total) || 0;
  const subtotal = Number(invoice.subtotal) || 0;
  const discount = Number(invoice.discount) || 0;
  const tax = Number(invoice.tax) || 0;

  const payments = invoice.payments || [];
  const paidAmount = payments.reduce(
    (sum, p) => sum + (Number(p.amount) || 0),
    0,
  );
  const balanceDue = Math.max(0, total - paidAmount);

  const items = invoice.items || [];

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Invoice Document: ${invoice.invoiceNumber}`}
      size="xl"
    >
      <div className="space-y-6">
        {/* Printable Sheet Container */}
        <div
          ref={printRef}
          id="printable-invoice"
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 print:border-none print:p-0 print:shadow-none"
        >
          {/* Header */}
          <div className="flex flex-col justify-between gap-4 border-b border-gray-200 pb-6 sm:flex-row sm:items-start">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold">
                  GF
                </div>
                <h2 className="text-xl font-extrabold text-gray-900">
                  GarageFlow Automotive
                </h2>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Precision Auto Repairs & Diagnostic Center
              </p>
              <p className="text-xs text-gray-500">
                100 Motorway Blvd • (555) 019-2834 • service@garageflow.io
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs uppercase tracking-widest text-gray-400 font-semibold">
                INVOICE
              </span>
              <p className="text-xl font-mono font-extrabold text-gray-900">
                {invoice.invoiceNumber}
              </p>
              <div className="mt-1 flex sm:justify-end">
                <InvoiceStatusBadge status={invoice.status} size="sm" />
              </div>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-6 py-6 border-b border-gray-100 sm:grid-cols-4 text-xs">
            <div>
              <span className="font-semibold text-gray-400 uppercase tracking-wider">
                Billed To
              </span>
              <p className="mt-1 font-bold text-gray-900 text-sm">
                {invoice.customer.firstName} {invoice.customer.lastName}
              </p>
              <p className="text-gray-500">{invoice.customer.phone}</p>
            </div>

            <div>
              <span className="font-semibold text-gray-400 uppercase tracking-wider">
                Vehicle Details
              </span>
              <p className="mt-1 font-bold text-gray-900 text-sm">
                {invoice.vehicle.make} {invoice.vehicle.model}
              </p>
              <p className="font-mono text-gray-600">
                Reg: {invoice.vehicle.registrationNumber}
              </p>
              {invoice.vehicle.year && (
                <p className="text-gray-500">Year: {invoice.vehicle.year}</p>
              )}
            </div>

            <div>
              <span className="font-semibold text-gray-400 uppercase tracking-wider">
                Repair Job Reference
              </span>
              <p className="mt-1 font-mono font-bold text-gray-900 text-sm">
                {invoice.job?.jobNumber || "—"}
              </p>
              <p className="text-gray-500">
                Created: {formatDate(invoice.createdAt)}
              </p>
            </div>

            <div>
              <span className="font-semibold text-gray-400 uppercase tracking-wider">
                Payment Dates
              </span>
              <p className="mt-1 text-gray-600">
                Issued: {formatDate(invoice.issuedAt || invoice.createdAt)}
              </p>
              <p className="text-gray-600">
                Due: {formatDate(invoice.dueDate)}
              </p>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="py-6">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-200 bg-gray-50/75 text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-gray-400">
                      No line items recorded.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2.5 px-3">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                            item.type === "PART"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-purple-50 text-purple-700"
                          }`}
                        >
                          {item.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-gray-900">
                        {item.description}
                      </td>
                      <td className="py-2.5 px-3 text-center text-gray-600">
                        {item.quantity}
                      </td>
                      <td className="py-2.5 px-3 text-right text-gray-600">
                        {formatCurrency(Number(item.unitPrice))}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-gray-900">
                        {formatCurrency(Number(item.total))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Financials & Balance */}
          <div className="flex flex-col justify-end gap-2 border-t border-gray-200 pt-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-xs text-xs text-gray-500 space-y-1">
              <p className="font-semibold text-gray-700">Payment Terms</p>
              <p>
                Payment is due upon vehicle collection or invoice due date. We
                accept cash, credit/debit cards, and electronic bank transfers.
              </p>
            </div>

            <div className="w-full sm:w-64 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-rose-600 font-medium">
                  <span>Discount:</span>
                  <span>-{formatCurrency(discount)}</span>
                </div>
              )}
              {tax > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Tax:</span>
                  <span>+{formatCurrency(tax)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t text-sm font-bold text-gray-900">
                <span>Total Amount:</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Total Paid:</span>
                <span className="font-semibold text-emerald-600">
                  {formatCurrency(paidAmount)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t text-sm font-extrabold text-blue-600">
                <span>Balance Due:</span>
                <span>{formatCurrency(balanceDue)}</span>
              </div>
            </div>
          </div>

          {/* Payment Receipts History */}
          {payments.length > 0 && (
            <div className="mt-6 border-t border-gray-100 pt-4 text-xs">
              <span className="font-semibold uppercase tracking-wider text-gray-500">
                Payment History ({payments.length})
              </span>
              <div className="mt-2 divide-y divide-gray-100 rounded-lg border border-gray-100 bg-gray-50/50 p-2">
                {payments.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between py-1.5 px-2"
                  >
                    <div>
                      <span className="font-medium text-gray-800">
                        {p.method}
                      </span>
                      {p.reference && (
                        <span className="ml-2 text-gray-400">
                          (Ref: {p.reference})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500">
                        {formatDate(p.paidAt)}
                      </span>
                      <span className="font-bold text-emerald-600">
                        {formatCurrency(Number(p.amount))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex justify-between items-center pt-3 border-t">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>

          <Button onClick={handlePrint} className="flex items-center gap-1.5">
            <Printer size={16} />
            <span>Print / Save as PDF</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
