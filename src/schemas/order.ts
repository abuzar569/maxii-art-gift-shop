import { z } from 'zod';

export const orderSchema = z.object({
  orderDate: z.string().min(1, 'Order date is required'),
  completionDate: z.string().optional(),
  customerName: z.string().min(1, 'Customer name is required').max(100),
  phone: z
    .string()
    .min(10, 'Phone must be at least 10 digits')
    .max(15, 'Phone must be at most 15 digits')
    .regex(/^\d+$/, 'Phone must contain only digits'),
  productName: z.string().min(1, 'Product name is required').max(200),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  totalAmount: z.number().min(0, 'Total amount must be non-negative'),
  advanceAmount: z.number().min(0, 'Advance amount must be non-negative'),
  paymentMethod: z.enum(['Cash', 'UPI', 'Bank Transfer'], {
    errorMap: () => ({ message: 'Payment method must be Cash, UPI, or Bank Transfer' }),
  }),
  status: z.enum(['Pending', 'In Progress', 'Completed', 'Delivered', 'Cancelled'], {
    errorMap: () => ({ message: 'Invalid status value' }),
  }),
  address: z.string().optional(),
  notes: z.string().optional(),
}).refine((data) => data.advanceAmount <= data.totalAmount, {
  message: 'Advance amount cannot exceed total amount',
  path: ['advanceAmount'],
});

export type OrderInput = z.infer<typeof orderSchema>;
