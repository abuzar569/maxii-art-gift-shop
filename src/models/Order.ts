import mongoose, { Schema } from 'mongoose';

const OrderSchema = new Schema(
  {
    sequenceNo: { type: String, unique: true, index: true },
    orderDate: { type: Date, required: true },
    completionDate: { type: Date },
    customerName: { type: String, required: true, index: true },
    phone: { type: String, required: true },
    productName: { type: String, required: true, index: true },
    quantity: { type: Number, required: true, min: 1 },
    totalAmount: { type: Number, required: true, min: 0 },
    advanceAmount: { type: Number, required: true, min: 0 },
    remainingAmount: { type: Number, default: 0 },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'UPI', 'Bank Transfer'],
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed', 'Delivered', 'Cancelled'],
      default: 'Pending',
      index: true,
    },
    address: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

// Single combined pre-save hook
OrderSchema.pre('save', async function () {
  // eslint-disable-next-line
  const doc = this as any;

  // Auto-calculate remaining amount
  doc.remainingAmount = Number(doc.totalAmount) - Number(doc.advanceAmount);

  // Auto-generate sequenceNo for new documents only
  if (!doc.sequenceNo) {
    const lastOrder = await mongoose.models.Order.findOne(
      {},
      { sequenceNo: 1 },
      { sort: { createdAt: -1 } }
    );
    let nextNum = 1;
    if (lastOrder?.sequenceNo) {
      const num = parseInt(String(lastOrder.sequenceNo).replace('#', ''), 10);
      nextNum = isNaN(num) ? 1 : num + 1;
    }
    doc.sequenceNo = `#${String(nextNum).padStart(4, '0')}`;
  }
});

export interface IOrder {
  _id: string;
  sequenceNo: string;
  orderDate: Date;
  completionDate?: Date;
  customerName: string;
  phone: string;
  productName: string;
  quantity: number;
  totalAmount: number;
  advanceAmount: number;
  remainingAmount: number;
  paymentMethod: string;
  status: string;
  address?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);

export default Order;
