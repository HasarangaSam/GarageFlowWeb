import { useState, type ChangeEvent } from "react";
import {
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
  Filter,
  Wrench,
} from "lucide-react";
import { toast } from "react-hot-toast";

import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";
import Table, {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/Table";
import Loading from "../components/ui/Loading";
import ConfirmDialog from "../components/ui/ConfirmDialog";

import { JobForm } from "../components/jobs/JobForm";
import JobDetails from "../components/jobs/JobDetails";
import MechanicJobForm from "../components/jobs/MechanicJobForm";
import JobStatusBadge from "../components/jobs/JobStatusBadge";
import JobPriorityBadge from "../components/jobs/JobPriorityBadge";

import {
  useCreateJob,
  useDeleteJob,
  useJob,
  useJobs,
  useMyJobs,
  useUpdateJob,
  useUpdateJobAsMechanic,
} from "../hooks/useJobs";
import { useAuth } from "../hooks/useAuth";

import type { JobFormValues } from "../schemas/jobFormSchema";
import type {
  JobPriority,
  JobStatus,
  MechanicUpdateRepairJobInput,
  RepairJob,
} from "../types/job";

const PAGE_SIZE = 10;

interface JobsPageProps {
  isMyJobs?: boolean;
}

const statusOptions: { value: string; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: "RECEIVED", label: "Received" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "WAITING_FOR_PARTS", label: "Waiting for Parts" },
  { value: "COMPLETED", label: "Completed" },
  { value: "READY_FOR_PICKUP", label: "Ready for Pickup" },
  { value: "DELIVERED", label: "Delivered" },
];

const priorityOptions: { value: string; label: string }[] = [
  { value: "", label: "All Priorities" },
  { value: "LOW", label: "Low" },
  { value: "NORMAL", label: "Normal" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

export default function JobsPage({ isMyJobs = false }: JobsPageProps) {
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<JobStatus | "">("");
  const [priorityFilter, setPriorityFilter] = useState<JobPriority | "">("");
  const [page, setPage] = useState(1);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<RepairJob | null>(null);

  const [viewingJobId, setViewingJobId] = useState<string | null>(null);
  const [deletingJob, setDeletingJob] = useState<RepairJob | null>(null);

  // Queries
  const allJobsQuery = useJobs(
    isMyJobs
      ? undefined
      : {
          page,
          limit: PAGE_SIZE,
          search: search.trim() || undefined,
          status: (statusFilter as JobStatus) || undefined,
          priority: (priorityFilter as JobPriority) || undefined,
        },
  );

  const myJobsQuery = useMyJobs(isMyJobs ? page : 1, PAGE_SIZE);

  const activeQuery = isMyJobs ? myJobsQuery : allJobsQuery;
  const { data, isLoading, isFetching, isError } = activeQuery;

  const { data: jobDetails, isLoading: detailsLoading } = useJob(viewingJobId);

  // Mutations
  const createMutation = useCreateJob();
  const updateMutation = useUpdateJob();
  const mechanicUpdateMutation = useUpdateJobAsMechanic();
  const deleteMutation = useDeleteJob();

  const canManage = user?.role === "OWNER" || user?.role === "MANAGER";
  const isMechanic = user?.role === "MECHANIC";
  // Mechanics can add/remove parts on their jobs; the backend enforces ownership
  const canManageParts = canManage || isMechanic;
  const canDelete = user?.role === "OWNER";

  const jobs = data?.jobs ?? [];
  const pagination = data?.pagination;

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleCreate = (): void => {
    setEditingJob(null);
    setIsFormOpen(true);
  };

  const handleEdit = (job: RepairJob): void => {
    setEditingJob(job);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (formData: JobFormValues): Promise<void> => {
    try {
      if (editingJob) {
        await updateMutation.mutateAsync({
          jobId: editingJob.id,
          data: {
            mechanicId: formData.mechanicId || undefined,
            complaint: formData.complaint,
            diagnosis: formData.diagnosis || undefined,
            status: formData.status,
            priority: formData.priority,
            mileageIn: formData.mileageIn ?? undefined,
            mileageOut: formData.mileageOut ?? undefined,
            notes: formData.notes || undefined,
          },
        });
        toast.success("Job updated successfully");
      } else {
        await createMutation.mutateAsync({
          customerId: formData.customerId,
          vehicleId: formData.vehicleId,
          mechanicId: formData.mechanicId || undefined,
          complaint: formData.complaint,
          diagnosis: formData.diagnosis || undefined,
          status: formData.status,
          priority: formData.priority,
          mileageIn: formData.mileageIn,
          notes: formData.notes || undefined,
        });
        toast.success("Job created successfully");
      }

      setIsFormOpen(false);
      setEditingJob(null);
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error(
        err.response?.data?.message || err.message || "Failed to save job",
      );
    }
  };

  const handleMechanicFormSubmit = async (
    formData: MechanicUpdateRepairJobInput,
  ): Promise<void> => {
    if (!editingJob) return;

    try {
      await mechanicUpdateMutation.mutateAsync({
        jobId: editingJob.id,
        data: {
          ...formData,
          diagnosis: formData.diagnosis || undefined,
          notes: formData.notes || undefined,
        },
      });
      toast.success("Job updates saved successfully");
      setIsFormOpen(false);
      setEditingJob(null);
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to save job updates",
      );
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!deletingJob) return;

    try {
      await deleteMutation.mutateAsync(deletingJob.id);
      toast.success("Job deleted successfully");
      setDeletingJob(null);
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error(
        err.response?.data?.message || err.message || "Unable to delete job",
      );
    }
  };

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString("en-LK", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            {isMyJobs && <Wrench className="h-5 w-5 text-indigo-600" />}
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              {isMyJobs ? "My Assigned Jobs" : "Repair Jobs"}
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {isMyJobs
              ? "View and update repair jobs currently assigned to you."
              : "Track, manage, and assign repair jobs across your garage."}
          </p>
        </div>

        {canManage && !isMyJobs && (
          <Button onClick={handleCreate} className="w-full sm:w-auto">
            <Plus className="mr-1.5 h-4 w-4" />
            New Repair Job
          </Button>
        )}
      </div>

      {/* Filters (only on main jobs view) */}
      {!isMyJobs && (
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search job #, customer, or vehicle registration..."
              value={search}
              onChange={handleSearchChange}
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as JobStatus | "");
                  setPage(1);
                }}
                className="rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value as JobPriority | "");
                setPage(1);
              }}
              className="rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {priorityOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {isLoading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <Loading />
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-sm text-red-500">
            Failed to load repair jobs. Please try refreshing the page.
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-base font-medium text-gray-900">
              No repair jobs found
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {isMyJobs
                ? "You do not have any repair jobs assigned to you right now."
                : search || statusFilter || priorityFilter
                  ? "No jobs match your current search and filter criteria."
                  : "Get started by creating your first repair job."}
            </p>
            {canManage &&
              !isMyJobs &&
              !search &&
              !statusFilter &&
              !priorityFilter && (
                <Button onClick={handleCreate} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  New Repair Job
                </Button>
              )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Mechanic</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-semibold text-gray-900">
                        {job.jobNumber}
                      </TableCell>

                      <TableCell>
                        <div className="font-semibold text-xs text-slate-900">
                          {job.customer.firstName} {job.customer.lastName}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {job.customer.phone}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-col gap-1 items-start">
                          <span className="inline-flex items-center rounded-md border border-slate-300 bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-800">
                            {job.vehicle.registrationNumber}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {job.vehicle.make} {job.vehicle.model}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <JobStatusBadge status={job.status} />
                      </TableCell>

                      <TableCell>
                        <JobPriorityBadge priority={job.priority} />
                      </TableCell>

                      <TableCell>
                        {job.mechanic ? (
                          <span className="inline-flex items-center rounded-lg border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                            {job.mechanic.name}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            Unassigned
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-sm text-gray-500">
                        {formatDate(job.createdAt)}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            title="View Details"
                            onClick={() => setViewingJobId(job.id)}
                            className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {(canManage || isMyJobs) && (
                            <button
                              type="button"
                              title="Edit Job"
                              onClick={() => handleEdit(job)}
                              className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          )}

                          {canDelete && !isMyJobs && (
                            <button
                              type="button"
                              title="Delete Job"
                              onClick={() => setDeletingJob(job)}
                              className="rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
                <div className="text-sm text-gray-500">
                  Showing page {pagination.page} of {pagination.totalPages} (
                  {pagination.total} total jobs)
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page <= 1 || isFetching}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page >= pagination.totalPages || isFetching}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create / Edit Job Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingJob(null);
        }}
        title={
          editingJob
            ? `${isMyJobs ? "Update" : "Edit"} Job - ${editingJob.jobNumber}`
            : "New Repair Job"
        }
        description={
          editingJob
            ? isMyJobs
              ? "Add your diagnosis, mileage out, work notes, and job status."
              : "Update repair job specifications, mechanic assignment, and status."
            : "Register a new repair job for customer vehicle service."
        }
        size="xl"
      >
        {isMyJobs && editingJob ? (
          <MechanicJobForm
            job={editingJob}
            onSubmit={handleMechanicFormSubmit}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingJob(null);
            }}
            isSubmitting={mechanicUpdateMutation.isPending}
          />
        ) : (
          <JobForm
            job={editingJob}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingJob(null);
            }}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
          />
        )}
      </Modal>

      {/* View Details Modal */}
      <Modal
        isOpen={Boolean(viewingJobId)}
        onClose={() => setViewingJobId(null)}
        title="Repair Job Details"
        size="xl"
      >
        {detailsLoading || !jobDetails ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <Loading />
          </div>
        ) : (
          <JobDetails
            job={jobDetails}
            canManageParts={canManageParts}
            onEdit={() => {
              const current = jobDetails;
              setViewingJobId(null);
              handleEdit(current);
            }}
          />
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingJob)}
        onClose={() => setDeletingJob(null)}
        onConfirm={handleDelete}
        title="Delete Repair Job"
        message={`Are you sure you want to delete job ${deletingJob?.jobNumber}? This action cannot be undone.`}
        confirmText="Delete Job"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
