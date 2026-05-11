# fitosanitario-mobile

App móvil Expo + TypeScript (offline-first) para el sistema fitosanitario.

## Requisitos

- Node.js + npm
- Expo Go en el teléfono (Android/iOS) o emulador
- Backend accesible desde la red del teléfono

## Configuración

1) Crea un archivo `.env` (puedes copiar de `.env.example`).

- `EXPO_PUBLIC_API_URL` **debe terminar en** `/api`.
- En teléfono **NO uses** `localhost`. Usa la IP LAN de tu PC.

Ejemplo:

```bash
EXPO_PUBLIC_API_URL=http://192.168.100.13:3000/api
```

2) Instala dependencias:

```bash
npm install
```

## Ejecutar

```bash
npm run start
```

- Escanea el QR con Expo Go.
- Si usas emulador Android, normalmente el backend se alcanza por `http://10.0.2.2:3000/api`.

## Notas

- La app es **offline-first**:
  - Catálogos: usa caché SQLite cuando no hay red.
  - Reportes: se encolan en SQLite y luego se sincronizan al backend.
- La subida de multimedia (imágenes/audio) se hace por `multipart/form-data` hacia `/reportes`.
