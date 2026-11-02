import { useState } from "react";
import {
  Ban,
  DollarSign,
  FileText,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Send,
  Trash2,
} from "lucide-react";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import Loading from "../components/ui/Loading";
import InvoiceMetrics from "../components/invoices/InvoiceMetrics";
import { formatCurrency } from "../utils/formatters";
import InvoiceStatusBadge from "../components/invoices/InvoiceStatusBadge";
import CreateInvoiceModal from "../components/invoices/CreateInvoiceModal";
import RecordPaymentModal from "../components/invoices/RecordPaymentModal";
import InvoicePrintModal from "../components/invoices/InvoicePrintModal";
import {
  useDeleteInvoice,
  useInvoices,
  useInvoiceSummary,
  useUpdateInvoice,
} from "../hooks/useInvoices";
import { useAuth } from "../hooks/useAuth";
import type { Invoice } from "../types/invoice";

export default function InvoicesPage() {
  const { user } = useAuth();
  const canManage = user?.role === "OWNER" || user?.role === "MANAGER";

  // Filter state
  const [activeFilter, setActiveFilter] = useState<string>("attention");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  // Queries
  const {
    data: summaryData,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
  } = useInvoiceSummary();

  const {
    data: invoicesData,
    isLoading: isInvoicesLoading,
    isFetching: isInvoicesFetching,
    refetch: refetchInvoices,
  } = useInvoices({
    page,
    limit: 25,
    search: searchTerm || undefined,
    status: activeFilter !== "all" ? activeFilter : undefined,
  });

  const updateMutation = useUpdateInvoice();
  const deleteMutation = useDeleteInvoice();

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [invoiceToPay, setInvoiceToPay] = useState<Invoice | null>(null);
  const [invoiceToPrint, setInvoiceToPrint] = useState<Invoice | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [invoiceToIssue, setInvoiceToIssue] = useState<Invoice | null>(null);
  const [invoiceToVoid, setInvoiceToVoid] = useState<Invoice | null>(null);

  const handleRefresh = () => {
    refetchSummary();
    refetchInvoices();
  };

  const handleIssueConfirm = async () => {
    if (invoiceToIssue) {
      await updateMutation.mutateAsync({
        id: invoiceToIssue.id,
        data: { status: "ISSUED" },
      });
      setInvoiceToIssue(null);
    }
  };

  const handleVoidConfirm = async () => {
    if (invoiceToVoid) {
      await updateMutation.mutateAsync({
        id: invoiceToVoid.id,
        data: { status: "VOID" },
      });
      setInvoiceToVoid(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (invoiceToDelete) {
      await deleteMutation.mutateAsync(invoiceToDelete.id);
      setInvoiceToDelete(null);
    }
  };

  const invoices = invoicesData?.invoices || [];
  const pagination = invoicesData?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-slate-100">
            Invoices & Payments
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Generate invoices, collect payments, print receipts, and track receivables
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            disabled={isInvoicesFetching}
            className="flex items-center gap-1.5"
          >
            <RefreshCw
              size={14}
              className={isInvoicesFetching ? "animate-spin text-indigo-600" : ""}
            />
            <span>Refresh</span>
          </Button>

          {canManage && (
            <Button
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Plus size={15} />
              <span>Create Invoice</span>
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50/70 p-3 text-xs dark:border-amber-500/20 dark:bg-amber-500/5">
        <span className="font-semibold text-amber-900 dark:text-amber-200">Needs attention</span>
        <span className="text-amber-800/80 dark:text-amber-200/70">Drafts to issue and invoices with a balance to collect.</span>
        <button type="button" onClick={() => { setActiveFilter("attention"); setPage(1); }} className="ml-auto rounded-lg border border-amber-300 bg-white px-3 py-1.5 font-semibold text-amber-800 hover:bg-amber-100 dark:border-amber-500/30 dark:bg-slate-900 dark:text-amber-200">Show queue ({(summaryData?.draftCount ?? 0) + (summaryData?.issuedCount ?? 0) + (summaryData?.partiallyPaidCount ?? 0)})</button>
      </div>

      {/* Metrics Cards */}
      <InvoiceMetrics
        summary={summaryData}
        isLoading={isSummaryLoading}
        activeFilter={activeFilter}
        onSelectFilter={(filter) => {
          setActiveFilter(filter);
          setPage(1);
        }}
      />

      {/* Search & Filter Tabs */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs md:flex-row md:items-center md:justify-between dark:border-slate-800/80 dark:bg-slate-900/60">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search by invoice #, customer, vehicle..."
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
            onClick={() => { setActiveFilter("attention"); setPage(1); }}
            className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition ${activeFilter === "attention" ? "bg-white text-amber-800 shadow-sm dark:bg-slate-800 dark:text-amber-200" : "text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200"}`}
          >Needs attention</button>
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
            All Invoices
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveFilter("DRAFT");
              setPage(1);
            }}
            className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition ${
              activeFilter === "DRAFT"
                ? "bg-white text-purple-700 shadow-sm dark:bg-slate-800 dark:text-purple-300 dark:shadow-slate-950/20"
                : "text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            Draft ({summaryData?.draftCount ?? 0})
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveFilter("ISSUED");
              setPage(1);
            }}
            className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition ${
              activeFilter === "ISSUED"
                ? "bg-white text-blue-700 shadow-sm dark:bg-slate-800 dark:text-blue-300 dark:shadow-slate-950/20"
                : "text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            Issued ({summaryData?.issuedCount ?? 0})
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveFilter("PARTIALLY_PAID");
              setPage(1);
            }}
            className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition ${
              activeFilter === "PARTIALLY_PAID"
                ? "bg-white text-amber-700 shadow-sm dark:bg-slate-800 dark:text-amber-300 dark:shadow-slate-950/20"
                : "text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            Partial ({summaryData?.partiallyPaidCount ?? 0})
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveFilter("PAID");
              setPage(1);
            }}
            className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition ${
              activeFilter === "PAID"
                ? "bg-white text-emerald-700 shadow-sm dark:bg-slate-800 dark:text-emerald-300 dark:shadow-slate-950/20"
                : "text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            Paid ({summaryData?.paidCount ?? 0})
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveFilter("VOID");
              setPage(1);
            }}
            className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition ${
              activeFilter === "VOID"
                ? "bg-white text-rose-700 shadow-sm dark:bg-slate-800 dark:text-rose-300 dark:shadow-slate-950/20"
                : "text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            Void
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800/80 dark:bg-slate-900/60">
        {isInvoicesLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loading />
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-slate-800 dark:text-slate-500">
              <FileText size={24} />
            </div>
            <h3 className="mt-3 text-base font-semibold text-gray-900 dark:text-slate-100">
              No invoices found
            </h3>
            <p className="mt-1 max-w-sm text-xs text-gray-500 dark:text-slate-400">
              {searchTerm
                ? `No invoices match "${searchTerm}".`
                : activeFilter !== "all"
                ? `No invoices with status "${activeFilter}".`
                : "No invoices have been generated yet. Complete a repair job to create an invoice."}
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
                <Button
                  size="sm"
                  className="mt-4"
                  onClick={() => setIsCreateOpen(true)}
                >
                  <Plus size={15} className="mr-1.5" />
                  Create First Invoice
                </Button>
              )
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50/75 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Customer & Vehicle</th>
                  <th className="py-3.5 px-4">Repair Job</th>
                  <th className="py-3.5 px-4 text-right">Total</th>
                  <th className="py-3.5 px-4 text-right">Balance Due</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {invoices.map((inv) => {
                  const total = Number(inv.total) || 0;
                  const payments = inv.payments || [];
                  const paid = payments.reduce(
                    (s, p) => s + (Number(p.amount) || 0),
                    0,
                  );
                  const balance = Math.max(0, total - paid);
                  const overdue = Boolean(inv.dueDate && new Date(inv.dueDate).getTime() < new Date().setHours(0, 0, 0, 0) && balance > 0);

                  const isDraft = inv.status === "DRAFT";
                  const isIssued = inv.status === "ISSUED";
                  const isPartial = inv.status === "PARTIALLY_PAID";
                  const canPay = (isIssued || isPartial) && balance > 0;
                  const canDelete = isDraft && payments.length === 0;

                  return (
                    <tr
                      key={inv.id}
                      className="transition-colors hover:bg-gray-50/70 dark:hover:bg-slate-800/50"
                    >
                      {/* Invoice number */}
                      <td className="py-3 px-4 font-mono font-bold text-gray-900 dark:text-slate-100">
                        {inv.invoiceNumber}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <InvoiceStatusBadge status={inv.status} size="sm" />
                      </td>

                      {/* Customer & Vehicle */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900 dark:text-slate-100">
                            {inv.customer.firstName} {inv.customer.lastName}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-slate-400">
                            {inv.vehicle.registrationNumber} ({inv.vehicle.make}{" "}
                            {inv.vehicle.model})
                          </span>
                        </div>
                      </td>

                      {/* Job */}
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
                          {inv.job?.jobNumber || "—"}
                        </span>
                      </td>

                      {/* Total */}
                      <td className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-slate-100">
                        {formatCurrency(total)}
                      </td>

                      {/* Balance Due */}
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`font-bold ${
                            balance === 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {balance === 0 ? "Paid in full" : formatCurrency(balance)}
                        </span>
                        {overdue && <span className="mt-1 block text-[10px] font-semibold uppercase tracking-wide text-rose-600 dark:text-rose-400">Overdue · due {new Date(inv.dueDate!).toLocaleDateString("en-LK", { day: "numeric", month: "short" })}</span>}
                        {!overdue && inv.dueDate && balance > 0 && <span className="mt-1 block text-[10px] text-slate-500 dark:text-slate-400">Due {new Date(inv.dueDate).toLocaleDateString("en-LK", { day: "numeric", month: "short" })}</span>}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Print / View document */}
                          <button
                            type="button"
                            title="Print / View Invoice"
                            onClick={() => setInvoiceToPrint(inv)}
                            className="cursor-pointer rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                          >
                            <Printer size={16} />
                          </button>

                          {canManage && (
                            <>
                              {/* Issue draft */}
                              {isDraft && (
                                <button
                                  type="button"
                                  title="Issue Invoice (finalize draft)"
                                  onClick={() => setInvoiceToIssue(inv)}
                                  className="cursor-pointer rounded-lg p-1.5 text-blue-600 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40 dark:hover:text-blue-300"
                                >
                                  <Send size={15} />
                                </button>
                              )}

                              {/* Record Payment */}
                              {canPay && (
                                <button
                                  type="button"
                                  title="Record Payment"
                                  onClick={() => setInvoiceToPay(inv)}
                                  className="cursor-pointer rounded-lg p-1.5 text-emerald-600 transition hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300"
                                >
                                  <DollarSign size={16} />
                                </button>
                              )}

                              {/* Void */}
                              {(isIssued || isPartial) && (
                                <button
                                  type="button"
                                  title="Void Invoice"
                                  onClick={() => setInvoiceToVoid(inv)}
                                  className="cursor-pointer rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-rose-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-rose-400"
                                >
                                  <Ban size={15} />
                                </button>
                              )}

                              {/* Delete draft */}
                              {canDelete && (
                                <button
                                  type="button"
                                  title="Delete Draft"
                                  onClick={() => setInvoiceToDelete(inv)}
                                  className="cursor-pointer rounded-lg p-1.5 text-rose-500 transition hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
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

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6 dark:border-slate-800">
            <span className="text-xs text-gray-500 dark:text-slate-400">
              Showing page {pagination.page} of {pagination.totalPages} (
              {pagination.total} invoices)
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

      {/* Create Invoice Modal */}
      <CreateInvoiceModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={Boolean(invoiceToPay)}
        onClose={() => setInvoiceToPay(null)}
        invoice={invoiceToPay}
      />

      {/* Invoice Printable View Modal */}
      <InvoicePrintModal
        isOpen={Boolean(invoiceToPrint)}
        onClose={() => setInvoiceToPrint(null)}
        invoice={invoiceToPrint}
      />

      {/* Issue Invoice Confirmation Modal */}
      <Modal
        isOpen={Boolean(invoiceToIssue)}
        onClose={() => setInvoiceToIssue(null)}
        title="Issue Invoice"
        size="md"
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-slate-300">
            Are you ready to issue invoice{" "}
            <span className="font-semibold text-gray-900 dark:text-slate-100">
              {invoiceToIssue?.invoiceNumber}
            </span>{" "}
            for{" "}
            <span className="font-semibold text-gray-900 dark:text-slate-100">
              {formatCurrency(Number(invoiceToIssue?.total || 0))}
            </span>
            ?
          </p>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Once an invoice is issued, its prices and line items are locked to
            preserve financial accounting, and it will be ready to receive
            payments.
          </p>
          <div className="flex justify-end gap-3 pt-3">
            <Button
              variant="secondary"
              onClick={() => setInvoiceToIssue(null)}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleIssueConfirm}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Issuing..." : "Confirm & Issue"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Void Confirmation Modal */}
      <Modal
        isOpen={Boolean(invoiceToVoid)}
        onClose={() => setInvoiceToVoid(null)}
        title="Void Invoice"
        size="md"
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-slate-300">
            Are you sure you want to mark invoice{" "}
            <span className="font-semibold text-gray-900 dark:text-slate-100">
              {invoiceToVoid?.invoiceNumber}
            </span>{" "}
            as VOID?
          </p>
          <p className="text-xs text-rose-600 dark:text-rose-400">
            Voiding cancels all further billing and payment collections for this
            invoice.
          </p>
          <div className="flex justify-end gap-3 pt-3">
            <Button
              variant="secondary"
              onClick={() => setInvoiceToVoid(null)}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleVoidConfirm}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Voiding..." : "Void Invoice"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(invoiceToDelete)}
        onClose={() => setInvoiceToDelete(null)}
        title="Delete Draft Invoice"
        size="md"
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-slate-300">
            Are you sure you want to delete draft invoice{" "}
            <span className="font-semibold text-gray-900 dark:text-slate-100">
              {invoiceToDelete?.invoiceNumber}
            </span>
            ?
          </p>
          <div className="flex justify-end gap-3 pt-3">
            <Button
              variant="secondary"
              onClick={() => setInvoiceToDelete(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Invoice"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
