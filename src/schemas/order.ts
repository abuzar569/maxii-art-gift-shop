import { z } from 'zod';

export const orderSchema = z.object({
  orderDate: z.string().optional().default(() => new Date().toISOString().slice(0, 10)),
  completionDate: z.string().optional(),
  customerName: z.string().min(1, 'Customer name is required').max(100),
  phone: z
    .string()
    .optional()
    .default('')
    .transform((v) => v.replace(/\D/g, ''))
    .refine((v) => v === '' || (v.length >= 10 && v.length <= 15), {
      message: 'Phone must be 10–15 digits',
    }),
  productName: z.string().min(1, 'Product name is required').max(200),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').optional().default(1),
  totalAmount: z.number().min(0).optional().default(0),
  advanceAmount: z.number().min(0).optional().default(0),
  paymentMethod: z
    .enum(['Cash', 'UPI', 'Bank Transfer'])
    .optional()
    .default('Cash'),
  status: z
    .enum(['Pending', 'In Progress', 'Completed', 'Delivered', 'Cancelled'])
    .optional()
    .default('Pending'),
  address: z.string().optional().default(''),
  notes: z.string().optional().default(''),
}).refine(
  (data) => (data.advanceAmount ?? 0) <= (data.totalAmount ?? 0),
  {
    message: 'Advance amount cannot exceed total amount',
    path: ['advanceAmount'],
  }
);

export type OrderInput = z.infer<typeof orderSchema>;
