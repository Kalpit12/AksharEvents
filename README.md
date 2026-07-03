# AxarEvents

**Discover. Book. Experience.**

Kenya's premier event discovery and booking platform for career fairs, university events, conferences, expos, and networking events across Africa.

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS v4**
- **Prisma ORM** + PostgreSQL
- **NextAuth v5** (RBAC authentication)
- **Stripe** (payments)
- **Cloudinary** (image uploads)
- **Resend** (email notifications)
- **React Hook Form** + Zod validation
- **TanStack Query** (client state)
- **Framer Motion** (animations)
- **Docker** (local PostgreSQL)

## Features

- Multi-role authentication (Attendee, Organizer, Admin)
- Event discovery with search, filters, and AI recommendations
- Ticket booking (Free, Paid, VIP, Group) with Stripe checkout
- QR code ticket generation and verification
- Organizer dashboard with analytics
- Admin dashboard with event approval
- Exhibitor and sponsor management
- Reviews with admin moderation
- Email notifications (welcome, tickets, reminders)
- SEO optimized (sitemap, robots.txt, structured data)
- Dark/light mode
- Mobile-first responsive design

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Start PostgreSQL (Docker)

```bash
npm run db:up
```

### 3. Configure environment

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL` — PostgreSQL connection string
- `AUTH_SECRET` — Generate with `openssl rand -base64 32`
- `AUTH_URL` — `http://localhost:5001` for local dev
- `NEXT_PUBLIC_APP_URL` — `http://localhost:5001`

Optional:
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`, `EMAIL_FROM`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

### 4. Set up database

```bash
npm run db:push
npm run db:seed
```

### 5. Run development server

```bash
npm run dev
```

Open [http://localhost:5001](http://localhost:5001)

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@axarevents.com | admin123 |
| Organizer | organizer@axarevents.com | password123 |
| Attendee | attendee@axarevents.com | password123 |

## Project Structure

```
src/
├── app/
│   ├── api/              # API routes (auth, search, stripe webhook)
│   ├── admin/            # Admin dashboard
│   ├── auth/             # Login & registration
│   ├── booking/          # Booking success page
│   ├── categories/       # Event categories
│   ├── dashboard/        # User dashboard
│   ├── events/           # Event listing & detail
│   ├── organizer/        # Organizer dashboard & QR scanner
│   ├── venues/           # Venue pages
│   └── ...               # Static pages (about, contact, faq, etc.)
├── components/
│   ├── booking/          # Booking form
│   ├── events/           # Event cards, filters, countdown
│   ├── home/             # Homepage sections
│   ├── layout/           # Header, footer, search
│   └── ui/               # Shadcn-style UI components
└── lib/
    ├── actions.ts        # Server actions
    ├── auth.ts           # NextAuth config
    ├── email.ts          # Resend email templates
    ├── events.ts         # Event queries & search
    ├── prisma.ts         # Database client
    ├── qr.ts             # QR code generation
    ├── stripe.ts         # Stripe integration
    └── validations.ts    # Zod schemas
prisma/
├── schema.prisma         # Full database schema
└── seed.ts               # Demo data
```

## Deployment (Vercel + PostgreSQL)

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial AxarEvents platform"
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. Deploy to Vercel

```bash
npx vercel
```

Or connect your GitHub repo at [vercel.com](https://vercel.com).

### 3. Set up PostgreSQL

Use [Vercel Postgres](https://vercel.com/storage/postgres), [Neon](https://neon.tech), or [Supabase](https://supabase.com).

Set `DATABASE_URL` in Vercel environment variables.

### 4. Configure environment variables

Add all variables from `.env.example` in the Vercel dashboard:
- `AUTH_SECRET`, `AUTH_URL`, `NEXT_PUBLIC_APP_URL`
- `STRIPE_*` keys
- `RESEND_API_KEY`
- `CLOUDINARY_*` keys

### 5. Run database migration

```bash
npx prisma db push
npx prisma db seed
```

Or add a build command: `prisma generate && prisma db push && next build`

### 6. Configure Stripe webhook

Point Stripe webhook to: `https://your-domain.com/api/webhooks/stripe`

Events: `checkout.session.completed`

## API Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET/POST | `/api/auth/[...nextauth]` | — | NextAuth handlers |
| GET | `/api/search?q=` | Public | Global search |
| POST | `/api/webhooks/stripe` | Stripe | Payment webhooks |

## License

Proprietary — AxarEvents © 2026
