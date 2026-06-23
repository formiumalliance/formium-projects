# Formium Projects — Deployment Guide
## Hostinger Business Plan (Node.js)

---

## Prerequisites

- Hostinger Business Plan with Node.js support
- Supabase project (free tier works)
- Domain configured on Hostinger

---

## Step 1: Set Up Supabase

1. Go to https://supabase.com → New project
2. Choose region: **ap-south-1 (Mumbai)** for best performance in India
3. Save your password
4. Go to **Settings → Database**
5. Copy the **Transaction pooler** connection string → this is your `DATABASE_URL`
6. Copy the **Session pooler** or **Direct** connection string → this is your `DIRECT_URL`
7. Go to **Settings → API** → copy `URL` and `anon public` key and `service_role` key

---

## Step 2: Configure Supabase Storage

1. Go to **Storage** in Supabase
2. Create a new bucket called `formium-files`
3. Set bucket to **Private**
4. Create the following folders inside: `requirements`, `designs`, `assets`, `deliverables`

---

## Step 3: Hostinger Setup

### SSH into your Hostinger server:
```bash
ssh your-user@your-server-ip
```

### Install Node.js 20 (if not available via Hostinger panel):
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Clone/upload your project:
```bash
cd /home/your-user/
git clone https://github.com/your-repo/formium-projects.git
# OR upload via SFTP/FileManager
cd formium-projects
```

---

## Step 4: Configure Environment Variables

```bash
cp .env.example .env
nano .env
```

Fill in all values:
- `DATABASE_URL` — from Supabase (transaction pooler, port 6543)
- `DIRECT_URL` — from Supabase (direct, port 5432)
- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key
- `NEXTAUTH_SECRET` — run `openssl rand -base64 32` to generate
- `NEXTAUTH_URL` — your full domain, e.g. `https://projects.formiumalliance.com`
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` — Hostinger email credentials
- `EMAIL_FROM` — e.g. `Formium Projects <noreply@formiumalliance.com>`

---

## Step 5: Install Dependencies

```bash
npm install
```

---

## Step 6: Set Up Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to Supabase (first time)
npm run db:push

# OR run migrations
npm run db:migrate

# Seed the database with demo data and admin user
npm run db:seed
```

---

## Step 7: Build the Application

```bash
npm run build
```

This creates a `.next/standalone` directory optimised for Node.js production.

---

## Step 8: Start with PM2

```bash
# Install PM2 globally
npm install -g pm2

# Create logs directory
mkdir -p logs

# Start the app
pm2 start ecosystem.config.js

# Save PM2 config (auto-start on reboot)
pm2 save
pm2 startup
# Follow the printed command to enable auto-start
```

---

## Step 9: Configure Hostinger Reverse Proxy

In your Hostinger hPanel:
1. Go to **Websites → your domain → Node.js**
2. Set **Application root**: `/home/your-user/formium-projects`
3. Set **Application startup file**: `node_modules/next/dist/bin/next`
4. Set **Node.js version**: 20.x

OR configure Nginx proxy (if using VPS):

```nginx
server {
    listen 80;
    server_name projects.formiumalliance.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name projects.formiumalliance.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Step 10: Set Up Cron Job (Optional)

For automated health checks, add to your crontab (`crontab -e`):
```cron
# Run health checks every 15 minutes
*/15 * * * * cd /home/your-user/formium-projects && npx ts-node --project tsconfig.json scripts/cron.ts >> logs/cron.log 2>&1
```

---

## Post-Deployment Checklist

- [ ] App loads at your domain
- [ ] Login works with `admin@formiumalliance.com`
- [ ] Change the super admin password immediately
- [ ] Email sending works (test via create user)
- [ ] File uploads work (test via client portal)
- [ ] Set up Supabase row-level security policies
- [ ] Configure backups in Supabase

---

## Default Login Credentials (Change Immediately!)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@formiumalliance.com | Formium@Admin2024! |
| Project Head | head@formiumalliance.com | Formium@Head2024! |
| Project Manager | pm@formiumalliance.com | Formium@PM2024! |
| Developer | dev@formiumalliance.com | Formium@Dev2024! |
| BGM | bgm@formiumalliance.com | Formium@BGM2024! |
| Client (demo) | client@example.com | Formium@Client2024! |

---

## Updating the Application

```bash
cd /home/your-user/formium-projects
git pull origin main
npm install
npm run build
npm run db:migrate
pm2 restart formium-projects
```

---

## Troubleshooting

**App not starting:**
```bash
pm2 logs formium-projects
```

**Database connection errors:**
- Ensure `DATABASE_URL` uses the pooler connection (port 6543)
- Ensure `DIRECT_URL` uses direct connection (port 5432)
- Check Supabase project is not paused (free tier pauses after 1 week of inactivity)

**Email not sending:**
- Test SMTP with Hostinger webmail first
- Ensure port 465 (SSL) or 587 (TLS) is open

**Build errors:**
```bash
rm -rf .next node_modules
npm install
npm run build
```

---

## Architecture Summary

```
formium-projects/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Login, forgot password
│   ├── (dashboard)/       # All portal pages
│   │   ├── super-admin/   # Super Admin portal
│   │   ├── project-head/  # Project Head portal
│   │   ├── pm/            # PM portal
│   │   ├── bgm/           # BGM portal
│   │   ├── dev/           # Developer portal
│   │   └── client/        # Client portal
│   └── api/               # API routes
├── components/            # React components
│   ├── growth-tree/       # 3D Three.js tree
│   ├── layout/            # Sidebar, header
│   ├── notifications/     # Notifications dropdown
│   └── projects/          # Badges, status components
├── lib/
│   ├── auth/              # NextAuth config + permissions
│   ├── db/                # Prisma client
│   ├── email/             # Nodemailer templates
│   ├── notifications/     # Notification service
│   ├── templates/         # Template engine
│   └── utils/             # Health check, handover, formatting
├── prisma/
│   ├── schema.prisma      # Full DB schema (17 models)
│   └── seed.ts            # Demo data seeder
└── types/                 # TypeScript types
```

---

*Built by Formium Alliance LLP — Internal Platform*
