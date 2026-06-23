// lib/env.ts
// Environment variable validation — imported at app startup
// Throws on missing required vars so deployment fails loudly, not silently.

const required = [
  'DATABASE_URL',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SMTP_HOST',
  'SMTP_USER',
  'SMTP_PASS',
  'EMAIL_FROM',
  'NEXT_PUBLIC_APP_URL',
] as const

const optional = [
  'STORAGE_BUCKET',
  'MAX_FILE_SIZE_MB',
  'ENCRYPTION_KEY',
  'PUSHER_APP_ID',
  'PUSHER_KEY',
  'PUSHER_SECRET',
  'PUSHER_CLUSTER',
] as const

type RequiredEnv = typeof required[number]
type OptionalEnv = typeof optional[number]

export type Env = {
  [K in RequiredEnv]: string
} & {
  [K in OptionalEnv]?: string
} & {
  NODE_ENV: 'development' | 'production' | 'test'
  STORAGE_BUCKET: string
  MAX_FILE_SIZE_MB: number
}

function validateEnv(): Env {
  // Skip validation in test environments
  if (process.env.NODE_ENV === 'test') {
    return process.env as unknown as Env
  }

  const missing: string[] = []

  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key)
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `[Formium Projects] Missing required environment variables:\n${missing.map(k => `  - ${k}`).join('\n')}\n\nSee .env.example for setup instructions.`
    )
  }

  // Validate formats
  const appUrl = process.env.NEXTAUTH_URL
  if (appUrl && !appUrl.startsWith('http')) {
    throw new Error('[Formium Projects] NEXTAUTH_URL must start with http:// or https://')
  }

  const secret = process.env.NEXTAUTH_SECRET
  if (secret && secret.length < 32) {
    console.warn('[Formium Projects] NEXTAUTH_SECRET should be at least 32 characters for security')
  }

  return {
    ...process.env,
    STORAGE_BUCKET: process.env.STORAGE_BUCKET || 'formium-files',
    MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB || '50'),
    NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
  } as Env
}

// Validate once at module load — will throw if invalid during build/startup
let env: Env

try {
  env = validateEnv()
} catch (error) {
  if (process.env.NODE_ENV === 'production') {
    throw error // Hard fail in production
  }
  console.error(error)
  env = process.env as unknown as Env // Allow dev to continue with warnings
}

export { env }
export default env
