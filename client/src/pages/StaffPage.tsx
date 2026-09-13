import { useState } from "react";
import { Pencil, Plus, Search, Trash2, UsersRound } from "lucide-react";
import toast from "react-hot-toast";

import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Input from "../components/ui/Input";
import Loading from "../components/ui/Loading";
import Modal from "../components/ui/Modal";
import Table, {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/Table";
import {
  useCreateStaffUser,
  useDeleteStaffUser,
  useUpdateStaffUser,
  useUsers,
} from "../hooks/useUsers";
import type { StaffAccountInput, StaffUser } from "../types/user";

const emptyForm: StaffAccountInput = {
  name: "",
  email: "",
  password: "",
  role: "MECHANIC",
};

function messageFrom(error: unknown, fallback: string) {
  const response = (error as { response?: { data?: { message?: string } } })?.response;
  return response?.data?.message ?? fallback;
}

export default function StaffPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<StaffUser | null>(null);
  const [form, setForm] = useState<StaffAccountInput>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<StaffUser | null>(null);

  const { data: users = [], isLoading, isError } = useUsers(
    search ? { search } : {},
  );
  const createMutation = useCreateStaffUser();
  const updateMutation = useUpdateStaffUser();
  const deleteMutation = useDeleteStaffUser();
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const staff = users.filter((user) => user.role !== "OWNER");

  const openCreate = () => {
    setSelectedUser(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (user: StaffUser) => {
    setSelectedUser(user);
    setForm({ name: user.name, email: user.email, password: "", role: user.role as "MANAGER" | "MECHANIC" });
    setFormOpen(true);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedUser && !form.password) {
      toast.error("A temporary password is required for a new account");
      return;
    }
    try {
      if (selectedUser) {
        await updateMutation.mutateAsync({ userId: selectedUser.id, data: form });
        toast.success("Staff account updated");
      } else {
        await createMutation.mutateAsync(form);
        toast.success("Staff account created");
      }
      setFormOpen(false);
      setSelectedUser(null);
    } catch (error) {
      toast.error(messageFrom(error, "Unable to save staff account"));
    }
  };

  const deleteUser = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("Staff account deleted");
      setDeleteTarget(null);
    } catch (error) {
      toast.error(messageFrom(error, "Unable to delete staff account"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Staff Management
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Create and manage manager and mechanic team accounts.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={15} />
          Add Staff Account
        </Button>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              id="staff-search"
              placeholder="Search by name or email..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && setSearch(searchInput.trim())}
            />
          </div>
          <Button onClick={() => setSearch(searchInput.trim())}>
            <Search size={15} />
            Search
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-12 shadow-xs">
          <Loading size="lg" text="Loading staff..." />
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-rose-200/80 bg-rose-50 p-8 text-center text-sm text-rose-700 shadow-xs">
          Unable to load staff accounts. Please try again.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.length === 0 ? (
                <TableRow>
                  <TableCell {...({ colSpan: 4 } as { colSpan: number })} className="py-16 text-center">
                    <UsersRound className="mx-auto mb-3 text-slate-300" size={32} />
                    <p className="font-medium text-slate-900">No staff accounts found</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Create a manager or mechanic account to get started.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                staff.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <p className="font-medium text-slate-900">{user.name}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === "MANAGER" ? "info" : "success"}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {new Date(user.createdAt).toLocaleDateString("en-LK", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          title="Edit staff account"
                          onClick={() => openEdit(user)}
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                        >
                          <Pencil size={17} />
                        </button>
                        <button
                          type="button"
                          title="Delete staff account"
                          onClick={() => setDeleteTarget(user)}
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Modal
        isOpen={formOpen}
        onClose={() => !isSaving && setFormOpen(false)}
        title={selectedUser ? "Edit Staff Account" : "Add Staff Account"}
        description={
          selectedUser
            ? "Leave the password blank to keep it unchanged."
            : "The staff member can sign in with this email and password."
        }
      >
        <form className="space-y-4" onSubmit={submit}>
          <Input
            id="staff-name"
            label="Full name"
            required
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
          <Input
            id="staff-email"
            label="Email address"
            type="email"
            required
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
          />
          <Input
            id="staff-password"
            label={selectedUser ? "New password" : "Temporary password"}
            type="password"
            required={!selectedUser}
            minLength={6}
            helperText={
              selectedUser
                ? "Optional — use at least 6 characters to reset it."
                : "At least 6 characters."
            }
            value={form.password ?? ""}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
          />
          <div className="space-y-1.5">
            <label htmlFor="staff-role" className="block text-xs font-medium text-slate-700">
              Role
            </label>
            <select
              id="staff-role"
              value={form.role}
              onChange={(event) =>
                setForm({ ...form, role: event.target.value as "MANAGER" | "MECHANIC" })
              }
              className="w-full rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-xs text-slate-900 shadow-xs transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="MECHANIC">Mechanic</option>
              <option value="MANAGER">Manager</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setFormOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" loading={isSaving}>
              {selectedUser ? "Save Changes" : "Create Account"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => !deleteMutation.isPending && setDeleteTarget(null)}
        onConfirm={deleteUser}
        title="Delete staff account?"
        message={
          deleteTarget
            ? `Delete ${deleteTarget.name}'s account? This cannot be undone.`
            : undefined
        }
        confirmText="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
