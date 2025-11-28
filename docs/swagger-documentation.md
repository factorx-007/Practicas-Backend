# Documentación API con Swagger - ProTalent

## 📚 Introducción

Se ha implementado **Swagger/OpenAPI 3.0.0** para la documentación interactiva de la API de ProTalent. Esta implementación sigue las mejores prácticas modernas de 2024 y proporciona una interfaz web completa para explorar y probar los endpoints de la API.

## 🚀 Acceso a la Documentación

### URLs de Acceso

- **Swagger UI (Interfaz Web)**: `http://localhost:5000/api-docs`
- **Especificación JSON**: `http://localhost:5000/api-docs.json`
- **API Root (Info General)**: `http://localhost:5000/`

### Cómo Iniciar

```bash
# Iniciar el servidor de desarrollo
pnpm dev

# La documentación estará disponible automáticamente en:
# http://localhost:5000/api-docs
```

## 🛠️ Características Implementadas

### Configuración Técnica

- **OpenAPI 3.0.0** (versión más reciente)
- **swagger-jsdoc 6.2.8** para generación automática desde comentarios
- **swagger-ui-express 5.0.1** para la interfaz web
- **TypeScript definitions** completas
- **Autenticación JWT** configurada con Bearer tokens

### Esquemas Definidos

#### Usuarios y Roles
- `UserRole`: ESTUDIANTE, EMPRESA, INSTITUCION, ADMIN
- `StudentType`: ESTUDIANTE, EGRESADO
- `User`: Esquema base de usuario
- `Student`: Perfil de estudiante (extiende User)
- `Company`: Perfil de empresa (extiende User)
- `Institution`: Perfil de institución (extiende User)

#### Ofertas de Trabajo
- `ModalidadTrabajo`: TIEMPO_COMPLETO, MEDIO_TIEMPO, PRACTICA, etc.
- `EstadoOferta`: PUBLICADA, CERRADA, BORRADOR, PAUSADA
- `EstadoPostulacion`: PENDIENTE, EN_REVISION, ACEPTADA, RECHAZADA, ENTREVISTA
- `Offer`: Esquema completo de oferta
- `Application`: Esquema de postulación

#### Respuestas Estándar
- `ApiResponse`: Respuesta estándar de la API
- `PaginatedResponse`: Respuesta paginada
- `ValidationError`: Errores de validación
- `Error`: Errores generales

### Endpoints Documentados

#### 🔐 Authentication (`/api/auth`)
- `POST /register` - Registrar nuevo usuario
- `POST /login` - Iniciar sesión
- `GET /me` - Obtener información del usuario autenticado
- `POST /google` - Autenticación con Google OAuth (sin documentar)
- `POST /refresh` - Refrescar tokens (sin documentar)
- `POST /logout` - Cerrar sesión (sin documentar)

#### 👥 Users (`/api/users`)
- Endpoints de gestión de usuarios (pendiente de documentar)

#### 💼 Offers (`/api/offers`)
- `GET /search` - Buscar ofertas con filtros avanzados
- `POST /` - Crear nueva oferta (solo empresas)
- Otros endpoints de ofertas (pendiente de documentar)

## 🔧 Configuración Técnica

### Archivos Clave

```
src/
├── config/
│   └── swagger.ts          # Configuración principal de Swagger
├── routes/
│   ├── auth.routes.ts      # Endpoints documentados
│   ├── offers.routes.ts    # Endpoints documentados
│   └── users.routes.ts     # Pendiente de documentar
└── app.ts                  # Integración de Swagger
```

### Variables de Entorno

```env
# API Configuration
API_BASE_URL=http://localhost:5000
PORT=5000
```

### Configuración de Swagger

```typescript
// src/config/swagger.ts
const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ProTalent API',
      version: '1.0.0',
      description: 'API Backend para la plataforma ProTalent'
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:5000',
        description: 'Servidor de Desarrollo'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  }
}
```

## 📝 Cómo Documentar Endpoints

### Formato de Documentación

Los endpoints se documentan usando comentarios JSDoc con sintaxis de OpenAPI:

```typescript
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Iniciar sesión
 *     description: Permite a un usuario iniciar sesión con email y contraseña
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "juan.perez@ejemplo.com"
 *               password:
 *                 type: string
 *                 example: "miPassword123"
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
```

### Elementos Importantes

1. **Tags**: Agrupa endpoints por módulo
2. **Security**: Define autenticación requerida
3. **RequestBody**: Esquema de datos de entrada
4. **Responses**: Respuestas posibles con códigos HTTP
5. **Examples**: Ejemplos reales de uso
6. **References**: Referencias a esquemas reutilizables

## 🔄 Próximos Pasos

### Endpoints Pendientes de Documentar

#### Auth Module
- `POST /api/auth/google` - Google OAuth
- `POST /api/auth/refresh` - Refresh tokens
- `POST /api/auth/logout` - Cerrar sesión
- `POST /api/auth/change-password` - Cambiar contraseña

#### Users Module
- `GET /api/users/me` - Perfil propio
- `PUT /api/users/me` - Actualizar perfil
- `PUT /api/users/me/student` - Actualizar perfil estudiante
- `PUT /api/users/me/company` - Actualizar perfil empresa
- `GET /api/users/search` - Buscar usuarios
- `POST /api/users/:userId/follow` - Seguir usuario

#### Offers Module
- `GET /api/offers/:id` - Obtener oferta por ID
- `PUT /api/offers/:id` - Actualizar oferta
- `DELETE /api/offers/:id` - Eliminar oferta
- `POST /api/offers/:id/apply` - Postularse a oferta
- `GET /api/offers/:id/applications` - Ver postulaciones

### Mejoras Futuras

1. **Autenticación en Swagger UI**: Configurar token JWT en la interfaz
2. **Ejemplos Reales**: Agregar más ejemplos de respuestas
3. **Validaciones**: Documentar todas las validaciones de entrada
4. **Códigos de Error**: Documentar todos los códigos de error específicos
5. **Modelos Anidados**: Documentar relaciones entre modelos

## 📊 Beneficios de la Implementación

### Para Desarrolladores
- **Documentación Automática**: Se actualiza con los cambios en el código
- **Testing Interactivo**: Probar endpoints directamente desde la interfaz
- **Validación**: Verificar estructura de requests/responses
- **IntelliSense**: Autocompletado en IDEs compatibles

### Para el Equipo
- **Onboarding Rápido**: Nuevos desarrolladores pueden entender la API fácilmente
- **Comunicación**: Facilita la comunicación entre frontend y backend
- **Estándares**: Mantiene consistencia en el diseño de la API
- **Documentación Viva**: Siempre sincronizada con el código

### Para el Frontend
- **Contratos Claros**: Especificaciones exactas de cada endpoint
- **Generación de Clientes**: Posibilidad de generar clientes TypeScript automáticamente
- **Mockeo**: Facilita la creación de mocks para testing

## 🛡️ Seguridad

### Autenticación JWT
- **Bearer Authentication**: Configurado para todos los endpoints protegidos
- **Token Examples**: Documentados en la interfaz
- **Scopes**: Definidos por roles de usuario

### Validaciones
- **Input Validation**: Todas las validaciones están documentadas
- **Error Responses**: Códigos de error estándar definidos
- **Rate Limiting**: Configurado en el servidor (no documentado aún)

## 🔗 Enlaces Útiles

- [OpenAPI 3.0.0 Specification](https://swagger.io/specification/)
- [Swagger JSDoc Documentation](https://github.com/Surnet/swagger-jsdoc)
- [Swagger UI Express](https://github.com/scottie1984/swagger-ui-express)
- [TypeScript Swagger Best Practices](https://tsed.dev/tutorials/swagger.html)

---

**Nota**: Esta implementación sigue las mejores prácticas de 2024 y utiliza únicamente librerías modernas y mantenidas activamente.