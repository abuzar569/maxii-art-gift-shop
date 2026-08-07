import mongoose, { Schema } from 'mongoose';

const InventorySchema = new Schema(
  {
    itemName: { type: String, required: true, index: true },
    category: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, default: 'pcs' },
    minimumStock: { type: Number, default: 0, min: 0 },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

export interface IInventory {
  _id: string;
  itemName: string;
  category?: string;
  quantity: number;
  unit?: string;
  minimumStock: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const Inventory =
  mongoose.models.Inventory || mongoose.model('Inventory', InventorySchema);

export default Inventory;
