export type CategoryName =
  | 'Coffee'
  | 'Non-Coffee'
  | 'Tea'
  | 'Pastries'
  | 'Desserts'
  | 'Snacks'
  | 'Add-ons'
  | (string & {});

export interface Category {
  id: string;
  name: CategoryName;
  icon: string;
}

export interface IngredientRef {
  ingredientId: string;
  qty: number;
}

export type ProductStatus = 'available' | 'sold-out' | 'hidden';

export interface Product {
  id: string;
  name: string;
  category: CategoryName;
  price: number;
  cost: number;
  ingredients: IngredientRef[];
  status: ProductStatus;
  image?: string;
}
