import { useState } from "react";
import {
  Car,
  ClipboardList,
  FileText,
  Lock,
  Plus,
  Printer,
  Trash2,
  User,
  Wrench,
} from "lucide-react";

import Button from "../ui/Button";
import Loading from "../ui/Loading";

import JobPriorityBadge from "./JobPriorityBadge";
import JobStatusBadge from "./JobStatusBadge";
import AddJobPartModal from "./AddJobPartModal";
import CreateInvoiceModal from "../invoices/CreateInvoiceModal";
import InvoicePrintModal from "../invoices/InvoicePrintModal";

import { useJobParts, useRemoveJobPart } from "../../hooks/useJobs";
import { useInvoice } from "../../hooks/useInvoices";
import { useAuth } from "../../hooks/useAuth";

import type { JobStatus, RepairJobDetails } from "../../types/job";

interface JobDetailsProps {
  job: RepairJobDetails;
  /** True if the current user is allowed to add/remove parts */
  canManageParts: boolean;
  onEdit: () => void;
}

const statusTransitions: Record<JobStatus, JobStatus[]> = {
  RECEIVED: ["IN_PROGRESS"],
  IN_PROGRESS: ["WAITING_FOR_PARTS", "COMPLETED"],
  WAITING_FOR_PARTS: ["IN_PROGRESS", "COMPLETED"],
  COMPLETED: ["READY_FOR_PICKUP"],
  READY_FOR_PICKUP: ["DELIVERED"],
  DELIVERED: [],
};

const statusLabels: Record<JobStatus, string> = {
  RECEIVED: "Received",
  IN_PROGRESS: "In Progress",
  WAITING_FOR_PARTS: "Waiting for Parts",
  COMPLETED: "Completed",
  READY_FOR_PICKUP: "Ready for Pickup",
  DELIVERED: "Delivered",
};

const invoiceStatusLabels: Record<string, string> = {
  DRAFT: "Draft",
  ISSUED: "Issued",
  PARTIALLY_PAID: "Partially Paid",
  PAID: "Paid",
  VOID: "Void",
};

const invoiceStatusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  ISSUED: "bg-blue-50 text-blue-700",
  PARTIALLY_PAID: "bg-orange-50 text-orange-700",
  PAID: "bg-green-50 text-green-700",
  VOID: "bg-red-50 text-red-700",
};

const formatMoney = (value: number | string) =>
  `Rs. ${Number(value).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function JobDetails({
  job,
  canManageParts,
  onEdit,
}: JobDetailsProps) {
  const { user } = useAuth();
  const canManage = user?.role === "OWNER" || user?.role === "MANAGER";

  const [addPartOpen, setAddPartOpen] = useState(false);
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false);
  const [printInvoiceOpen, setPrintInvoiceOpen] = useState(false);

  const { data: fullInvoice } = useInvoice(
    printInvoiceOpen && job.invoice ? job.invoice.id : null,
  );

  const { data: parts = [], isLoading: loadingParts } = useJobParts(job.id);

  const removePartMutation = useRemoveJobPart();

  const availableStatuses = statusTransitions[job.status] || [];

  // Parts can be added if the job is not invoiced, not delivered, and user has permission
  const hasInvoice = Boolean(job.invoice);
  const isDelivered = job.status === "DELIVERED";
  const canAddParts = canManageParts && !hasInvoice && !isDelivered;
  const canRemoveParts = canManageParts && !hasInvoice && !isDelivered;

  const partsTotal = parts.reduce((sum, p) => sum + Number(p.total), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm text-gray-500">Repair Job</p>

          <h2 className="mt-1 text-2xl font-bold text-gray-900">
            {job.jobNumber}
          </h2>

          <div className="mt-3 flex flex-wrap gap-2">
            <JobStatusBadge status={job.status} />
            <JobPriorityBadge priority={job.priority} />
          </div>
        </div>

        <Button variant="secondary" onClick={onEdit}>
          Edit Job
        </Button>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Customer */}
        <div className="rounded-xl border border-gray-200 p-4">
          <div className="mb-3 flex items-center gap-2 text-gray-500">
            <User size={18} />
            <span className="text-sm font-medium">Customer</span>
          </div>

          <p className="font-semibold text-gray-900">
            {job.customer.firstName} {job.customer.lastName}
          </p>
          <p className="mt-1 text-sm text-gray-500">{job.customer.phone}</p>
          {job.customer.email && (
            <p className="mt-1 text-sm text-gray-500">{job.customer.email}</p>
          )}
        </div>

        {/* Vehicle */}
        <div className="rounded-xl border border-gray-200 p-4">
          <div className="mb-3 flex items-center gap-2 text-gray-500">
            <Car size={18} />
            <span className="text-sm font-medium">Vehicle</span>
          </div>

          <p className="font-semibold text-gray-900">
            {job.vehicle.registrationNumber}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {job.vehicle.make} {job.vehicle.model}
          </p>
          {job.vehicle.year && (
            <p className="mt-1 text-sm text-gray-500">
              Year: {job.vehicle.year}
            </p>
          )}
        </div>

        {/* Mechanic */}
        <div className="rounded-xl border border-gray-200 p-4">
          <div className="mb-3 flex items-center gap-2 text-gray-500">
            <Wrench size={18} />
            <span className="text-sm font-medium">Mechanic</span>
          </div>

          {job.mechanic ? (
            <>
              <p className="font-semibold text-gray-900">{job.mechanic.name}</p>
              <p className="mt-1 text-sm text-gray-500">{job.mechanic.email}</p>
            </>
          ) : (
            <p className="text-sm text-gray-400 italic">Not assigned</p>
          )}
        </div>
      </div>

      {/* Job Info */}
      <div className="rounded-xl border border-gray-200">
        <div className="border-b border-gray-200 px-5 py-4">
          <h3 className="font-semibold text-gray-900">Job Information</h3>
        </div>

        <div className="grid gap-5 p-5 md:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Complaint
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">
              {job.complaint}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Diagnosis
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">
              {job.diagnosis || "Not provided"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Mileage In
            </p>
            <p className="mt-1 text-sm text-gray-800">
              {job.mileageIn !== null && job.mileageIn !== undefined
                ? `${job.mileageIn.toLocaleString()} km`
                : "Not provided"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Mileage Out
            </p>
            <p className="mt-1 text-sm text-gray-800">
              {job.mileageOut !== null && job.mileageOut !== undefined
                ? `${job.mileageOut.toLocaleString()} km`
                : "Not provided"}
            </p>
          </div>

          <div className="md:col-span-2">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Notes
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">
              {job.notes || "No notes"}
            </p>
          </div>
        </div>
      </div>

      {/* Parts */}
      <div className="rounded-xl border border-gray-200">
        <div className="flex items-center justify-between gap-2 border-b border-gray-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <ClipboardList size={18} className="text-gray-500" />
            <h3 className="font-semibold text-gray-900">Parts Used</h3>
            {parts.length > 0 && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                {parts.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {hasInvoice && (
              <span className="flex items-center gap-1 rounded-md border border-orange-200 bg-orange-50 px-2 py-1 text-xs text-orange-700">
                <Lock className="h-3 w-3" />
                Locked (invoiced)
              </span>
            )}

            {canAddParts && (
              <Button size="sm" onClick={() => setAddPartOpen(true)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add Parts
              </Button>
            )}
          </div>
        </div>

        {loadingParts ? (
          <div className="flex justify-center p-8">
            <Loading />
          </div>
        ) : parts.length === 0 ? (
          <div className="flex flex-col items-center p-10 text-center">
            <ClipboardList className="mb-2 h-8 w-8 text-gray-300" />
            <p className="text-sm font-medium text-gray-500">
              No parts added yet
            </p>
            {canAddParts && (
              <p className="mt-1 text-xs text-gray-400">
                Click "Add Parts" to install parts from inventory.
              </p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {parts.map((jobPart) => (
              <div
                key={jobPart.id}
                className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {jobPart.part.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    SKU: {jobPart.part.sku}
                  </p>
                </div>

                <div className="flex items-center gap-5">
                  <span className="text-sm text-gray-600">
                    {jobPart.quantity} × {formatMoney(jobPart.unitPrice)}
                  </span>

                  <span className="font-semibold text-gray-900">
                    {formatMoney(jobPart.total)}
                  </span>

                  {canRemoveParts && (
                    <button
                      type="button"
                      title="Remove part"
                      disabled={removePartMutation.isPending}
                      onClick={() =>
                        removePartMutation.mutate({
                          jobId: job.id,
                          jobPartId: jobPart.id,
                        })
                      }
                      className="rounded-lg p-1.5 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Parts total */}
            <div className="flex items-center justify-end gap-3 bg-gray-50 px-4 py-3">
              <span className="text-sm font-medium text-gray-600">
                Parts Subtotal
              </span>
              <span className="text-base font-bold text-gray-900">
                {formatMoney(partsTotal)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Invoice summary */}
      {job.invoice ? (
        <div className="rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 border-b border-gray-200 px-5 py-4">
            <FileText size={18} className="text-gray-500" />
            <h3 className="font-semibold text-gray-900">Invoice</h3>
            <span
              className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                invoiceStatusColors[job.invoice.status] ??
                "bg-gray-100 text-gray-600"
              }`}
            >
              {invoiceStatusLabels[job.invoice.status] ?? job.invoice.status}
            </span>

            <Button
              size="sm"
              variant="secondary"
              onClick={() => setPrintInvoiceOpen(true)}
              className="ml-auto flex items-center gap-1.5"
            >
              <Printer size={14} />
              <span>Print / View</span>
            </Button>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Invoice Number
              </p>
              <p className="mt-1 font-semibold text-gray-900">
                {job.invoice.invoiceNumber}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Subtotal
              </p>
              <p className="mt-1 text-sm text-gray-800">
                {formatMoney(job.invoice.subtotal)}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Discount
              </p>
              <p className="mt-1 text-sm text-gray-800">
                {formatMoney(job.invoice.discount)}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Tax
              </p>
              <p className="mt-1 text-sm text-gray-800">
                {formatMoney(job.invoice.tax)}
              </p>
            </div>

            <div className="sm:col-span-2 border-t border-gray-100 pt-3 flex justify-end">
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Grand Total
                </p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {formatMoney(job.invoice.total)}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (job.status === "COMPLETED" || job.status === "READY_FOR_PICKUP") &&
        canManage ? (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-4">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Ready for Invoicing
            </p>
            <p className="text-xs text-gray-500">
              This repair job is finished. Generate a customer invoice with
              parts & labour.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setCreateInvoiceOpen(true)}
            className="flex items-center gap-1.5 self-start sm:self-auto"
          >
            <FileText size={15} />
            <span>Generate Invoice</span>
          </Button>
        </div>
      ) : null}

      {/* Next Status */}
      {availableStatuses.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm font-medium text-gray-700">
            Next available status
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            {availableStatuses.map((status) => (
              <span
                key={status}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700"
              >
                {statusLabels[status]}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Add Part Modal */}
      <AddJobPartModal
        jobId={job.id}
        isOpen={addPartOpen}
        onClose={() => setAddPartOpen(false)}
      />

      {/* Create Invoice Modal */}
      <CreateInvoiceModal
        isOpen={createInvoiceOpen}
        onClose={() => setCreateInvoiceOpen(false)}
        preselectedJobId={job.id}
      />

      {/* Print Invoice Modal */}
      <InvoicePrintModal
        isOpen={printInvoiceOpen}
        onClose={() => setPrintInvoiceOpen(false)}
        invoice={fullInvoice || null}
      />
    </div>
  );
}
