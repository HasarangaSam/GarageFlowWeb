import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import Button from "../ui/Button";
import Input from "../ui/Input";
import SearchableSelect from "../ui/SearchableSelect";

import { useCustomers } from "../../hooks/useCustomers";
import { vehicleFormSchema } from "../../schemas/vehicleFormSchema";

import type { Vehicle, VehicleDetails } from "../../types/vehicle";
import type { VehicleFormValues } from "../../schemas/vehicleFormSchema";

interface VehicleFormProps {
  vehicle?: Vehicle | VehicleDetails;
  onSubmit: (data: VehicleFormValues) => void | Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const VehicleForm = ({
  vehicle,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: VehicleFormProps) => {
  const isEditMode = Boolean(vehicle);

  const { data: customerData, isLoading: customersLoading } = useCustomers({
    page: 1,
    limit: 100,
  });

  const customers = customerData?.customers ?? [];

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: {
      customerId: vehicle?.customerId ?? "",
      registrationNumber: vehicle?.registrationNumber ?? "",
      make: vehicle?.make ?? "",
      model: vehicle?.model ?? "",
      year: vehicle?.year ?? undefined,
      mileage: vehicle?.mileage ?? undefined,
    },
  });

  useEffect(() => {
    reset({
      customerId: vehicle?.customerId ?? "",
      registrationNumber: vehicle?.registrationNumber ?? "",
      make: vehicle?.make ?? "",
      model: vehicle?.model ?? "",
      year: vehicle?.year ?? undefined,
      mileage: vehicle?.mileage ?? undefined,
    });
  }, [vehicle, reset]);

  const handleFormSubmit = async (data: VehicleFormValues) => {
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          {isEditMode ? (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Customer
              </label>

              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700">
                {vehicle?.customer
                  ? `${vehicle.customer.firstName} ${vehicle.customer.lastName}`
                  : "Customer"}
              </div>

              <p className="mt-1 text-xs text-gray-500">
                The customer cannot be changed after the vehicle is created.
              </p>
            </div>
          ) : (
            <Controller
              name="customerId"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  id="customerId"
                  label="Customer"
                  required
                  placeholder="Select or search customer..."
                  searchPlaceholder="Search customer by name or phone..."
                  options={customers.map((c) => ({
                    value: c.id,
                    label: `${c.firstName} ${c.lastName}`,
                    subLabel: c.phone ? `${c.phone}${c.email ? ` • ${c.email}` : ""}` : c.email ?? undefined,
                  }))}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={customersLoading || isSubmitting}
                  isLoading={customersLoading}
                  error={errors.customerId?.message}
                  emptyMessage="No matching customers found."
                />
              )}
            />
          )}
        </div>

        <Input
          label="Registration Number"
          placeholder="e.g. CAB-1234"
          error={errors.registrationNumber?.message}
          disabled={isSubmitting}
          {...register("registrationNumber")}
        />

        <Input
          label="Make"
          placeholder="e.g. Toyota"
          error={errors.make?.message}
          disabled={isSubmitting}
          {...register("make")}
        />

        <Input
          label="Model"
          placeholder="e.g. Corolla"
          error={errors.model?.message}
          disabled={isSubmitting}
          {...register("model")}
        />

        <Controller
          name="year"
          control={control}
          render={({ field }) => (
            <Input
              label="Year"
              type="number"
              placeholder="e.g. 2022"
              error={errors.year?.message}
              disabled={isSubmitting}
              value={field.value ?? ""}
              onChange={(event) => {
                const value = event.target.value;

                field.onChange(value === "" ? undefined : Number(value));
              }}
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
            />
          )}
        />

        <Controller
          name="mileage"
          control={control}
          render={({ field }) => (
            <Input
              label="Mileage"
              type="number"
              placeholder="e.g. 45000"
              error={errors.mileage?.message}
              disabled={isSubmitting}
              value={field.value ?? ""}
              onChange={(event) => {
                const value = event.target.value;

                field.onChange(value === "" ? undefined : Number(value));
              }}
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
            />
          )}
        />
      </div>

      <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>

        <Button type="submit" loading={isSubmitting}>
          {isEditMode ? "Update Vehicle" : "Create Vehicle"}
        </Button>
      </div>
    </form>
  );
};
