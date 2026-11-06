import { prisma } from "../src/config/database.js";
import { invalidateDashboardCache } from "../src/utils/cache.js";

async function main() {
  console.log("🌱 Starting Sri Lanka sample data seed...");

  // 1. Seed the 5 requested parts
  const partsData = [
    {
      sku: "OF-7102-PR",
      name: "Premium Oil Filter",
      description: "High-efficiency spin-on oil filter for Toyota / Honda 4-cylinder engines",
      quantity: 24,
      minimumStock: 8,
      costPrice: 4.5,
      sellingPrice: 12.0,
    },
    {
      sku: "OIL-5W30-SYN",
      name: "Full Synthetic 5W-30 Motor Oil (5L)",
      description: "Advanced full-synthetic engine oil with thermal breakdown protection",
      quantity: 18,
      minimumStock: 6,
      costPrice: 22.0,
      sellingPrice: 42.5,
    },
    {
      sku: "BRK-PAD-F01",
      name: "Front Ceramic Brake Pad Set",
      description: "Ultra-quiet, low-dust ceramic front brake pads for sedans and compact SUVs",
      quantity: 2, // Low stock demo!
      minimumStock: 5,
      costPrice: 28.0,
      sellingPrice: 65.0,
    },
    {
      sku: "SP-IRID-4PK",
      name: "Laser Iridium Spark Plugs (Pack of 4)",
      description: "Extended life laser iridium plugs for reliable ignition and fuel economy",
      quantity: 12,
      minimumStock: 4,
      costPrice: 18.5,
      sellingPrice: 39.99,
    },
    {
      sku: "CAF-CAB-09",
      name: "Cabin Air Filter with Carbon",
      description: "Activated carbon cabin air filter removing pollen, dust, and odors",
      quantity: 10,
      minimumStock: 4,
      costPrice: 7.0,
      sellingPrice: 19.5,
    },
  ];

  const seededParts: Record<string, any> = {};
  for (const p of partsData) {
    const part = await prisma.part.upsert({
      where: { sku: p.sku },
      update: {
        name: p.name,
        description: p.description,
        quantity: p.quantity,
        minimumStock: p.minimumStock,
        costPrice: p.costPrice,
        sellingPrice: p.sellingPrice,
      },
      create: {
        sku: p.sku,
        name: p.name,
        description: p.description,
        quantity: p.quantity,
        minimumStock: p.minimumStock,
        costPrice: p.costPrice,
        sellingPrice: p.sellingPrice,
      },
    });
    seededParts[p.sku] = part;
    console.log(`✓ Part ready: ${part.name} (${part.sku})`);
  }

  // Find mechanic user if available to assign to jobs
  const mechanic = await prisma.user.findFirst({
    where: { role: "MECHANIC" },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  // 2. Seed 3 Sri Lankan Customers
  const customerInputs = [
    {
      firstName: "Kasun",
      lastName: "Perera",
      phone: "+94772345678",
      email: "kasun.perera@gmail.com",
      address: "No. 45, High Level Road, Nugegoda, Colombo",
      notes: "VIP customer - prefers weekend drop-offs",
    },
    {
      firstName: "Chathura",
      lastName: "Jayawardena",
      phone: "+94719876543",
      email: "chathura.j@yahoo.com",
      address: "No. 112/A, Peradeniya Road, Kandy",
      notes: "Fleet vehicle owner",
    },
    {
      firstName: "Dilani",
      lastName: "Fernando",
      phone: "+94765554321",
      email: "dilani.fernando@outlook.com",
      address: "No. 18, Negombo Road, Wattala, Gampaha",
      notes: "Contact via WhatsApp for estimates",
    },
  ];

  const seededCustomers: any[] = [];
  for (const c of customerInputs) {
    let customer = await prisma.customer.findFirst({
      where: { phone: c.phone },
    });
    if (!customer) {
      customer = await prisma.customer.create({ data: c });
    }
    seededCustomers.push(customer);
    console.log(`✓ Customer ready: ${customer.firstName} ${customer.lastName} (${customer.phone})`);
  }

  // 3. Seed 4 Sri Lankan Vehicles
  const vehicleInputs = [
    {
      registrationNumber: "WP CAB-4521",
      make: "Toyota",
      model: "Prius",
      year: 2017,
      mileage: 85200,
      customerIndex: 0, // Kasun
    },
    {
      registrationNumber: "WP CAD-8834",
      make: "Honda",
      model: "Vezel RU3",
      year: 2018,
      mileage: 67400,
      customerIndex: 0, // Kasun (2nd vehicle)
    },
    {
      registrationNumber: "CP CAA-1290",
      make: "Suzuki",
      model: "Wagon R Stingray",
      year: 2019,
      mileage: 52100,
      customerIndex: 1, // Chathura
    },
    {
      registrationNumber: "WP KX-6743",
      make: "Nissan",
      model: "X-Trail Hybrid",
      year: 2016,
      mileage: 114500,
      customerIndex: 2, // Dilani
    },
  ];

  const seededVehicles: any[] = [];
  for (const v of vehicleInputs) {
    const existing = await prisma.vehicle.findUnique({
      where: { registrationNumber: v.registrationNumber },
    });
    const customer = seededCustomers[v.customerIndex];
    const vehicle =
      existing ??
      (await prisma.vehicle.create({
        data: {
          customerId: customer.id,
          registrationNumber: v.registrationNumber,
          make: v.make,
          model: v.model,
          year: v.year,
          mileage: v.mileage,
        },
      }));
    seededVehicles.push(vehicle);
    console.log(`✓ Vehicle ready: ${vehicle.make} ${vehicle.model} [${vehicle.registrationNumber}]`);
  }

  // Helper for sequential job numbers
  const getNextJobNumber = async (offset = 0) => {
    const latest = await prisma.repairJob.findFirst({
      orderBy: { jobNumber: "desc" },
      select: { jobNumber: true },
    });
    let nextNum = 1;
    if (latest) {
      const match = latest.jobNumber.match(/(\d+)$/);
      if (match) nextNum = Number.parseInt(match[1], 10) + 1;
    }
    return `JOB-${String(nextNum + offset).padStart(6, "0")}`;
  };

  // Helper for sequential invoice numbers
  const getNextInvoiceNumber = async (offset = 0) => {
    const latest = await prisma.invoice.findFirst({
      orderBy: { invoiceNumber: "desc" },
      select: { invoiceNumber: true },
    });
    let nextNum = 1;
    if (latest) {
      const match = latest.invoiceNumber.match(/(\d+)$/);
      if (match) nextNum = Number.parseInt(match[1], 10) + 1;
    }
    return `INV-${String(nextNum + offset).padStart(6, "0")}`;
  };

  // 4. Seed Jobs
  const jobsToCreate = [
    {
      vehicle: seededVehicles[0], // Toyota Prius
      complaint: "Hybrid system warning light ON and engine oil service overdue",
      diagnosis: "Hybrid battery cooling fan dust cleaned. Engine oil and filter replaced.",
      status: "IN_PROGRESS" as const,
      priority: "HIGH" as const,
      mileageIn: 85200,
      parts: [
        { part: seededParts["OF-7102-PR"], qty: 1 },
        { part: seededParts["OIL-5W30-SYN"], qty: 1 },
      ],
    },
    {
      vehicle: seededVehicles[1], // Honda Vezel
      complaint: "High-pitch squeaking sound when braking from highway speed",
      diagnosis: "Front brake pads worn down below 2mm. Replacement needed.",
      status: "WAITING_FOR_PARTS" as const,
      priority: "URGENT" as const,
      mileageIn: 67400,
      parts: [
        { part: seededParts["BRK-PAD-F01"], qty: 1 },
      ],
    },
    {
      vehicle: seededVehicles[2], // Suzuki Wagon R
      complaint: "Periodic 50,000 km full maintenance checkup and minor misfire",
      diagnosis: "Fouled spark plugs replaced with laser iridium plugs. Replaced dirty cabin filter.",
      status: "COMPLETED" as const,
      priority: "NORMAL" as const,
      mileageIn: 52100,
      mileageOut: 52106,
      completedAt: new Date(),
      parts: [
        { part: seededParts["SP-IRID-4PK"], qty: 1 },
        { part: seededParts["CAF-CAB-09"], qty: 1 },
      ],
      invoice: {
        status: "PAID" as const,
        labour: 45.0,
        discount: 0,
        paymentMethod: "CARD" as const,
        paymentRef: "Commercial Bank Card 4112",
      },
    },
    {
      vehicle: seededVehicles[3], // Nissan X-Trail
      complaint: "Air conditioner smell and reduced airflow inside cabin",
      diagnosis: "Replaced cabin air filter with activated carbon filter and sanitized vents.",
      status: "READY_FOR_PICKUP" as const,
      priority: "NORMAL" as const,
      mileageIn: 114500,
      mileageOut: 114503,
      completedAt: new Date(),
      parts: [
        { part: seededParts["CAF-CAB-09"], qty: 1 },
      ],
      invoice: {
        status: "ISSUED" as const,
        labour: 25.0,
        discount: 5.0,
      },
    },
  ];

  for (let i = 0; i < jobsToCreate.length; i++) {
    const j = jobsToCreate[i];

    // Check if an existing open job already exists for this vehicle
    const existingJob = await prisma.repairJob.findFirst({
      where: {
        vehicleId: j.vehicle.id,
        complaint: j.complaint,
      },
    });

    if (existingJob) {
      console.log(`ℹ Job already exists for ${j.vehicle.registrationNumber}`);
      continue;
    }

    const jobNumber = await getNextJobNumber();
    const repairJob = await prisma.repairJob.create({
      data: {
        jobNumber,
        customerId: j.vehicle.customerId,
        vehicleId: j.vehicle.id,
        mechanicId: mechanic?.id,
        complaint: j.complaint,
        diagnosis: j.diagnosis,
        status: j.status,
        priority: j.priority,
        mileageIn: j.mileageIn,
        mileageOut: j.mileageOut,
        completedAt: j.completedAt,
        notes: "Seed demo data for Sri Lanka vehicles",
      },
    });
    console.log(`✓ Job created: ${repairJob.jobNumber} (${j.status}) for ${j.vehicle.registrationNumber}`);

    // Link Parts
    let partsSubtotal = 0;
    for (const item of j.parts) {
      const unitPrice = Number(item.part.sellingPrice);
      const total = unitPrice * item.qty;
      partsSubtotal += total;

      await prisma.jobPart.create({
        data: {
          jobId: repairJob.id,
          partId: item.part.id,
          quantity: item.qty,
          unitPrice,
          total,
        },
      });
    }

    // Create Invoice if specified
    if (j.invoice) {
      const invoiceNumber = await getNextInvoiceNumber();
      const labourCost = j.invoice.labour;
      const discount = j.invoice.discount || 0;
      const subtotal = partsSubtotal + labourCost;
      const total = subtotal - discount;

      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          repairJobId: repairJob.id,
          customerId: j.vehicle.customerId,
          vehicleId: j.vehicle.id,
          subtotal,
          discount,
          tax: 0,
          total,
          status: j.invoice.status,
          issuedAt: new Date(),
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          items: {
            create: [
              ...j.parts.map((item) => ({
                type: "PART" as const,
                partId: item.part.id,
                description: item.part.name,
                quantity: item.qty,
                unitPrice: Number(item.part.sellingPrice),
                total: Number(item.part.sellingPrice) * item.qty,
              })),
              {
                type: "LABOUR" as const,
                description: "Mechanical Labor & Diagnostic",
                quantity: 1,
                unitPrice: labourCost,
                total: labourCost,
              },
            ],
          },
          payments: j.invoice.paymentMethod
            ? {
                create: [
                  {
                    amount: total,
                    method: j.invoice.paymentMethod,
                    reference: j.invoice.paymentRef,
                  },
                ],
              }
            : undefined,
        },
      });
      console.log(`✓ Invoice created: ${invoice.invoiceNumber} (${invoice.status}) - Total: $${total}`);
    }
  }

  // Refresh Redis cache
  await invalidateDashboardCache();
  console.log("✨ All Sri Lanka sample data seeded successfully and dashboard cache invalidated!");
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

