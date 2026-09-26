import { Prisma } from "../generated/prisma/client.js";

import { prisma } from "../config/database.js";
import { AppError } from "../utils/errors.js";
import { invalidateDashboardCache } from "../utils/cache.js";

import type {
  CreateInvoiceInput,
  UpdateInvoiceInput,
} from "../schemas/invoice.schema.js";

interface GetInvoicesOptions {
  page: number;
  limit: number;
  search?: string;
  status?: string;
}

const generateInvoiceNumber = async () => {
  const latest = await prisma.invoice.findFirst({
    orderBy: { invoiceNumber: "desc" },
    select: { invoiceNumber: true },
  });

  if (!latest) {
    return "INV-000001";
  }

  const match = latest.invoiceNumber.match(/(\d+)$/);
  const number = match ? Number.parseInt(match[1], 10) : 0;

  return `INV-${String(number + 1).padStart(6, "0")}`;
};

export const calculateInvoiceTotals = (
  items: {
    quantity: number;
    unitPrice: Prisma.Decimal;
  }[],
  discount: Prisma.Decimal,
  tax: Prisma.Decimal,
) => {
  const subtotal = items.reduce(
    (sum, item) => sum.add(item.unitPrice.mul(item.quantity)),
    new Prisma.Decimal(0),
  );

  const total = subtotal.sub(discount).add(tax);

  if (total.lessThan(0)) {
    throw new AppError("Discount cannot be greater than the subtotal", 400);
  }

  return {
    subtotal,
    total,
  };
};

export const getInvoices = async ({
  page,
  limit,
  search,
  status,
}: GetInvoicesOptions) => {
  const skip = (page - 1) * limit;

  const where: Prisma.InvoiceWhereInput = {};

  if (status) {
    where.status = status as Prisma.EnumInvoiceStatusFilter;
  }

  if (search) {
    where.OR = [
      {
        invoiceNumber: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        customer: {
          OR: [
            {
              firstName: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              lastName: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              phone: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        },
      },
      {
        vehicle: {
          registrationNumber: {
            contains: search,
            mode: "insensitive",
          },
        },
      },
    ];
  }

  const [invoices, total] = await prisma.$transaction([
    prisma.invoice.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        customer: true,
        vehicle: true,
        job: {
          select: {
            id: true,
            jobNumber: true,
            status: true,
          },
        },
        payments: true,
      },
    }),

    prisma.invoice.count({
      where,
    }),
  ]);

  return {
    invoices,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getInvoiceSummary = async () => {
  const invoices = await prisma.invoice.findMany({
    select: {
      id: true,
      status: true,
      total: true,
      payments: {
        select: {
          amount: true,
        },
      },
    },
  });

  let totalInvoiced = new Prisma.Decimal(0);
  let totalPaid = new Prisma.Decimal(0);
  let draftCount = 0;
  let issuedCount = 0;
  let partiallyPaidCount = 0;
  let paidCount = 0;
  let voidCount = 0;

  for (const inv of invoices) {
    if (inv.status === "DRAFT") draftCount++;
    else if (inv.status === "ISSUED") issuedCount++;
    else if (inv.status === "PARTIALLY_PAID") partiallyPaidCount++;
    else if (inv.status === "PAID") paidCount++;
    else if (inv.status === "VOID") voidCount++;

    if (inv.status !== "VOID") {
      totalInvoiced = totalInvoiced.add(inv.total);
      for (const p of inv.payments) {
        totalPaid = totalPaid.add(new Prisma.Decimal(p.amount));
      }
    }
  }

  const outstanding = totalInvoiced.sub(totalPaid);

  return {
    totalInvoices: invoices.length,
    totalInvoiced: Number(totalInvoiced.toFixed(2)),
    totalPaid: Number(totalPaid.toFixed(2)),
    totalOutstanding: Math.max(Number(outstanding.toFixed(2)), 0),
    draftCount,
    issuedCount,
    partiallyPaidCount,
    paidCount,
    voidCount,
  };
};

export const getInvoiceById = async (invoiceId: string) => {
  const invoice = await prisma.invoice.findUnique({
    where: {
      id: invoiceId,
    },
    include: {
      customer: true,
      vehicle: true,
      job: {
        include: {
          mechanic: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          parts: {
            include: {
              part: true,
            },
          },
        },
      },
      items: true,
      payments: {
        orderBy: {
          paidAt: "desc",
        },
      },
    },
  });

  if (!invoice) {
    throw new AppError("Invoice not found", 404);
  }

  return invoice;
};

export const createInvoice = async (input: CreateInvoiceInput) => {
  const existingInvoice = await prisma.invoice.findUnique({
    where: {
      repairJobId: input.repairJobId,
    },
  });

  if (existingInvoice) {
    throw new AppError("This repair job already has an invoice", 409);
  }

  const job = await prisma.repairJob.findUnique({
    where: {
      id: input.repairJobId,
    },
    include: {
      parts: {
        include: {
          part: true,
        },
      },
      invoice: true,
    },
  });

  if (!job) {
    throw new AppError("Repair job not found", 404);
  }

  if (job.status !== "COMPLETED" && job.status !== "READY_FOR_PICKUP") {
    throw new AppError(
      "An invoice can only be created for a completed repair job",
      400,
    );
  }

  if (job.invoice) {
    throw new AppError("This repair job already has an invoice", 409);
  }

  const invoiceNumber = await generateInvoiceNumber();

  const invoiceItems = [
    ...job.parts.map((jobPart) => ({
      partId: jobPart.partId,
      type: "PART" as const,
      description: jobPart.part.name,
      quantity: jobPart.quantity,
      unitPrice: new Prisma.Decimal(jobPart.unitPrice),
      total: new Prisma.Decimal(jobPart.total),
    })),

    ...input.labourItems.map((item) => {
      const unitPrice = new Prisma.Decimal(item.unitPrice);

      return {
        partId: null as string | null,
        type: "LABOUR" as const,
        description: item.description,
        quantity: item.quantity,
        unitPrice,
        total: unitPrice.mul(item.quantity),
      };
    }),
  ];

  if (invoiceItems.length === 0) {
    throw new AppError("An invoice must contain at least one item", 400);
  }

  const discount = new Prisma.Decimal(input.discount);

  const tax = new Prisma.Decimal(input.tax);

  const { subtotal, total } = calculateInvoiceTotals(
    invoiceItems,
    discount,
    tax,
  );

  const invoice = await prisma.$transaction(async (tx) => {
    const createdInvoice = await tx.invoice.create({
      data: {
        invoiceNumber,
        customerId: job.customerId,
        vehicleId: job.vehicleId,
        repairJobId: job.id,
        subtotal,
        discount,
        tax,
        total,
        status: "DRAFT",
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,

        items: {
          create: invoiceItems.map((item) => ({
            partId: item.partId,
            type: item.type,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
          })),
        },
      },

      include: {
        customer: true,
        vehicle: true,
        job: {
          select: {
            id: true,
            jobNumber: true,
            status: true,
          },
        },
        items: true,
      },
    });

    return createdInvoice;
  });

  await invalidateDashboardCache();

  return invoice;
};

export const updateInvoice = async (
  invoiceId: string,
  input: UpdateInvoiceInput,
) => {
  const invoice = await prisma.invoice.findUnique({
    where: {
      id: invoiceId,
    },

    include: {
      items: true,
      payments: true,
      job: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  if (!invoice) {
    throw new AppError("Invoice not found", 404);
  }

  if (invoice.status === "VOID") {
    throw new AppError("A void invoice cannot be updated", 400);
  }

  const hasPayments = invoice.payments.length > 0;

  /*
   * Once an invoice is issued or has payments,
   * its financial information is locked.
   */
  if (
    invoice.status !== "DRAFT" &&
    (input.discount !== undefined || input.tax !== undefined)
  ) {
    throw new AppError(
      "Financial information cannot be changed after an invoice is issued",
      400,
    );
  }

  if (hasPayments) {
    throw new AppError("An invoice with payments cannot be modified", 400);
  }

  if (input.status === "PARTIALLY_PAID" || input.status === "PAID") {
    throw new AppError(
      "Invoice payment status is managed through payments",
      400,
    );
  }

  if (input.status === "DRAFT" && invoice.status !== "DRAFT") {
    throw new AppError("Only draft invoices can remain in draft status", 400);
  }

  if (input.status === "ISSUED" && invoice.status !== "DRAFT") {
    throw new AppError("Only draft invoices can be issued", 400);
  }

  const discount =
    input.discount !== undefined
      ? new Prisma.Decimal(input.discount)
      : invoice.discount;

  const tax =
    input.tax !== undefined ? new Prisma.Decimal(input.tax) : invoice.tax;

  const { subtotal, total } = calculateInvoiceTotals(
    invoice.items,
    discount,
    tax,
  );

  const updatedInvoice = await prisma.$transaction(async (tx) => {
    if (input.status === "ISSUED" && invoice.job.status === "COMPLETED") {
      await tx.repairJob.update({
        where: { id: invoice.job.id },
        data: { status: "READY_FOR_PICKUP" },
      });
    }

    return tx.invoice.update({
      where: {
        id: invoiceId,
      },

      data: {
        discount,
        tax,
        subtotal,
        total,

        dueDate:
          input.dueDate !== undefined ? new Date(input.dueDate) : undefined,

        status: input.status,

        issuedAt: input.status === "ISSUED" ? new Date() : undefined,
      },

      include: {
        customer: true,
        vehicle: true,

        job: {
          select: {
            id: true,
            jobNumber: true,
            status: true,
          },
        },

        items: true,
        payments: true,
      },
    });
  });

  await invalidateDashboardCache();

  return updatedInvoice;
};

export const deleteInvoice = async (invoiceId: string) => {
  const invoice = await prisma.invoice.findUnique({
    where: {
      id: invoiceId,
    },
    include: {
      payments: true,
    },
  });

  if (!invoice) {
    throw new AppError("Invoice not found", 404);
  }

  if (invoice.payments.length > 0) {
    throw new AppError("An invoice with payments cannot be deleted", 400);
  }

  if (invoice.status !== "DRAFT") {
    throw new AppError("Only draft invoices can be deleted", 400);
  }

  await prisma.invoice.delete({
    where: {
      id: invoiceId,
    },
  });

  await invalidateDashboardCache();
};
