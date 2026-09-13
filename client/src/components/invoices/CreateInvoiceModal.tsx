import { useEffect, useState } from "react";
import {
  AlertCircle,
  Car,
  Plus,
  Trash2,
  User,
  Wrench,
} from "lucide-react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Modal from "../ui/Modal";
import Loading from "../ui/Loading";
import SearchableSelect from "../ui/SearchableSelect";
import { useJobs, useJob } from "../../hooks/useJobs";
import { useCreateInvoice } from "../../hooks/useInvoices";
import type { CreateInvoiceLabourItem } from "../../types/invoice";
import { formatCurrency } from "../../utils/formatters";

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedJobId?: string | null;
}

export default function CreateInvoiceModal({
  isOpen,
  onClose,
  preselectedJobId,
}: CreateInvoiceModalProps) {
  const createMutation = useCreateInvoice();

  // Fetch eligible uninvoiced completed jobs
  const { data: eligibleJobsData, isLoading: isLoadingEligible } = useJobs({
    status: "COMPLETED,READY_FOR_PICKUP",
    hasInvoice: false,
    limit: 50,
  });

  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [labourItems, setLabourItems] = useState<CreateInvoiceLabourItem[]>([
    { description: "General Mechanical Labour", quantity: 1, unitPrice: 50 },
  ]);
  const [discount, setDiscount] = useState<number>(0);
  const [tax, setTax] = useState<number>(0);
  const [dueDate, setDueDate] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Fetch full details of the selected job to get parts installed
  const { data: selectedJob } = useJob(
    selectedJobId || null,
  );

  useEffect(() => {
    if (isOpen) {
      if (preselectedJobId) {
        setSelectedJobId(preselectedJobId);
      } else if (
        eligibleJobsData?.jobs &&
        eligibleJobsData.jobs.length > 0 &&
        !selectedJobId
      ) {
        setSelectedJobId(eligibleJobsData.jobs[0].id);
      }
      setError(null);
    }
  }, [isOpen, preselectedJobId, eligibleJobsData]);

  const handleAddLabour = () => {
    setLabourItems((prev) => [
      ...prev,
      { description: "", quantity: 1, unitPrice: 50 },
    ]);
  };

  const handleRemoveLabour = (index: number) => {
    setLabourItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLabourChange = (
    index: number,
    field: keyof CreateInvoiceLabourItem,
    value: string | number,
  ) => {
    setLabourItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Calculations
  const installedParts = selectedJob?.parts || [];
  const partsSubtotal = installedParts.reduce(
    (sum, p) => sum + Number(p.total),
    0,
  );

  const labourSubtotal = labourItems.reduce(
    (sum, l) => sum + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0),
    0,
  );

  const subtotal = partsSubtotal + labourSubtotal;
  const numDiscount = Number(discount) || 0;
  const numTax = Number(tax) || 0;
  const grandTotal = Math.max(0, subtotal - numDiscount + numTax);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobId) {
      setError("Please select a completed repair job");
      return;
    }

    if (numDiscount > subtotal) {
      setError("Discount cannot exceed the subtotal amount");
      return;
    }

    const filteredLabour = labourItems.filter(
      (l) => l.description.trim() && l.quantity > 0,
    );

    if (installedParts.length === 0 && filteredLabour.length === 0) {
      setError("Invoice must include at least one installed part or labour item");
      return;
    }

    try {
      await createMutation.mutateAsync({
        repairJobId: selectedJobId,
        labourItems: filteredLabour.map((l) => ({
          description: l.description.trim(),
          quantity: Number(l.quantity),
          unitPrice: Number(l.unitPrice),
        })),
        discount: numDiscount,
        tax: numTax,
        dueDate: dueDate || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create invoice");
    }
  };

  const eligibleJobs = eligibleJobsData?.jobs || [];
  const isSubmitting = createMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Invoice"
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Job Selection */}
        <div>
          {isLoadingEligible ? (
            <div className="flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
              <Loading />
            </div>
          ) : eligibleJobs.length === 0 && !preselectedJobId ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              There are no completed repair jobs waiting for an invoice. Only jobs
              marked as COMPLETED or READY_FOR_PICKUP without existing invoices
              can be billed.
            </div>
          ) : (
            <SearchableSelect
              label="Select Completed Repair Job"
              required
              value={selectedJobId}
              onChange={(val) => setSelectedJobId(val)}
              disabled={isSubmitting || Boolean(preselectedJobId)}
              placeholder="Search by job number, customer, or vehicle plate..."
              searchPlaceholder="Search job number, plate, or customer..."
              options={eligibleJobs.map((j) => ({
                value: j.id,
                label: `${j.jobNumber} • ${j.customer.firstName} ${j.customer.lastName}`,
                badge: j.vehicle.registrationNumber,
                subLabel: `${j.vehicle.make} ${j.vehicle.model} • Status: ${j.status.replace("_", " ")}`,
              }))}
              emptyMessage="No matching completed jobs found."
            />
          )}
        </div>

        {/* Selected Job Overview */}
        {selectedJob && (
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-xs">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="flex items-center gap-2">
                <User size={16} className="text-blue-600" />
                <div>
                  <p className="font-semibold text-gray-900">
                    {selectedJob.customer.firstName}{" "}
                    {selectedJob.customer.lastName}
                  </p>
                  <p className="text-gray-500">{selectedJob.customer.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Car size={16} className="text-blue-600" />
                <div>
                  <p className="font-semibold text-gray-900">
                    {selectedJob.vehicle.registrationNumber}
                  </p>
                  <p className="text-gray-500">
                    {selectedJob.vehicle.make} {selectedJob.vehicle.model}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Wrench size={16} className="text-blue-600" />
                <div>
                  <p className="font-semibold text-gray-900">
                    {selectedJob.jobNumber}
                  </p>
                  <p className="text-gray-500">{selectedJob.status}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Installed Parts from Job */}
        {selectedJob && (
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between pb-2 border-b">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-700">
                Parts Installed on Job ({installedParts.length})
              </span>
              <span className="text-xs font-bold text-gray-900">
                Parts Total: {formatCurrency(partsSubtotal)}
              </span>
            </div>

            {installedParts.length === 0 ? (
              <p className="py-3 text-xs text-gray-400 italic">
                No inventory parts were added to this job.
              </p>
            ) : (
              <div className="mt-2 divide-y divide-gray-100 text-xs">
                {installedParts.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between py-2"
                  >
                    <div>
                      <span className="font-medium text-gray-900">
                        {p.part.name}
                      </span>
                      <span className="ml-2 font-mono text-[11px] text-gray-400">
                        ({p.part.sku})
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500">
                        {p.quantity} × {formatCurrency(Number(p.unitPrice))}
                      </span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(Number(p.total))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Labour Items */}
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between pb-2 border-b">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-700">
              Labour & Service Charges
            </span>
            <button
              type="button"
              onClick={handleAddLabour}
              className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              <Plus size={14} />
              <span>Add Labour Item</span>
            </button>
          </div>

          <div className="mt-3 space-y-2">
            {labourItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Labour service description..."
                  value={item.description}
                  onChange={(e) =>
                    handleLabourChange(idx, "description", e.target.value)
                  }
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="Qty/Hrs"
                  min={0.25}
                  step={0.25}
                  value={item.quantity}
                  onChange={(e) =>
                    handleLabourChange(
                      idx,
                      "quantity",
                      parseFloat(e.target.value) || 0,
                    )
                  }
                  className="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-xs text-center focus:border-blue-500 focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="Rate (Rs.)"
                  min={0}
                  step={1}
                  value={item.unitPrice}
                  onChange={(e) =>
                    handleLabourChange(
                      idx,
                      "unitPrice",
                      parseFloat(e.target.value) || 0,
                    )
                  }
                  className="w-24 rounded-lg border border-gray-300 px-2 py-1.5 text-xs text-right focus:border-blue-500 focus:outline-none"
                />
                <span className="w-20 text-right text-xs font-semibold text-gray-900">
                  {formatCurrency(
                    (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveLabour(idx)}
                  className="p-1 text-gray-400 hover:text-rose-600"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Discount, Tax & Due Date */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-gray-700">
              Discount (Rs.)
            </label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={discount}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700">
              Tax (Rs.)
            </label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={tax}
              onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700">
              Payment Due Date
            </label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Invoice Totals Summary Box */}
        <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 text-xs space-y-1.5">
          <div className="flex justify-between text-gray-600">
            <span>Parts Subtotal:</span>
            <span>{formatCurrency(partsSubtotal)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Labour Subtotal:</span>
            <span>{formatCurrency(labourSubtotal)}</span>
          </div>
          {numDiscount > 0 && (
            <div className="flex justify-between text-rose-600 font-medium">
              <span>Discount:</span>
              <span>-{formatCurrency(numDiscount)}</span>
            </div>
          )}
          {numTax > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Tax:</span>
              <span>+{formatCurrency(numTax)}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t text-sm font-bold text-gray-900">
            <span>Grand Total:</span>
            <span className="text-base text-blue-600">
              {formatCurrency(grandTotal)}
            </span>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700 border border-rose-200">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {/* Footer Actions */}
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
            disabled={isSubmitting || !selectedJobId || grandTotal <= 0}
          >
            {isSubmitting ? "Generating..." : "Create Draft Invoice"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
