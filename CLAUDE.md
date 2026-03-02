# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev           # Start dev server
npm run build         # Production build
npm run start         # Start production server
npm run lint          # ESLint

# Database
npm run prisma:generate   # Generate Prisma clients (public + tenant schemas)
npm run prisma:migrate    # Run migrations (dev only)
```

## Architecture Overview

FisioHub is a **multi-tenant SaaS** platform for physiotherapy clinic management. Each clinic is isolated in its own PostgreSQL schema.

### Multi-Tenancy Model

- **Public schema** (`generated/public`): Global data — `Clinic` registrations and `SuperAdmin` users.
- **Tenant schemas** (`generated/tenant`): Per-clinic data in `clinic_{slug}` PostgreSQL schemas — users, patients, appointments, sessions, anamnesis.
- **Tenant routing**: Subdomains map to clinic slugs (e.g., `clinicname.fisiohub.com.br`). Middleware extracts the slug from hostname and passes it via `x-tenant-slug` header.
- **Dynamic Prisma client**: `lib/prisma/tenant.ts` exports `getTenantPrisma(slug)` which instantiates a Prisma client pointing to the correct schema. Two separate Prisma schemas are maintained: `prisma/schema.prisma` (public) and `prisma/tenant-schema.prisma` (tenant), with outputs to `generated/public` and `generated/tenant`.

### App Router Structure

```
app/
├── (admin)/          # Super admin routes — requires SUPER_ADMIN role
├── (auth)/           # Public auth (login page)
├── (clinic)/         # Tenant-scoped clinic routes (dashboard, patients, appointments, sessions, physiotherapists)
└── api/              # Route handlers mirroring the clinic feature domains
```

### Authentication & Authorization

- **NextAuth v5** with JWT strategy and Credentials provider (email + password via bcryptjs).
- **Super admin login**: authenticates against `SuperAdmin` table in public schema.
- **Clinic user login**: requires `clinicSlug` + email + password against tenant schema `User` table.
- **JWT payload**: `{ id, role, clinicSlug }`.
- **Middleware** (`middleware.ts`): validates JWT, guards routes by role, and enforces that `clinicSlug` in the token matches the subdomain. `/admin` requires `SUPER_ADMIN`; clinic routes require a valid session with matching clinic slug.

### Key Roles & Enums

- **UserRole**: `ADMIN`, `PHYSIOTHERAPIST`, `RECEPTIONIST`, `SUPER_ADMIN`
- **AppointmentStatus**: `SCHEDULED`, `CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `NO_SHOW`
- **AppointmentType**: `INITIAL_EVALUATION`, `FOLLOW_UP`, `DISCHARGE`, `RETURN`
- **Plan**: `BASIC`, `PROFESSIONAL`, `ENTERPRISE`

### Key Utilities

- `lib/utils.ts`: `cn()` (Tailwind class merge), Brazilian formatters (`formatCPF`, `formatPhone`), `formatDate`/`formatDateTime`/`formatTime` (Portuguese locale via date-fns), `slugify()`, `getInitials()`.
- `hooks/use-tenant.ts`: returns current clinic slug from session.
- `hooks/use-current-user.ts`: returns current user and auth state.

### UI Stack

- **shadcn/ui** (new-york style) with Radix UI primitives and Lucide icons.
- **Tailwind CSS v4** with PostCSS.
- **React Hook Form + Zod** for form validation.
- **TanStack Query v5** for server state.
- **Sonner** for toast notifications.
- **next-themes** for dark/light mode.

### Path Aliases

Configured in `tsconfig.json` and `components.json`:
- `@/components`, `@/lib`, `@/hooks`, `@/ui`, `@/utils`, `@/types`

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (public schema)
- `NEXTAUTH_SECRET` — NextAuth JWT secret
- `NODE_ENV` — `development` or `production`

## Important Notes

- **Tenant client caching**: In development, tenant Prisma clients are cached. In production, fresh clients are created per request.
- **New tenant provisioning**: `lib/prisma/provision.ts` exports `provisionTenant(slug)` to create the schema and run migrations for a new clinic.
- **Date formatting**: Always use the helpers from `lib/utils.ts` which use `pt-BR` locale.
- **Brazilian-specific fields**: CPF (formatted), phone numbers, and health insurance data are common on patient records.
