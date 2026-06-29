# Sistema Integral de Gestión Fitosanitaria

Plataforma de gestión fitosanitaria para el monitoreo, reporte y control de plagas y enfermedades en cultivos.

## Arquitectura

| Componente | Tecnología | Ubicación |
|------------|-----------|-----------|
| **Backend API** | NestJS + PostgreSQL + Drizzle ORM + MinIO | `fitosanitario-backend/` |
| **Frontend Web** | Angular 19 | `fitosanitario-frontend/` |
| **App Móvil** | Expo React Native | `fitosanitario-mobile/` |

## Calidad de Software — ISO 25010

El proyecto implementa controles y prácticas alineados con ISO 25010 en las siguientes categorías:

| Dimensión | Implementación |
|-----------|---------------|
| **Functional Suitability** | CRUD completo, DTOs con validación, TypeScript strict en todos los módulos |
| **Performance Efficiency** | Middleware de monitoreo, Pool de conexiones PostgreSQL, MinIO para archivos |
| **Compatibility** | API REST stateless, Docker multi-contenedor, JWT interoperable |
| **Usability** | Swagger/OpenAPI, diseño iOS-minimalista, badges de estado semánticos |
| **Reliability** | Offline-first con SQLite local, historial de cambios auditado, manejo de errores global |
| **Security** | Passwords bcrypt, JWT con expiración, guards por rol (AGRICULTOR/MODERADOR) |
| **Maintainability** | Arquitectura modular NestJS, 12 módulos separados, inyección de dependencias |
| **Portability** | Contenedores Docker, Expo multiplataforma, configuración por `.env` |

> Documentación completa: [docs/qa/iso-25010.md](fitosanitario-backend/docs/qa/iso-25010.md)

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
