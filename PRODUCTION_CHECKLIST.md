# PRODUCTION_CHECKLIST.md
# Formium Projects — Production Deployment Checklist

Complete every item before going live. Items marked ⚠️ are critical.

---

## Phase 1 — Supabase Setup

- [ ] ⚠️  Create Supabase project (ap-south-1 / Mumbai region recommended for India)
- [ ] ⚠️  Note the Project URL, anon key, and service role key
- [ ] ⚠️  In Supabase → Settings → Database, copy the Transaction pooler URL (port 6543) → `DATABASE_URL`
- [ ] ⚠️  Copy the Direct connection URL (port 5432) → `DIRECT_URL`
- [ ] ⚠️  Go to Storage → Create bucket named `formium-files`
- [ ] ⚠️  Set bucket to **Private** (not public)
- [ ] Create folders inside bucket: `projects/`
- [ ] (Recommended) Enable Row Level Security on all tables after migration

---

## Phase 2 — Hostinger Setup

- [ ] ⚠️  Ensure Node.js 20.x is selected in Hostinger hPanel
- [ ] SSH access confirmed working
- [ ] Domain DNS pointed to Hostinger server
- [ ] SSL certificate active (Let's Encrypt or Hostinger SSL)
- [ ] Upload project files via SFTP or Git

---

## Phase 3 — Environment Variables

Copy `.env.example` to `.env` and fill every value:

- [ ] ⚠️  `DATABASE_URL` — Supabase transaction pooler (port 6543)
- [ ] ⚠️  `DIRECT_URL` — Supabase direct connection (port 5432)
- [ ] ⚠️  `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- [ ] ⚠️  `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon/public key
- [ ] ⚠️  `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (never expose to client)
- [ ] ⚠️  `NEXTAUTH_URL` — Full domain URL (e.g. `https://projects.formiumalliance.com`)
- [ ] ⚠️  `NEXTAUTH_SECRET` — Generate with: `openssl rand -base64 32` (min 32 chars)
- [ ] ⚠️  `SMTP_HOST` — Hostinger SMTP: `smtp.hostinger.com`
- [ ] ⚠️  `SMTP_PORT` — `465`
- [ ] ⚠️  `SMTP_USER` — Your Hostinger email (e.g. `noreply@formiumalliance.com`)
- [ ] ⚠️  `SMTP_PASS` — Hostinger email password
- [ ] ⚠️  `EMAIL_FROM` — e.g. `Formium Projects <noreply@formiumalliance.com>`
- [ ] ⚠️  `NEXT_PUBLIC_APP_URL` — Same as NEXTAUTH_URL
- [ ] `STORAGE_BUCKET` — Default: `formium-files`
- [ ] `MAX_FILE_SIZE_MB` — Default: `50`
- [ ] `ENCRYPTION_KEY` — Generate with: `openssl rand -hex 32` (for future credential encryption)

---

## Phase 4 — Database Setup

```bash
# Generate Prisma client from schema
npm run db:generate

# Push schema to Supabase (creates all tables)
npm run db:push

# Seed with demo data and initial admin user
npm run db:seed
```

Verify after seeding:
- [ ] 6 users created (run `npm run db:studio` to check)
- [ ] Demo project "Sunrise Interiors" exists
- [ ] All 17+ tables visible in Supabase dashboard

---

## Phase 5 — Build & Deploy

```bash
npm install
npm run build
```

- [ ] Build completes with 0 errors
- [ ] `.next/standalone` directory created
- [ ] Start with PM2: `pm2 start ecosystem.config.js`
- [ ] PM2 auto-start: `pm2 save && pm2 startup` (follow printed command)

---

## Phase 6 — Post-Deploy Verification

### Health Check
- [ ] `curl https://your-domain.com/api/health` returns `{"status":"ok"}`
- [ ] Database: `"ok"` in health check
- [ ] Supabase: `"ok"` in health check

### Auth Flow
- [ ] Login page loads at `/login`
- [ ] Super admin can log in: `admin@formiumalliance.com` / `Formium@Admin2024!`
- [ ] **Immediately change all demo passwords** after first login
- [ ] Role-based redirect works (admin → `/super-admin`)
- [ ] Logout works

### Portals
- [ ] `/super-admin` loads correctly for admin
- [ ] `/pm` loads correctly for PM user
- [ ] `/client` loads correctly for client user
- [ ] `/dev` loads correctly for developer user

### Notifications & Email
- [ ] Create a test project and verify welcome email is sent
- [ ] Publish an update and verify client notification email

### File Upload
- [ ] Upload a test file in client portal → Files
- [ ] File appears in list and can be downloaded
- [ ] File visible in Supabase Storage dashboard

### 3D Growth Tree
- [ ] Client dashboard loads with 3D tree visible
- [ ] Tree responds correctly to project progress
- [ ] Mobile view works correctly

---

## Phase 7 — Security Hardening

- [ ] ⚠️  **Change all demo passwords** (6 accounts seeded)
- [ ] ⚠️  Delete or deactivate the demo client account (`client@example.com`) if not needed
- [ ] Verify `NEXTAUTH_SECRET` is ≥32 characters and unique
- [ ] Verify `SUPABASE_SERVICE_ROLE_KEY` is not exposed in any client-side code
- [ ] Review Supabase Storage bucket — confirm it's Private
- [ ] Set up Hostinger firewall: allow only ports 80, 443, 22
- [ ] Enable Supabase database backups (Supabase dashboard → Settings → Backups)

---

## Phase 8 — Cron Jobs

Set up automated health checks and archiving:

```bash
# Edit crontab
crontab -e

# Add:
# Health check + archive check every 15 minutes
*/15 * * * * cd /path/to/app && npx ts-node --project tsconfig.json scripts/cron.ts >> logs/cron.log 2>&1
```

- [ ] Cron job added to crontab
- [ ] `logs/` directory created: `mkdir -p logs`
- [ ] Verify cron runs: check `logs/cron.log` after 15 minutes

---

## Phase 9 — Monitoring

- [ ] PM2 logs accessible: `pm2 logs formium-projects`
- [ ] Error log monitoring set up (optional: Sentry, Logtail, or Hostinger logs)
- [ ] Set up uptime monitoring (optional: UptimeRobot, Better Uptime) on `/api/health`
- [ ] Supabase dashboard → Usage — verify within free/paid tier limits

---

## Phase 10 — Go-Live

- [ ] All items above checked
- [ ] Inform team of portal URLs and credentials
- [ ] Create first real project in Super Admin → Projects → New
- [ ] Test full workflow: BGM creates proposal → PM activates → Developer updates task → Client views update
- [ ] **Remove or archive the seed demo project** once real data is set up

---

## Quick Reference: Default URLs

| Portal | URL | First Login |
|--------|-----|-------------|
| Super Admin | /super-admin | admin@formiumalliance.com |
| Project Head | /project-head | head@formiumalliance.com |
| Project Manager | /pm | pm@formiumalliance.com |
| Developer | /dev | dev@formiumalliance.com |
| BGM | /bgm | bgm@formiumalliance.com |
| Client | /client | client@example.com |

**⚠️  Change all passwords immediately after first login.**

---

## Rollback Plan

If deployment fails:
```bash
pm2 stop formium-projects
# Restore previous build from backup
pm2 start ecosystem.config.js
```

---

*Generated for Formium Projects v1.0.0 — Formium Alliance LLP*
