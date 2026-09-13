import { Prisma } from "../generated/prisma/client.js";

import { prisma } from "../config/database.js";
import { AppError } from "../utils/errors.js";

import type { CreatePaymentInput } from "../schemas/payment.schema.js";
import { notifyManagers } from "./notification.service.js";

import { invalidateDashboardCache } from "../utils/cache.js";

const calculateInvoiceStatus = (
  total: Prisma.Decimal,
  paidAmount: Prisma.Decimal,
) => {
  if (paidAmount.greaterThanOrEqualTo(total)) {
    return "PAID" as const;
  }

  if (paidAmount.greaterThan(0)) {
    return "PARTIALLY_PAID" as const;
  }

  return "ISSUED" as const;
};

export const getInvoicePayments = async (invoiceId: string) => {
  const invoice = await prisma.invoice.findUnique({
    where: {
      id: invoiceId,
    },
    include: {
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

  const paidAmount = invoice.payments.reduce(
    (sum, payment) => sum.add(new Prisma.Decimal(payment.amount)),
    new Prisma.Decimal(0),
  );

  const remainingBalance = invoice.total.sub(paidAmount);

  return {
    payments: invoice.payments,
    summary: {
      invoiceTotal: invoice.total,
      paidAmount,
      remainingBalance: remainingBalance.lessThan(0)
        ? new Prisma.Decimal(0)
        : remainingBalance,
      status: calculateInvoiceStatus(invoice.total, paidAmount),
    },
  };
};

export const createPayment = async (
  invoiceId: string,
  input: CreatePaymentInput,
) => {
  const paymentAmount = new Prisma.Decimal(input.amount);

  const result = await prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findUnique({
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

    if (invoice.status === "DRAFT") {
      throw new AppError("A draft invoice cannot receive payments", 400);
    }

    if (invoice.status === "VOID") {
      throw new AppError("A void invoice cannot receive payments", 400);
    }

    const paidAmount = invoice.payments.reduce(
      (sum, payment) => sum.add(new Prisma.Decimal(payment.amount)),
      new Prisma.Decimal(0),
    );

    const remainingBalance = invoice.total.sub(paidAmount);

    if (remainingBalance.lessThanOrEqualTo(0)) {
      throw new AppError("This invoice has already been fully paid", 400);
    }

    if (paymentAmount.greaterThan(remainingBalance)) {
      throw new AppError(
        `Payment cannot exceed the remaining balance of ${remainingBalance.toFixed(2)}`,
        400,
      );
    }

    const payment = await tx.payment.create({
      data: {
        invoiceId,
        amount: paymentAmount,
        method: input.method,
        reference: input.reference || null,
      },
    });

    const newPaidAmount = paidAmount.add(paymentAmount);

    const newStatus = calculateInvoiceStatus(invoice.total, newPaidAmount);

    await tx.invoice.update({
      where: {
        id: invoiceId,
      },
      data: {
        status: newStatus,
      },
    });

    return {
      payment,
      invoiceNumber: invoice.invoiceNumber,
      invoiceTotal: invoice.total,
      paidAmount: newPaidAmount,
      remainingBalance: invoice.total.sub(newPaidAmount),
      status: newStatus,
    };
  });

  await invalidateDashboardCache();

  // Notify managers/owners about the payment (fire-and-forget)
  void notifyManagers(
    "PAYMENT_RECEIVED",
    "Payment Received",
    `Payment of Rs. ${result.payment.amount.toFixed(2)} received for invoice ${result.invoiceNumber}. New status: ${result.status}.`,
  );

  return result;
};

export const deletePayment = async (invoiceId: string, paymentId: string) => {
  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findFirst({
      where: {
        id: paymentId,
        invoiceId,
      },
    });

    if (!payment) {
      throw new AppError("Payment not found", 404);
    }

    const invoice = await tx.invoice.findUnique({
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

    if (invoice.status === "VOID") {
      throw new AppError("Payments cannot be changed on a void invoice", 400);
    }

    await tx.payment.delete({
      where: {
        id: paymentId,
      },
    });

    const remainingPayments = invoice.payments.filter(
      (item) => item.id !== paymentId,
    );

    const paidAmount = remainingPayments.reduce(
      (sum, item) => sum.add(new Prisma.Decimal(item.amount)),
      new Prisma.Decimal(0),
    );

    const newStatus = calculateInvoiceStatus(invoice.total, paidAmount);

    await tx.invoice.update({
      where: {
        id: invoiceId,
      },
      data: {
        status: newStatus,
      },
    });

    return {
      paidAmount,
      remainingBalance: invoice.total.sub(paidAmount),
      status: newStatus,
    };
  });

  await invalidateDashboardCache();

  return result;
};
