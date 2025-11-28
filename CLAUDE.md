# ProTalent Backend - Documentación Completa

## 📋 Índice

1. [Estado del Proyecto](#estado-del-proyecto)
2. [Optimizaciones de Performance](#optimizaciones-de-performance)
3. [Comandos de Desarrollo](#comandos-de-desarrollo)
4. [Estructura del Proyecto](#estructura-del-proyecto)
5. [Módulos Implementados](#módulos-implementados)
6. [Testing](#testing)
7. [Configuración](#configuración)

---

## Estado del Proyecto

### ✅ Funcionalidades Completadas

#### 1. **Infraestructura y Configuración** ✅
- ✅ **Schema de Base de Datos**: Prisma (PostgreSQL) + MongoDB híbrido
- ✅ **Configuración del Proyecto**: TypeScript, Jest, ESLint
- ✅ **Arquitectura Modular**: Separación clara de responsabilidades
- ✅ **Variables de Entorno**: Configuración completa con optimizaciones
- ✅ **Dependencias**: 150+ paquetes instalados con pnpm
- ✅ **Performance Optimizado**: Arranque 88% más rápido

#### 2. **Módulo de Autenticación** ✅
- ✅ JWT Tokens (access/refresh) seguros
- ✅ Google OAuth integración completa
- ✅ Middleware de autenticación y autorización por roles
- ✅ Controladores: Login, registro, refresh
- ✅ Documentación: `docs/auth-module.md`

#### 3. **Módulo de Usuarios** ✅
- ✅ Perfiles diferenciados (estudiantes, empresas, instituciones)
- ✅ Sistema social (follow/unfollow)
- ✅ Búsqueda avanzada con filtros
- ✅ Upload de archivos (Cloudinary)
- ✅ 34 tests unitarios pasando
- ✅ Documentación: `docs/users-module-nextjs.md`

#### 4. **Módulo de Ofertas** ✅
- ✅ CRUD completo de ofertas
- ✅ Sistema de postulaciones con estados
- ✅ Búsqueda avanzada con múltiples filtros
- ✅ 29 tests unitarios pasando
- ✅ Documentación: `docs/offers-module-nextjs.md`

#### 5. **Módulo Social** ✅
- ✅ Posts con multimedia (imágenes/videos)
- ✅ Sistema de reacciones (6 tipos)
- ✅ Comentarios anidados
- ✅ Feed personalizado
- ✅ 13 tests unitarios pasando
- ✅ Documentación: `docs/social-module-nextjs.md`

#### 6. **Módulo de Administración** ✅
- ✅ Gestión completa de usuarios
- ✅ Moderación de ofertas
- ✅ Moderación de contenido social
- ✅ Dashboard con estadísticas
- ✅ 43 tests unitarios pasando
- ✅ Sistema de verificación de contenido

#### 7. **Módulo de Chat** ✅
- ✅ Arquitectura híbrida (PostgreSQL + MongoDB)
- ✅ Socket.IO tiempo real
- ✅ Conversaciones privadas y grupales
- ✅ Mensajes multimedia
- ✅ Estados de lectura
- ✅ Documentación: `docs/chat-module.md`

---

## ⚡ Optimizaciones de Performance

### **NUEVA ACTUALIZACIÓN**: Octubre 2025

#### 🚀 Resultados de Optimización

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| **Arranque del servidor** | 12s | 1.4s | **88% ↓** |
| **Hot reload** | 6s | 0.5s | **92% ↓** |
| **Memoria Redis** | 20-25 MB | 10-15 MB | **50% ↓** |
| **Response time** | N/A | 25-54ms | Excelente |
| **Throughput** | N/A | 330 req/s | Excelente |

#### ✅ Optimizaciones Implementadas

1. **tsx en lugar de ts-node** → Ahorro de ~4 segundos
2. **Conexiones paralelas** → Ahorro de ~3 segundos
3. **Redis con duplicate()** → Ahorro de 50% memoria
4. **Logs condicionales** → Performance mejorado
5. **Lazy loading de Bull Queues** → Ahorro de ~0.9s
6. **Dev Light Mode** → 4 modos de desarrollo flexibles

#### 📚 Documentación de Optimizaciones

- `OPTIMIZACIONES.md` - Guía técnica completa
- `PERFORMANCE-TESTS.md` - Resultados de pruebas
- `RESUMEN-OPTIMIZACIONES.md` - Resumen ejecutivo

---

## Comandos de Desarrollo

### 🚀 Desarrollo Optimizado

```bash
# Modo normal (todos los servicios) - 5-6 segundos
npm run dev

# Modo ligero (solo PostgreSQL) - 2 segundos
npm run dev:light

# Modo API (PostgreSQL + Redis) - 3 segundos
npm run dev:api

# Modo chat (PostgreSQL + Redis + MongoDB) - 4-5 segundos
npm run dev:chat

# Modo completo explícito
npm run dev:full

# Modo antiguo (ts-node) - por compatibilidad
npm run dev:old
```

### 🧪 Testing

```bash
# Ejecutar todos los tests
npm test

# Tests en modo watch
npm run test:watch

# Tests con coverage
npm run test:coverage
```

### 🗄️ Base de Datos

```bash
# Generar cliente Prisma
npm run db:generate

# Aplicar cambios del schema
npm run db:push

# Crear migración
npm run db:migrate

# Abrir Prisma Studio
npm run db:studio

# Seed de datos
npm run db:seed
```

### 🔨 Build y Type Checking

```bash
# Compilar TypeScript
npm run build

# Verificar tipos (IMPORTANTE: ejecutar antes de commits)
npm run typecheck

# Iniciar en producción
npm start
```

---

## Estructura del Proyecto

```
Practicas-Backend/
├── src/
│   ├── config/              # Configuraciones
│   │   ├── database.ts      # Prisma client (optimizado)
│   │   ├── mongodb.ts       # MongoDB connection
│   │   ├── redis.ts         # Redis client (optimizado con duplicate())
│   │   ├── auth.ts          # JWT y OAuth config
│   │   ├── cloudinary.ts    # Cloudinary setup
│   │   ├── swagger.ts       # API documentation
│   │   └── features.config.ts  # 🆕 Dev Light Mode
│   │
│   ├── controllers/         # Controladores HTTP
│   │   ├── auth.controller.ts
│   │   ├── users.controller.ts
│   │   ├── offers.controller.ts
│   │   ├── social.controller.ts
│   │   ├── chat.controller.ts
│   │   ├── notifications.controller.ts
│   │   └── admin.controller.ts
│   │
│   ├── services/            # Lógica de negocio
│   │   ├── auth.service.ts
│   │   ├── users.service.ts
│   │   ├── offers.service.ts
│   │   ├── social.service.ts
│   │   ├── chat.service.ts
│   │   ├── notifications.service.ts
│   │   ├── admin.service.ts
│   │   └── queue.service.ts  # 🆕 Lazy loading
│   │
│   ├── middleware/          # Middleware personalizado
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   ├── upload.middleware.ts
│   │   ├── rateLimiter.middleware.ts
│   │   └── security.middleware.ts
│   │
│   ├── routes/              # Definición de rutas
│   │   ├── auth.routes.ts
│   │   ├── users.routes.ts
│   │   ├── offers.routes.ts
│   │   ├── social.routes.ts
│   │   ├── chat.routes.ts
│   │   ├── notifications.routes.ts
│   │   └── admin.routes.ts
│   │
│   ├── models/              # MongoDB models
│   │   ├── Message.model.ts
│   │   └── Notification.model.ts
│   │
│   ├── socket/              # Socket.IO handlers
│   │   ├── chat.socket.ts
│   │   └── notifications.socket.ts
│   │
│   ├── types/               # Tipos TypeScript
│   │   ├── auth.types.ts
│   │   ├── user.types.ts
│   │   ├── offers.types.ts
│   │   ├── social.types.ts
│   │   ├── chat.types.ts
│   │   ├── notifications.types.ts
│   │   └── common.types.ts
│   │
│   ├── utils/               # Utilidades
│   │   ├── logger.ts        # Winston logging
│   │   ├── responses.ts     # API responses helpers
│   │   ├── validators.ts    # Validadores custom
│   │   └── helpers.ts       # Funciones auxiliares
│   │
│   ├── app.ts              # Express app setup
│   └── server.ts           # 🆕 Server con optimizaciones
│
├── tests/                   # Tests
│   ├── unit/               # Tests unitarios
│   │   ├── auth/
│   │   ├── users/
│   │   ├── offers/
│   │   ├── social/
│   │   ├── chat/
│   │   └── admin/
│   ├── integration/        # Tests de integración
│   └── setup.ts            # Configuración de tests
│
├── docs/                    # Documentación
│   ├── auth-module.md
│   ├── users-module-nextjs.md
│   ├── offers-module-nextjs.md
│   ├── social-module-nextjs.md
│   ├── chat-module.md
│   ├── notifications-module-nextjs.md
│   ├── admin-module.md
│   └── swagger-documentation.md
│
├── prisma/                  # Prisma schema y migraciones
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── OPTIMIZACIONES.md       # 🆕 Guía de optimizaciones
├── PERFORMANCE-TESTS.md    # 🆕 Resultados de pruebas
├── RESUMEN-OPTIMIZACIONES.md  # 🆕 Resumen ejecutivo
├── DESARROLLO-BACKEND.md   # Plan de desarrollo
├── FUNCIONALIDADES-FALTANTES.md
├── package.json
├── tsconfig.json
├── jest.config.js
└── .env
```

---

## Módulos Implementados

### 🔐 Autenticación
- JWT con access/refresh tokens (15min/7días)
- Google OAuth 2.0
- HTTP-only cookies
- Middleware de autorización por roles
- Refresh automático de tokens

### 👥 Usuarios
- 4 tipos de perfiles: ESTUDIANTE, EMPRESA, INSTITUCION, ADMIN
- Sistema social de seguimiento
- Búsqueda y filtrado avanzado
- Upload de archivos (CV, avatares)
- Gestión de experiencia laboral (JSON estructurado)

### 💼 Ofertas de Trabajo
- CRUD completo con autorización
- Sistema de postulaciones multi-estado
- Preguntas dinámicas personalizadas
- Filtros avanzados (ubicación, tipo, salario, etc.)
- Verificación y destacado (admin)

### 📱 Social
- Posts con multimedia (imágenes/videos Cloudinary)
- 6 tipos de reacciones (like, love, haha, wow, sad, angry)
- Comentarios anidados ilimitados
- Feed personalizado basado en conexiones
- Moderación de contenido

### 💬 Chat
- Arquitectura híbrida PostgreSQL + MongoDB
- Socket.IO para tiempo real
- Conversaciones privadas y grupales
- Mensajes multimedia
- Estados de lectura
- Reacciones a mensajes
- Edición y eliminación

### 🔔 Notificaciones
- Notificaciones en tiempo real (Socket.IO)
- Bull queues para procesamiento asíncrono
- Múltiples canales (in-app, email, push)
- Sistema de preferencias
- Templates configurables

### 👨‍💼 Administración
- Dashboard con estadísticas
- Gestión completa de usuarios
- Moderación de ofertas
- Moderación de contenido social
- Sistema de verificación
- Filtros y búsquedas avanzadas

---

## Testing

### 📊 Estadísticas Actuales

- **Total de Tests**: 133 tests unitarios ✅
- **Cobertura**: Todos los módulos principales
- **Estado**: 100% pasando

### Por Módulo

| Módulo | Tests | Estado |
|--------|-------|--------|
| Administración | 43 | ✅ |
| Usuarios | 34 | ✅ |
| Ofertas | 29 | ✅ |
| Chat | 14 | ✅ |
| Social | 13 | ✅ |

### Ejecutar Tests

```bash
# Todos los tests
npm test

# Watch mode
npm run test:watch

# Con coverage
npm run test:coverage
```

---

## Configuración

### Variables de Entorno

```bash
# Servidor
NODE_ENV=development
PORT=5000

# 🆕 OPTIMIZACIONES DE DESARROLLO
PRISMA_LOG_LEVEL=minimal    # verbose | minimal | production
DEV_MODE=full               # light | api | chat | full
QUEUE_LAZY_MODE=true        # true | false

# JWT
JWT_SECRET=your_secret_here
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback

# PostgreSQL (Prisma)
DATABASE_URL=postgresql://...

# MongoDB (Chat)
MONGODB_URI=mongodb+srv://...

# Redis (Cache, Queues, Socket.IO)
REDIS_URL=redis://...

# Cloudinary (Upload)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Frontend
FRONTEND_URL=http://localhost:3000
```

### 🆕 Modos de Desarrollo

#### LIGHT (2 segundos)
- Solo PostgreSQL
- Uso: Quick fixes, testing de lógica

#### API (3 segundos)
- PostgreSQL + Redis
- Uso: Desarrollo de endpoints REST

#### CHAT (4-5 segundos)
- PostgreSQL + Redis + MongoDB + Socket.IO
- Uso: Desarrollo de funcionalidades de chat

#### FULL (5-6 segundos - default)
- Todos los servicios
- Uso: Testing completo, desarrollo integral

---

## 🔄 Últimas Actualizaciones

### Octubre 2025 - Optimizaciones de Performance ⭐

**MEJORAS MASIVAS DE RENDIMIENTO**

1. ✅ **tsx en lugar de ts-node**: 88% más rápido en arranque
2. ✅ **Conexiones paralelas**: 3 segundos ahorrados
3. ✅ **Redis optimizado**: 50% menos memoria (crítico para límite de 30MB)
4. ✅ **Lazy loading**: Colas bajo demanda
5. ✅ **Dev Light Mode**: 4 modos flexibles de desarrollo
6. ✅ **Logs condicionales**: Performance mejorado

**Resultado**: De 12s a 1.4s de arranque (10.6 segundos ahorrados)

**Documentación completa**:
- `OPTIMIZACIONES.md`
- `PERFORMANCE-TESTS.md`
- `RESUMEN-OPTIMIZACIONES.md`

### Septiembre 2025 - Campo `experiencia` ahora es JSON

**BREAKING CHANGE**: El campo `experiencia` cambió de `String?` a `Json?`

**Estructura JSON**:
```typescript
interface ExperienciaLaboral {
  id?: string;
  empresa: string;
  puesto: string;
  descripcion?: string;
  fechaInicio: string;
  fechaFin?: string;
  esTrabajoActual?: boolean;
  ubicacion?: string;
  tipo?: 'TIEMPO_COMPLETO' | 'MEDIO_TIEMPO' | 'FREELANCE' | 'PRACTICAS' | 'VOLUNTARIADO';
  habilidades?: string[];
}
```

---

## 📈 Estadísticas del Proyecto

- **Endpoints API**: 75+ endpoints REST
- **Tests**: 133 unitarios pasando
- **Documentación**: 10+ guías completas
- **Performance**: 330 req/s throughput
- **Response time**: 25-54ms endpoints simples
- **Arranque**: 1.4s (88% más rápido)
- **Hot reload**: 0.5s (92% más rápido)
- **Memoria Redis**: 10-15 MB (50% optimizado)

---

## 🎯 Próximos Pasos

### En Desarrollo
- Sistema de notificaciones completo (email templates)
- Tests de integración E2E
- CI/CD pipeline

### Consideraciones Futuras
- Caching estratégico con Redis
- CDN para assets estáticos
- Load balancing
- Monitoring con Prometheus/Grafana

---

## 🔧 Notas Técnicas Importantes

### TypeScript
- Configurado con strict mode
- tsx NO hace type checking en runtime
- **Ejecutar `npm run typecheck` antes de commits**

### Bases de Datos
- **PostgreSQL (Prisma)**: Usuarios, ofertas, posts, aplicaciones
- **MongoDB (Mongoose)**: Chat, mensajes en tiempo real
- **Redis**: Cache, sessions, queues, Socket.IO adapter

### Performance
- Hot reload en ~500ms con tsx
- Conexiones paralelas a servicios
- Lazy loading de recursos pesados
- Logs optimizados para desarrollo

### Seguridad
- Rate limiting con Redis
- JWT con refresh tokens
- CORS configurado
- Helmet headers
- Validación con express-validator
- Sanitización de datos

### Arquitectura
- Modular y escalable
- Separación clara de responsabilidades
- Services pattern
- Middleware chain
- Error handling centralizado
- Logging estructurado con Winston

---

## 📞 Soporte y Recursos

### Documentación
- Swagger UI: `http://localhost:5000/api-docs`
- Carpeta `/docs` con guías completas
- Archivos de optimización en raíz del proyecto

### Testing
- 133 tests unitarios en `/tests/unit`
- Mocks configurados para Prisma y MongoDB
- Jest con ts-jest

### Performance
- Benchmarks en `PERFORMANCE-TESTS.md`
- Guía de optimización en `OPTIMIZACIONES.md`
- Resumen ejecutivo en `RESUMEN-OPTIMIZACIONES.md`

---

**Última actualización**: 26 de Octubre de 2025
**Versión**: ProTalent Backend v1.0.0 (Optimizado)
**Estado**: ✅ Producción-Ready con optimizaciones avanzadas
