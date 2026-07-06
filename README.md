# Sistema Integral de Gestión Fitosanitaria

Plataforma de gestión fitosanitaria para el monitoreo, reporte y control de plagas y enfermedades en cultivos.

## Arquitectura

| Componente | Tecnología | Ubicación |
|------------|-----------|-----------|
| **Backend API** | NestJS + PostgreSQL + Drizzle ORM + MinIO | `fitosanitario-backend/` |
| **Frontend Web** | Angular 19 + PrimeNG | `fitosanitario-frontend/` |
| **App Móvil** | Expo React Native (offline-first) | `fitosanitario-mobile/` |

## Requisitos

- Node.js 20+
- PostgreSQL 15+
- Docker Desktop (para PostgreSQL y MinIO)
- Expo Go (en teléfono físico, para la app móvil)

---

## 1. Iniciar PostgreSQL (Docker)

Levantar la base de datos con Docker:

```bash
docker run -d \
  --name fitosanitario-db \
  -e POSTGRES_USER=root \
  -e POSTGRES_PASSWORD=root \
  -e POSTGRES_DB=fitosanitario \
  -p 5432:5432 \
  postgres:16
```

Verificar que el contenedor esté corriendo:

```bash
docker ps
```

---

## 2. Backend (`fitosanitario-backend/`)

### 2.1 Configurar variables de entorno

```bash
cd fitosanitario-backend
cp .env.example .env
```

Editar `.env` con los valores correctos:

```env
DATABASE_URL=postgresql://root:root@localhost:5432/fitosanitario
JWT_SECRET=una_clave_secreta_larga_y_segura
JWT_EXPIRES_IN=7d
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_PUBLIC_ENDPOINT=192.168.100.15
MINIO_ACCESS_KEY=root
MINIO_SECRET_KEY=root12345
MINIO_BUCKET=fitosanitario
MINIO_USE_SSL=false
```

> **Nota**: `MINIO_PUBLIC_ENDPOINT` debe ser la IP LAN de tu PC para que el teléfono pueda acceder a las imágenes.

### 2.2 Instalar dependencias

```bash
npm install
```

### 2.3 Generar y ejecutar migrations

```bash
# Generar archivos de migración desde el schema
npm run db:generate

# Aplicar migraciones a la base de datos
npm run db:migrate

# (Opcional) Abrir Drizzle Studio para explorar datos
npm run db:studio
```

### 2.4 Iniciar el servidor

```bash
# Desarrollo con hot-reload
npm run start:dev

# Producción
npm run build
npm run start:prod
```

El servidor se ejecuta en `http://localhost:3000`.  
Documentación Swagger disponible en `http://localhost:3000/api/docs`.

### 2.5 Comandos útiles

```bash
# Compilar
npm run build

# Ejecutar tests unitarios
npm run test

# Ejecutar tests e2e
npm run test:e2e

# Lint y formato
npm run lint
npm run format
```

### 2.6 MinIO (almacenamiento de imágenes/audio)

Si necesitas MinIO local:

```bash
docker run -d \
  --name fitosanitario-minio \
  -e MINIO_ROOT_USER=root \
  -e MINIO_ROOT_PASSWORD=root12345 \
  -p 9000:9000 \
  -p 9001:9001 \
  minio/minio server /data --console-address ":9001"
```

Luego crear el bucket `fitosanitario` desde la consola web en `http://localhost:9001`.

---

## 3. Frontend Web (`fitosanitario-frontend/`)

### 3.1 Configurar variables de entorno

```bash
cd fitosanitario-frontend
cp .env.example .env
```

Editar `.env`:

```env
API_URL=http://localhost:3000/api
```

### 3.2 Instalar dependencias

```bash
npm install
```

### 3.3 Iniciar servidor de desarrollo

```bash
ng serve
```

La app se ejecuta en `http://localhost:4200`.

### 3.4 Comandos útiles

```bash
# Build de producción
ng build

# Tests
ng test

# Lint
ng lint
```

---

## 4. App Móvil (`fitosanitario-mobile/`)

### 4.1 Configurar variables de entorno

```bash
cd fitosanitario-mobile
cp .env.example .env
```

Editar `.env`:

```env
EXPO_PUBLIC_API_URL=http://192.168.100.15:3000/api
```

> **IMPORTANTE**: En el teléfono **NO uses** `localhost`. Usa la IP LAN de tu PC (ej. `192.168.100.15`).  
> La URL **debe terminar en** `/api` porque NestJS tiene `globalPrefix('api')`.  
> Si usas emulador Android, usa `http://10.0.2.2:3000/api`.

### 4.2 Instalar dependencias

```bash
npm install
```

### 4.3 Iniciar la app

```bash
npx expo start
```

Esto abre el bundler de Expo. Escanea el QR con Expo Go en tu teléfono.

### 4.4 Comandos útiles

```bash
# TypeScript check (sin compilar)
npx tsc --noEmit

# Tests
npm run test

# Lint
npm run lint

# Build para producción (APK/IPA)
npx expo build
```

### 4.5 Características

- **Offline-first**: Catálogos en caché SQLite; reportes se encolan sin conexión.
- **Accesibilidad**: TTS (text-to-speech), feedback háptico, modo fácil.
- **Multimedia**: Captura de fotos y grabación de audio desde la app.

---

## 5. Flujo de trabajo completo

```bash
# 1. Base de datos
docker start fitosanitario-db

# 2. Backend (terminal 1)
cd fitosanitario-backend
npm run db:migrate
npm run start:dev

# 3. Frontend (terminal 2)
cd fitosanitario-frontend
ng serve

# 4. Mobile (terminal 3)
cd fitosanitario-mobile
npx expo start
```

---

## Estándares ISO

El proyecto implementa controles alineados con ISO 25010, ISO 9001 e ISO 27001.

Documentación detallada:
- [ISO 25010](fitosanitario-backend/docs/qa/iso-25010.md)
- [ISO 9001](fitosanitario-backend/docs/qa/iso-9001.md)
- [ISO 27001](fitosanitario-backend/docs/qa/iso-27001.md)

## CI/CD

GitHub Actions — 4 workflows:
- `ci.yml`: orquestador multi-componente
- `backend.yml`: lint + test + build
- `mobile.yml`: typecheck + test + lint
- `frontend.yml`: lint + test + build

## Testing

| Componente | Framework | Ubicación |
|-----------|-----------|-----------|
| Backend | Jest | `fitosanitario-backend/src/**/*.spec.ts` |
| Mobile | Jest | `fitosanitario-mobile/src/**/*.spec.ts` |
| Frontend | Vitest | `fitosanitario-frontend/src/**/*.spec.ts` |
