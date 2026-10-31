# Deploy híbrido — API + Postgres en la nube + Firebase Hosting (front)

Cumple **RNF-12** (cloud) y lo declarado de **Firebase**, sin reescribir Postgres/Express.

> Si **Railway** tiene signups desactivados, usá **Render** (abajo). Es el mismo esquema.

## Orden (importante)

1. Subir código a GitHub  
2. Nube: Postgres + API (Render o Railway)  
3. Anotar la URL pública de la API (`https://….onrender.com/api`)  
4. Build del front con esa URL  
5. Firebase Hosting: publicar `dist/`  
6. Poner `CORS_ORIGIN` = URL de Firebase Hosting  
7. Seed de usuarios en la API  

---

## A) Render — API + PostgreSQL (alternativa a Railway)

1. Entrá a https://render.com → Sign up con GitHub.  
2. **New → PostgreSQL** → creá una DB (plan free si está disponible). Copiá la **Internal/External Database URL**.  
3. **New → Web Service** → conectá el repo `Rafvtrvs/Ing-en-software`:
   - **Root Directory:** `camus LDA/server`  
   - **Runtime:** Docker  
   - **Dockerfile Path:** `./Dockerfile`  
4. Variables del Web Service:

| Variable | Valor |
|----------|--------|
| `DATABASE_URL` | External Database URL de Render Postgres |
| `JWT_SECRET` | secreto largo aleatorio |
| `NODE_ENV` | `production` |
| `PORT` | `4000` |
| `CORS_ORIGIN` | después la URL de Firebase; mientras tanto la URL temporal del propio servicio |
| `AUTH_PROVIDER` | `local` |
| `STORAGE_PROVIDER` | `mock` |
| `MAIL_PROVIDER` | `mock` |
| `PUSH_PROVIDER` | `mock` |

5. Deploy. La API queda en algo como: `https://camus-api.onrender.com/api`  
6. Seed: en Render → Shell del servicio (si está) o con un one-off:

```bash
npx tsx prisma/seed.ts
```

> Nota free: el servicio puede “dormirse” sin tráfico; el primer request tarda unos segundos.

### A-bis) Railway (si más adelante te habilitan cuenta)

Igual idea: Postgres + servicio Docker con root `camus LDA/server`.

---

## B) Build del frontend apuntando a la API

En la carpeta `camus LDA`, creá `.env.production`:

```env
VITE_API_URL=https://TU-SERVICIO.onrender.com/api
VITE_MAPBOX_TOKEN=pk.tu_token
```

Luego:

```bash
npm run build
```

Eso deja listo `dist/` con la URL de la API horneada.

---

## C) Firebase Hosting — frontend

1. https://console.firebase.google.com → crear proyecto (ej. `camus-lda`).  
2. En la carpeta `camus LDA`:

```bash
npm install -g firebase-tools
firebase login
copy .firebaserc.example .firebaserc
```

Editá `.firebaserc` con el **Project ID** real.

```bash
firebase use TU-PROJECT-ID
firebase deploy --only hosting
```

3. Firebase te da una URL tipo `https://TU-PROJECT.web.app`.  
4. Volvé a Render → API → `CORS_ORIGIN=https://TU-PROJECT.web.app` → Manual Deploy / restart.  

---

## Probar

1. Abrí la URL de Firebase.  
2. Login: `admin@camus.cl` / `admin123` (tras el seed).  
3. Si falla CORS o API, revisá `VITE_API_URL` (hay que **rebuild + redeploy** hosting si cambió) y `CORS_ORIGIN`.

---

## Qué queda para “Firebase completo” (después)

- Storage real (`STORAGE_PROVIDER=firebase`)  
- Auth Firebase (opcional; hoy JWT local sigue válido si el profesor acepta híbrido)  
- FCM / correo  
