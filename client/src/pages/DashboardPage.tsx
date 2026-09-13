import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  Package,
  Plus,
  Receipt,
  RefreshCw,
  TrendingUp,
  Wrench,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { getDashboard } from "../services/dashboardService";
import { useAuth } from "../hooks/useAuth";
import type { JobPriority, JobStatus, PaymentMethod } from "../types/dashboard";
import { formatCurrency } from "../utils/formatters";

const formatDate = (date: string) => {
  return new Intl.DateTimeFormat("en-LK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
};

const formatTimeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const getStatusConfig = (status: JobStatus) => {
  switch (status) {
    case "RECEIVED":
      return {
        label: "Received",
        badge: "bg-slate-100 text-slate-700 border-slate-200/80",
        dot: "bg-slate-400",
      };
    case "IN_PROGRESS":
      return {
        label: "In Progress",
        badge: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
        dot: "bg-indigo-500",
      };
    case "WAITING_FOR_PARTS":
      return {
        label: "Waiting for Parts",
        badge: "bg-amber-50 text-amber-700 border-amber-200/80",
        dot: "bg-amber-500",
      };
    case "READY_FOR_PICKUP":
      return {
        label: "Ready for Pickup",
        badge: "bg-teal-50 text-teal-700 border-teal-200/80",
        dot: "bg-teal-500",
      };
    case "COMPLETED":
      return {
        label: "Completed",
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
        dot: "bg-emerald-500",
      };
    case "DELIVERED":
      return {
        label: "Delivered",
        badge: "bg-violet-50 text-violet-700 border-violet-200/80",
        dot: "bg-violet-500",
      };
    default:
      return {
        label: status,
        badge: "bg-slate-100 text-slate-700 border-slate-200/80",
        dot: "bg-slate-400",
      };
  }
};

const getPriorityConfig = (priority: JobPriority) => {
  switch (priority) {
    case "URGENT":
      return {
        label: "Urgent",
        className: "bg-rose-50 text-rose-700 border-rose-200 font-semibold",
      };
    case "HIGH":
      return {
        label: "High",
        className: "bg-amber-50 text-amber-700 border-amber-200 font-medium",
      };
    case "NORMAL":
      return {
        label: "Normal",
        className: "bg-slate-100 text-slate-600 border-slate-200",
      };
    case "LOW":
      return {
        label: "Low",
        className: "bg-slate-50 text-slate-500 border-slate-200",
      };
  }
};

const getPaymentMethodIcon = (method: PaymentMethod) => {
  switch (method) {
    case "CASH":
      return Banknote;
    case "CARD":
      return CreditCard;
    case "BANK_TRANSFER":
      return Building2;
    default:
      return Receipt;
  }
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-500/20">
          <AlertTriangle size={24} />
        </div>
        <h2 className="mt-4 text-base font-semibold text-slate-900">
          Failed to load dashboard
        </h2>
        <p className="mt-1.5 text-xs text-slate-500">
          Unable to fetch real-time garage statistics. Please verify your connection.
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800"
        >
          <RefreshCw size={14} />
          Retry Connection
        </button>
      </div>
    );
  }

  const {
    summary,
    lowStockParts,
    recentJobs,
    recentPayments,
    mechanicWorkload,
    jobStatusCounts,
  } = data;

  const firstName = user?.name ? user.name.split(" ")[0] : "there";

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Good day, {firstName} 👋
            </h1>
          </div>
          <p className="mt-1 text-xs font-normal text-slate-500 sm:text-sm">
            Here is what is happening across your workshop bays today.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-xs transition hover:bg-slate-50 disabled:opacity-50"
            title="Refresh dashboard metrics"
          >
            <RefreshCw
              size={14}
              className={`${isFetching ? "animate-spin text-indigo-600" : ""}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <Link
            to="/jobs"
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800"
          >
            <Plus size={14} />
            <span>New Job</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Active Jobs */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Active Workshop Jobs
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-500/20">
              <BriefcaseBusiness size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900">
              {summary.activeJobs}
            </span>
            <span className="text-xs font-medium text-slate-600">
              in workshop
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
            <span className="flex items-center gap-1 text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
              Real-time load
            </span>
            <Link
              to="/jobs"
              className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-700"
            >
              View bay <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {/* Completed Today */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Completed Today
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/20">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900">
              {summary.completedToday}
            </span>
            <span className="text-xs font-medium text-emerald-600">
              jobs finished
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
            <span className="flex items-center gap-1 text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Kept after pickup or delivery
            </span>
            <Link
              to="/jobs"
              className="inline-flex items-center gap-1 font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Details <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {/* Today's Revenue */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Today's Revenue
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600 ring-1 ring-teal-500/20">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="truncate text-2xl font-extrabold tracking-tight text-slate-900">
              {formatCurrency(summary.todayRevenue)}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
            <span className="flex items-center gap-1 text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
              Settled payments
            </span>
            <Link
              to="/invoices"
              className="inline-flex items-center gap-1 font-semibold text-teal-600 hover:text-teal-700"
            >
              Invoices <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {/* Outstanding Receivables */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Outstanding Balance
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-500/20">
              <CircleDollarSign size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="truncate text-2xl font-extrabold tracking-tight text-slate-900">
              {formatCurrency(summary.outstandingPayments)}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
            <span className="flex items-center gap-1 text-slate-600">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Pending invoices
            </span>
            <Link
              to="/invoices"
              className="inline-flex items-center gap-1 font-semibold text-amber-600 hover:text-amber-700"
            >
              Collect <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </div>

      {/* Current workshop queue only; completed and pickup work are not mechanic workload. */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Current Workshop Queue
            </span>
          </div>
          <span className="text-xs text-slate-600">
            {summary.activeJobs} ongoing jobs across mechanics
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 p-2.5 border border-slate-100">
            <div className="h-2 w-2 rounded-full bg-slate-400" />
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-slate-500">Received</p>
              <p className="text-sm font-bold text-slate-800">
                {jobStatusCounts.received}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl bg-indigo-50/60 p-2.5 border border-indigo-100/70">
            <div className="h-2 w-2 rounded-full bg-indigo-500" />
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-indigo-700">
                In Progress
              </p>
              <p className="text-sm font-bold text-indigo-900">
                {jobStatusCounts.inProgress}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl bg-amber-50/60 p-2.5 border border-amber-100/70">
            <div className="h-2 w-2 rounded-full bg-amber-500" />
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-amber-700">Waiting Parts</p>
              <p className="text-sm font-bold text-amber-900">
                {jobStatusCounts.waitingForParts}
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Main 2-Column Section: Recent Jobs & Recent Payments */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Recent Jobs Card */}
        <section className="flex flex-col rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-bold tracking-tight text-slate-900">
                Recent Repair Jobs
              </h2>
              <p className="text-xs text-slate-500">
                Most recently updated jobs
              </p>
            </div>
            <Link
              to="/jobs"
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 transition hover:text-indigo-700"
            >
              View all <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="flex-1 divide-y divide-slate-100">
            {recentJobs.length === 0 ? (
              <EmptyState message="No repair jobs recorded yet." />
            ) : (
              recentJobs.map((job) => {
                const statusConfig = getStatusConfig(job.status);
                const priorityConfig = getPriorityConfig(job.priority);
                const customerInitials =
                  `${job.customer.firstName[0] || ""}${job.customer.lastName[0] || ""}`.toUpperCase();

                return (
                  <div
                    key={job.id}
                    className="group p-4 transition hover:bg-slate-50/70"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Customer Avatar */}
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-700 border border-slate-200/60">
                          {customerInitials}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-sm text-slate-900">
                              {job.jobNumber}
                            </span>
                            {/* License plate tag */}
                            <span className="inline-flex items-center rounded-md border border-slate-300 bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold tracking-wider text-slate-800 shadow-2xs">
                              {job.vehicle.registrationNumber}
                            </span>
                          </div>

                          <p className="mt-1 truncate text-xs text-slate-600">
                            {job.vehicle.make} {job.vehicle.model} •{" "}
                            <span className="text-slate-500">
                              {job.customer.firstName} {job.customer.lastName}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Status badge */}
                      <div className="shrink-0 text-right">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusConfig.badge}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot}`}
                          />
                          {statusConfig.label}
                        </span>
                        <p className="mt-1 text-[11px] text-slate-400">
                          {formatTimeAgo(job.updatedAt)}
                        </p>
                      </div>
                    </div>

                    {/* Footer Row */}
                    <div className="mt-3 flex items-center justify-between border-t border-slate-100/60 pt-2.5 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Wrench size={13} className="text-slate-400" />
                        <span>
                          {job.mechanic?.name ?? "Unassigned"}
                        </span>
                      </div>

                      <span
                        className={`rounded-md border px-2 py-0.5 text-[10px] ${priorityConfig.className}`}
                      >
                        {priorityConfig.label}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Recent Payments Card */}
        <section className="flex flex-col rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-bold tracking-tight text-slate-900">
                Recent Payments
              </h2>
              <p className="text-xs text-slate-500">
                Invoices paid and settled recently
              </p>
            </div>
            <Link
              to="/invoices"
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 transition hover:text-indigo-700"
            >
              View all <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="flex-1 divide-y divide-slate-100">
            {recentPayments.length === 0 ? (
              <EmptyState message="No payments recorded yet." />
            ) : (
              recentPayments.map((payment) => {
                const MethodIcon = getPaymentMethodIcon(payment.method);
                return (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between gap-4 p-4 transition hover:bg-slate-50/70"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60">
                        <MethodIcon size={18} />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-slate-900">
                            {payment.invoice.customer.firstName}{" "}
                            {payment.invoice.customer.lastName}
                          </span>
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600">
                            {payment.invoice.invoiceNumber}
                          </span>
                        </div>

                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {payment.method.replace("_", " ")}
                          {payment.reference ? ` • ${payment.reference}` : ""} •{" "}
                          {formatDate(payment.paidAt)}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="font-bold text-sm text-emerald-700">
                        +{formatCurrency(payment.amount)}
                      </p>
                      <span className="inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                        Paid
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* Bottom 2-Column Section: Low Stock Parts & Mechanic Workload */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Low Stock Parts Card */}
        <section className="flex flex-col rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <div>
                <h2 className="text-sm font-bold tracking-tight text-slate-900">
                  Inventory Alerts
                </h2>
                <p className="text-xs text-slate-500">
                  Items below or at minimum threshold
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {summary.lowStockParts > 0 ? (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-500/20">
                  {summary.lowStockParts} attention needed
                </span>
              ) : (
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  Healthy
                </span>
              )}
              <Link
                to="/inventory"
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 transition hover:text-indigo-700"
              >
                Manage <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>

          <div className="flex-1 divide-y divide-slate-100">
            {lowStockParts.length === 0 ? (
              <EmptyState message="All inventory parts are sufficiently stocked." />
            ) : (
              lowStockParts.map((part) => {
                const percentage = Math.min(
                  100,
                  Math.round((part.quantity / Math.max(1, part.minimumStock)) * 100),
                );
                const isCritical = part.quantity === 0 || percentage <= 40;

                return (
                  <div
                    key={part.id}
                    className="p-4 transition hover:bg-slate-50/70"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-semibold text-xs text-slate-900 truncate">
                          {part.name}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          SKU: <span className="font-mono text-slate-600">{part.sku}</span>
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="flex items-center justify-end gap-1.5">
                          <span
                            className={`text-sm font-bold ${
                              isCritical ? "text-rose-600" : "text-amber-600"
                            }`}
                          >
                            {part.quantity} left
                          </span>
                          <span className="text-xs text-slate-400">
                            / min {part.minimumStock}
                          </span>
                        </div>
                        <span
                          className={`inline-block mt-0.5 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            isCritical
                              ? "bg-rose-50 text-rose-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {part.quantity === 0 ? "Out of stock" : "Low stock"}
                        </span>
                      </div>
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="mt-3">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isCritical ? "bg-rose-500" : "bg-amber-500"
                          }`}
                          style={{ width: `${Math.max(5, percentage)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Mechanic Workload Card */}
        <section className="flex flex-col rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-bold tracking-tight text-slate-900">
                Mechanic Bay Workload
              </h2>
              <p className="text-xs text-slate-500">
                Current active capacity across workshop staff
              </p>
            </div>
            <Link
              to="/staff"
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 transition hover:text-indigo-700"
            >
              Staff <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="flex-1 divide-y divide-slate-100">
            {mechanicWorkload.length === 0 ? (
              <EmptyState message="No mechanics active in this garage." />
            ) : (
              mechanicWorkload.map((mechanic) => {
                const mechanicInitials = mechanic.mechanicName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <div
                    key={mechanic.mechanicId}
                    className="p-4 transition hover:bg-slate-50/70"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 font-bold text-xs text-indigo-700">
                          {mechanicInitials}
                        </div>
                        <div>
                          <p className="font-semibold text-xs text-slate-900">
                            {mechanic.mechanicName}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Mechanic
                          </p>
                        </div>
                      </div>

                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                        {mechanic.total} {mechanic.total === 1 ? "job" : "jobs"}
                      </span>
                    </div>

                    {/* Breakdown Badges */}
                    <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                      <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-600">
                        Received: <b className="text-slate-800">{mechanic.received}</b>
                      </span>
                      <span className="rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-indigo-700">
                        In Progress: <b>{mechanic.inProgress}</b>
                      </span>
                      <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-700">
                        Waiting: <b>{mechanic.waitingForParts}</b>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* Global Low Stock Attention Banner */}
      {summary.lowStockParts > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50/90 to-orange-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
              <AlertTriangle size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">
                Low Inventory Restock Recommended
              </p>
              <p className="text-xs text-slate-600">
                {summary.lowStockParts}{" "}
                {summary.lowStockParts === 1 ? "part is" : "parts are"} below
                minimum safety threshold. Review your stock to prevent repair delays.
              </p>
            </div>
          </div>
          <Link
            to="/inventory"
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-amber-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-amber-800"
          >
            Review Parts
          </Link>
        </div>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-2">
        <Package size={20} />
      </div>
      <p className="text-xs font-medium text-slate-500">{message}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="h-6 w-48 rounded-lg bg-slate-200" />
          <div className="mt-2 h-3.5 w-72 rounded-lg bg-slate-200" />
        </div>
        <div className="h-8 w-24 rounded-xl bg-slate-200" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-32 rounded-2xl border border-slate-200/80 bg-white p-5"
          >
            <div className="h-4 w-28 rounded bg-slate-200" />
            <div className="mt-4 h-8 w-20 rounded bg-slate-200" />
          </div>
        ))}
      </div>

      <div className="h-20 rounded-2xl border border-slate-200/80 bg-white p-4" />

      <div className="grid gap-6 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-72 rounded-2xl border border-slate-200/80 bg-white"
          />
        ))}
      </div>
    </div>
  );
}
