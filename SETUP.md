# 🎁 Gift Shop Admin Panel — Setup Guide

## Prerequisites
- Node.js 18+
- MongoDB (local or MongoDB Atlas)

## Quick Start

### 1. Configure environment
Edit `.env.local` in the project root:

```env
MONGODB_URI=mongodb://localhost:27017/gift-admin   # or your Atlas URI
JWT_SECRET=change-this-to-a-long-random-secret
ADMIN_EMAIL=admin@giftshop.com
ADMIN_PASSWORD=admin123
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run development server
```bash
npm run dev
```

Open http://localhost:3000

### 4. Login
- Email: `admin@giftshop.com`
- Password: `admin123`

> The admin account is auto-created on first login if no users exist.

---

## Features Built

### Dashboard (`/admin/default`)
- Stat cards: Total Orders, Pending, Completed, Revenue, Advance Received, Remaining Balance, Available Items
- Recent Orders table
- Today's Orders
- Orders Due for Completion Today

### Orders (`/admin/orders`)
- Full order table with all fields
- Search by customer name, sequence number, product name
- Filter by status (All / Pending / In Progress / Completed / Delivered / Cancelled)
- Sort: Newest / Oldest
- Pagination (20 per page)
- Add / Edit / Delete orders
- Print Invoice (opens browser print dialog)
- Export to CSV
- Delete confirmation modal

### Inventory (`/admin/inventory`)
- Full inventory table
- Add / Edit / Delete items
- Search by item name or category
- Low Stock warning badge (red) when quantity < minimum stock

### Settings (`/admin/settings`)
- Account info
- Change password

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login |
| POST | /api/auth/logout | Logout |
| POST | /api/auth/change-password | Change password |
| GET | /api/dashboard | Dashboard metrics |
| GET | /api/orders | List orders (search, filter, sort, paginate) |
| POST | /api/orders | Create order |
| GET | /api/orders/:id | Get order |
| PUT | /api/orders/:id | Update order |
| DELETE | /api/orders/:id | Delete order |
| GET | /api/inventory | List inventory |
| POST | /api/inventory | Create item |
| GET | /api/inventory/:id | Get item |
| PUT | /api/inventory/:id | Update item |
| DELETE | /api/inventory/:id | Delete item |

---

## Using MongoDB Atlas (Recommended for Production)

1. Create a free cluster at https://www.mongodb.com/atlas
2. Get your connection string
3. Update `.env.local`:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/gift-admin
```
