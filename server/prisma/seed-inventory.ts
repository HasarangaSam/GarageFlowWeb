import { prisma } from "../src/config/database.js";

const sampleParts = [
  {
    sku: "OIL-CAS-5W30",
    name: "Castrol EDGE 5W-30 Full Synthetic Motor Oil (5L)",
    description: "Advanced full synthetic engine oil engineered with Fluid Titanium Technology.",
    quantity: 24,
    minimumStock: 8,
    costPrice: 28.5,
    sellingPrice: 48.0,
  },
  {
    sku: "OIL-MOB-0W20",
    name: "Mobil 1 Advanced Fuel Economy 0W-20 (5L)",
    description: "Low viscosity advanced synthetic oil improving fuel economy and engine protection.",
    quantity: 18,
    minimumStock: 6,
    costPrice: 32.0,
    sellingPrice: 52.0,
  },
  {
    sku: "FLT-BOS-OIL1",
    name: "Bosch Premium Spin-On Oil Filter",
    description: "High-efficiency media filter captures 99% of harmful contaminants.",
    quantity: 35,
    minimumStock: 10,
    costPrice: 4.8,
    sellingPrice: 12.5,
  },
  {
    sku: "FLT-MAN-AIR1",
    name: "Mann-Filter Engine Air Filter",
    description: "OEM quality air filter ensuring optimal air flow and dust separation.",
    quantity: 15,
    minimumStock: 5,
    costPrice: 8.5,
    sellingPrice: 22.0,
  },
  {
    sku: "BRK-BRE-F01",
    name: "Brembo Front Ceramic Brake Pad Set",
    description: "Low-dust, noise-free ceramic pads delivering exceptional stopping performance.",
    quantity: 12,
    minimumStock: 4,
    costPrice: 38.0,
    sellingPrice: 78.0,
  },
  {
    sku: "BRK-BRE-R01",
    name: "Brembo Rear Ceramic Brake Pad Set",
    description: "Rear axle ceramic brake pads engineered for longevity and consistent friction.",
    quantity: 10,
    minimumStock: 4,
    costPrice: 32.0,
    sellingPrice: 68.0,
  },
  {
    sku: "BRK-BRE-ROT1",
    name: "Brembo High Carbon Front Brake Rotors (Pair)",
    description: "Coated disc brake rotors with UV protection to resist corrosion and vibration.",
    quantity: 6,
    minimumStock: 2,
    costPrice: 65.0,
    sellingPrice: 135.0,
  },
  {
    sku: "FLD-CAS-DOT4",
    name: "Castrol Brake Fluid DOT 4 High Performance (1L)",
    description: "High boiling point hydraulic fluid for modern ABS and disc brake systems.",
    quantity: 20,
    minimumStock: 6,
    costPrice: 6.5,
    sellingPrice: 15.0,
  },
  {
    sku: "IGN-NGK-SPK4",
    name: "NGK Laser Iridium Spark Plugs (Pack of 4)",
    description: "Laser welded iridium center electrode tip ensures high durability and spark efficiency.",
    quantity: 22,
    minimumStock: 6,
    costPrice: 18.0,
    sellingPrice: 42.0,
  },
  {
    sku: "ELE-BOS-BAT60",
    name: "Bosch S4 Car Battery 12V 60Ah 540A",
    description: "Maintenance-free lead acid starter battery with PowerFrame grid technology.",
    quantity: 5,
    minimumStock: 3,
    costPrice: 72.0,
    sellingPrice: 129.0,
  },
  {
    sku: "BLT-GAT-SRP1",
    name: "Gates Micro-V Heavy Duty Serpentine Belt",
    description: "EPDM construction resists heat cracking and wear on accessory pulleys.",
    quantity: 9,
    minimumStock: 4,
    costPrice: 12.0,
    sellingPrice: 28.5,
  },
  {
    sku: "CLN-PRS-5050",
    name: "Prestone Long Life 50/50 Prediluted Coolant (4L)",
    description: "All-makes, all-models extended life radiator coolant protecting against freeze/boil.",
    quantity: 16,
    minimumStock: 6,
    costPrice: 9.5,
    sellingPrice: 22.0,
  },
  {
    sku: "WIP-MIC-24",
    name: "Michelin Stealth Ultra Wiper Blade 24\"",
    description: "Smart-Flex technology blade delivers smooth, streak-free wipes in severe weather.",
    quantity: 18,
    minimumStock: 6,
    costPrice: 7.0,
    sellingPrice: 19.99,
  },
  {
    sku: "WIP-MIC-18",
    name: "Michelin Stealth Ultra Wiper Blade 18\"",
    description: "Aerodynamic hybrid wiper blade with premium rubber compound.",
    quantity: 14,
    minimumStock: 6,
    costPrice: 6.5,
    sellingPrice: 18.5,
  },
  {
    sku: "CLN-GAT-HOS1",
    name: "Gates Upper Radiator Coolant Hose",
    description: "Molded EPDM coolant hose designed to resist electrochemical degradation.",
    quantity: 1, // LOW STOCK on purpose (min 4)
    minimumStock: 4,
    costPrice: 8.0,
    sellingPrice: 18.0,
  },
  {
    sku: "SUS-MON-STR1",
    name: "Monroe Quick-Strut Front Shock Absorber Assembly",
    description: "Pre-assembled suspension strut assembly including coil spring and bearing plate.",
    quantity: 0, // OUT OF STOCK on purpose (min 2)
    minimumStock: 2,
    costPrice: 55.0,
    sellingPrice: 115.0,
  },
];

async function seed() {
  console.log("Seeding automotive garage inventory parts...");

  for (const item of sampleParts) {
    const existing = await prisma.part.findUnique({
      where: { sku: item.sku },
    });

    if (!existing) {
      const part = await prisma.part.create({
        data: item,
      });

      if (item.quantity > 0) {
        await prisma.inventoryTransaction.create({
          data: {
            partId: part.id,
            type: "PURCHASE",
            quantity: item.quantity,
            referenceType: "INITIAL_SEED",
            referenceId: null,
          },
        });
      }
      console.log(`Created part: ${item.name} (${item.sku}) - Qty: ${item.quantity}`);
    } else {
      console.log(`Skipped existing part: ${item.sku}`);
    }
  }

  console.log("Inventory seeding completed successfully!");
}

seed()
  .catch((e) => {
    console.error("Failed to seed inventory:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
