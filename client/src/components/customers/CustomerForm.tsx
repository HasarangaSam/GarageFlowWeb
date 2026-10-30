import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import Button from "../ui/Button";
import Input from "../ui/Input";

import {
  customerFormSchema,
  type CustomerFormValues,
} from "../../schemas/customerSchema";

import type { Customer } from "../../types/customer";

interface CustomerFormProps {
  customer?: Customer | null;
  onSubmit: (data: CustomerFormValues) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function CustomerForm({
  customer,
  onSubmit,
  onCancel,
  loading = false,
}: CustomerFormProps) {
  const isEditing = Boolean(customer);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      address: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (customer) {
      reset({
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        email: customer.email ?? "",
        address: customer.address ?? "",
        notes: customer.notes ?? "",
      });
    } else {
      reset({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        address: "",
        notes: "",
      });
    }
  }, [customer, reset]);

  const submitForm = (data: CustomerFormValues) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(submitForm)} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id="firstName"
          label="First name"
          placeholder="Enter first name"
          required
          {...register("firstName")}
          error={errors.firstName?.message}
        />

        <Input
          id="lastName"
          label="Last name"
          placeholder="Enter last name"
          required
          {...register("lastName")}
          error={errors.lastName?.message}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id="phone"
          label="Phone"
          placeholder="Enter phone number"
          required
          {...register("phone")}
          error={errors.phone?.message}
        />

        <Input
          id="email"
          label="Email"
          type="email"
          placeholder="Enter email address"
          {...register("email")}
          error={errors.email?.message}
        />
      </div>

      <div>
        <label
          htmlFor="address"
          className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300"
        >
          Address
        </label>

        <textarea
          id="address"
          rows={3}
          placeholder="Enter customer address"
          className={`w-full resize-none rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-2 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 ${
            errors.address
              ? "border-red-400 focus:border-red-500 focus:ring-red-100 dark:border-rose-500 dark:focus:ring-rose-950/20"
              : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-100 dark:border-slate-700 dark:focus:border-indigo-500 dark:focus:ring-indigo-500/20"
          }`}
          {...register("address")}
        />

        {errors.address && (
          <p className="mt-1.5 text-xs text-red-600 dark:text-rose-400">
            {errors.address.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="notes"
          className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-slate-300"
        >
          Notes
        </label>

        <textarea
          id="notes"
          rows={4}
          placeholder="Add any additional notes"
          className={`w-full resize-none rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-2 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 ${
            errors.notes
              ? "border-red-400 focus:border-red-500 focus:ring-red-100 dark:border-rose-500 dark:focus:ring-rose-950/20"
              : "border-gray-300 focus:border-indigo-500 focus:ring-indigo-100 dark:border-slate-700 dark:focus:border-indigo-500 dark:focus:ring-indigo-500/20"
          }`}
          {...register("notes")}
        />

        {errors.notes && (
          <p className="mt-1.5 text-xs text-red-600 dark:text-rose-400">{errors.notes.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-2 border-t pt-4 dark:border-slate-800">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>

        <Button type="submit" loading={loading}>
          {isEditing ? "Update Customer" : "Create Customer"}
        </Button>
      </div>
    </form>
  );
}
