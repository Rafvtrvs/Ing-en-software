import 'dotenv/config'

function get(name: string, fallback = ''): string {
  return process.env[name] ?? fallback
}

const nodeEnv = get('NODE_ENV', 'development')
const jwtSecret = get('JWT_SECRET', 'dev-secret')
const weakSecrets = new Set(['', 'dev-secret', 'cambia-este-secreto-en-produccion'])

if (nodeEnv === 'production' && weakSecrets.has(jwtSecret)) {
  throw new Error(
    'JWT_SECRET inseguro o ausente: en producción definí un secreto largo y aleatorio.',
  )
}

if (nodeEnv === 'production' && !get('DATABASE_URL')) {
  throw new Error('DATABASE_URL es obligatoria en producción.')
}

export const env = {
  nodeEnv,
  port: Number(get('PORT', '4000')),
  databaseUrl: get('DATABASE_URL'),
  corsOrigin: get('CORS_ORIGIN', 'http://localhost:5173'),
  auth: {
    provider: get('AUTH_PROVIDER', 'local') as 'local' | 'firebase',
    jwtSecret,
    jwtExpiresIn: get('JWT_EXPIRES_IN', '8h'),
  },
  external: {
    storageProvider: get('STORAGE_PROVIDER', 'mock'),
    mailProvider: get('MAIL_PROVIDER', 'mock'),
    pushProvider: get('PUSH_PROVIDER', 'mock'),
    storageLocalDir: get('STORAGE_LOCAL_DIR', './.storage'),
  },
}

// Eager init when firebase/fcm requested
if (env.auth.provider === 'firebase' || env.external.pushProvider === 'fcm') {
  void import('../external/firebaseAdmin.js')
    .then((m) => m.initFirebaseAdmin())
    .catch((err) => console.error('[firebase-admin] init', err))
}
