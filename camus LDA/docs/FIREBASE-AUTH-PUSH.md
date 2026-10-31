# Firebase Auth + FCM (Camus LDA)

Proyecto Firebase: **camuslda** · Hosting: https://camuslda.web.app

## 1. Consola — Authentication

1. [Firebase Console → Authentication](https://console.firebase.google.com/project/camuslda/authentication)
2. Get started → **Sign-in method** → **Email/Password** → Enable → Save
3. **Templates**:
   - Password reset → Action URL: `https://camuslda.web.app/restablecer-contrasena` (también vale `/reset-password`)
   - Email address verification → Action URL: `https://camuslda.web.app`
4. **Users** → Add user:
   - `admin@camus.cl` / clave ≥ 8
   - `operador@camus.cl` / clave ≥ 8
5. El API vincula `firebase_uid` en Postgres en el **primer login** (por email).

## 2. Consola — Cloud Messaging (Web)

1. Project settings → **Cloud Messaging**
2. Web Push certificates → Generate key pair → **VAPID key** → `VITE_FIREBASE_VAPID_KEY`
3. Project settings → **General** → Web app → `apiKey`, `authDomain`, `projectId`, `messagingSenderId`, `appId`

## 3. Service account (API / Render)

1. Project settings → **Service accounts** → Generate new private key
2. En Render: `FIREBASE_SERVICE_ACCOUNT_JSON` = JSON completo (una línea)
3. Local: `GOOGLE_APPLICATION_CREDENTIALS` → ruta al JSON

Nunca subas el JSON al repo.

## 4. Variables

### Frontend (`.env` / `.env.production` → luego `npm run build` + Hosting)

```
VITE_API_URL=https://ing-en-software-1.onrender.com/api
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=camuslda.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=camuslda
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_VAPID_KEY=
```

### Backend (Render / `server/.env`)

```
AUTH_PROVIDER=firebase
PUSH_PROVIDER=fcm
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
JWT_SECRET=<secreto-largo>
CORS_ORIGIN=https://camuslda.web.app
```

Con `AUTH_PROVIDER=local` el login sigue siendo email/password + JWT (Docker/dev sin Firebase).

Tras cambiar env en Render: **redeploy** del servicio API. Tras cambiar `VITE_*`: **rebuild** del front y `firebase deploy --only hosting`.

## 5. Checklist end-to-end

- [ ] Email/Password activo + usuarios seed en Firebase
- [ ] Plantillas con Action URL a Hosting
- [ ] Service account en Render + `AUTH_PROVIDER=firebase` + `PUSH_PROVIDER=fcm`
- [ ] Front build con todas las `VITE_FIREBASE_*` + VAPID
- [ ] Login admin y operador en https://camuslda.web.app
- [ ] Forgot → correo Firebase → nueva clave en `/restablecer-contrasena?mode=resetPassword&oobCode=…`
- [ ] Admin acepta notificaciones; `POST /auth/devices` 200
- [ ] Login de otro usuario → push al admin (“Inicio de sesión”)
- [ ] Cambio de estado de OT → push (“OT … → …”)
- [ ] Chrome móvil / PWA; iOS solo si “Añadir a pantalla de inicio”

## 6. Notas

- Campanita in-app sigue local; FCM es el canal al celular/navegador del admin.
- 2FA en Configuración sigue cosmético.
- Tabla `dispositivo_push` (Prisma `DispositivoPush`).
