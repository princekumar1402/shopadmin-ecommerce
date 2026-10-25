# ShopAdmin — Multi-Vendor E-Commerce Marketplace

A full-stack e-commerce marketplace built with **Next.js**, **Core PHP**, and **MySQL**, featuring product discovery, shopping cart, checkout, vendor management, and an administrative dashboard.

**GitHub Repository:** [https://github.com/princekumar1402/shopadmin-ecommerce](https://github.com/princekumar1402/shopadmin-ecommerce)

---

## Features

### Customer Marketplace
- Browse products and categories.
- Search and filter products by keyword, category, price, and sorting.
- View detailed product pages with pricing, strike-through comparisons, images, and live inventory status.
- Add products to a persistent shopping cart stored in client storage.
- Update quantities with inventory threshold validation and remove items.
- Submit orders through a shipping and payment details checkout form.
- View instant order confirmation receipt upon successful checkout.

### Vendor Dashboard
- Real-time store performance metrics (Gross Volume, Catalog Size, Inventory Count, Order History).
- Dedicated product catalog management: create, edit, and adjust inventory.
- Soft-delete products to deactivate listings while preserving customer order history and relational integrity.
- Monitor customer orders containing vendor merchandise and update fulfillment stages.
- Server-side authorization verifying product and order ownership.

### Admin Dashboard
- System-wide marketplace overview: total users, vendor accounts, active products, global orders, and gross merchandise value (GMV).
- Search and oversee registered vendor stores.
- Approve or suspend merchant accounts with immediate database synchronization.
- Global product catalog management with search and filters by category, vendor, and active state.
- Deactivate or reactivate product listings platform-wide.
- Global order management with fulfillment status transitions (`pending`, `confirmed`, `shipped`, `delivered`, `cancelled`).
- Strict administrative permission enforcement (`requireAuth('admin')`).

---

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router), React, TypeScript |
| **Styling** | Vanilla CSS (Curated dark mode design system, tokens, glassmorphism) |
| **Backend** | Core PHP 8.2 (Modular REST APIs, Router) |
| **Database** | MySQL 8.0 (Relational schema, foreign keys, utf8mb4) |
| **Database Access** | PHP PDO (Prepared statements, parameterized queries) |
| **Authentication Foundation** | Stateless HMAC-SHA256 tokens & HttpOnly cookie support |
| **Infrastructure** | Docker, Docker Compose |
| **Testing** | Production builds, HTTP API tests, database verification |

---

## Architecture

```text
       Browser / Client
              │
              ▼
    Next.js Frontend (App Router / TypeScript)
              │
              │  HTTP / REST API (JSON)
              ▼
    Core PHP Backend (Modular REST API / Router)
              │
              │  PHP Data Objects (PDO)
              ▼
    MySQL Database (Engine: InnoDB, utf8mb4)
              │
              ▼
    Persistent Docker Volume (cretzo_mysql_data)
```

The Next.js frontend communicates with the PHP backend through REST endpoints. The backend handles database operations, order processing, inventory deduction, and server-side authorization checks.

---

## Getting Started

### Prerequisites
Ensure the following are installed on your machine:
- **Git**
- **Docker Desktop**
- **Node.js** (v18+ recommended) and **npm**
- A terminal such as **PowerShell** or **Bash**

---

### 1. Clone the repository
```bash
git clone https://github.com/princekumar1402/shopadmin-ecommerce.git
cd shopadmin-ecommerce
```

### 2. Configure environment variables
Create your local `.env` file from the provided example template:

```powershell
Copy-Item .env.example .env
```
*(On Linux/macOS, run `cp .env.example .env`)*

Inspect `.env` and set your preferred database credentials, database name, and JWT secret:
```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=cretzo_marketplace
DB_USER=cretzo_user
DB_PASS=your_secure_db_password
DB_ROOT_PASSWORD=your_secure_root_password
DB_CHARSET=utf8mb4

BACKEND_PORT=8080
JWT_SECRET=your_jwt_secret_key_here

FRONTEND_PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```
> **Security Note:** Never commit actual `.env` files or secrets to version control.

### 3. Start the backend and database
From the project root:
```bash
docker compose up -d --build
```

Verify that containers are healthy and running:
```bash
docker compose ps
```

Inspect logs if needed:
```bash
docker compose logs --tail=100
```

The database schema and seeds in `backend/database.sql` are automatically initialized on the first volume build.

### 4. Configure and start the frontend
Open a separate terminal window and install dependencies:
```bash
cd frontend
npm install
```

Create `frontend/.env.local` to point to the backend API:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

Start the Next.js development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Main Application Routes

| Route | Purpose |
| :--- | :--- |
| `/` | Marketplace homepage & product catalog |
| `/products/[id]` | Product details, stock availability & Add to Cart |
| `/cart` | Interactive shopping cart & order summary |
| `/checkout` | Shipping address entry & order submission |
| `/checkout/success` | Order confirmation receipt & summary |
| `/vendor` | Vendor dashboard & store KPIs |
| `/vendor/products` | Vendor product catalog management (Create/Edit/Delete) |
| `/vendor/orders` | Vendor customer orders & fulfillment tracking |
| `/admin` | System admin overview & platform GMV |
| `/admin/vendors` | Merchant accounts approval & suspension |
| `/admin/products` | Global product catalog oversight & archiving |
| `/admin/orders` | Platform-wide marketplace order management |

---

## API Overview

The backend exposes RESTful endpoints:

- **`/api/categories`**: Category listing and navigation.
- **`/api/products`**: Product catalog query, search, vendor filtering, creation, update, and soft-deletion.
- **`/api/orders`**: Order creation, inventory validation, buyer/vendor order fetching, and fulfillment status updates.
- **`/api/vendors`**: Public store profiles, vendor dashboard data, and administrative approval toggles.
- **`/api/auth`**: User registration, authentication, token issuance, and profile verification.
- **`/api/admin`**: High-level platform KPIs, recent transactions, and newly registered merchants.

All endpoints communicate via standard JSON payloads and HTTP status codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`).

---

## Database Design

The relational MySQL schema includes tables for:
- `users`: Buyers, vendors, and platform administrators.
- `vendors`: Merchant store profiles, logos, descriptions, and approval states.
- `categories`: Marketplace product hierarchy and iconography.
- `products`: Product listings, pricing, strike-through comparisons, stock inventory, and JSON image arrays.
- `orders`: Transaction headers, buyer references, shipping addresses, totals, and fulfillment states.
- `order_items`: Line-item snapshots capturing product ID, vendor ID, quantity, and purchase unit price.
- `reviews`: Customer ratings and feedback linked to products and verified buyers.

---

## Testing and Verification

The development process enforces rigorous verification:
- **Next.js Production Build:** Compiles all static and dynamic pages with 0 TypeScript errors (`npm run build`).
- **HTTP API Endpoint Tests:** Automated requests verifying status codes and response bodies.
- **Inventory & Transaction Tests:** Stock deduction upon order submission and validation against stockouts.
- **Cross-Vendor Isolation:** Strict checks verifying that vendors cannot inspect or alter other stores' listings or orders.
- **Admin Permission Checks:** Endpoints strictly reject unauthenticated (401) and vendor (403) access attempts.
- **Route Regression Checks:** Automated verification ensuring all customer, vendor, and admin pages return HTTP 200.

Run the frontend production build locally:
```bash
cd frontend
npm run build
```

---

## Security Notes
- `.env` and `frontend/.env.local` are excluded from version control via `.gitignore`.
- Password hashes use PHP's native `password_hash()` (Bcrypt with work factor 12).
- Sensitive tokens are verified on every protected request via stateless HMAC-SHA256 signatures.
- Authorization is enforced on the server for all vendor and administrative operations; client-supplied IDs and roles are never trusted.
- Production deployments should enforce HTTPS, secure cookie flags, and rotate secrets regularly.

---

## Future Improvements
- Complete dedicated customer, vendor, and administrator authentication UI pages (Login, Register, Password Reset).
- Role-aware client-side middleware for automated route guarding.
- Integrated payment gateways (e.g., Stripe, PayPal, Razorpay).
- Native file and image upload pipeline with S3 / CDN integration.
- Customer account order history and profile self-service portal.

---

## Author

**Prince Kumar**  
B.Tech Computer Science and Engineering  
**GitHub:** [https://github.com/princekumar1402](https://github.com/princekumar1402)

---

*ShopAdmin is a comprehensive full-stack multi-vendor e-commerce platform demonstrating modern React architecture, RESTful API design, database integrity, and role-based administrative workflows.*
