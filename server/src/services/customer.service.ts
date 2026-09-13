import { prisma } from "../config/database.js";
import { AppError } from "../utils/errors.js";
import { invalidateDashboardCache } from "../utils/cache.js";

import type {
  CreateCustomerInput,
  UpdateCustomerInput,
} from "../schemas/customer.schema.js";

interface GetCustomersParams {
  page: number;
  limit: number;
  search?: string;
}

export const getCustomers = async ({
  page,
  limit,
  search,
}: GetCustomersParams) => {
  const skip = (page - 1) * limit;

  const where = search
    ? {
        OR: [
          {
            firstName: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            lastName: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            phone: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            email: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
        ],
      }
    : undefined;

  const [customers, total] = await prisma.$transaction([
    prisma.customer.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: {
            vehicles: true,
          },
        },
      },
    }),

    prisma.customer.count({
      where,
    }),
  ]);

  return {
    customers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getCustomerById = async (customerId: string) => {
  const customer = await prisma.customer.findUnique({
    where: {
      id: customerId,
    },
    include: {
      vehicles: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!customer) {
    throw new AppError("Customer not found", 404);
  }

  return customer;
};

export const createCustomer = async (input: CreateCustomerInput) => {
  const customer = await prisma.customer.create({
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      email: input.email || null,
      address: input.address || null,
      notes: input.notes || null,
    },
  });

  await invalidateDashboardCache();
  return customer;
};

export const updateCustomer = async (
  customerId: string,
  input: UpdateCustomerInput,
) => {
  const existingCustomer = await prisma.customer.findUnique({
    where: {
      id: customerId,
    },
  });

  if (!existingCustomer) {
    throw new AppError("Customer not found", 404);
  }

  const customer = await prisma.customer.update({
    where: {
      id: customerId,
    },
    data: {
      ...input,
      email: input.email === "" ? null : input.email,
    },
  });

  await invalidateDashboardCache();
  return customer;
};

export const deleteCustomer = async (customerId: string) => {
  const existingCustomer = await prisma.customer.findUnique({
    where: {
      id: customerId,
    },
    include: {
      vehicles: {
        select: {
          id: true,
        },
      },
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

  if (!existingCustomer) {
    throw new AppError("Customer not found", 404);
  }

  if (existingCustomer.jobs.length > 0) {
    throw new AppError("Customers with repair history cannot be deleted", 409);
  }

  if (existingCustomer.invoices.length > 0) {
    throw new AppError("Customers with invoices cannot be deleted", 409);
  }

  await prisma.customer.delete({
    where: {
      id: customerId,
    },
  });

  await invalidateDashboardCache();
};
