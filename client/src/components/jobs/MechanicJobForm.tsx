import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import Button from "../ui/Button";
import Input from "../ui/Input";
import { mechanicJobUpdateSchema } from "../../schemas/jobFormSchema";
import type { MechanicUpdateRepairJobInput, RepairJob } from "../../types/job";

interface MechanicJobFormProps {
  job: RepairJob;
  onSubmit: (data: MechanicUpdateRepairJobInput) => void | Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function MechanicJobForm({
  job,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: MechanicJobFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MechanicUpdateRepairJobInput>({
    resolver: zodResolver(mechanicJobUpdateSchema),
    defaultValues: {
      diagnosis: job.diagnosis ?? "",
      status: job.status,
      mileageOut: job.mileageOut ?? undefined,
      notes: job.notes ?? "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        Customer, vehicle, complaint, assignment, and priority are managed by
        the front office.
      </div>

      <div>
        <label
          htmlFor="mechanic-status"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700"
        >
          Job Status
        </label>
        <select
          id="mechanic-status"
          className="w-full rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50"
          {...register("status")}
        >
          {job.status === "RECEIVED" && (
            <option value="RECEIVED">Received</option>
          )}
          {(job.status === "RECEIVED" || job.status === "IN_PROGRESS") && (
            <option value="IN_PROGRESS">In Progress</option>
          )}
          {(job.status === "IN_PROGRESS" ||
            job.status === "WAITING_FOR_PARTS") && (
            <option value="WAITING_FOR_PARTS">Waiting for Parts</option>
          )}
          {(job.status === "IN_PROGRESS" ||
            job.status === "WAITING_FOR_PARTS") && (
            <option value="COMPLETED">Completed</option>
          )}
          {job.status === "COMPLETED" && (
            <option value="COMPLETED">Completed</option>
          )}
          {job.status === "READY_FOR_PICKUP" && (
            <option value="READY_FOR_PICKUP">Ready for Pickup</option>
          )}
          {job.status === "DELIVERED" && (
            <option value="DELIVERED">Delivered</option>
          )}
        </select>
        <p className="mt-1 text-xs text-slate-500">
          You can move the job through its workshop stages. Front office handles
          pickup and delivery.
        </p>
      </div>

      <div>
        <label
          htmlFor="mechanic-diagnosis"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700"
        >
          Diagnosis
        </label>
        <textarea
          id="mechanic-diagnosis"
          rows={4}
          placeholder="Record your inspection findings and diagnosis"
          className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 ${errors.diagnosis ? "border-rose-400" : "border-slate-200/80"}`}
          {...register("diagnosis")}
        />
        {errors.diagnosis && (
          <p className="mt-1 text-xs text-rose-600">
            {errors.diagnosis.message}
          </p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Input
          id="mechanic-mileage-out"
          label="Mileage Out (KM)"
          type="number"
          placeholder="e.g. 45020"
          error={errors.mileageOut?.message}
          {...register("mileageOut", {
            setValueAs: (value) => (value === "" ? undefined : Number(value)),
          })}
        />
      </div>

      <div>
        <label
          htmlFor="mechanic-notes"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700"
        >
          Internal Notes
        </label>
        <textarea
          id="mechanic-notes"
          rows={3}
          placeholder="Add work notes for the garage team"
          className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 ${errors.notes ? "border-rose-400" : "border-slate-200/80"}`}
          {...register("notes")}
        />
        {errors.notes && (
          <p className="mt-1 text-xs text-rose-600">{errors.notes.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-3">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          Save Updates
        </Button>
      </div>
    </form>
  );
}
