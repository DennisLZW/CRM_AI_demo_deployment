## SmartCRM AI Demo

A CRM demo built with **Next.js App Router + Prisma + Postgres (Docker)**.
It is designed for small sales teams to manage customers, track follow-ups, generate AI suggestions, and send Gmail-based outreach in one workflow.

## What This Project Implements
- **Role-based access control (RBAC)**:
  - `admin` can view and manage all customers, activities, and email logs.
  - `staff` can only access customers and related records they own; unauthorized customer detail access returns `404`.
- **AI insight generation** (`POST /api/ai/insight`):
  - Analyzes customer profile + recent activities.
  - Returns structured progress analysis, risk/priority signals, and recommended next actions with suggested follow-up timing.
- **AI email drafting** (`POST /api/ai/email/draft`):
  - Generates plain-text follow-up emails from customer context and activity history.
  - Supports sales outreach scenarios and can be edited before sending.
- **Gmail send + traceability**:
  - Sends emails through Gmail OAuth.
  - Stores send records in `EmailLog` for both customer-level and global history views.

## Live Demo
- Production: https://crmaidemo.vercel.app

## Features
- **Customer management**: CRUD (including notes). Customers list links to customer details.
- **Activity timeline**: Add activities on the customer details page; view a global recent timeline.
- **Dashboard**: Key metrics, recent activities, and customers to follow up on. Cards link to the lists.
- **Dev data seeding**: Generate 50 customers + random activities.
- **Email assistant & logs**: Draft and send plain-text emails via Gmail OAuth, and view email logs.

## Getting Started

### Prerequisites
- Node.js / npm
- Docker Desktop (for local Postgres)

### 1) Start Postgres (Docker)

```bash
docker compose up -d db
```

Default port mapping: `localhost:5434 -> container:5432`

### 2) Configure environment variables

`.env` is included with defaults; locally you can use it directly:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5434/smartcrm?schema=public"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3) Install dependencies

```bash
npm install
```

### 4) Initialize the database (Prisma migrate)

```bash
npx prisma migrate dev
```

### 5) Start the dev server

```bash
npm run dev
```

Open `http://localhost:3000`

## Seed (Demo data)

Available only in development:

```bash
curl -X POST http://localhost:3000/api/dev/seed
```

Writes: **50 customers** + **random activity records**.

### Reset + Seed (with login accounts)

Resets demo data (clears `Customer` / `Activity` / `User`):

```bash
curl -X POST http://localhost:3000/api/dev/reset-seed
```

It creates 3 login accounts by default (same password):
- admin: `admin@demo.local` / `password123`
- staff: `staff1@demo.local` / `password123`
- staff: `staff2@demo.local` / `password123`

## AI & Gmail (OAuth)

### AI endpoints
- `POST /api/ai/insight`: Generate progress insight based on customer + recent activities
- `POST /api/ai/email/draft`: Generate a plain-text follow-up email draft

### Gmail OAuth (send plain text)

1) Configure `.env`:

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:3000/api/gmail/oauth/callback
GMAIL_SENDER_USER=your@gmail.com
GMAIL_SEND_AS=your@gmail.com

# AI (Gemini only)
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-flash-latest
```

2) Connect Gmail (stores the refresh token into `GmailAuth`):
- Open `/api/gmail/oauth/start`

3) Send email:
- `POST /api/email/send` (body: `customerId,toEmail,subject,bodyText`)

## Routes

### Pages
- `/dashboard`: Dashboard (cards + recent activities + follow-up)
- `/dashboard/new-customers`: New customers (last 7 days)
- `/dashboard/stale-customers`: Customers to follow up (14 days without contact)
- `/customers`: Customer list (CRUD) — click a customer to open details
- `/customers/[id]`: Customer details + activities (manual add)
- `/activities`: Global activities timeline (latest 50)
- `/emails`: Global email logs
- `/emails/[id]`: Email log detail + plain-text body

### APIs
- `GET/POST /api/customers`
- `GET/PATCH/DELETE /api/customers/[id]`
- `GET/POST /api/activities`
- `POST /api/email/send`
- `GET /api/email/logs`
- `POST /api/dev/seed` (development only)
- `POST /api/dev/reset-seed` (development only)

## Notes
- Prisma Client is generated via `prisma generate` (`postinstall` and `build` scripts).
- If you change `.env`, restart `npm run dev`.

## Next
Planned AI enhancements (based on activities/customer information):
- Auto-convert raw notes into structured activities
- Better AI insights and next-action generation
- Email assistant improvements (drafting, refining, and follow-up)
