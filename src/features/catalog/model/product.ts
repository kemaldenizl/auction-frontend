/** Mirrors the catalog service's `Product` record. JSON arrives camelCase. */
export interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string;
  startingPrice: number;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface ProductListQuery {
  category?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export type ProductDraft = Pick<
  Product,
  "name" | "category" | "startingPrice"
> &
  Partial<Pick<Product, "description" | "imageUrl" | "isActive">>;
