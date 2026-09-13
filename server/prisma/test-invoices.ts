import { prisma } from "../src/config/database.js";
import {
  createInvoice,
  getInvoices,
  getInvoiceSummary,
} from "../src/services/invoice.service.js";
import { createPayment } from "../src/services/payment.service.js";

async function main() {
  console.log("=== Testing Invoices & Payments System ===");

  // Find job JOB-000001
  const job = await prisma.repairJob.findFirst({
    where: { jobNumber: "JOB-000001" },
    include: { invoice: true, parts: true },
  });

  if (!job) {
    console.log("JOB-000001 not found");
    return;
  }

  console.log(`Job: ${job.jobNumber}, Status: ${job.status}, Parts: ${job.parts.length}`);

  let invoice = job.invoice;
  if (!invoice) {
    console.log("Creating invoice for JOB-000001...");
    invoice = await createInvoice({
      repairJobId: job.id,
      labourItems: [
        {
          description: "Full Comprehensive Brake System Inspection & Installation",
          quantity: 2,
          unitPrice: 65,
        },
      ],
      discount: 10,
      tax: 15,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    });
    console.log(`Created Invoice: ${invoice.invoiceNumber}, Status: ${invoice.status}, Total: $${Number(invoice.total).toFixed(2)}`);
  } else {
    console.log(`Existing invoice: ${invoice.invoiceNumber}, Status: ${invoice.status}, Total: $${Number(invoice.total).toFixed(2)}`);
  }

  // Issue the invoice if DRAFT
  if (invoice.status === "DRAFT") {
    console.log("Issuing invoice...");
    const { updateInvoice } = await import("../src/services/invoice.service.js");
    invoice = await updateInvoice(invoice.id, { status: "ISSUED" });
    console.log(`Invoice status after issue: ${invoice.status}`);
  }

  // Test recording a partial payment of $50
  const payments = await prisma.payment.findMany({ where: { invoiceId: invoice.id } });
  if (payments.length === 0) {
    console.log("Recording test payment of $50...");
    const paymentResult = await createPayment(invoice.id, {
      amount: 50,
      method: "CARD",
      reference: "STRIPE-CH-8831",
    });
    console.log(`Payment recorded! New invoice status: ${paymentResult.status}, Remaining balance: $${Number(paymentResult.remainingBalance).toFixed(2)}`);
  }

  // Check Invoice Summary
  const summary = await getInvoiceSummary();
  console.log("Invoice Summary:", summary);

  // Check getInvoices list
  const list = await getInvoices({ page: 1, limit: 5 });
  console.log(`Invoices on page 1: ${list.invoices.length}, Total: ${list.pagination.total}`);

  console.log("=== Verification Successful! ===");
}

main()
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
