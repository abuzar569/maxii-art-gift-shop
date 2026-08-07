# Requirements Document

## Introduction

This document defines the requirements for a full-stack Order and Inventory Management System for a small business. The system is a Next.js 15 (App Router) web application backed by MongoDB that lets a single admin manage customer orders from creation through delivery, track raw material / product inventory, and monitor business performance through a real-time dashboard. Authentication is JWT-based with bcrypt password hashing. The UI is built with Tailwind CSS and shadcn/ui, supports dark mode, and is fully responsive.

> **Note on existing codebase**: The workspace contains the Horizon UI Next.js template (Chakra UI / ApexCharts). The design phase will resolve whether to retain, replace, or layer shadcn/ui on top of the existing template. Requirements are stated independently of that resolution.

---

## Glossary

- **System**: The Order and Inventory Management web application as a whole.
- **Admin**: The single authenticated user who operates the System.
- **Auth_Service**: The module responsible for issuing, validating, and revoking JWT tokens and hashing passwords.
- **Order**: A customer purchase record tracked from creation to delivery.
- **Order_Manager**: The backend and frontend module responsible for all Order CRUD operations.
- **Sequence_Number**: An auto-incremented, zero-padded four-digit order identifier (e.g., `#0001`).
- **Inventory_Item**: A record representing a raw material or product held in stock.
- **Inventory_Manager**: The backend and frontend module responsible for all Inventory CRUD operations.
- **Dashboard**: The summary view shown immediately after login.
- **Dashboard_Service**: The API endpoint that computes aggregated dashboard metrics.
- **Invoice**: A printable / exportable document summarising a single Order.
- **Customer_History**: A view that aggregates all Orders for a single customer.
- **Order_Timeline**: A visual representation of an Order's status progression.
- **Cloudinary**: The third-party image hosting service used to store order reference images.
- **Validator**: The Zod-based schema validation layer applied to all API inputs and form submissions.
- **JWT**: JSON Web Token used as the bearer credential for protected routes.
- **Low_Stock_Warning**: A visual indicator displayed when an Inventory_Item's quantity falls below its minimum stock threshold.

---

## Requirements

---

### Requirement 1: Admin Authentication

**User Story:** As an Admin, I want to log in with a username and password, so that only authorised users can access the System.

#### Acceptance Criteria

1. THE Auth_Service SHALL hash Admin passwords using bcrypt with a minimum work factor of 12 before persisting them to the database.
2. WHEN an Admin submits valid credentials, THE Auth_Service SHALL issue a signed JWT with an expiry of 24 hours.
3. WHEN an Admin submits invalid credentials, THE Auth_Service SHALL return an HTTP 401 response with a descriptive error message and SHALL NOT issue a token.
4. WHILE a valid JWT is present in the request, THE Auth_Service SHALL grant access to all protected API routes.
5. IF a request reaches a protected API route without a valid JWT, THEN THE Auth_Service SHALL return an HTTP 401 response and redirect the requester to the login page.
6. WHEN an Admin logs out, THE Auth_Service SHALL invalidate the client-side JWT and redirect the Admin to the login page.
7. THE System SHALL support exactly one Admin account; attempts to create additional accounts through the API SHALL return HTTP 403.

---

### Requirement 2: Protected Route Navigation

**User Story:** As an Admin, I want all application pages to be protected, so that unauthenticated visitors cannot view business data.

#### Acceptance Criteria

1. WHEN an unauthenticated user navigates to any route other than `/login`, THE System SHALL redirect the user to `/login`.
2. WHILE the Admin is authenticated, THE System SHALL display a sidebar containing navigation links to Dashboard, Orders, Inventory, Settings, and a Logout action; IF the Admin's session expires while the application is in use, THEN THE System SHALL keep the sidebar visible until the Admin's next navigation attempt, at which point THE System SHALL redirect to `/login`.
3. THE System SHALL render a top navigation bar on every protected page that displays the current page title and Admin account controls.

---

### Requirement 3: Dashboard Overview

**User Story:** As an Admin, I want a dashboard that summarises key business metrics, so that I can assess business performance at a glance.

#### Acceptance Criteria

1. WHEN the Admin loads the Dashboard, THE Dashboard_Service SHALL return the following aggregated metrics computed from live database data: Total Orders count, Pending Orders count, Completed Orders count, Total Revenue (sum of `totalAmount` for all non-Cancelled orders), Total Advance Received (sum of `advanceAmount` for all non-Cancelled orders), Remaining Balance (Total Revenue minus Total Advance Received), and Available Products count (total distinct Inventory_Items with quantity greater than zero).
2. THE Dashboard SHALL display each metric in a visually distinct card component.
3. THE Dashboard SHALL display a "Recent Orders" list showing the ten most recently created Orders, each with Sequence_Number, customer name, product name, status, and total amount.
4. THE Dashboard SHALL display a "Today's Orders" list showing all Orders whose `orderDate` equals the current calendar date.
5. THE Dashboard SHALL display an "Orders Due Today" list showing all Orders whose `completionDate` equals the current calendar date and whose status is not Completed or Delivered.
6. THE Dashboard SHALL display a monthly Orders chart plotting the count of Orders created per month for the trailing 12 months.
7. THE Dashboard SHALL display a monthly Revenue chart plotting the sum of `totalAmount` per month for the trailing 12 months.
8. THE Dashboard SHALL display a calendar widget that marks dates on which one or more Orders have an expected `completionDate`.

---

### Requirement 4: Order Creation

**User Story:** As an Admin, I want to create new orders with all required customer and product details, so that every customer purchase is recorded accurately.

#### Acceptance Criteria

1. WHEN the Admin submits a valid new order form, THE Order_Manager SHALL persist the Order to the database and SHALL assign the next available Sequence_Number in the format `#NNNN` where `NNNN` is a zero-padded integer incrementing from `0001`.
2. THE Order_Manager SHALL auto-calculate and persist `remainingAmount` as `totalAmount` minus `advanceAmount` at the time of creation.
3. THE Validator SHALL enforce that the following fields are present and non-empty for every new Order: `orderDate`, `customerName`, `phone`, `productName`, `quantity`, `totalAmount`, `advanceAmount`, `paymentMethod`, and `status`.
4. THE Validator SHALL enforce that `phone` contains between 10 and 15 digits.
5. THE Validator SHALL enforce that `quantity` is a positive integer greater than zero.
6. THE Validator SHALL enforce that `totalAmount` and `advanceAmount` are non-negative numbers and that `advanceAmount` is less than or equal to `totalAmount`.
7. THE Validator SHALL enforce that `paymentMethod` is one of: `Cash`, `UPI`, or `Bank Transfer`.
8. THE Validator SHALL enforce that `status` is one of: `Pending`, `In Progress`, `Completed`, `Delivered`, or `Cancelled`.
9. IF the Validator rejects any field, THEN THE Order_Manager SHALL return HTTP 422 with field-level error messages identifying each invalid field by name.
10. WHERE the Admin provides an `instagramUsername`, THE Order_Manager SHALL persist it; otherwise THE Order_Manager SHALL store a null value.
11. WHERE the Admin uploads an order reference image, THE Order_Manager SHALL upload the image to Cloudinary and persist the returned URL in the Order record; otherwise THE Order_Manager SHALL store a null value for the image URL.
12. WHEN an Order is created successfully, THE System SHALL display a success toast notification and navigate the Admin to the Order detail page for the new Order.

---

### Requirement 5: Order Retrieval and Listing

**User Story:** As an Admin, I want to view, search, filter, and sort all orders, so that I can quickly locate any order in the system.

#### Acceptance Criteria

1. THE Order_Manager SHALL expose `GET /api/orders` which returns a paginated list of Orders with a default page size of 20 records per page.
2. WHEN the Admin provides a `search` query parameter, THE Order_Manager SHALL return only Orders whose `customerName`, `sequenceNo`, or `productName` contains the search string (case-insensitive).
3. WHEN the Admin provides a `status` filter parameter, THE Order_Manager SHALL return only Orders matching the given status value.
4. WHEN the Admin provides a `sort` parameter of `newest`, THE Order_Manager SHALL return Orders sorted by `createdAt` descending; WHEN `sort` is `oldest`, THE Order_Manager SHALL return Orders sorted by `createdAt` ascending.
5. THE Order_Manager SHALL expose `GET /api/orders/:id` which returns a single Order by its MongoDB document ID; IF no Order with the given ID exists, THEN THE Order_Manager SHALL return HTTP 404.
6. THE System SHALL render an Orders table displaying: Sequence_Number, Date of Order, Customer Name, Product Name, Quantity, Total Amount, Advance Amount, Remaining Amount, Payment Method, Status, and action buttons; IF an API error occurs that indicates a system problem, THEN THE System SHALL suppress the Orders table and display an error state instead of partially rendered data.
7. WHEN no `sort` parameter is provided, THE Order_Manager SHALL return Orders in their natural database order.
8. THE Orders table SHALL display a pagination control allowing the Admin to navigate between pages.

---

### Requirement 6: Order Update

**User Story:** As an Admin, I want to edit existing order details, so that I can correct mistakes and update order progress.

#### Acceptance Criteria

1. WHEN the Admin submits a valid order update, THE Order_Manager SHALL persist the changes and SHALL recalculate `remainingAmount` as `totalAmount` minus `advanceAmount`.
2. THE Validator SHALL apply the same field validation rules defined in Requirement 4 to all update requests.
3. IF an update request references an Order ID that does not exist, THEN THE Order_Manager SHALL return HTTP 404 immediately, before processing any other part of the update request.
4. WHEN an Order is updated successfully, THE System SHALL display a success toast notification.

---

### Requirement 7: Order Deletion

**User Story:** As an Admin, I want to delete orders, so that I can remove erroneous or test records from the system.

#### Acceptance Criteria

1. WHEN the Admin initiates deletion of an Order, THE System SHALL display a confirmation dialog before sending the delete request; IF the confirmation dialog fails to display due to a UI error, THEN THE System SHALL block the deletion entirely.
2. WHEN the Admin confirms deletion and THE Order_Manager returns HTTP 200 confirming successful removal from the database, THE System SHALL display a success toast notification and remove the Order from the displayed table without a full page reload; IF the server returns HTTP 200 but the deletion did not actually succeed in the database, THE System SHALL not display a success state.
3. IF the Order ID does not exist, THEN THE Order_Manager SHALL return HTTP 404.

---

### Requirement 8: Invoice Generation

**User Story:** As an Admin, I want to print and export order invoices, so that I can provide customers with order confirmation documents.

#### Acceptance Criteria

1. WHEN the Admin selects "Print Invoice" for an Order, THE System SHALL render a print-ready invoice containing: Sequence_Number, customer name, phone, product name, quantity, total amount, advance amount, remaining amount, payment method, order date, expected completion date, and status.
2. THE System SHALL provide an "Export to PDF" action that generates a PDF file of the selected Order's invoice and triggers a browser download.
3. THE System SHALL provide an "Export to Excel" action that generates an `.xlsx` file containing all currently filtered and searched Orders and triggers a browser download.

---

### Requirement 9: CSV Import and Export for Orders

**User Story:** As an Admin, I want to import and export orders as CSV files, so that I can bulk-load historical data and share records with external tools.

#### Acceptance Criteria

1. WHEN the Admin uploads a valid CSV file conforming to the Order field schema, THE Order_Manager SHALL parse each row and persist it as a new Order, assigning a sequential Sequence_Number to each imported record.
2. IF any CSV row fails Validator rules, THEN THE Order_Manager SHALL skip that row, record the row number and error reason, and return a summary report of all skipped rows only after the entire import process completes.
3. THE System SHALL provide a CSV export action that downloads all currently filtered and searched Orders as a `.csv` file with column headers matching the Order field names.
4. FOR ALL valid Order records that are exported to CSV and then re-imported, THE Order_Manager SHALL produce Order records with equivalent field values (round-trip property, excluding auto-assigned fields such as `sequenceNo` and `_id`).

---

### Requirement 10: Order Timeline

**User Story:** As an Admin, I want to view an order's status history as a timeline, so that I can see when each stage was reached.

#### Acceptance Criteria

1. WHEN the Admin views an Order detail page, THE System SHALL display an Order_Timeline showing each status transition in chronological order with the timestamp of the transition.
2. THE Order_Manager SHALL record a status transition event containing the new status and a UTC timestamp each time an Order's `status` field changes.
3. THE Order_Timeline SHALL display status nodes in the sequence: Created → In Progress → Completed → Delivered, with Cancelled as a terminal node reachable from any state.

---

### Requirement 11: Customer History

**User Story:** As an Admin, I want to view all orders for a specific customer on a single page, so that I can assess purchase history and outstanding balances.

#### Acceptance Criteria

1. WHEN the Admin navigates to a customer history page with a given `phone` number, THE Order_Manager SHALL return all Orders associated with that phone number, sorted by `createdAt` descending.
2. THE Customer_History page SHALL display aggregated totals for the customer: total orders count, total revenue, total advance received, and total remaining balance.
3. THE Customer_History page SHALL display a full list of the customer's Orders in a table.

---

### Requirement 12: WhatsApp Quick Contact

**User Story:** As an Admin, I want a one-click WhatsApp contact button on each order, so that I can quickly message customers without manually copying their phone number.

#### Acceptance Criteria

1. WHEN the Admin clicks the WhatsApp button on an Order, THE System SHALL open a new browser tab with the WhatsApp Web URL pre-filled with the Order's `phone` number; IF the browser blocks the new tab from opening, THEN THE System SHALL copy the WhatsApp URL to the clipboard and display a toast notification informing the Admin that the URL was copied.
2. THE System SHALL construct the WhatsApp URL using the format `https://wa.me/<phone>` with the phone number formatted without spaces or special characters.

---

### Requirement 13: Inventory Management

**User Story:** As an Admin, I want to manage inventory items with stock levels, so that I can track available materials and be warned when stock is low.

#### Acceptance Criteria

1. WHEN the Admin submits a valid new inventory form, THE Inventory_Manager SHALL persist the Inventory_Item to the database.
2. THE Validator SHALL enforce that the following fields are present and non-empty for every Inventory_Item: `itemName`, `quantity`, `unit`, and `minimumStock`.
3. THE Validator SHALL enforce that `quantity` and `minimumStock` are non-negative integers.
4. IF the Validator rejects any Inventory_Item field, THEN THE Inventory_Manager SHALL return HTTP 422 with field-level error messages.
5. WHEN the Admin updates an Inventory_Item, THE Inventory_Manager SHALL persist the changes and recalculate the low-stock status.
6. WHEN the Admin confirms deletion of an Inventory_Item, THE Inventory_Manager SHALL permanently remove the item from the database.
7. WHILE an Inventory_Item's `quantity` is less than its `minimumStock`, THE System SHALL display a Low_Stock_Warning badge (red) on that item in the inventory list.
8. THE Inventory_Manager SHALL expose `GET /api/inventory` which returns all Inventory_Items; WHEN the Admin provides a `search` query parameter, THE Inventory_Manager SHALL return only items whose `itemName` or `category` contains the search string (case-insensitive).
9. THE Inventory_Manager SHALL expose `GET /api/inventory/:id`; IF no item with the given ID exists, THEN THE Inventory_Manager SHALL return HTTP 404.

---

### Requirement 14: Dashboard API

**User Story:** As an Admin, I want the dashboard metrics to be served by a dedicated API, so that the frontend can efficiently retrieve aggregated data in a single request.

#### Acceptance Criteria

1. THE Dashboard_Service SHALL expose `GET /api/dashboard` which returns all metrics defined in Requirement 3, Acceptance Criterion 1 in a single JSON response.
2. WHILE the Admin is authenticated and an API request is active, THE Dashboard_Service SHALL respond to `GET /api/dashboard` within 2000ms for databases containing up to 10,000 Order records.
3. IF the Admin is not authenticated, THEN THE Dashboard_Service SHALL return HTTP 401.

---

### Requirement 15: Data Validation — Zod Schemas

**User Story:** As an Admin, I want all form inputs and API payloads to be validated before processing, so that invalid data is never persisted.

#### Acceptance Criteria

1. THE Validator SHALL define a Zod schema for the Order model covering all fields listed in the Order schema definition.
2. THE Validator SHALL define a Zod schema for the Inventory_Item model covering all fields listed in the Inventory schema definition.
3. THE Validator SHALL define a Zod schema for the Admin login payload.
4. WHEN a form field fails validation, THE System SHALL display an inline error message directly beneath the relevant field without submitting the form; THE System SHALL only perform this display after the Admin has explicitly interacted with the form (focused and blurred a field, or attempted submission).
5. THE System SHALL prevent form submission while any validation error is present; THE Order_Manager and Inventory_Manager SHALL additionally validate all incoming payloads server-side and return HTTP 422 for invalid data, ensuring invalid data cannot be persisted even if client-side prevention fails.

---

### Requirement 16: Dark Mode

**User Story:** As an Admin, I want to toggle between light and dark themes, so that I can use the application comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE System SHALL provide a dark mode toggle accessible from the top navigation bar.
2. WHEN the Admin activates dark mode, THE System SHALL apply a dark colour scheme to all pages and components.
3. THE System SHALL persist the Admin's theme preference to `localStorage` and restore it on the next page load; WHEN no preference has been previously stored, THE System SHALL detect the operating system's theme preference via the `prefers-color-scheme` media query and apply it as the default.

---

### Requirement 17: Responsive Design

**User Story:** As an Admin, I want the application to be usable on mobile and tablet devices, so that I can manage orders from any device.

#### Acceptance Criteria

1. THE System SHALL render a fully functional layout on viewport widths from 375px to 1920px.
2. WHEN the viewport width is less than 768px, THE System SHALL collapse the sidebar into a hamburger-menu-triggered drawer.
3. THE System SHALL not require horizontal scrolling on any page at viewport widths of 375px or wider.

---

### Requirement 18: Loading States and Toast Notifications

**User Story:** As an Admin, I want visual feedback during async operations, so that I know when the system is processing a request.

#### Acceptance Criteria

1. WHILE an API request is in flight, THE System SHALL display a loading indicator on the initiating button or the affected UI region.
2. WHEN an API request completes successfully, THE System SHALL display a success toast notification with a descriptive message.
3. WHEN an API request fails, THE System SHALL display an error toast notification with the error message returned by the API.
4. THE System SHALL automatically dismiss toast notifications after 5 seconds.

---

### Requirement 19: Settings Page

**User Story:** As an Admin, I want a settings page where I can update the Admin account credentials, so that I can maintain account security.

#### Acceptance Criteria

1. THE System SHALL render a Settings page accessible from the sidebar navigation.
2. WHEN the Admin submits a password change form with the current password and a new password, THE Auth_Service SHALL first validate that the new password is at least 8 characters; WHEN the length check passes, THE Auth_Service SHALL validate the current password, hash the new password using bcrypt, and persist it.
3. IF the current password provided is incorrect, THEN THE Auth_Service SHALL return HTTP 400 with a descriptive error message.

---

### Requirement 20: Database Backup and Restore

**User Story:** As an Admin, I want to back up and restore the database, so that business data is protected against accidental loss.

#### Acceptance Criteria

1. THE System SHALL provide a "Backup Database" action on the Settings page that exports all Orders and Inventory_Items as a JSON file and triggers a browser download.
2. WHEN the Admin uploads a valid backup JSON file, THE System SHALL restore all Orders and Inventory_Items from the file, replacing existing records only where `sequenceNo` or document `_id` matches.
3. IF the uploaded file is not valid JSON or does not conform to the backup schema, THEN THE System SHALL display an error toast notification and SHALL NOT modify the database.

---

### Requirement 21: Role-Based Authentication (Extensible)

**User Story:** As an Admin, I want the authentication system to be designed for future staff roles, so that additional users with limited permissions can be added without a full rewrite.

#### Acceptance Criteria

1. THE Auth_Service SHALL store a `role` field on every user document, with the initial Admin account assigned the role `admin`.
2. THE Auth_Service SHALL include the `role` claim in every issued JWT.
3. THE System SHALL enforce route-level permission checks using the `role` claim so that future roles with restricted permissions can be added by extending the permission configuration without modifying individual route handlers.

---

### Requirement 22: Image Upload for Order Reference

**User Story:** As an Admin, I want to upload a reference image when creating or editing an order, so that I can attach visual context to an order.

#### Acceptance Criteria

1. WHEN the Admin selects an image file on the Order form, THE System SHALL display a preview of the selected image before submission.
2. THE Validator SHALL enforce that uploaded image files are of type `image/jpeg`, `image/png`, or `image/webp` and do not exceed 5 MB.
3. WHEN the Admin submits the Order form with a valid image, THE Order_Manager SHALL upload the image to Cloudinary and persist the returned secure URL in the Order record.
4. IF the Cloudinary upload fails, THEN THE Order_Manager SHALL return HTTP 502 with a descriptive error message and SHALL NOT persist the Order; WHEN the Cloudinary upload succeeds, THE Order_Manager SHALL proceed normally and persist the Order.
5. WHERE an Order has an associated image URL, THE System SHALL display the image on the Order detail page.
