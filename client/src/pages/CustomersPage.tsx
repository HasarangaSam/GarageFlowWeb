import { useState } from "react";
import { Eye, Pencil, Plus, Search, Trash2, Users } from "lucide-react";
import toast from "react-hot-toast";

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

import CustomerForm from "../components/customers/CustomerForm";

import {
  useCreateCustomer,
  useCustomer,
  useCustomers,
  useDeleteCustomer,
  useUpdateCustomer,
} from "../hooks/useCustomers";

import { useAuth } from "../hooks/useAuth";

import type { Customer, CustomerListParams } from "../types/customer";

import type { CustomerFormValues } from "../schemas/customerSchema";

const PAGE_SIZE = 10;

export default function CustomersPage() {
  const { user } = useAuth();

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsCustomerId, setDetailsCustomerId] = useState<string | null>(
    null,
  );

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(
    null,
  );

  const params: CustomerListParams = {
    page,
    limit: PAGE_SIZE,
    ...(search ? { search } : {}),
  };

  const { data, isLoading, isFetching, isError } = useCustomers(params);

  const { data: customerDetails, isLoading: isLoadingDetails } =
    useCustomer(detailsCustomerId);

  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();
  const deleteMutation = useDeleteCustomer();

  const canManage = user?.role === "OWNER" || user?.role === "MANAGER";

  const canDelete = user?.role === "OWNER";

  const customers = data?.customers ?? [];
  const pagination = data?.pagination;

  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  const handleAdd = () => {
    setSelectedCustomer(null);
    setFormOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormOpen(true);
  };

  const handleDetails = (customerId: string) => {
    setDetailsCustomerId(customerId);
    setDetailsOpen(true);
  };

  const handleDeleteClick = (customer: Customer) => {
    setCustomerToDelete(customer);
    setDeleteOpen(true);
  };

  const handleFormSubmit = async (formData: CustomerFormValues) => {
    try {
      if (selectedCustomer) {
        await updateMutation.mutateAsync({
          customerId: selectedCustomer.id,
          data: formData,
        });

        toast.success("Customer updated successfully");
      } else {
        await createMutation.mutateAsync(formData);

        toast.success("Customer created successfully");
      }

      setFormOpen(false);
      setSelectedCustomer(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong",
      );
    }
  };

  const handleDelete = async () => {
    if (!customerToDelete) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(customerToDelete.id);

      toast.success("Customer deleted successfully");

      setDeleteOpen(false);
      setCustomerToDelete(null);

      if (customers.length === 1 && page > 1) {
        setPage((currentPage) => currentPage - 1);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to delete customer",
      );
    }
  };

  const isFormLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Customers
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Manage your garage customer directory, vehicles, and contact profiles.
          </p>
        </div>

        {canManage && (
          <Button onClick={handleAdd}>
            <Plus size={16} />
            Add Customer
          </Button>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <Input
              id="customer-search"
              placeholder="Search by name, phone or email..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleSearch();
                }
              }}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSearch}>
              <Search size={15} />
              Search
            </Button>

            {search && (
              <Button variant="secondary" onClick={handleClearSearch}>
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-12 shadow-xs">
          <Loading size="lg" text="Loading customers..." />
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-rose-200/80 bg-rose-50 p-8 text-center shadow-xs">
          <p className="text-sm font-medium text-rose-700">
            Unable to load customers.
          </p>
          <p className="mt-1 text-sm text-rose-600">Please try again.</p>
        </div>
      ) : (
        <>
          <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
            {isFetching && (
              <div className="absolute right-4 top-4 z-10">
                <Loading size="sm" />
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Vehicles</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {customers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      {...({ colSpan: 6 } as { colSpan: number })}
                      className="py-16 text-center"
                    >
                      <Users className="mx-auto mb-3 text-slate-300" size={32} />
                      <p className="font-medium text-slate-900">
                        No customers found
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {search
                          ? "Try a different search."
                          : "Add your first customer to get started."}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-900">
                            {customer.firstName} {customer.lastName}
                          </p>
                          <p className="text-xs text-slate-400 font-mono">
                            {customer.id.slice(0, 8)}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell className="text-slate-700">{customer.phone}</TableCell>

                      <TableCell>
                        {customer.email ? (
                          <span className="text-slate-700">{customer.email}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={
                            (customer._count?.vehicles ?? 0) > 0
                              ? "info"
                              : "default"
                          }
                        >
                          {customer._count?.vehicles ?? 0}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-slate-600 text-xs">
                        {new Date(customer.createdAt).toLocaleDateString("en-LK", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>

                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleDetails(customer.id)}
                            title="View customer"
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                          >
                            <Eye size={17} />
                          </button>

                          {canManage && (
                            <button
                              type="button"
                              onClick={() => handleEdit(customer)}
                              title="Edit customer"
                              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                            >
                              <Pencil size={17} />
                            </button>
                          )}

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDeleteClick(customer)}
                              title="Delete customer"
                              className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
                            >
                              <Trash2 size={17} />
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {pagination && pagination.totalPages > 0 && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                Showing{" "}
                {customers.length === 0
                  ? 0
                  : (pagination.page - 1) * pagination.limit + 1}{" "}
                to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                of {pagination.total} customers
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() =>
                    setPage((currentPage) => Math.max(currentPage - 1, 1))
                  }
                >
                  Previous
                </Button>

                <span className="px-2 text-xs text-slate-600">
                  Page {pagination.page} of {pagination.totalPages}
                </span>

                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() =>
                    setPage((currentPage) =>
                      Math.min(currentPage + 1, pagination.totalPages),
                    )
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <Modal
        isOpen={formOpen}
        onClose={() => {
          if (!isFormLoading) {
            setFormOpen(false);
            setSelectedCustomer(null);
          }
        }}
        title={selectedCustomer ? "Edit Customer" : "Add Customer"}
        description={
          selectedCustomer
            ? "Update the customer's information."
            : "Enter the customer's information."
        }
        size="lg"
      >
        <CustomerForm
          customer={selectedCustomer}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setFormOpen(false);
            setSelectedCustomer(null);
          }}
          loading={isFormLoading}
        />
      </Modal>

      <Modal
        isOpen={detailsOpen}
        onClose={() => {
          setDetailsOpen(false);
          setDetailsCustomerId(null);
        }}
        title="Customer Details"
        size="lg"
      >
        {isLoadingDetails ? (
          <Loading size="md" text="Loading customer..." className="py-8" />
        ) : customerDetails ? (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Name
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {customerDetails.firstName} {customerDetails.lastName}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Phone
                </p>
                <p className="mt-1 text-sm text-slate-900">
                  {customerDetails.phone}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Email
                </p>
                <p className="mt-1 text-sm text-slate-900">
                  {customerDetails.email || <span className="text-slate-400">No email</span>}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Address
                </p>
                <p className="mt-1 text-sm text-slate-900">
                  {customerDetails.address || <span className="text-slate-400">No address</span>}
                </p>
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold text-slate-900">
                Vehicles
              </p>

              {customerDetails.vehicles.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center">
                  <p className="text-sm text-slate-500">
                    No vehicles registered.
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-slate-200/80">
                  <div className="divide-y divide-slate-100">
                    {customerDetails.vehicles.map((vehicle) => (
                      <div
                        key={vehicle.id}
                        className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-slate-50 transition"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {vehicle.make} {vehicle.model}
                          </p>
                          <p className="text-xs text-slate-500 font-mono">
                            {vehicle.registrationNumber}
                          </p>
                        </div>

                        <div className="text-right">
                          {vehicle.year && (
                            <p className="text-sm text-slate-700">
                              {vehicle.year}
                            </p>
                          )}
                          {vehicle.color && (
                            <p className="text-xs text-slate-500">
                              {vehicle.color}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {customerDetails.notes && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Notes
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                  {customerDetails.notes}
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-slate-500">
            Customer not found.
          </p>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => {
          if (!deleteMutation.isPending) {
            setDeleteOpen(false);
            setCustomerToDelete(null);
          }
        }}
        onConfirm={handleDelete}
        title="Delete customer?"
        message={
          customerToDelete
            ? `Are you sure you want to delete ${customerToDelete.firstName} ${customerToDelete.lastName}? This action cannot be undone.`
            : "Are you sure you want to delete this customer?"
        }
        confirmText="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
