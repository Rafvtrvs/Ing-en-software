import 'dotenv/config'

function get(name: string, fallback = ''): string {
  return process.env[name] ?? fallback
}

export const env = {
  port: Number(get('PORT', '4000')),
  databaseUrl: get('DATABASE_URL'),
  corsOrigin: get('CORS_ORIGIN', 'http://localhost:5173'),
  auth: {
    provider: get('AUTH_PROVIDER', 'local') as 'local' | 'firebase',
    jwtSecret: get('JWT_SECRET', 'dev-secret'),
    jwtExpiresIn: get('JWT_EXPIRES_IN', '8h'),
  },
  external: {
    storageProvider: get('STORAGE_PROVIDER', 'mock'),
    mailProvider: get('MAIL_PROVIDER', 'mock'),
    pushProvider: get('PUSH_PROVIDER', 'mock'),
    storageLocalDir: get('STORAGE_LOCAL_DIR', './.storage'),
  },
}
