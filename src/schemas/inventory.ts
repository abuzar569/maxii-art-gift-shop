import { z } from 'zod';

export const inventorySchema = z.object({
  itemName: z.string().min(1, 'Item name is required').max(200),
  category: z.string().optional(),
  quantity: z.number().int().min(0, 'Quantity must be non-negative'),
  unit: z.string().optional(),
  minimumStock: z.number().int().min(0, 'Minimum stock must be non-negative'),
  description: z.string().optional(),
});

export type InventoryInput = z.infer<typeof inventorySchema>;
