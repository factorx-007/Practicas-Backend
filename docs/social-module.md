# Módulo Social - ProTalent Backend

## Descripción General

El módulo social de ProTalent permite a los usuarios crear posts, interactuar a través de comentarios y reacciones, y mantener un feed personalizado. Es el corazón de la interacción social de la plataforma.

## Características Implementadas

### ✅ Posts
- **Creación de posts** con contenido de texto
- **Subida de multimedia** (imágenes y videos) vía Cloudinary
- **Control de privacidad** (público, conexiones, privado)
- **CRUD completo** (crear, leer, actualizar, eliminar)
- **Búsqueda avanzada** con filtros y paginación
- **Validación robusta** de contenido y datos

### ✅ Comentarios
- **Sistema de comentarios anidados** (respuestas a comentarios)
- **CRUD completo** para comentarios
- **Validación de permisos** (solo comentar en posts visibles)
- **Paginación** de comentarios por post
- **Ordenamiento** por fecha o popularidad

### ✅ Reacciones
- **6 tipos de reacciones**: LIKE, LOVE, HAHA, WOW, SAD, ANGRY
- **Toggle inteligente**: crear, actualizar o eliminar reacciones
- **Reacciones a posts y comentarios**
- **Prevención de reacciones duplicadas**

### ✅ Feed Personalizado
- **Feed basado en conexiones** (usuarios seguidos)
- **Incluye posts propios** en el feed
- **Filtrado automático** de posts privados
- **Ordenamiento configurable**
- **Paginación eficiente**

## Estructura del Módulo

```
src/
├── controllers/
│   └── social.controller.ts      # 11 endpoints principales
├── routes/
│   └── social.routes.ts          # Rutas con validación completa
├── types/
│   └── social.types.ts           # Interfaces y DTOs
└── middleware/
    └── upload.middleware.ts      # Manejo de archivos multimedia
```

## Endpoints Disponibles

### Posts
- `POST /api/social/posts` - Crear post (con multimedia opcional)
- `GET /api/social/posts` - Listar posts con filtros
- `GET /api/social/posts/:id` - Obtener post específico
- `PUT /api/social/posts/:id` - Actualizar post propio
- `DELETE /api/social/posts/:id` - Eliminar post propio

### Comentarios
- `POST /api/social/comentarios` - Crear comentario
- `GET /api/social/comentarios` - Listar comentarios por post
- `PUT /api/social/comentarios/:id` - Actualizar comentario propio
- `DELETE /api/social/comentarios/:id` - Eliminar comentario propio

### Reacciones
- `POST /api/social/reacciones` - Crear/actualizar/eliminar reacción

### Feed
- `GET /api/social/feed` - Obtener feed personalizado

## Validaciones Implementadas

### Posts
- Contenido: 1-2000 caracteres
- Privacidad: booleano opcional
- Multimedia: máximo 5 imágenes, 2 videos
- Tipos de archivo permitidos vía Cloudinary

### Comentarios
- Contenido: 1-1000 caracteres
- Validación de post existente
- Validación de permisos para comentar
- Soporte para comentarios padre (respuestas)

### Reacciones
- Tipo válido según enum TipoReaccion
- Validación de post/comentario existente
- Prevención de reacciones duplicadas

## Características de Seguridad

### Autenticación y Autorización
- **JWT requerido** en todos los endpoints
- **Validación de propiedad** para operaciones de edición/eliminación
- **Control de privacidad** para visualización de posts
- **Validación de permisos** para comentarios en posts privados

### Validación de Datos
- **express-validator** en todas las rutas
- **Sanitización automática** de entrada
- **Validación de tipos** estricta con TypeScript
- **Manejo seguro de archivos** con Cloudinary

### Rate Limiting
- Aplicado a nivel de aplicación (`/api/*`)
- Configuración por variables de entorno
- Protección contra spam

## Testing

### Cobertura de Tests
- **13 tests unitarios** del controlador social
- **Cobertura completa** de todos los endpoints principales
- **Mocks configurados** para Prisma, logger y validadores
- **Tests de casos de error** y casos exitosos

### Tipos de Tests
- Creación de posts (con y sin multimedia)
- Obtención de posts (con filtros y paginación)
- Posts específicos y control de privacidad
- Creación y gestión de comentarios
- Sistema de reacciones (crear, actualizar, eliminar)
- Feed personalizado con conexiones

## Configuración de Base de Datos

### Modelos Prisma Utilizados
- `Post` - Posts de usuarios
- `Comentario` - Comentarios en posts
- `Reaccion` - Reacciones a posts/comentarios
- `Follow` - Relaciones de seguimiento (para feed)
- `Usuario` - Información de usuarios

### Relaciones
- Post ↔ Usuario (autor)
- Post ↔ Comentario (uno a muchos)
- Post ↔ Reaccion (uno a muchos)
- Comentario ↔ Usuario (autor)
- Comentario ↔ Comentario (respuestas anidadas)
- Usuario ↔ Follow (seguidor/seguido)

## Integración con Cloudinary

### Subida de Archivos
- **Configuración automática** al iniciar servidor
- **Tipos permitidos**: imágenes (JPG, PNG, GIF, WebP), videos (MP4, WebM)
- **Límites configurables**: tamaño máximo por archivo
- **Transformaciones automáticas** para optimización
- **URLs seguras** retornadas para almacenamiento

### Middleware de Upload
- `uploadPostMedia` - Manejo específico para posts
- **Validación de tipos** de archivo
- **Manejo de errores** de Multer/Cloudinary
- **Limpieza automática** en caso de error

## Variables de Entorno Requeridas

```env
# Cloudinary (para multimedia)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Performance y Optimización

### Base de Datos
- **Paginación eficiente** en todas las consultas
- **Índices automáticos** por Prisma en campos de búsqueda
- **Consultas optimizadas** con includes selectivos
- **Conteo paralelo** para paginación

### API
- **Compresión** habilitada en respuestas
- **Caché de headers** para archivos estáticos
- **Límites de tamaño** en requests JSON
- **Logging estructurado** para monitoreo

## Documentación API

### Swagger/OpenAPI
- **Documentación completa** de todos los endpoints
- **Esquemas definidos** para requests/responses
- **Ejemplos de uso** incluidos
- **Validaciones documentadas**
- **Disponible en**: `http://localhost:5000/api-docs`

### Schemas Documentados
- `Post` - Estructura completa de posts
- `Comentario` - Estructura de comentarios
- `Reaccion` - Tipos de reacciones
- `CreatePostRequest` - DTOs de creación
- `PostsResponse` - Respuestas paginadas

## Estado del Módulo

### ✅ Completado
- Implementación completa de funcionalidades
- Tests unitarios comprehensivos (13 tests)
- Documentación Swagger completa
- Integración con upload de archivos
- Validaciones robustas
- Manejo de errores consistente
- Logging estructurado

### 🔄 Próximas Mejoras Sugeridas
- **Tests de integración** E2E
- **Métricas de engagement** (likes, shares, views)
- **Sistema de hashtags** y menciones
- **Notificaciones push** para interacciones
- **Feed algorítmico** basado en ML
- **Moderación automática** de contenido
- **Analytics de posts** para usuarios

## Comandos Útiles

```bash
# Ejecutar tests del módulo social
npx jest tests/unit/controllers/social.controller.test.ts

# Ejecutar todos los tests
pnpm test

# Ejecutar en modo development
pnpm run dev

# Ver documentación
open http://localhost:5000/api-docs
```

## Conclusión

El módulo social está **completamente implementado y testeado**, proporcionando una base sólida para las interacciones sociales en ProTalent. La implementación sigue las mejores prácticas de seguridad, performance y mantenibilidad, y está lista para producción.