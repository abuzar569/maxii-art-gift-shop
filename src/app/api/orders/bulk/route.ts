import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import { authenticateRequest } from '@/lib/auth';

const VALID_PAYMENT = ['Cash', 'UPI', 'Bank Transfer'];
const VALID_STATUS  = ['Pending', 'In Progress', 'Completed', 'Delivered', 'Cancelled'];

// Parse a single CSV line respecting quoted fields
function parseLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
    else { current += ch; }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(text: string) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = parseLine(lines[0]).map(h => h.toLowerCase().replace(/[\s_-]/g, ''));
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = (values[idx] || '').trim(); });
    rows.push(row);
  }
  return { headers, rows };
}

// Map any reasonable column name variant to our field
function normalise(h: string): string {
  const map: Record<string, string> = {
    customername: 'customerName', customer: 'customerName', name: 'customerName',
    phone: 'phone', mobile: 'phone', phonenumber: 'phone', contact: 'phone',
    productname: 'productName', product: 'productName', item: 'productName', itemname: 'productName',
    quantity: 'quantity', qty: 'quantity',
    totalamount: 'totalAmount', total: 'totalAmount', amount: 'totalAmount', price: 'totalAmount',
    advanceamount: 'advanceAmount', advance: 'advanceAmount',
    minimumamount: 'advanceAmount', minimumamountreceived: 'advanceAmount', minadvance: 'advanceAmount',
    paymentmethod: 'paymentMethod', payment: 'paymentMethod', paymentmode: 'paymentMethod',
    status: 'status', orderstatus: 'status',
    orderdate: 'orderDate', date: 'orderDate',
    completiondate: 'completionDate', expecteddate: 'completionDate',
    completedate: 'completionDate', duedate: 'completionDate',
    address: 'address', addr: 'address',
    notes: 'notes', note: 'notes', remarks: 'notes',
  };
  return map[h] || h;
}

function normalisePayment(v: string): string {
  if (!v) return 'Cash';
  const match = VALID_PAYMENT.find(p => p.toLowerCase() === v.toLowerCase());
  return match || 'Cash';
}

function normaliseStatus(v: string): string {
  if (!v) return 'Pending';
  const match = VALID_STATUS.find(s => s.toLowerCase() === v.toLowerCase());
  return match || 'Pending';
}

function parseDate(v: string): Date | undefined {
  if (!v) return undefined;
  const d = new Date(v);
  return isNaN(d.getTime()) ? undefined : d;
}

export async function POST(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    if (!file.name.endsWith('.csv')) return NextResponse.json({ error: 'Only CSV files are supported' }, { status: 400 });

    const text = await file.text();
    const { rows } = parseCSV(text);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'CSV file is empty or has no data rows' }, { status: 400 });
    }

    const results = { success: 0, failed: 0, errors: [] as { row: number; reason: string }[] };
    const OrderModel = Order as any;

    for (let i = 0; i < rows.length; i++) {
      const raw = rows[i];
      const rowNum = i + 2;

      // Normalise all column names
      const row: Record<string, string> = {};
      for (const key of Object.keys(raw)) {
        row[normalise(key)] = raw[key];
      }

      // Skip rows that are entirely empty
      const allEmpty = Object.values(row).every(v => !v);
      if (allEmpty) continue;

      try {
        // customerName — use placeholder if missing
        const customerName = row.customerName?.trim() || 'Unknown Customer';

        // productName — use placeholder if missing
        const productName = row.productName?.trim() || 'Unknown Product';

        // phone — clean digits, allow empty
        const phone = (row.phone || '').replace(/\D/g, '');

        // numbers — default to 0 / 1 if empty or invalid
        const quantity   = Math.max(1, parseInt(row.quantity) || 1);
        const totalAmount   = parseFloat(row.totalAmount)   || 0;
        const advanceAmount = parseFloat(row.advanceAmount) || 0;

        // clamp advance to total
        const safeAdvance = Math.min(advanceAmount, totalAmount);

        // payment & status
        const paymentMethod = normalisePayment(row.paymentMethod || '');
        const status        = normaliseStatus(row.status || '');

        // dates
        const orderDate     = parseDate(row.orderDate) || new Date();
        const completionDate = parseDate(row.completionDate);

        const order = new OrderModel({
          orderDate,
          completionDate,
          customerName,
          phone,
          productName,
          quantity,
          totalAmount,
          advanceAmount: safeAdvance,
          paymentMethod,
          status,
          address: row.address?.trim() || '',
          notes:   row.notes?.trim()   || '',
        });

        await order.save();
        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push({ row: rowNum, reason: (err as Error).message });
      }
    }

    return NextResponse.json({
      message: `Import complete: ${results.success} imported, ${results.failed} failed`,
      ...results,
    });

  } catch (err) {
    console.error('Bulk upload error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
