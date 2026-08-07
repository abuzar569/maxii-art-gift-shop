import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import { authenticateRequest } from '@/lib/auth';

// Expected CSV columns (case-insensitive)
const REQUIRED_COLS = ['customerName', 'phone', 'productName', 'quantity', 'totalAmount', 'advanceAmount', 'paymentMethod', 'orderDate'];
const VALID_PAYMENT = ['Cash', 'UPI', 'Bank Transfer'];
const VALID_STATUS = ['Pending', 'In Progress', 'Completed', 'Delivered', 'Cancelled'];

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  // Parse a single CSV line respecting quoted fields
  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, ''));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });
    rows.push(row);
  }

  return { headers, rows };
}

// Map flexible column names to our schema fields
function normaliseHeader(h: string): string {
  const map: Record<string, string> = {
    customername: 'customerName',
    customer: 'customerName',
    name: 'customerName',
    phone: 'phone',
    mobile: 'phone',
    phonenumber: 'phone',
    productname: 'productName',
    product: 'productName',
    item: 'productName',
    quantity: 'quantity',
    qty: 'quantity',
    totalamount: 'totalAmount',
    total: 'totalAmount',
    amount: 'totalAmount',
    advanceamount: 'advanceAmount',
    advance: 'advanceAmount',
    minimumamount: 'advanceAmount',
    minimumamountreceived: 'advanceAmount',
    paymentmethod: 'paymentMethod',
    payment: 'paymentMethod',
    status: 'status',
    orderstatus: 'status',
    orderdate: 'orderDate',
    date: 'orderDate',
    completiondate: 'completionDate',
    expecteddate: 'completionDate',
    completedate: 'completionDate',
    address: 'address',
    notes: 'notes',
    note: 'notes',
  };
  return map[h] || h;
}

export async function POST(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'Only CSV files are supported' }, { status: 400 });
    }

    const text = await file.text();
    const { headers, rows } = parseCSV(text);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'CSV file is empty or has no data rows' }, { status: 400 });
    }

    // Normalise headers
    const normalisedRows = rows.map(row => {
      const normalised: Record<string, string> = {};
      for (const key of Object.keys(row)) {
        const normKey = normaliseHeader(key.toLowerCase().replace(/\s+/g, ''));
        normalised[normKey] = row[key];
      }
      return normalised;
    });

    const results = {
      success: 0,
      failed: 0,
      errors: [] as { row: number; reason: string }[],
    };

    const OrderModel = Order as any;

    for (let i = 0; i < normalisedRows.length; i++) {
      const row = normalisedRows[i];
      const rowNum = i + 2; // +2 because row 1 is headers, and we display human-readable row number

      try {
        // Validate required fields
        const missing = REQUIRED_COLS.filter(col => !row[col] || row[col].trim() === '');
        if (missing.length > 0) {
          results.failed++;
          results.errors.push({ row: rowNum, reason: `Missing required fields: ${missing.join(', ')}` });
          continue;
        }

        const quantity = Number(row.quantity);
        const totalAmount = Number(row.totalAmount);
        const advanceAmount = Number(row.advanceAmount);

        if (isNaN(quantity) || quantity < 1) {
          results.failed++;
          results.errors.push({ row: rowNum, reason: 'Invalid quantity (must be a number ≥ 1)' });
          continue;
        }
        if (isNaN(totalAmount) || totalAmount < 0) {
          results.failed++;
          results.errors.push({ row: rowNum, reason: 'Invalid totalAmount' });
          continue;
        }
        if (isNaN(advanceAmount) || advanceAmount < 0) {
          results.failed++;
          results.errors.push({ row: rowNum, reason: 'Invalid advanceAmount' });
          continue;
        }
        if (advanceAmount > totalAmount) {
          results.failed++;
          results.errors.push({ row: rowNum, reason: 'Advance amount cannot exceed total amount' });
          continue;
        }

        // Normalise payment method
        let paymentMethod = row.paymentMethod?.trim() || 'Cash';
        if (!VALID_PAYMENT.includes(paymentMethod)) {
          // Try case-insensitive match
          const match = VALID_PAYMENT.find(p => p.toLowerCase() === paymentMethod.toLowerCase());
          if (match) {
            paymentMethod = match;
          } else {
            results.failed++;
            results.errors.push({ row: rowNum, reason: `Invalid paymentMethod "${paymentMethod}". Use: Cash, UPI, Bank Transfer` });
            continue;
          }
        }

        // Normalise status
        let status = row.status?.trim() || 'Pending';
        if (!VALID_STATUS.includes(status)) {
          const match = VALID_STATUS.find(s => s.toLowerCase() === status.toLowerCase());
          if (match) {
            status = match;
          } else {
            status = 'Pending'; // default
          }
        }

        // Parse dates
        const orderDate = row.orderDate ? new Date(row.orderDate) : new Date();
        if (isNaN(orderDate.getTime())) {
          results.failed++;
          results.errors.push({ row: rowNum, reason: `Invalid orderDate "${row.orderDate}"` });
          continue;
        }

        let completionDate: Date | undefined;
        if (row.completionDate && row.completionDate.trim()) {
          completionDate = new Date(row.completionDate);
          if (isNaN(completionDate.getTime())) {
            completionDate = undefined;
          }
        }

        const phone = row.phone?.trim().replace(/\D/g, '');
        if (!phone || phone.length < 10 || phone.length > 15) {
          results.failed++;
          results.errors.push({ row: rowNum, reason: `Invalid phone number "${row.phone}"` });
          continue;
        }

        const order = new OrderModel({
          orderDate,
          completionDate,
          customerName: row.customerName.trim(),
          phone,
          productName: row.productName.trim(),
          quantity,
          totalAmount,
          advanceAmount,
          paymentMethod,
          status,
          address: row.address?.trim() || '',
          notes: row.notes?.trim() || '',
        });

        await order.save();
        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push({ row: rowNum, reason: `Unexpected error: ${(err as Error).message}` });
      }
    }

    return NextResponse.json({
      message: `Import complete: ${results.success} imported, ${results.failed} failed`,
      ...results,
    }, { status: 200 });

  } catch (err) {
    console.error('Bulk upload error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
