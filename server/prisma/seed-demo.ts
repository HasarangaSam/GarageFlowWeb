import { prisma } from "../src/config/database.js";
import { invalidateDashboardCache } from "../src/utils/cache.js";

const DEMO_NOTE = "GarageFlow Sri Lanka demo data";

const customers = [
  {
    firstName: "Kasun",
    lastName: "Perera",
    phone: "+94771234561",
    email: "kasun.perera@example.lk",
    address: "Nugegoda, Colombo",
  },
  {
    firstName: "Sahan",
    lastName: "Gamage",
    phone: "+94771234562",
    email: "sahan.gamage@example.lk",
    address: "Maharagama, Colombo",
  },
  {
    firstName: "Nimali",
    lastName: "Fernando",
    phone: "+94771234563",
    email: "nimali.fernando@example.lk",
    address: "Wattala, Gampaha",
  },
  {
    firstName: "Dilan",
    lastName: "Jayasinghe",
    phone: "+94771234564",
    email: "dilan.jayasinghe@example.lk",
    address: "Kottawa, Colombo",
  },
  {
    firstName: "Tharushi",
    lastName: "Silva",
    phone: "+94771234565",
    email: "tharushi.silva@example.lk",
    address: "Dehiwala, Colombo",
  },
];

const vehicleData = [
  { registrationNumber: "CAX-8123", make: "Toyota", model: "Aqua", year: 2016, mileage: 84500, customerIndex: 0 },
  { registrationNumber: "CAT-5067", make: "Honda", model: "Vezel", year: 2015, mileage: 101200, customerIndex: 1 },
  { registrationNumber: "CAU-9421", make: "Suzuki", model: "Wagon R", year: 2018, mileage: 62300, customerIndex: 2 },
  { registrationNumber: "CBE-3174", make: "Nissan", model: "X-Trail", year: 2014, mileage: 128400, customerIndex: 3 },
  { registrationNumber: "CAV-6840", make: "Toyota", model: "Prius", year: 2013, mileage: 154600, customerIndex: 4 },
  { registrationNumber: "CAJ-1295", make: "Honda", model: "Fit", year: 2017, mileage: 74800, customerIndex: 0 },
];

const jobData = [
  { jobNumber: "JOB-000004", vehicleIndex: 0, complaint: "Engine oil and filter service due", diagnosis: "Routine service inspection pending.", status: "RECEIVED", priority: "NORMAL", mileageIn: 84500 },
  { jobNumber: "JOB-000005", vehicleIndex: 1, complaint: "Front suspension knocking noise", diagnosis: "Inspect lower-arm bushes and stabilizer links.", status: "IN_PROGRESS", priority: "HIGH", mileageIn: 101200 },
  { jobNumber: "JOB-000006", vehicleIndex: 2, complaint: "Air conditioning not cooling", diagnosis: "Compressor pressure check in progress.", status: "IN_PROGRESS", priority: "NORMAL", mileageIn: 62300 },
  { jobNumber: "JOB-000007", vehicleIndex: 3, complaint: "Brake pedal feels soft", diagnosis: "Brake master-cylinder seal kit is required.", status: "WAITING_FOR_PARTS", priority: "URGENT", mileageIn: 128400 },
  { jobNumber: "JOB-000008", vehicleIndex: 4, complaint: "Hybrid battery warning light", diagnosis: "Battery cooling fan cleaned; battery health test completed.", status: "COMPLETED", priority: "HIGH", mileageIn: 154600, mileageOut: 154618 },
  { jobNumber: "JOB-000009", vehicleIndex: 5, complaint: "Annual service and wheel alignment", diagnosis: "Service completed; alignment within specification.", status: "READY_FOR_PICKUP", priority: "NORMAL", mileageIn: 74800, mileageOut: 74811 },
  { jobNumber: "JOB-000010", vehicleIndex: 0, complaint: "Battery drains overnight", diagnosis: "Parasitic drain test scheduled.", status: "RECEIVED", priority: "HIGH", mileageIn: 84520 },
  { jobNumber: "JOB-000011", vehicleIndex: 1, complaint: "Check-engine light is on", diagnosis: "Oxygen-sensor fault code found; wiring inspection underway.", status: "IN_PROGRESS", priority: "HIGH", mileageIn: 101260 },
  { jobNumber: "JOB-000012", vehicleIndex: 2, complaint: "Tyre rotation and balancing", diagnosis: "Tyres balanced and rotated.", status: "DELIVERED", priority: "LOW", mileageIn: 62400, mileageOut: 62408 },
  { jobNumber: "JOB-000013", vehicleIndex: 3, complaint: "Starter motor intermittently fails", diagnosis: "Starter motor replacement awaits supplier delivery.", status: "WAITING_FOR_PARTS", priority: "URGENT", mileageIn: 128560 },
  { jobNumber: "JOB-000014", vehicleIndex: 4, complaint: "Cabin vibration at high speed", diagnosis: "Wheel balancing and engine-mount inspection completed.", status: "READY_FOR_PICKUP", priority: "NORMAL", mileageIn: 154720, mileageOut: 154728 },
  { jobNumber: "JOB-000015", vehicleIndex: 5, complaint: "Headlamp beam alignment", diagnosis: "Headlamps aligned and road-tested.", status: "DELIVERED", priority: "LOW", mileageIn: 74910, mileageOut: 74913 },
] as const;

const invoiceData = [
  {
    invoiceNumber: "INV-000003",
    jobNumber: "JOB-000008",
    status: "DRAFT",
    items: [
      { description: "Hybrid battery diagnostic", quantity: 1, unitPrice: 8500 },
      { description: "Battery cooling fan service", quantity: 1, unitPrice: 3500 },
    ],
    discount: 0,
    tax: 0,
    payments: [],
  },
  {
    invoiceNumber: "INV-000004",
    jobNumber: "JOB-000009",
    status: "ISSUED",
    items: [
      { description: "Full engine service", quantity: 1, unitPrice: 8000 },
      { description: "Wheel alignment", quantity: 1, unitPrice: 4500 },
    ],
    discount: 0,
    tax: 0,
    payments: [],
  },
  {
    invoiceNumber: "INV-000005",
    jobNumber: "JOB-000012",
    status: "PAID",
    items: [
      { description: "Tyre rotation", quantity: 1, unitPrice: 2500 },
      { description: "Wheel balancing", quantity: 1, unitPrice: 3500 },
    ],
    discount: 0,
    tax: 0,
    payments: [{ amount: 6000, method: "CASH", reference: "Cash counter receipt" }],
  },
  {
    invoiceNumber: "INV-000006",
    jobNumber: "JOB-000014",
    status: "PARTIALLY_PAID",
    items: [
      { description: "Wheel balancing", quantity: 1, unitPrice: 6000 },
      { description: "Engine mount inspection", quantity: 1, unitPrice: 4500 },
    ],
    discount: 500,
    tax: 0,
    payments: [{ amount: 4000, method: "BANK_TRANSFER", reference: "Commercial Bank transfer" }],
  },
  {
    invoiceNumber: "INV-000007",
    jobNumber: "JOB-000015",
    status: "PAID",
    items: [
      { description: "Headlamp beam alignment", quantity: 1, unitPrice: 2000 },
      { description: "Electrical system check", quantity: 1, unitPrice: 1000 },
    ],
    discount: 0,
    tax: 0,
    payments: [{ amount: 3000, method: "CARD", reference: "Card terminal receipt" }],
  },
] as const;

async function main() {
  const mechanic = await prisma.user.findFirst({
    where: { role: "MECHANIC" },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  const seededCustomers = [];
  for (const customer of customers) {
    const existing = await prisma.customer.findFirst({ where: { phone: customer.phone } });
    seededCustomers.push(
      existing ??
        (await prisma.customer.create({
          data: { ...customer, notes: DEMO_NOTE },
        })),
    );
  }

  const vehicles = [];
  for (const vehicle of vehicleData) {
    const existing = await prisma.vehicle.findUnique({
      where: { registrationNumber: vehicle.registrationNumber },
    });
    vehicles.push(
      existing ??
        (await prisma.vehicle.create({
          data: {
            customerId: seededCustomers[vehicle.customerIndex].id,
            registrationNumber: vehicle.registrationNumber,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            mileage: vehicle.mileage,
          },
        })),
    );
  }

  let createdJobs = 0;
  for (const job of jobData) {
    const existing = await prisma.repairJob.findUnique({
      where: { jobNumber: job.jobNumber },
      select: { id: true },
    });

    if (existing) continue;

    const vehicle = vehicles[job.vehicleIndex];
    const isFinished = ["COMPLETED", "READY_FOR_PICKUP", "DELIVERED"].includes(job.status);

    await prisma.repairJob.create({
      data: {
        jobNumber: job.jobNumber,
        customerId: vehicle.customerId,
        vehicleId: vehicle.id,
        mechanicId: mechanic?.id,
        complaint: job.complaint,
        diagnosis: job.diagnosis,
        status: job.status,
        priority: job.priority,
        mileageIn: job.mileageIn,
        mileageOut: "mileageOut" in job ? job.mileageOut : undefined,
        notes: DEMO_NOTE,
        completedAt: isFinished ? new Date() : null,
      },
    });
    createdJobs++;
  }

  let createdInvoices = 0;
  for (const invoice of invoiceData) {
    const job = await prisma.repairJob.findUnique({
      where: { jobNumber: invoice.jobNumber },
      select: {
        id: true,
        customerId: true,
        vehicleId: true,
        invoice: { select: { id: true } },
      },
    });

    if (!job || job.invoice) continue;

    const subtotal = invoice.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    const total = subtotal - invoice.discount + invoice.tax;

    await prisma.invoice.create({
      data: {
        invoiceNumber: invoice.invoiceNumber,
        repairJobId: job.id,
        customerId: job.customerId,
        vehicleId: job.vehicleId,
        subtotal,
        discount: invoice.discount,
        tax: invoice.tax,
        total,
        status: invoice.status,
        issuedAt: invoice.status === "DRAFT" ? null : new Date(),
        dueDate: invoice.status === "DRAFT" ? null : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        items: {
          create: invoice.items.map((item) => ({
            type: "LABOUR",
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice,
          })),
        },
        payments: {
          create: invoice.payments.map((payment) => ({
            amount: payment.amount,
            method: payment.method,
            reference: payment.reference,
          })),
        },
      },
    });
    createdInvoices++;
  }

  await invalidateDashboardCache();
  console.log(`Demo data ready: ${seededCustomers.length} customers, ${vehicles.length} vehicles, ${createdJobs} new jobs, ${createdInvoices} new invoices.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
