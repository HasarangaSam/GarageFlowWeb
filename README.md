# GarageFlow

GarageFlow is a web application for running an automotive repair workshop in one place. It helps a garage team register customers and vehicles, manage repair work, control spare-parts stock, create invoices, record payments, and keep staff aware of important activity as it happens.

The project is designed around the day-to-day journey of a vehicle through a garage—from check-in to paid delivery—while protecting the important business records created along the way.

## What it helps a garage manage

- **Customers and vehicles** — Keep customer details, contact information, notes, and multiple vehicles under the right owner. Vehicle registration numbers are unique.
- **Repair jobs** — Create clear job cards with customer, vehicle, complaint, priority, assigned mechanic, mileage, diagnosis, notes, and progress status.
- **Mechanic work** — Give mechanics a focused view of their assigned work. They can update their diagnosis, job notes, mileage, and permitted operational statuses without gaining access to management-only records.
- **Parts and inventory** — Maintain a parts catalogue with SKU, costs, selling prices, stock on hand, and minimum-stock level. View stock movements and inventory value.
- **Invoices and payments** — Turn completed work into an itemised invoice, add labour charges, apply discount and tax, issue the invoice, and accept one or more payments.
- **Dashboard and alerts** — See active work, completed jobs, recent payments, outstanding balances, mechanic workload, and parts that need attention.
- **Notifications** — Notify the right staff when work is assigned or completed, when stock is low, and when a payment is received.
- **GarageFlow AI** — Ask read-only questions about current workshop data, such as active jobs, low-stock items, vehicle history, and mechanic workload. Financial answers remain restricted to management roles.

## How the business workflow works

1. A customer and their vehicle are registered.
2. A manager or owner opens a repair job and may assign it to a mechanic.
3. The mechanic records findings, updates progress, and allocates required parts.
4. Once work is completed, the front office can mark it ready for pickup and create an invoice.
5. The invoice is issued and payments are recorded until the balance is settled.
6. A vehicle can only be marked as delivered once its linked invoice exists and is fully paid.

### Repair job statuses

Jobs follow a controlled progression:

`RECEIVED → IN_PROGRESS ↔ WAITING_FOR_PARTS → COMPLETED → READY_FOR_PICKUP → DELIVERED`

This keeps the workshop queue understandable. Mechanics can work with the operational statuses (`IN_PROGRESS`, `WAITING_FOR_PARTS`, and `COMPLETED`), while the front office handles pickup and delivery.

### Roles and access

| Role | Main responsibility |
| --- | --- |
| **Owner** | Full control, including staff administration, deletion rights, finances, and operational records. |
| **Manager** | Runs workshop operations: customers, vehicles, jobs, stock, invoices, payments, and notifications. |
| **Mechanic** | Works on assigned jobs, uses parts for those jobs, updates operational details, and uses the AI assistant within role limits. |

Access is applied in both the application interface and the API, so a user cannot simply bypass the screen-level restrictions.

## Important business rules

### Inventory and parts

- Parts have a unique SKU, current quantity, minimum-stock threshold, cost price, and selling price.
- Adding a part to a job checks available stock first. Stock cannot become negative.
- Allocating a part reduces stock and preserves the selling price used at that moment, so a later catalogue price change does not alter the job’s charge.
- Removing a part from a job restores stock.
- Every stock change is recorded as a transaction: purchase, job usage, adjustment, return, or damage.
- Low-stock items automatically create notifications for owners and managers.
- A part already used in a repair job cannot be deleted, which protects historical job and invoice records.

### Invoices and payments

- One repair job can have one invoice.
- An invoice can only be created after a job is completed or ready for pickup.
- Parts used on the job are carried into the invoice automatically; labour items can be added separately.
- Totals use exact two-decimal database values for subtotal, discount, tax, and final total—appropriate for currency handling.
- Invoice status moves through `DRAFT`, `ISSUED`, `PARTIALLY_PAID`, `PAID`, or `VOID`.
- A draft can be edited or deleted. Once issued, its financial values are locked; once payments exist, it cannot be modified.
- Payments can be split across methods: cash, card, bank transfer, or other. The invoice status updates automatically based on the remaining balance.
- Payments cannot exceed the amount still owed. Only an owner can remove a recorded payment.

### Data integrity and transactions

GarageFlow groups related actions into database transactions where they must succeed or fail together. For example, when a part is allocated to a job, the system updates stock, creates the job-part record, and writes the inventory audit entry as one unit of work. The same approach is used for invoice creation and payment reconciliation. This avoids half-finished financial or inventory records if an operation fails.

## Technology stack

| Area | Technology |
| --- | --- |
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| UI behaviour | React Router, TanStack React Query, Zustand, React Hook Form, Zod |
| Backend | Node.js, TypeScript, Express |
| Database | PostgreSQL with Prisma ORM |
| Live updates | Socket.IO |
| Authentication | JWT access tokens, refresh tokens, bcrypt password hashing |
| Cache and rate limiting | Upstash Redis |
| AI assistant | Google Gemini with read-only business-data tools |
| Testing | Vitest |
| Delivery | Docker, GitHub Actions, Render configuration, Vercel configuration |

## Project structure

```text
GarageFlow/
├── client/                 # React web application
│   └── src/
│       ├── pages/          # Dashboard, jobs, invoices, inventory, etc.
│       ├── components/     # Reusable forms, tables, modals, and UI
│       ├── services/       # API communication
│       └── hooks/          # Data, auth, and live-update hooks
├── server/                 # Express API
│   ├── prisma/             # PostgreSQL schema, migrations, and seed scripts
│   └── src/
│       ├── services/       # Business rules
│       ├── controllers/    # Request handling
│       ├── routes/         # API endpoints
│       ├── middleware/     # Authentication, roles, errors, rate limiting
│       └── socket/         # Real-time notifications
├── docker-compose.yml      # Backend container setup
└── render.yaml             # Render deployment configuration
```

## Run locally

### Prerequisites

- Node.js 20 or later
- PostgreSQL database
- npm

Upstash Redis and Gemini are optional for a basic local setup. Without them, caching/Redis-backed features and the AI assistant are unavailable, but the core application can still be configured around PostgreSQL.

### 1. Configure the server

Create `server/.env` with the following values:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/garageflow?schema=public"
ACCESS_TOKEN_SECRET="replace-with-a-long-random-secret"
REFRESH_TOKEN_SECRET="replace-with-a-long-random-secret"
CLIENT_URL="http://localhost:5173"

# Optional: Redis-backed cache, rate limits, and token blacklist
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

# Optional: GarageFlow AI assistant
GEMINI_API_KEY=""
```

Install dependencies, generate the Prisma client, and apply the database migrations:

```bash
cd server
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

The API starts at `http://localhost:5000`. Its health endpoint is available at `http://localhost:5000/api/health`.

### 2. Configure and start the client

In a second terminal, create `client/.env` if the default local API address needs to be changed:

```env
VITE_API_URL="http://localhost:5000/api"
VITE_SOCKET_URL="http://localhost:5000"
```

Then start the web app:

```bash
cd client
npm install
npm run dev
```

Open the address shown by Vite, normally `http://localhost:5173`.

## Useful commands

| Location | Command | Purpose |
| --- | --- | --- |
| `client` | `npm run dev` | Start the frontend in development mode. |
| `client` | `npm run build` | Type-check and build the frontend. |
| `client` | `npm test` | Run frontend tests. |
| `client` | `npm run lint` | Check frontend code style. |
| `server` | `npm run dev` | Start the API with file watching. |
| `server` | `npm run build` | Compile the server. |
| `server` | `npm test` | Run server tests. |
| `server` | `npm run prisma:migrate` | Create and apply a development migration. |

## Deployment notes

- The backend includes a Dockerfile and can be started through the root `docker-compose.yml` after `server/.env` is configured.
- `render.yaml` provides a Render service definition for the backend.
- `client/vercel.json` contains the Vercel configuration for the frontend.
- Set `CLIENT_URL` on the backend to the deployed frontend URL, and set `VITE_API_URL` and `VITE_SOCKET_URL` on the frontend to the deployed API URL.
- Use strong, unique production values for both token secrets and never commit `.env` files.

## API areas

The REST API is organised under `/api`:

- `/auth` — registration, login, refresh, logout, and current user
- `/customers` and `/vehicles` — customer and vehicle records
- `/jobs` — repair jobs, assignments, mechanic updates, and job parts
- `/parts` — parts catalogue, stock adjustments, and transaction history
- `/invoices` — invoice creation, status, summaries, and itemised detail
- `/invoices/:invoiceId/payments` — payment records and reconciliation
- `/dashboard` — operational summary
- `/notifications` — read and manage notifications
- `/users` — staff management
- `/ai` — the GarageFlow AI assistant

## Quality checks

GitHub Actions runs the client tests and build, server tests and build, and a Docker build on pushes and pull requests targeting `main` or `master`.

## License

No license has been specified for this repository.
