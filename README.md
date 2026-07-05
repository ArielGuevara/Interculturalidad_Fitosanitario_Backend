# Sistema Integral de Gestión Fitosanitaria

Plataforma de gestión fitosanitaria para el monitoreo, reporte y control de plagas y enfermedades en cultivos.

## Arquitectura

| Componente | Tecnología | Ubicación |
|------------|-----------|-----------|
| **Backend API** | NestJS + PostgreSQL + Drizzle ORM + MinIO | `fitosanitario-backend/` |
| **Frontend Web** | Angular 19 | `fitosanitario-frontend/` |
| **App Móvil** | Expo React Native | `fitosanitario-mobile/` |

## Estándares ISO

El proyecto implementa controles alineados con ISO 25010, ISO 9001 e ISO 27001.

> Documentación detallada: [ISO 25010](fitosanitario-backend/docs/qa/iso-25010.md), [ISO 9001](fitosanitario-backend/docs/qa/iso-9001.md), [ISO 27001](fitosanitario-backend/docs/qa/iso-27001.md)

## CI/CD

```yaml
# GitHub Actions — 4 workflows
# - ci.yml: orquestador multi-componente
# - backend.yml: lint + test + build
# - mobile.yml: typecheck + test + lint
# - frontend.yml: lint + test + build
```

## Testing

| Componente | Framework | Ubicación |
|-----------|-----------|-----------|
| Backend | Jest | `fitosanitario-backend/src/**/*.spec.ts` |
| Mobile | Jest | `fitosanitario-mobile/src/**/*.spec.ts` |
| Frontend | Angular TestBed | `fitosanitario-frontend/src/**/*.spec.ts` |

## Cómo empezar

### Backend

```bash
cd fitosanitario-backend
npm install
cp .env.example .env    # configurar DATABASE_URL
npm run db:migrate      # ejecutar migrations
npm run start:dev       # http://localhost:3000
```

### Mobile

```bash
cd fitosanitario-mobile
npm install
cp .env.example .env    # configurar EXPO_PUBLIC_API_URL
npx expo start
```

### Frontend

```bash
cd fitosanitario-frontend
npm install
ng serve                # http://localhost:4200
```

## Requisitos

- Node.js 20+
- PostgreSQL 15+
- Docker (para MinIO)
