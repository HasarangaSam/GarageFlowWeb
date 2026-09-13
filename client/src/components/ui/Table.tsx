import type { ReactNode } from "react";

interface TableProps {
  children: ReactNode;
  className?: string;
}

interface TableHeaderProps {
  children: ReactNode;
  className?: string;
}

interface TableBodyProps {
  children: ReactNode;
  className?: string;
}

interface TableRowProps {
  children: ReactNode;
  className?: string;
}

interface TableHeadProps {
  children: ReactNode;
  className?: string;
}

interface TableCellProps {
  children: ReactNode;
  className?: string;
}

export default function Table({ children, className = "" }: TableProps) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">{children}</table>
      </div>
    </div>
  );
}

export function TableHeader({ children, className = "" }: TableHeaderProps) {
  return (
    <thead className={`border-b border-slate-200/80 bg-slate-50/80 ${className}`}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = "" }: TableBodyProps) {
  return (
    <tbody className={`divide-y divide-slate-100 ${className}`}>
      {children}
    </tbody>
  );
}

export function TableRow({ children, className = "" }: TableRowProps) {
  return (
    <tr className={`transition-colors hover:bg-slate-50/70 ${className}`}>{children}</tr>
  );
}

export function TableHead({ children, className = "" }: TableHeadProps) {
  return (
    <th
      scope="col"
      className={`whitespace-nowrap px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 ${className}`}
    >
      {children}
    </th>
  );
}

export function TableCell({ children, className = "" }: TableCellProps) {
  return (
    <td className={`px-4 py-3 text-xs sm:text-sm text-slate-700 ${className}`}>
      {children}
    </td>
  );
}
