export interface Part {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  quantity: number;
  minimumStock: number;
  costPrice: number | string;
  sellingPrice: number | string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    jobParts?: number;
    inventoryTransactions?: number;
  };
}

export type InventoryTransactionType =
  | "PURCHASE"
  | "JOB_USAGE"
  | "ADJUSTMENT"
  | "RETURN"
  | "DAMAGE";

export interface InventoryTransaction {
  id: string;
  partId: string;
  type: InventoryTransactionType;
  quantity: number;
  referenceType: string | null;
  referenceId: string | null;
  createdAt: string;
}

export interface InventorySummary {
  totalSkus: number;
  totalItems: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalValuation: number;
  totalRetailValue: number;
  projectedProfit: number;
}

export interface PartListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: "all" | "inStock" | "lowStock" | "outOfStock";
}

export interface PartPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PartsResponse {
  success: boolean;
  data: {
    parts: Part[];
    pagination: PartPagination;
  };
}

export interface PartResponse {
  success: boolean;
  data: {
    part: Part;
  };
}

export interface InventorySummaryResponse {
  success: boolean;
  data: {
    summary: InventorySummary;
  };
}

export interface PartTransactionsResponse {
  success: boolean;
  data: {
    part: {
      id: string;
      name: string;
      sku: string;
    };
    transactions: InventoryTransaction[];
  };
}

export interface CreatePartInput {
  sku: string;
  name: string;
  description?: string;
  quantity: number;
  minimumStock: number;
  costPrice: number;
  sellingPrice: number;
}

export type UpdatePartInput = Partial<CreatePartInput>;

export interface AdjustStockInput {
  type: "PURCHASE" | "ADJUSTMENT" | "RETURN" | "DAMAGE";
  quantity: number;
  reason?: string;
}
