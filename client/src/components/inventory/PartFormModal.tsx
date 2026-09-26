/* eslint-disable react-hooks/set-state-in-effect -- The modal intentionally resets its local draft when its controlling props change. */
import { useEffect, useState } from "react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Modal from "../ui/Modal";
import type { CreatePartInput, Part } from "../../types/part";
import { useCreatePart, useUpdatePart } from "../../hooks/useParts";
import { formatCurrency } from "../../utils/formatters";

type PartFormData = Omit<
  CreatePartInput,
  "quantity" | "minimumStock" | "costPrice" | "sellingPrice"
> & {
  quantity: number | "";
  minimumStock: number | "";
  costPrice: number | "";
  sellingPrice: number | "";
};

interface PartFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  partToEdit?: Part | null;
}

export default function PartFormModal({
  isOpen,
  onClose,
  partToEdit,
}: PartFormModalProps) {
  const createMutation = useCreatePart();
  const updateMutation = useUpdatePart();

  const isEditing = Boolean(partToEdit);

  const [formData, setFormData] = useState<PartFormData>({
    sku: "",
    name: "",
    description: "",
    quantity: 0,
    minimumStock: 5,
    costPrice: 0,
    sellingPrice: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (partToEdit) {
      setFormData({
        sku: partToEdit.sku,
        name: partToEdit.name,
        description: partToEdit.description || "",
        quantity: partToEdit.quantity,
        minimumStock: partToEdit.minimumStock,
        costPrice: Number(partToEdit.costPrice) || 0,
        sellingPrice: Number(partToEdit.sellingPrice) || 0,
      });
    } else {
      setFormData({
        sku: "",
        name: "",
        description: "",
        quantity: 0,
        minimumStock: 5,
        costPrice: 0,
        sellingPrice: 0,
      });
    }
    setErrors({});
  }, [partToEdit, isOpen]);

  const handleChange = (
    field: keyof CreatePartInput,
    value: string | number,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const cost = Number(formData.costPrice) || 0;
  const sell = Number(formData.sellingPrice) || 0;
  const profit = sell - cost;
  const margin = sell > 0 ? ((profit / sell) * 100).toFixed(1) : "0.0";

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.sku.trim()) newErrors.sku = "SKU is required";
    if (!formData.name.trim()) newErrors.name = "Part name is required";
    if (Number(formData.quantity) < 0)
      newErrors.quantity = "Quantity cannot be negative";
    if (Number(formData.minimumStock) < 0)
      newErrors.minimumStock = "Minimum stock cannot be negative";
    if (Number(formData.costPrice) < 0)
      newErrors.costPrice = "Cost price cannot be negative";
    if (Number(formData.sellingPrice) < 0)
      newErrors.sellingPrice = "Selling price cannot be negative";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (isEditing && partToEdit) {
      await updateMutation.mutateAsync({
        id: partToEdit.id,
        data: {
          sku: formData.sku.trim(),
          name: formData.name.trim(),
          description: formData.description?.trim() || undefined,
          quantity: Number(formData.quantity),
          minimumStock: Number(formData.minimumStock),
          costPrice: Number(formData.costPrice),
          sellingPrice: Number(formData.sellingPrice),
        },
      });
    } else {
      await createMutation.mutateAsync({
        sku: formData.sku.trim(),
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        quantity: Number(formData.quantity),
        minimumStock: Number(formData.minimumStock),
        costPrice: Number(formData.costPrice),
        sellingPrice: Number(formData.sellingPrice),
      });
    }
    onClose();
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isEditing ? `Edit Part: ${partToEdit?.sku}` : "Add New Inventory Part"
      }
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* SKU */}
          <div>
            <label className="block text-xs font-medium text-gray-700">
              SKU / Part Code <span className="text-rose-500">*</span>
            </label>
            <Input
              value={formData.sku}
              onChange={(e) =>
                handleChange("sku", e.target.value.toUpperCase())
              }
              placeholder="e.g. BRK-BRE-F01"
              disabled={isSubmitting}
            />
            {errors.sku && (
              <p className="mt-1 text-xs text-rose-500">{errors.sku}</p>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-gray-700">
              Part Name <span className="text-rose-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="e.g. Brembo Front Brake Pads"
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-rose-500">{errors.name}</p>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-gray-700">
            Description / Specifications
          </label>
          <textarea
            value={formData.description || ""}
            onChange={(e) => handleChange("description", e.target.value)}
            rows={2}
            placeholder="Vehicle compatibility, dimensions, grade, manufacturer notes..."
            className="w-full rounded-lg border border-gray-300 p-2.5 text-sm transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={isSubmitting}
          />
        </div>

        {/* Stock quantities */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-gray-700">
              Current Stock Quantity
            </label>
            <Input
              type="number"
              min={0}
              step={1}
              value={formData.quantity}
              onChange={(e) =>
                handleChange(
                  "quantity",
                  e.target.value === "" ? "" : Number(e.target.value),
                )
              }
              disabled={isSubmitting}
            />
            {errors.quantity && (
              <p className="mt-1 text-xs text-rose-500">{errors.quantity}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700">
              Minimum Stock Threshold (Alert Level)
            </label>
            <Input
              type="number"
              min={0}
              step={1}
              value={formData.minimumStock}
              onChange={(e) =>
                handleChange(
                  "minimumStock",
                  e.target.value === "" ? "" : Number(e.target.value),
                )
              }
              disabled={isSubmitting}
            />
            {errors.minimumStock && (
              <p className="mt-1 text-xs text-rose-500">
                {errors.minimumStock}
              </p>
            )}
          </div>
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-gray-700">
              Cost Price (Rs.) <span className="text-rose-500">*</span>
            </label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={formData.costPrice}
              onChange={(e) =>
                handleChange(
                  "costPrice",
                  e.target.value === "" ? "" : Number(e.target.value),
                )
              }
              disabled={isSubmitting}
            />
            {errors.costPrice && (
              <p className="mt-1 text-xs text-rose-500">{errors.costPrice}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700">
              Selling / Retail Price (Rs.){" "}
              <span className="text-rose-500">*</span>
            </label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={formData.sellingPrice}
              onChange={(e) =>
                handleChange(
                  "sellingPrice",
                  e.target.value === "" ? "" : Number(e.target.value),
                )
              }
              disabled={isSubmitting}
            />
            {errors.sellingPrice && (
              <p className="mt-1 text-xs text-rose-500">
                {errors.sellingPrice}
              </p>
            )}
          </div>
        </div>

        {/* Profit margin live calculation */}
        <div className="rounded-lg border border-gray-200 bg-gray-50/70 p-3 text-xs">
          <div className="flex items-center justify-between text-gray-600">
            <span>Unit Profit:</span>
            <span
              className={`font-semibold ${
                profit >= 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {formatCurrency(profit)}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-gray-600">
            <span>Gross Margin:</span>
            <span
              className={`font-semibold ${
                Number(margin) >= 30
                  ? "text-emerald-600"
                  : Number(margin) > 0
                    ? "text-amber-600"
                    : "text-rose-600"
              }`}
            >
              {margin}%
            </span>
          </div>
        </div>

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
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? isEditing
                ? "Updating..."
                : "Saving..."
              : isEditing
                ? "Save Changes"
                : "Create Part"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
