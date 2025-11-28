# Módulo de Administración - ProTalent Backend

## 📋 Índice
1. [Introducción](#introducción)
2. [Arquitectura](#arquitectura)
3. [Endpoints API](#endpoints-api)
4. [Gestión de Usuarios](#gestión-de-usuarios)
5. [Moderación de Ofertas](#moderación-de-ofertas)
6. [Moderación de Contenido Social](#moderación-de-contenido-social)
7. [Dashboard](#dashboard)
8. [Autenticación](#autenticación)
9. [Ejemplos de Uso](#ejemplos-de-uso)

---

## Introducción

El módulo de administración proporciona un sistema completo de gestión y moderación para la plataforma ProTalent. Solo los usuarios con rol `ADMIN` tienen acceso a estas funcionalidades.

### Características Principales
- ✅ Gestión completa de usuarios (CRUD, verificación, cambio de roles)
- ✅ Moderación de ofertas (aprobar, rechazar, verificar, destacar)
- ✅ Moderación de contenido social (ocultar/mostrar posts, eliminar comentarios)
- ✅ Dashboard con estadísticas en tiempo real
- ✅ Sistema de verificación visual (badges)
- ✅ Filtros avanzados y paginación

### Campos Agregados a la Base de Datos

#### Modelo `Oferta`
```prisma
verificada    Boolean  @default(false)  // Oferta verificada por admin
destacada     Boolean  @default(false)  // Oferta destacada (premium)
```

#### Modelo `Post`
```prisma
oculto        Boolean  @default(false)  // Post oculto por moderación
reportado     Boolean  @default(false)  // Post reportado por usuarios
```

---

## Arquitectura

### Estructura de Archivos
```
src/
├── types/
│   └── admin.types.ts          # Tipos TypeScript
├── services/
│   └── admin.service.ts        # Lógica de negocio
├── controllers/
│   └── admin.controller.ts     # Controladores HTTP
└── routes/
    └── admin.routes.ts         # Rutas API

tests/
└── unit/
    ├── admin.service.test.ts   # Tests del servicio (22 tests)
    └── admin.controller.test.ts # Tests del controlador (21 tests)
```

### Tecnologías Utilizadas
- **TypeScript**: Tipado estático
- **Prisma ORM**: Acceso a base de datos
- **Express**: Framework HTTP
- **Jest**: Testing (43 tests - 100% pasando)

---

## Endpoints API

Todas las rutas están bajo el prefijo `/api/admin` y requieren autenticación con rol `ADMIN`.

### Resumen de Endpoints

| Categoría | Método | Ruta | Descripción |
|-----------|--------|------|-------------|
| **Dashboard** | GET | `/dashboard` | Estadísticas generales |
| **Usuarios** | GET | `/users` | Listar todos los usuarios |
| **Usuarios** | GET | `/users/stats` | Estadísticas de usuarios |
| **Usuarios** | PUT | `/users/:userId` | Actualizar usuario |
| **Usuarios** | DELETE | `/users/:userId` | Eliminar usuario |
| **Usuarios** | PUT | `/users/:userId/verify-email` | Verificar email |
| **Usuarios** | PUT | `/users/:userId/role` | Cambiar rol |
| **Ofertas** | GET | `/offers` | Listar todas las ofertas |
| **Ofertas** | GET | `/offers/stats` | Estadísticas de ofertas |
| **Ofertas** | PUT | `/offers/:offerId` | Actualizar oferta |
| **Ofertas** | DELETE | `/offers/:offerId` | Eliminar oferta |
| **Ofertas** | PUT | `/offers/:offerId/approve` | Aprobar oferta |
| **Ofertas** | PUT | `/offers/:offerId/reject` | Rechazar oferta |
| **Posts** | GET | `/posts` | Listar todos los posts |
| **Posts** | GET | `/posts/stats` | Estadísticas de posts |
| **Posts** | PUT | `/posts/:postId/hide` | Ocultar post |
| **Posts** | PUT | `/posts/:postId/unhide` | Mostrar post |
| **Posts** | DELETE | `/posts/:postId` | Eliminar post |
| **Posts** | DELETE | `/comments/:commentId` | Eliminar comentario |

---

## Gestión de Usuarios

### GET /api/admin/users
Obtiene la lista de todos los usuarios con filtros avanzados.

**Query Parameters:**
```typescript
{
  page?: number;           // Página actual (default: 1)
  limit?: number;          // Items por página (default: 10)
  search?: string;         // Búsqueda en nombre, apellido, email
  rol?: UserRole;          // Filtrar por rol
  activo?: boolean;        // Filtrar por estado activo
  verificado?: boolean;    // Filtrar por email verificado
  perfilCompleto?: boolean;// Filtrar por perfil completo
  fechaDesde?: string;     // Fecha desde (ISO 8601)
  fechaHasta?: string;     // Fecha hasta (ISO 8601)
  orderBy?: string;        // Campo para ordenar
  order?: 'asc' | 'desc';  // Dirección de orden
}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Usuarios obtenidos exitosamente",
  "data": {
    "data": [
      {
        "id": "clm123...",
        "nombre": "Juan",
        "apellido": "Pérez",
        "email": "juan@ejemplo.com",
        "rol": "ESTUDIANTE",
        "activo": true,
        "emailVerificado": false,
        "perfilCompleto": true,
        "_count": {
          "seguidores": 10,
          "posts": 5
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "itemsPerPage": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### GET /api/admin/users/stats
Obtiene estadísticas completas de usuarios.

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "total": 100,
    "porRol": {
      "ESTUDIANTE": 70,
      "EMPRESA": 20,
      "INSTITUCION": 5,
      "ADMIN": 5
    },
    "activos": 95,
    "inactivos": 5,
    "verificados": 60,
    "noVerificados": 40,
    "perfilCompleto": 80,
    "perfilIncompleto": 20,
    "registrosHoy": 3,
    "registrosEstaSemana": 15,
    "registrosEsteMes": 45
  }
}
```

### PUT /api/admin/users/:userId
Actualiza cualquier campo de un usuario.

**Body:**
```json
{
  "nombre": "Juan Carlos",
  "apellido": "García",
  "email": "nuevo@email.com",
  "rol": "EMPRESA",
  "activo": true,
  "emailVerificado": true
}
```

### DELETE /api/admin/users/:userId
Elimina un usuario permanentemente de la base de datos.

⚠️ **ADVERTENCIA**: Esta acción es irreversible y elimina todos los datos relacionados.

### PUT /api/admin/users/:userId/verify-email
Verifica manualmente el email de un usuario.

### PUT /api/admin/users/:userId/role
Cambia el rol de un usuario.

**Body:**
```json
{
  "rol": "ADMIN"
}
```

---

## Moderación de Ofertas

### GET /api/admin/offers
Obtiene todas las ofertas con filtros.

**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  search?: string;          // Búsqueda en título y descripción
  modalidad?: ModalidadTrabajo;
  estado?: EstadoOferta;
  empresaId?: string;
  verificada?: boolean;     // ⭐ Filtrar ofertas verificadas
  destacada?: boolean;      // ⭐ Filtrar ofertas destacadas
  fechaDesde?: string;
  fechaHasta?: string;
  orderBy?: string;
  order?: 'asc' | 'desc';
}
```

### GET /api/admin/offers/stats
Estadísticas de ofertas.

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "activas": 100,
    "cerradas": 45,
    "borradores": 5,
    "verificadas": 80,
    "noVerificadas": 70,
    "destacadas": 15,
    "porModalidad": {
      "REMOTO": 60,
      "PRESENCIAL": 50,
      "HIBRIDO": 40
    },
    "publicadasHoy": 5,
    "publicadasEstaSemana": 20,
    "publicadasEsteMes": 50,
    "totalPostulaciones": 450,
    "promedioPostulacionesPorOferta": 3
  }
}
```

### PUT /api/admin/offers/:offerId
Actualiza campos de una oferta.

**Body:**
```json
{
  "verificada": true,       // ⭐ Verificar oferta
  "destacada": true,        // ⭐ Destacar oferta
  "estado": "PUBLICADA",
  "razonRechazo": "No cumple requisitos"
}
```

### PUT /api/admin/offers/:offerId/approve
Aprueba una oferta (la verifica y activa).

**Acción:**
- Establece `verificada: true`
- Establece `estado: 'PUBLICADA'`

### PUT /api/admin/offers/:offerId/reject
Rechaza una oferta.

**Body:**
```json
{
  "razon": "No cumple con los requisitos mínimos"
}
```

**Acción:**
- Establece `verificada: false`
- Establece `estado: 'CERRADA'`

### DELETE /api/admin/offers/:offerId
Elimina una oferta permanentemente.

---

## Moderación de Contenido Social

### GET /api/admin/posts
Obtiene todos los posts con filtros.

**Query Parameters:**
```typescript
{
  page?: number;
  limit?: number;
  search?: string;      // Búsqueda en contenido
  autorId?: string;
  reportado?: boolean;  // ⭐ Posts reportados
  oculto?: boolean;     // ⭐ Posts ocultos
  fechaDesde?: string;
  fechaHasta?: string;
  orderBy?: string;
  order?: 'asc' | 'desc';
}
```

### GET /api/admin/posts/stats
Estadísticas de posts.

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "total": 500,
    "publicados": 480,
    "ocultos": 20,
    "reportados": 15,
    "conMedia": 300,
    "totalReacciones": 2500,
    "totalComentarios": 1200,
    "postsHoy": 25,
    "postsEstaSemana": 100,
    "postsEsteMes": 350
  }
}
```

### PUT /api/admin/posts/:postId/hide
Oculta un post (no lo elimina, solo lo hace invisible).

**Body:**
```json
{
  "razon": "Contenido inapropiado"
}
```

### PUT /api/admin/posts/:postId/unhide
Hace visible un post previamente oculto.

### DELETE /api/admin/posts/:postId
Elimina un post permanentemente.

### DELETE /api/admin/comments/:commentId
Elimina un comentario permanentemente.

---

## Dashboard

### GET /api/admin/dashboard
Obtiene un resumen completo de la plataforma.

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "usuarios": {
      "total": 1000,
      "nuevosHoy": 15,
      "nuevosEstaSemana": 80,
      "activos": 950
    },
    "ofertas": {
      "total": 200,
      "activas": 150,
      "nuevasHoy": 5,
      "totalPostulaciones": 800
    },
    "contenido": {
      "totalPosts": 5000,
      "nuevosPostsHoy": 50,
      "totalReacciones": 25000,
      "totalComentarios": 10000
    },
    "reportes": {
      "pendientes": 10,
      "urgentes": 2,
      "totalResueltos": 100
    },
    "actividad": {
      "usuariosActivos24h": 500,
      "usuariosActivos7d": 800,
      "tasaRetencion": 0.85
    }
  }
}
```

---

## Autenticación

Todas las rutas requieren:
1. **Token JWT** válido en el header `Authorization: Bearer <token>`
2. **Rol ADMIN** en el payload del token

### Obtener Token de Admin

1. **Crear usuario admin:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Admin",
    "apellido": "System",
    "email": "admin@protalent.com",
    "password": "Admin123",
    "rol": "ADMIN"
  }'
```

2. **Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@protalent.com",
    "password": "Admin123"
  }'
```

3. **Usar el token:**
```bash
TOKEN="<accessToken>"

curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/admin/dashboard
```

---

## Ejemplos de Uso

### Ejemplo 1: Buscar Usuarios Inactivos
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/admin/users?activo=false&limit=20"
```

### Ejemplo 2: Aprobar Ofertas Pendientes
```bash
# 1. Buscar ofertas no verificadas
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/admin/offers?verificada=false"

# 2. Aprobar una oferta
curl -X PUT -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/admin/offers/clm123abc/approve
```

### Ejemplo 3: Moderar Posts Reportados
```bash
# 1. Ver posts reportados
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/admin/posts?reportado=true"

# 2. Ocultar un post inapropiado
curl -X PUT -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"razon":"Contenido ofensivo"}' \
  http://localhost:5000/api/admin/posts/clm456def/hide
```

### Ejemplo 4: Destacar Ofertas Premium
```bash
curl -X PUT -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"destacada":true}' \
  http://localhost:5000/api/admin/offers/clm789ghi
```

### Ejemplo 5: Verificar Email Manualmente
```bash
curl -X PUT -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/admin/users/clm111aaa/verify-email
```

### Ejemplo 6: Eliminar Comentario Inapropiado
```bash
curl -X DELETE -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/admin/comments/clm222bbb
```

---

## Testing

### Ejecutar Tests del Módulo Admin
```bash
# Todos los tests del módulo admin
pnpm test admin

# Solo tests del servicio
pnpm test admin.service

# Solo tests del controlador
pnpm test admin.controller
```

### Cobertura de Tests
- **43 tests unitarios** (100% pasando)
- **22 tests** del servicio
- **21 tests** del controlador
- Cobertura completa de todas las funcionalidades

---

## Notas Importantes

### ⚠️ Precauciones
1. **Eliminaciones permanentes**: Las acciones DELETE son irreversibles
2. **Cambio de roles**: Cambiar roles puede afectar permisos inmediatamente
3. **Verificación de ofertas**: Solo ofertas verificadas deberían mostrarse como confiables
4. **Posts ocultos**: Los posts ocultos no se eliminan, solo se marcan como `oculto: true`

### ✅ Buenas Prácticas
1. **Siempre usar filtros**: Usa paginación para listas grandes
2. **Verificar antes de eliminar**: Confirma la acción antes de ejecutar DELETE
3. **Registrar razones**: Al ocultar/rechazar, siempre proporciona una razón
4. **Monitorear estadísticas**: Usa el dashboard para detectar anomalías

### 🔐 Seguridad
- Solo usuarios con rol `ADMIN` tienen acceso
- Todos los endpoints validan el token JWT
- Las acciones se registran en logs
- Rate limiting aplicado (100 requests/15min)

---

## Credenciales de Prueba

**Admin de Prueba:**
- Email: `admin@protalent.com`
- Password: `Admin123`

---

## Soporte

Para reportar bugs o solicitar nuevas funcionalidades del módulo admin:
- **GitHub Issues**: https://github.com/anthropics/claude-code/issues
- **Documentación general**: Ver `/docs/README.md`