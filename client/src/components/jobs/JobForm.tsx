import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import Button from "../ui/Button";
import Input from "../ui/Input";
import SearchableSelect, {
  type SearchableOption,
} from "../ui/SearchableSelect";
import { useCustomer, useCustomers } from "../../hooks/useCustomers";
import { useMechanics } from "../../hooks/useUsers";
import { jobFormSchema, type JobFormValues } from "../../schemas/jobFormSchema";
import type { RepairJob } from "../../types/job";
import { resolveJobMileageIn } from "../../utils/jobMileage";

interface JobFormProps {
  job?: RepairJob | null;
  onSubmit: (data: JobFormValues) => void | Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const statuses = [
  { value: "RECEIVED", label: "Received" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "WAITING_FOR_PARTS", label: "Waiting for Parts" },
  { value: "COMPLETED", label: "Completed" },
  { value: "READY_FOR_PICKUP", label: "Ready for Pickup" },
  { value: "DELIVERED", label: "Delivered" },
] as const;

const priorities = [
  { value: "LOW", label: "Low" },
  { value: "NORMAL", label: "Normal" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
] as const;

export function JobForm({
  job,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: JobFormProps) {
  const isEditMode = Boolean(job);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      customerId: job?.customerId ?? "",
      vehicleId: job?.vehicleId ?? "",
      mechanicId: job?.mechanicId ?? "",
      complaint: job?.complaint ?? "",
      diagnosis: job?.diagnosis ?? "",
      status: job?.status ?? "RECEIVED",
      priority: job?.priority ?? "NORMAL",
      mileageIn: job?.mileageIn ?? undefined,
      mileageOut: job?.mileageOut ?? undefined,
      notes: job?.notes ?? "",
    },
  });

  const selectedCustomerId = useWatch({ control, name: "customerId" });
  const selectedVehicleId = useWatch({ control, name: "vehicleId" });
  const currentMileageIn = useWatch({ control, name: "mileageIn" });

  const { data: customersData, isLoading: loadingCustomers } = useCustomers({
    limit: 100,
  });
  const customers = customersData?.customers || [];

  const { data: customer, isLoading: loadingCustomer } = useCustomer(
    selectedCustomerId || null,
  );

  const selectedVehicle = customer?.vehicles.find(
    (vehicle) => vehicle.id === selectedVehicleId,
  );

  const { data: mechanics = [], isLoading: loadingMechanics } = useMechanics();

  useEffect(() => {
    const defaultMileageIn = resolveJobMileageIn(
      selectedVehicle?.mileage ?? null,
      currentMileageIn,
    );

    if (
      defaultMileageIn !== undefined &&
      (currentMileageIn === undefined || currentMileageIn === null)
    ) {
      setValue("mileageIn", defaultMileageIn, { shouldDirty: true });
    }
  }, [selectedVehicle, currentMileageIn, setValue]);

  useEffect(() => {
    reset({
      customerId: job?.customerId ?? "",
      vehicleId: job?.vehicleId ?? "",
      mechanicId: job?.mechanicId ?? "",
      complaint: job?.complaint ?? "",
      diagnosis: job?.diagnosis ?? "",
      status: job?.status ?? "RECEIVED",
      priority: job?.priority ?? "NORMAL",
      mileageIn: job?.mileageIn ?? undefined,
      mileageOut: job?.mileageOut ?? undefined,
      notes: job?.notes ?? "",
    });
  }, [job, reset]);

  const handleFormSubmit = async (values: JobFormValues) => {
    const data: JobFormValues = {
      ...values,
      mechanicId: values.mechanicId?.trim() || undefined,
      diagnosis: values.diagnosis?.trim() || undefined,
      notes: values.notes?.trim() || undefined,
    };

    await onSubmit(data);
  };

  // Prepare searchable options
  const customerOptions: SearchableOption[] = customers.map((c) => ({
    value: c.id,
    label: `${c.firstName} ${c.lastName}`,
    subLabel: c.phone
      ? `${c.phone}${c.email ? ` • ${c.email}` : ""}`
      : (c.email ?? undefined),
  }));
  if (customer && !customerOptions.some((c) => c.value === customer.id)) {
    customerOptions.push({
      value: customer.id,
      label: `${customer.firstName} ${customer.lastName}`,
      subLabel: customer.phone
        ? `${customer.phone}${customer.email ? ` • ${customer.email}` : ""}`
        : (customer.email ?? undefined),
    });
  }

  const vehicleOptions: SearchableOption[] = (customer?.vehicles || []).map(
    (v) => ({
      value: v.id,
      label: `${v.make} ${v.model}${v.year ? ` (${v.year})` : ""}`,
      badge: v.registrationNumber,
      subLabel: v.color || undefined,
    }),
  );
  if (job?.vehicle && !vehicleOptions.some((v) => v.value === job.vehicle.id)) {
    vehicleOptions.push({
      value: job.vehicle.id,
      label: `${job.vehicle.make} ${job.vehicle.model}`,
      badge: job.vehicle.registrationNumber,
    });
  }

  const mechanicOptions: SearchableOption[] = mechanics.map((m) => ({
    value: m.id,
    label: m.name,
    subLabel: m.email,
  }));

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      {/* Customer and Vehicle Searchable Selectors */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Controller
            name="customerId"
            control={control}
            render={({ field }) => (
              <SearchableSelect
                id="customerId"
                label="Customer"
                required
                disabled={isEditMode}
                placeholder="Type name, phone or email..."
                searchPlaceholder="Search customer by name or phone..."
                options={customerOptions}
                value={field.value}
                onChange={(val) => {
                  field.onChange(val);
                  setValue("vehicleId", "");
                }}
                isLoading={loadingCustomers}
                error={errors.customerId?.message}
                emptyMessage="No customer found. Add customer first."
              />
            )}
          />
          {!isEditMode && (
            <p className="mt-1 text-[11px] text-slate-400">
              Search by customer name, phone number, or email.
            </p>
          )}
        </div>

        <div>
          <Controller
            name="vehicleId"
            control={control}
            render={({ field }) => (
              <SearchableSelect
                id="vehicleId"
                label="Vehicle"
                required
                disabled={!selectedCustomerId || loadingCustomer || isEditMode}
                placeholder={
                  !selectedCustomerId
                    ? "Select a customer first"
                    : loadingCustomer
                      ? "Loading vehicles..."
                      : "Search by plate or model..."
                }
                searchPlaceholder="Search by license plate or model..."
                options={vehicleOptions}
                value={field.value}
                onChange={(val) => {
                  field.onChange(val);
                  if (val) {
                    const pickedVehicle = customer?.vehicles.find(
                      (vehicle) => vehicle.id === val,
                    );
                    const defaultMileageIn = resolveJobMileageIn(
                      pickedVehicle?.mileage ?? null,
                      undefined,
                    );
                    if (defaultMileageIn !== undefined) {
                      setValue("mileageIn", defaultMileageIn, {
                        shouldDirty: true,
                      });
                    }
                  }
                }}
                isLoading={loadingCustomer}
                error={errors.vehicleId?.message}
                emptyMessage="No vehicles found for this customer."
              />
            )}
          />
          {!isEditMode && (
            <p className="mt-1 text-[11px] text-slate-400">
              Select or search vehicle registered under this customer.
            </p>
          )}
        </div>
      </div>

      <Input
        id="complaint"
        label="Customer Complaint"
        placeholder="Describe the primary symptoms or reason for visit..."
        error={errors.complaint?.message}
        {...register("complaint")}
        required
      />

      <div>
        <label
          htmlFor="diagnosis"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700"
        >
          Diagnosis
        </label>
        <textarea
          id="diagnosis"
          rows={3}
          placeholder="Initial findings, inspection notes, or technician remarks"
          className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 ${
            errors.diagnosis ? "border-rose-400" : "border-slate-200/80"
          }`}
          {...register("diagnosis")}
        />
        {errors.diagnosis && (
          <p className="mt-1 text-xs text-rose-600">
            {errors.diagnosis.message}
          </p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label
            htmlFor="status"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700"
          >
            Job Status
          </label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                id="status"
                className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 ${
                  errors.status ? "border-rose-400" : "border-slate-200/80"
                }`}
              >
                {statuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.status && (
            <p className="mt-1 text-xs text-rose-600">
              {errors.status.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="priority"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700"
          >
            Priority
          </label>
          <Controller
            name="priority"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                id="priority"
                className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 ${
                  errors.priority ? "border-rose-400" : "border-slate-200/80"
                }`}
              >
                {priorities.map((priority) => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.priority && (
            <p className="mt-1 text-xs text-rose-600">
              {errors.priority.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Input
          id="mileageIn"
          label="Mileage In (KM)"
          type="number"
          placeholder="e.g. 45000"
          error={errors.mileageIn?.message}
          {...register("mileageIn", {
            setValueAs: (value) =>
              value === "" || value === null || Number.isNaN(Number(value))
                ? undefined
                : Number(value),
          })}
        />

        <Input
          id="mileageOut"
          label="Mileage Out (KM)"
          type="number"
          placeholder="e.g. 45020"
          error={errors.mileageOut?.message}
          {...register("mileageOut", {
            setValueAs: (value) =>
              value === "" || value === null || Number.isNaN(Number(value))
                ? undefined
                : Number(value),
          })}
        />
      </div>

      {/* Mechanic Selection */}
      <div>
        <Controller
          name="mechanicId"
          control={control}
          render={({ field }) => (
            <SearchableSelect
              id="mechanicId"
              label="Assigned Mechanic"
              placeholder="Search or choose mechanic (optional)..."
              searchPlaceholder="Search mechanic by name..."
              options={mechanicOptions}
              value={field.value || ""}
              onChange={field.onChange}
              isLoading={loadingMechanics}
              error={errors.mechanicId?.message}
              emptyMessage="No mechanics found in staff."
            />
          )}
        />
        {mechanics.length === 0 && !loadingMechanics && (
          <p className="mt-1 text-xs text-slate-400">
            No mechanics registered in the system yet.
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="notes"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700"
        >
          Internal Notes
        </label>
        <textarea
          id="notes"
          rows={3}
          placeholder="Internal garage remarks (not shown to customer)"
          className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 ${
            errors.notes ? "border-rose-400" : "border-slate-200/80"
          }`}
          {...register("notes")}
        />
        {errors.notes && (
          <p className="mt-1 text-xs text-rose-600">{errors.notes.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {isEditMode ? "Update Job" : "Create Job"}
        </Button>
      </div>
    </form>
  );
}
