# Despliegue en Railway

ResiITO se despliega como **un proyecto de Railway con tres servicios**:

| Servicio   | Qué es                                   | Carpeta     |
|------------|------------------------------------------|-------------|
| `Postgres` | Base de datos PostgreSQL administrada    | —           |
| `backend`  | API Express + volumen para los PDF       | `/backend`  |
| `frontend` | React compilado, servido como sitio SPA  | `/frontend` |

Cada servicio tiene su `railway.json`:

- `backend/railway.json`: antes de cada despliegue corre `npm run migrar` (si una migración falla, el despliegue se cancela y la versión anterior sigue en línea). Revisa `/api/health` para saber si arrancó bien.
- `frontend/railway.json`: compila con `npm run build` y sirve `dist/` con `serve -s` (todas las rutas regresan `index.html`, así funcionan `/activar/...` y `/restablecer/...`).

> Los nombres de los servicios importan: las variables de abajo usan `${{backend...}}`, `${{frontend...}}` y `${{Postgres...}}`. Si los nombras distinto, ajusta las referencias.

## 1. Crear el proyecto y la base de datos

1. En <https://railway.com> → **New Project** → **Deploy from GitHub repo** → elige este repositorio.
   Railway crea un servicio; lo configuras como `backend` en el paso 2.
2. En el proyecto: **+ Create** → **Database** → **PostgreSQL**. Queda como servicio `Postgres`.

## 2. Servicio `backend`

**Settings**
- **Service name:** `backend`
- **Source → Root Directory:** `/backend`
- **Source → Branch:** la rama que vas a desplegar (por ejemplo `main`)
- **Config-as-code → Railway Config File:** `/backend/railway.json`
  (Railway no busca el archivo dentro del Root Directory; hay que poner la ruta completa)
- **Build → Watch Paths:** `/backend/**` (así un cambio solo en el frontend no redespliega la API)
- **Networking → Generate Domain** (puerto: el que Railway detecte; la app usa `PORT`)

**Volumen** (los PDF de los reportes; sin esto se borran en cada despliegue)
- Clic derecho en el servicio → **Attach Volume** → Mount path: `/data`

**Variables**

| Variable        | Valor                                                    |
|-----------------|----------------------------------------------------------|
| `NODE_ENV`      | `production`                                             |
| `DATABASE_URL`  | `${{Postgres.DATABASE_URL}}`                             |
| `JWT_SECRET`    | una clave larga y aleatoria (ver abajo)                  |
| `FRONTEND_URL`  | `https://${{frontend.RAILWAY_PUBLIC_DOMAIN}}`            |
| `UPLOADS_DIR`   | `/data/uploads`                                          |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | datos del correo saliente |

Generar `JWT_SECRET` (no reutilices la de desarrollo):

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Sin `SMTP_HOST`, los correos de activación se escriben en los logs del backend
(sirve para pruebas, no para usuarios reales). Railway restringe el SMTP saliente
en algunos planes: si los correos no llegan, revisa tu plan.

## 3. Servicio `frontend`

**+ Create → GitHub Repo →** el mismo repositorio.

**Settings**
- **Service name:** `frontend`
- **Root Directory:** `/frontend`
- **Railway Config File:** `/frontend/railway.json`
- **Watch Paths:** `/frontend/**`
- **Networking → Generate Domain**

**Variables**

| Variable       | Valor                                         |
|----------------|-----------------------------------------------|
| `VITE_API_URL` | `https://${{backend.RAILWAY_PUBLIC_DOMAIN}}`  |

`VITE_API_URL` se incrusta en el JavaScript **al compilar**: si cambia el dominio
del backend, hay que redesplegar el frontend.

## 4. Primer despliegue

1. Despliega `backend`. En los logs del *pre-deploy* deben aparecer las migraciones
   `000` a `005` aplicadas, y `/api/health` debe responder `{"estado":"OK"}`.
2. Despliega `frontend` y abre su dominio.
3. Crea la primera cuenta de coordinación. Con la CLI de Railway
   (`npm i -g @railway/cli`, `railway login`, `railway link` en la carpeta del repo):

   ```bash
   railway ssh --service backend
   npm run crear-coordinador
   ```

   Otra opción, desde tu computadora: copia `DATABASE_PUBLIC_URL` de las variables
   del servicio `Postgres` y ejecuta en `backend/`:

   ```bash
   DATABASE_URL="<DATABASE_PUBLIC_URL>" npm run crear-coordinador
   ```

## 5. Despliegues siguientes

- Cada push a la rama configurada redespliega el servicio cuya carpeta cambió.
- Los cambios a la base se hacen **solo** con un archivo nuevo en
  `backend/database/migraciones/` (`006_...sql`, `007_...sql`); el pre-deploy lo aplica.
  Nunca edites una migración que ya se aplicó en producción.
- Para revisar errores: pestaña **Deployments → View logs** de cada servicio.

## Checklist rápido

- [ ] `backend` responde en `https://<dominio-backend>/api/health`
- [ ] El volumen está montado en `/data` y `UPLOADS_DIR=/data/uploads`
- [ ] `NODE_ENV=production` y `FRONTEND_URL` apunta al dominio del frontend (CORS)
- [ ] `JWT_SECRET` nuevo, distinto al de desarrollo
- [ ] El frontend carga y el inicio de sesión llega al backend (sin errores de CORS en la consola)
- [ ] Existe al menos una cuenta de coordinación
