import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Package, Plus, Search, X } from "lucide-react";
import toast from "react-hot-toast";

import Button from "../ui/Button";
import Input from "../ui/Input";
import Loading from "../ui/Loading";
import Modal from "../ui/Modal";
import { useParts } from "../../hooks/useParts";
import { useAddJobParts } from "../../hooks/useJobs";
import type { Part } from "../../types/part";

interface AddJobPartModalProps {
  jobId: string;
  isOpen: boolean;
  onClose: () => void;
}

type SelectedPart = { part: Part; quantity: number };

const formatMoney = (value: number | string) =>
  `Rs. ${Number(value).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function AddJobPartModal({ jobId, isOpen, onClose }: AddJobPartModalProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Record<string, SelectedPart>>({});
  const { data, isLoading } = useParts({ search: search.trim() || undefined, limit: 50 });
  const addPartsMutation = useAddJobParts();
  const parts = data?.parts ?? [];
  const selectedParts = Object.values(selected);

  const togglePart = (part: Part) => {
    if (part.quantity === 0) return;
    setSelected((current) => {
      if (current[part.id]) {
        const { [part.id]: _, ...remaining } = current;
        return remaining;
      }
      return { ...current, [part.id]: { part, quantity: 1 } };
    });
  };

  const updateQuantity = (partId: string, value: number) => {
    setSelected((current) => {
      const entry = current[partId];
      if (!entry) return current;
      const quantity = Number.isFinite(value) ? Math.max(1, Math.min(value, entry.part.quantity)) : 1;
      return { ...current, [partId]: { ...entry, quantity } };
    });
  };

  const handleClose = () => {
    setSearch("");
    setSelected({});
    onClose();
  };

  const handleAdd = async () => {
    if (!selectedParts.length) return;
    try {
      await addPartsMutation.mutateAsync({
        jobId,
        data: { parts: selectedParts.map(({ part, quantity }) => ({ partId: part.id, quantity })) },
      });
      toast.success(`${selectedParts.length} part${selectedParts.length === 1 ? "" : "s"} added to the job`);
      handleClose();
    } catch {
      // The API error is surfaced through the shared mutation error handling.
    }
  };

  const total = selectedParts.reduce(
    (sum, { part, quantity }) => sum + Number(part.sellingPrice) * quantity,
    0,
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Parts to Job"
      description="Select all installed parts, set quantities, then add them together."
      size="xl"
    >
      <div className="space-y-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input id="part-search" placeholder="Search by part name or SKU..." value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" />
        </div>

        <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200">
          {isLoading ? (
            <div className="flex items-center justify-center p-8"><Loading /></div>
          ) : parts.length === 0 ? (
            <div className="space-y-2 p-8 text-center text-sm text-gray-500">
              <p>{search ? "No parts found matching your search." : "No parts in inventory."}</p>
              <Link to="/inventory" onClick={handleClose} className="text-xs font-semibold text-blue-600 underline hover:text-blue-700">Go to Inventory to manage parts</Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {parts.map((part) => {
                const isSelected = Boolean(selected[part.id]);
                const outOfStock = part.quantity === 0;
                return (
                  <button key={part.id} type="button" disabled={outOfStock} onClick={() => togglePart(part)} className={`w-full px-4 py-3 text-left transition-colors ${outOfStock ? "cursor-not-allowed bg-gray-50 opacity-50" : isSelected ? "bg-blue-50" : "hover:bg-gray-50"}`}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isSelected ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                          {isSelected ? <Check className="h-4 w-4" /> : <Package className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className={`truncate text-sm font-medium ${isSelected ? "text-blue-900" : "text-gray-900"}`}>{part.name}</p>
                          <p className="text-xs text-gray-500">SKU: {part.sku}</p>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-gray-800">{formatMoney(part.sellingPrice)}</p>
                        <p className={`text-xs ${part.quantity <= part.minimumStock ? "font-medium text-orange-600" : "text-gray-500"}`}>{outOfStock ? "Out of stock" : `${part.quantity} in stock`}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {selectedParts.length > 0 && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-blue-900">Selected parts ({selectedParts.length})</p>
              <p className="text-sm font-bold text-blue-900">{formatMoney(total)}</p>
            </div>
            <div className="space-y-2">
              {selectedParts.map(({ part, quantity }) => (
                <div key={part.id} className="flex items-center gap-3 rounded-lg bg-white p-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{part.name}</p>
                    <p className="text-xs text-gray-500">{formatMoney(part.sellingPrice)} each · {part.quantity} available</p>
                  </div>
                  <Input id={`part-quantity-${part.id}`} aria-label={`Quantity for ${part.name}`} type="number" min={1} max={part.quantity} value={quantity} onChange={(event) => updateQuantity(part.id, Number(event.target.value))} className="w-20 py-1.5 text-center" />
                  <button type="button" onClick={() => togglePart(part)} className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600" aria-label={`Remove ${part.name}`}><X className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleAdd} disabled={!selectedParts.length || addPartsMutation.isPending} loading={addPartsMutation.isPending}>
            <Plus className="mr-1.5 h-4 w-4" />Add Selected Parts
          </Button>
        </div>
      </div>
    </Modal>
  );
}
