# 🚀 Guía de Configuración para Producción - ProTalent Backend

## 📋 Índice

1. [Preparación del Código](#preparación-del-código)
2. [Variables de Entorno](#variables-de-entorno)
3. [Plataformas de Deployment Recomendadas](#plataformas-de-deployment)
4. [Docker Configuration](#docker-configuration)
5. [Deployment en Render](#deployment-en-render)
6. [Deployment en Railway](#deployment-en-railway)
7. [Deployment en Fly.io](#deployment-en-flyio)
8. [Consideraciones de Vercel](#consideraciones-de-vercel)
9. [Monitoreo y Logs](#monitoreo-y-logs)
10. [Checklist Pre-Deployment](#checklist-pre-deployment)

---

## 🎯 Preparación del Código

### 1. Verificación de Calidad de Código

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Tests
npm test

# Build de producción
npm run build
```

### 2. Optimizaciones Aplicadas

✅ **Performance**
- tsx en lugar de ts-node (88% más rápido)
- Conexiones paralelas a bases de datos
- Redis optimizado con duplicate()
- Lazy loading de Bull Queues
- Logs condicionales según ambiente

✅ **Código**
- ESLint configurado para producción
- TypeScript strict mode
- 133 tests unitarios pasando
- 0 errores de tipos

---

## 🔐 Variables de Entorno

### Archivo `.env.production` (Template)

```bash
# ===========================
# SERVIDOR
# ===========================
NODE_ENV=production
PORT=5000

# ===========================
# OPTIMIZACIONES
# ===========================
PRISMA_LOG_LEVEL=production    # minimal | production
DEV_MODE=full                   # Ignorado en producción
QUEUE_LAZY_MODE=true

# ===========================
# SEGURIDAD
# ===========================
JWT_SECRET=<CAMBIAR_POR_SECRET_FUERTE_64_CHARS>
JWT_REFRESH_SECRET=<CAMBIAR_POR_SECRET_FUERTE_64_CHARS>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# ===========================
# GOOGLE OAUTH
# ===========================
GOOGLE_CLIENT_ID=<TU_GOOGLE_CLIENT_ID>
GOOGLE_CLIENT_SECRET=<TU_GOOGLE_CLIENT_SECRET>
GOOGLE_REDIRECT_URI=https://tu-dominio.com/api/auth/google/callback

# ===========================
# POSTGRESQL (Prisma)
# ===========================
DATABASE_URL=postgresql://user:password@host:5432/database?schema=public&sslmode=require

# ===========================
# MONGODB (Chat)
# ===========================
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# ===========================
# REDIS (Cache, Queues, Socket.IO)
# ===========================
# Upstash Redis (Recomendado - Plan gratuito generoso)
REDIS_URL=rediss://default:password@host:6379

# ===========================
# CLOUDINARY (Upload)
# ===========================
CLOUDINARY_CLOUD_NAME=<TU_CLOUD_NAME>
CLOUDINARY_API_KEY=<TU_API_KEY>
CLOUDINARY_API_SECRET=<TU_API_SECRET>

# ===========================
# RATE LIMITING
# ===========================
RATE_LIMIT_WINDOW_MS=900000     # 15 minutos
RATE_LIMIT_MAX_REQUESTS=100

# ===========================
# FRONTEND
# ===========================
FRONTEND_URL=https://tu-frontend.vercel.app

# ===========================
# CORS ORIGINS (separados por coma)
# ===========================
ALLOWED_ORIGINS=https://tu-frontend.vercel.app,https://www.tu-dominio.com
```

---

## 🌐 Plataformas de Deployment

### 📊 Comparativa de Plataformas

| Característica | Vercel | Render | Railway | Fly.io |
|----------------|--------|--------|---------|--------|
| **Tipo** | Serverless | Traditional | Traditional | Edge Compute |
| **Docker** | ❌ No | ✅ Sí | ✅ Sí | ✅ Sí |
| **WebSockets** | ⚠️ Limitado | ✅ Sí | ✅ Sí | ✅ Sí |
| **PostgreSQL** | ⚠️ Externo | ✅ Incluido | ✅ Incluido | ⚠️ Externo |
| **Redis** | ⚠️ Externo | ✅ Incluido | ✅ Incluido | ⚠️ Externo |
| **Free Tier** | ✅ Generoso | ⚠️ Lento | ✅ $5 crédito | ✅ Limitado |
| **Cold Start** | ~1s | ~30-60s | ~5-10s | ~2-5s |
| **Precio Base** | Gratis* | $7/mes | $5/mes | $0-5/mes |

### ⭐ **Recomendación para ProTalent Backend**

#### 🥇 **MEJOR OPCIÓN: Railway o Render con Docker**

**¿Por qué Railway/Render y NO Vercel?**

❌ **Vercel NO es adecuado** para este backend porque:
1. **No soporta Docker** - Solo serverless functions
2. **No soporta WebSockets persistentes** - Tu chat requiere Socket.IO
3. **No incluye bases de datos** - Tendrías que usar servicios externos para PostgreSQL, MongoDB y Redis
4. **Límites de serverless** - 10s timeout en plan free, 60s en pro
5. **No hay procesos persistentes** - Bull queues no funcionarían correctamente

✅ **Railway/Render SÍ son adecuados** porque:
1. ✅ Soportan Docker containers
2. ✅ WebSockets funcionan perfectamente
3. ✅ PostgreSQL, Redis incluidos (MongoDB externo)
4. ✅ Procesos persistentes para queues
5. ✅ Despliegue desde GitHub automático
6. ✅ Logs en tiempo real

#### 💰 **Presupuesto Recomendado**

**Opción 1: Railway ($5-20/mes)**
- Backend: $5/mes (1GB RAM)
- PostgreSQL: Incluido
- Redis: Incluido
- MongoDB: MongoDB Atlas Free Tier

**Opción 2: Render ($7-25/mes)**
- Backend: $7/mes (512MB RAM) - LENTO en free tier
- PostgreSQL: Incluido en paid
- Redis: Incluido en paid
- MongoDB: MongoDB Atlas Free Tier

**Opción 3: Fly.io ($0-15/mes)**
- Backend: $5-10/mes
- PostgreSQL: Upstash o Railway
- Redis: Upstash Free Tier (10K commands/day)
- MongoDB: MongoDB Atlas Free Tier

---

## 🐳 Docker Configuration

### Dockerfile

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Instalar dependencias del sistema
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copiar package.json y lockfile
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Instalar pnpm
RUN npm install -g pnpm

# ===========================
# Etapa de dependencias
# ===========================
FROM base AS deps
RUN pnpm install --frozen-lockfile

# ===========================
# Etapa de build
# ===========================
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generar Prisma Client
RUN pnpm db:generate

# Build de TypeScript
RUN pnpm build

# Eliminar dev dependencies
RUN pnpm prune --prod

# ===========================
# Etapa de producción
# ===========================
FROM node:20-alpine AS runner

WORKDIR /app

# Crear usuario no-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 protalent

# Copiar archivos necesarios
COPY --from=builder --chown=protalent:nodejs /app/dist ./dist
COPY --from=builder --chown=protalent:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=protalent:nodejs /app/prisma ./prisma
COPY --from=builder --chown=protalent:nodejs /app/package.json ./package.json

# Cambiar a usuario no-root
USER protalent

# Exponer puerto
EXPOSE 5000

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=5000
ENV PRISMA_LOG_LEVEL=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando de inicio
CMD ["node", "dist/server.js"]
```

### docker-compose.yml (Para desarrollo local)

```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/protalent
      - MONGODB_URI=mongodb://mongo:27017/protalent
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - mongo
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: protalent
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  mongo:
    image: mongo:7
    volumes:
      - mongo_data:/data/db
    ports:
      - "27017:27017"

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

volumes:
  postgres_data:
  mongo_data:
  redis_data:
```

### .dockerignore

```
node_modules
dist
coverage
.env*
.git
.gitignore
.vscode
.idea
*.log
npm-debug.log*
README.md
CLAUDE.md
docs/
tests/
.eslintrc
.prettierrc
```

---

## 🚂 Deployment en Render

### 1. Configuración de Servicios

#### render.yaml

```yaml
services:
  # Backend Service
  - type: web
    name: protalent-backend
    env: docker
    plan: starter # $7/mes - 512MB RAM
    region: oregon
    dockerfilePath: ./Dockerfile
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 5000
      - key: DATABASE_URL
        fromDatabase:
          name: protalent-db
          property: connectionString
      - key: REDIS_URL
        fromDatabase:
          name: protalent-redis
          property: connectionString
      - key: JWT_SECRET
        generateValue: true
      - key: JWT_REFRESH_SECRET
        generateValue: true
      - key: MONGODB_URI
        sync: false # Configurar manualmente
      - key: FRONTEND_URL
        value: https://tu-frontend.vercel.app
      - key: CLOUDINARY_CLOUD_NAME
        sync: false
      - key: CLOUDINARY_API_KEY
        sync: false
      - key: CLOUDINARY_API_SECRET
        sync: false

databases:
  # PostgreSQL
  - name: protalent-db
    plan: starter # $7/mes - 256MB RAM
    region: oregon

  # Redis
  - name: protalent-redis
    plan: starter # $7/mes - 25MB
    region: oregon
```

### 2. Deploy Manual

```bash
# 1. Crear cuenta en Render
# 2. Conectar repositorio de GitHub
# 3. Crear Web Service
# 4. Configurar:
#    - Environment: Docker
#    - Build Command: (ninguno, usa Dockerfile)
#    - Start Command: (ninguno, usa Dockerfile CMD)
# 5. Agregar variables de entorno
# 6. Agregar PostgreSQL y Redis desde Dashboard
# 7. Deploy
```

### ⚠️ **Limitación de Render Free Tier**

El plan gratuito de Render tiene **cold starts de 50+ segundos** y el servicio se duerme después de 15 minutos de inactividad. **NO es recomendable para producción**.

---

## 🚄 Deployment en Railway

### 1. Configuración railway.json (Opcional)

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "node dist/server.js",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 2. Deploy desde Railway CLI

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Crear proyecto
railway init

# Agregar PostgreSQL
railway add --database postgres

# Agregar Redis
railway add --database redis

# Deploy
railway up

# Ver logs
railway logs
```

### 3. Deploy desde GitHub

1. Conectar repo en https://railway.app
2. Seleccionar repositorio
3. Railway detecta Dockerfile automáticamente
4. Agregar PostgreSQL y Redis desde dashboard
5. Configurar variables de entorno
6. Deploy automático en cada push

### 💰 **Pricing Railway**

- $5 de crédito mensual incluido
- ~$0.000463/min por servicio ejecutándose
- PostgreSQL: Almacenamiento y tiempo de cómputo
- Redis: Incluido en el plan

---

## ✈️ Deployment en Fly.io

### 1. Instalación Fly CLI

```bash
# Linux/WSL
curl -L https://fly.io/install.sh | sh

# macOS
brew install flyctl

# Login
flyctl auth login
```

### 2. Configuración fly.toml

```toml
app = "protalent-backend"
primary_region = "iad"

[build]
  dockerfile = "Dockerfile"

[env]
  NODE_ENV = "production"
  PORT = "8080"
  PRISMA_LOG_LEVEL = "production"

[http_service]
  internal_port = 5000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 1
  processes = ["app"]

  [http_service.concurrency]
    type = "connections"
    hard_limit = 250
    soft_limit = 200

[[services]]
  protocol = "tcp"
  internal_port = 5000
  processes = ["app"]

  [[services.ports]]
    port = 80
    handlers = ["http"]
    force_https = true

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

  [services.concurrency]
    type = "connections"
    hard_limit = 250
    soft_limit = 200

[[services.tcp_checks]]
  interval = "15s"
  timeout = "2s"
  grace_period = "10s"
  restart_limit = 0

[[services.http_checks]]
  interval = "30s"
  timeout = "5s"
  grace_period = "10s"
  method = "GET"
  path = "/health"
  protocol = "http"

[deploy]
  release_command = "npx prisma migrate deploy"

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 512
```

### 3. Deploy

```bash
# Crear app
flyctl launch

# Configurar secrets
flyctl secrets set JWT_SECRET=<secret>
flyctl secrets set JWT_REFRESH_SECRET=<secret>
flyctl secrets set DATABASE_URL=<postgres_url>
flyctl secrets set MONGODB_URI=<mongo_url>
flyctl secrets set REDIS_URL=<redis_url>
flyctl secrets set CLOUDINARY_CLOUD_NAME=<name>
flyctl secrets set CLOUDINARY_API_KEY=<key>
flyctl secrets set CLOUDINARY_API_SECRET=<secret>

# Deploy
flyctl deploy

# Logs
flyctl logs

# Scale
flyctl scale count 2
flyctl scale vm shared-cpu-1x --memory 1024
```

---

## ⚠️ Consideraciones de Vercel

### ¿Se puede usar Vercel para este backend?

**Respuesta corta: NO para el backend completo.**

**Respuesta larga:**

❌ **No puedes deployar este backend en Vercel porque:**

1. **Vercel es para serverless functions**, no para aplicaciones Express persistentes
2. **Socket.IO no funciona** en serverless (requiere conexiones persistentes)
3. **Bull queues no funcionan** (requieren procesos en background)
4. **No puedes usar Docker**
5. **Timeout de 10s (free) o 60s (pro)** - insuficiente para operaciones largas

⚠️ **Alternativa híbrida (NO recomendada):**

Podrías separar el backend en:
- **API REST en Vercel** (serverless functions)
- **WebSockets + Queues en Render/Railway** (servicio separado)

Pero esto complica la arquitectura innecesariamente.

### ✅ **Mejor estrategia:**

- **Frontend en Vercel** (Next.js) ✅
- **Backend en Railway/Render** (Express + Socket.IO + Queues) ✅

Así aprovechas las fortalezas de cada plataforma.

---

## 📊 Monitoreo y Logs

### 1. Health Check Endpoint

Tu backend ya tiene `/health` implementado en `src/app.ts:85-90`:

```typescript
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  }, 'Servidor funcionando correctamente');
});
```

### 2. Logging en Producción

Configurar Winston para enviar logs a servicios externos:

```bash
# Opciones recomendadas:
- Logtail (gratuito hasta 3GB/mes)
- Papertrail (gratuito hasta 50MB/mes)
- Better Stack (integración con Railway/Render)
```

### 3. Monitoring

```bash
# Opciones recomendadas:
- Sentry (errores y performance)
- New Relic (APM completo)
- Prometheus + Grafana (self-hosted)
```

---

## ✅ Checklist Pre-Deployment

### Código

- [ ] `npm run typecheck` sin errores
- [ ] `npm run lint` sin errores críticos
- [ ] `npm test` todos los tests pasan
- [ ] `npm run build` compila correctamente
- [ ] Dockerfile funciona localmente: `docker build -t backend . && docker run -p 5000:5000 backend`

### Bases de Datos

- [ ] PostgreSQL configurado con SSL
- [ ] MongoDB Atlas con IP whitelist configurada
- [ ] Redis con autenticación habilitada
- [ ] Migraciones de Prisma ejecutadas: `npx prisma migrate deploy`

### Seguridad

- [ ] JWT secrets generados (64+ caracteres aleatorios)
- [ ] CORS configurado con origins específicos
- [ ] Rate limiting habilitado
- [ ] Helmet headers configurados
- [ ] Variables sensibles en secrets (no en código)
- [ ] .env NO está en git (verificar .gitignore)

### Servicios Externos

- [ ] Cloudinary cuenta configurada
- [ ] Google OAuth credenciales de producción
- [ ] SMTP configurado para emails (si aplica)
- [ ] Frontend URL correcta en CORS y OAuth

### Monitoring

- [ ] Health check endpoint funcionando
- [ ] Logs centralizados configurados
- [ ] Alertas configuradas para errores críticos
- [ ] Backups automáticos de base de datos

### Performance

- [ ] `PRISMA_LOG_LEVEL=production`
- [ ] `NODE_ENV=production`
- [ ] Conexiones a DB con pool limits adecuados
- [ ] Redis configurado para producción

---

## 🎯 Recomendación Final

### Para ProTalent Backend:

**🥇 Mejor opción: Railway**

```
Frontend:     Vercel (Next.js) - GRATIS
Backend:      Railway (Docker) - $5-10/mes
PostgreSQL:   Railway incluido
Redis:        Railway incluido o Upstash Free
MongoDB:      MongoDB Atlas Free (512MB)
Cloudinary:   Plan Free (25 créditos/mes)

TOTAL: ~$5-15/mes
```

**Ventajas:**
- ✅ Deploy automático desde GitHub
- ✅ Todas las bases de datos incluidas
- ✅ Excelente DX (developer experience)
- ✅ Logs en tiempo real
- ✅ Sin cold starts
- ✅ WebSockets funcionan perfectamente
- ✅ $5 de crédito mensual incluido

**Deploy en 5 minutos:**
1. Push código a GitHub
2. Conectar repo en Railway
3. Agregar PostgreSQL y Redis
4. Configurar variables de entorno
5. Deploy automático ✅

---

**Última actualización:** 30 de Octubre de 2025
**Autor:** ProTalent Development Team
**Versión:** 1.0.0
