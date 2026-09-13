import { useState, type ChangeEvent } from "react";
import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
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
import Badge from "../components/ui/Badge";
import Loading from "../components/ui/Loading";
import ConfirmDialog from "../components/ui/ConfirmDialog";

import { VehicleForm } from "../components/vehicles/VehicleForm";

import {
  useCreateVehicle,
  useDeleteVehicle,
  useUpdateVehicle,
  useVehicle,
  useVehicles,
} from "../hooks/useVehicles";

import { useAuth } from "../hooks/useAuth";

import type { VehicleFormValues } from "../schemas/vehicleFormSchema";
import type { Vehicle } from "../types/vehicle";

const PAGE_SIZE = 10;

export default function VehiclesPage() {
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const [viewingVehicleId, setViewingVehicleId] = useState<string | null>(null);

  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null);

  const { data, isLoading, isFetching, isError } = useVehicles({
    page,
    limit: PAGE_SIZE,
    search: search.trim() || undefined,
  });

  const { data: vehicleDetails, isLoading: detailsLoading } =
    useVehicle(viewingVehicleId);

  const createMutation = useCreateVehicle();
  const updateMutation = useUpdateVehicle();
  const deleteMutation = useDeleteVehicle();

  const canManage = user?.role === "OWNER" || user?.role === "MANAGER";

  const canDelete = user?.role === "OWNER";

  const vehicles = data?.vehicles ?? [];
  const pagination = data?.pagination;

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setSearch(event.target.value);
    setPage(1);
  };

  const handleCreate = (): void => {
    setEditingVehicle(null);
    setIsFormOpen(true);
  };

  const handleEdit = (vehicle: Vehicle): void => {
    setEditingVehicle(vehicle);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (
    formData: VehicleFormValues,
  ): Promise<void> => {
    try {
      if (editingVehicle) {
        await updateMutation.mutateAsync({
          vehicleId: editingVehicle.id,
          data: {
            registrationNumber: formData.registrationNumber,
            make: formData.make,
            model: formData.model,
            year: formData.year,
            mileage: formData.mileage,
          },
        });

        toast.success("Vehicle updated successfully");
      } else {
        await createMutation.mutateAsync({
          customerId: formData.customerId,
          registrationNumber: formData.registrationNumber,
          make: formData.make,
          model: formData.model,
          year: formData.year,
          mileage: formData.mileage,
        });

        toast.success("Vehicle created successfully");
      }

      setIsFormOpen(false);
      setEditingVehicle(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong",
      );
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!deletingVehicle) return;

    try {
      await deleteMutation.mutateAsync(deletingVehicle.id);

      toast.success("Vehicle deleted successfully");
      setDeletingVehicle(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to delete vehicle",
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Vehicles</h1>
          <p className="mt-1 text-xs text-slate-500">
            Manage customer vehicles, registration records, and service logs.
          </p>
        </div>

        {canManage && (
          <Button onClick={handleCreate} className="w-full sm:w-auto">
            <Plus className="mr-1.5 h-4 w-4" />
            Add Vehicle
          </Button>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <Input
            placeholder="Search registration, make, model or customer..."
            value={search}
            onChange={handleSearchChange}
            className="pl-9"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        {isLoading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <Loading size="lg" text="Loading vehicles..." />
          </div>
        ) : isError ? (
          <div className="flex min-h-[300px] items-center justify-center px-6 text-center">
            <div>
              <p className="font-medium text-slate-900">
                Unable to load vehicles
              </p>

              <p className="mt-1 text-xs text-slate-500">Please try again.</p>
            </div>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="flex min-h-[300px] items-center justify-center px-6 text-center">
            <div>
              <p className="font-medium text-slate-900">No vehicles found</p>

              <p className="mt-1 text-xs text-slate-500">
                {search
                  ? "Try changing your search."
                  : "Add your first vehicle to get started."}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Registration</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Mileage</TableHead>
                    <TableHead>Jobs</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {vehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-xs text-slate-900">
                            {vehicle.make} {vehicle.model}
                          </p>

                          <p className="text-[11px] text-slate-400">
                            {vehicle.id.slice(0, 8)}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="inline-flex items-center rounded-md border border-slate-300 bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-800 shadow-2xs">
                          {vehicle.registrationNumber}
                        </span>
                      </TableCell>

                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-900">
                            {vehicle.customer.firstName}{" "}
                            {vehicle.customer.lastName}
                          </p>

                          <p className="text-xs text-slate-500">
                            {vehicle.customer.phone}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>{vehicle.year ?? "-"}</TableCell>

                      <TableCell>
                        {vehicle.mileage != null
                          ? `${vehicle.mileage.toLocaleString()} km`
                          : "-"}
                      </TableCell>

                      <TableCell>{vehicle._count?.jobs ?? 0}</TableCell>

                      <TableCell>{formatDate(vehicle.createdAt)}</TableCell>

                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewingVehicleId(vehicle.id)}
                            title="View vehicle"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {canManage && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(vehicle)}
                              title="Edit vehicle"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}

                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletingVehicle(vehicle)}
                              title="Delete vehicle"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500">
                  Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} vehicles)
                </p>

                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page === 1 || isFetching}
                    onClick={() => setPage((current) => current - 1)}
                  >
                    Previous
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page === pagination.totalPages || isFetching}
                    onClick={() => setPage((current) => current + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={() => {
          if (!createMutation.isPending && !updateMutation.isPending) {
            setIsFormOpen(false);
            setEditingVehicle(null);
          }
        }}
        title={editingVehicle ? "Edit Vehicle" : "Add Vehicle"}
        description={
          editingVehicle
            ? "Update the vehicle information."
            : "Add a vehicle to a customer."
        }
        size="lg"
      >
        <VehicleForm
          vehicle={editingVehicle ?? undefined}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingVehicle(null);
          }}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      </Modal>

      <Modal
        isOpen={Boolean(viewingVehicleId)}
        onClose={() => setViewingVehicleId(null)}
        title="Vehicle Details"
        description="Vehicle information and service history."
        size="lg"
      >
        {detailsLoading ? (
          <div className="flex min-h-[250px] items-center justify-center">
            <Loading size="md" text="Loading vehicle..." />
          </div>
        ) : vehicleDetails ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Vehicle
                </p>

                <p className="mt-1 font-medium text-slate-900">
                  {vehicleDetails.make} {vehicleDetails.model}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Registration
                </p>

                <p className="mt-1 font-medium text-slate-900">
                  {vehicleDetails.registrationNumber}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Customer
                </p>

                <p className="mt-1 text-slate-900">
                  {vehicleDetails.customer.firstName}{" "}
                  {vehicleDetails.customer.lastName}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Phone
                </p>

                <p className="mt-1 text-slate-900">
                  {vehicleDetails.customer.phone}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Year
                </p>

                <p className="mt-1 text-slate-900">
                  {vehicleDetails.year ?? "-"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Mileage
                </p>

                <p className="mt-1 text-slate-900">
                  {vehicleDetails.mileage != null
                    ? `${vehicleDetails.mileage.toLocaleString()} km`
                    : "-"}
                </p>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-900">
                Service History
              </h3>

              {vehicleDetails.jobs.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center">
                  <p className="text-sm text-slate-500">
                    No service history yet.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200/80">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job</TableHead>
                        <TableHead>Complaint</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Mechanic</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {vehicleDetails.jobs.map((job) => (
                        <TableRow key={job.id}>
                          <TableCell className="font-medium">
                            {job.jobNumber}
                          </TableCell>

                          <TableCell>
                            <span className="line-clamp-2 max-w-xs">
                              {job.complaint}
                            </span>
                          </TableCell>

                          <TableCell>
                            <Badge variant="info">
                              {job.status.replaceAll("_", " ")}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            {job.mechanic?.name ?? "Unassigned"}
                          </TableCell>

                          <TableCell>{formatDate(job.createdAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-slate-500">
            Vehicle information could not be loaded.
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deletingVehicle)}
        onClose={() => {
          if (!deleteMutation.isPending) {
            setDeletingVehicle(null);
          }
        }}
        onConfirm={handleDelete}
        title="Delete Vehicle"
        message={
          deletingVehicle
            ? `Are you sure you want to delete ${deletingVehicle.make} ${deletingVehicle.model} (${deletingVehicle.registrationNumber})? This action cannot be undone.`
            : ""
        }
        confirmText="Delete Vehicle"
        loading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
}

