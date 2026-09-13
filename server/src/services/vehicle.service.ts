import { prisma } from "../config/database.js";
import { AppError } from "../utils/errors.js";
import { invalidateDashboardCache } from "../utils/cache.js";

import type {
  CreateVehicleInput,
  UpdateVehicleInput,
} from "../schemas/vehicle.schema.js";

interface GetVehiclesParams {
  page: number;
  limit: number;
  search?: string;
}

export const getVehicles = async ({
  page,
  limit,
  search,
}: GetVehiclesParams) => {
  const skip = (page - 1) * limit;

  const where = search
    ? {
        OR: [
          {
            registrationNumber: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            make: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            model: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            customer: {
              firstName: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          },
          {
            customer: {
              lastName: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          },
        ],
      }
    : undefined;

  const [vehicles, total] = await prisma.$transaction([
    prisma.vehicle.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        _count: {
          select: {
            jobs: true,
          },
        },
      },
    }),

    prisma.vehicle.count({
      where,
    }),
  ]);

  return {
    vehicles,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getVehicleById = async (vehicleId: string) => {
  const vehicle = await prisma.vehicle.findUnique({
    where: {
      id: vehicleId,
    },
    include: {
      customer: true,
      jobs: {
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          jobNumber: true,
          complaint: true,
          diagnosis: true,
          status: true,
          priority: true,
          mileageIn: true,
          mileageOut: true,
          createdAt: true,
          updatedAt: true,
          mechanic: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!vehicle) {
    throw new AppError("Vehicle not found", 404);
  }

  return vehicle;
};

export const createVehicle = async (input: CreateVehicleInput) => {
  const customer = await prisma.customer.findUnique({
    where: {
      id: input.customerId,
    },
  });

  if (!customer) {
    throw new AppError("Customer not found", 404);
  }

  const existingVehicle = await prisma.vehicle.findUnique({
    where: {
      registrationNumber: input.registrationNumber,
    },
  });

  if (existingVehicle) {
    throw new AppError(
      "A vehicle with this registration number already exists",
      409,
    );
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      customerId: input.customerId,
      registrationNumber: input.registrationNumber,
      make: input.make,
      model: input.model,
      year: input.year,
      mileage: input.mileage,
    },
    include: {
      customer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
    },
  });

  await invalidateDashboardCache();
  return vehicle;
};

export const updateVehicle = async (
  vehicleId: string,
  input: UpdateVehicleInput,
) => {
  const existingVehicle = await prisma.vehicle.findUnique({
    where: {
      id: vehicleId,
    },
  });

  if (!existingVehicle) {
    throw new AppError("Vehicle not found", 404);
  }

  if (input.registrationNumber) {
    const registrationExists = await prisma.vehicle.findFirst({
      where: {
        registrationNumber: input.registrationNumber,
        NOT: {
          id: vehicleId,
        },
      },
    });

    if (registrationExists) {
      throw new AppError(
        "A vehicle with this registration number already exists",
        409,
      );
    }
  }

  const vehicle = await prisma.vehicle.update({
    where: {
      id: vehicleId,
    },
    data: {
      registrationNumber: input.registrationNumber,
      make: input.make,
      model: input.model,
      year: input.year,
      mileage: input.mileage,
    },
    include: {
      customer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
    },
  });

  await invalidateDashboardCache();
  return vehicle;
};

export const deleteVehicle = async (vehicleId: string) => {
  const existingVehicle = await prisma.vehicle.findUnique({
    where: {
      id: vehicleId,
    },
    include: {
      jobs: {
        select: {
          id: true,
        },
        take: 1,
      },
      invoices: {
        select: {
          id: true,
        },
        take: 1,
      },
    },
  });

  if (!existingVehicle) {
    throw new AppError("Vehicle not found", 404);
  }

  if (existingVehicle.jobs.length > 0) {
    throw new AppError("Vehicles with repair history cannot be deleted", 409);
  }

  if (existingVehicle.invoices.length > 0) {
    throw new AppError("Vehicles with invoices cannot be deleted", 409);
  }

  await prisma.vehicle.delete({
    where: {
      id: vehicleId,
    },
  });

  await invalidateDashboardCache();
};
