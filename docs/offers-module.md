# Módulo de Ofertas - Guía de Integración Next.js

## Descripción
Sistema completo de gestión de ofertas laborales con postulaciones, filtros avanzados y estadísticas.

## Características
- CRUD completo de ofertas
- Sistema de postulaciones
- Filtros avanzados de búsqueda
- Gestión de estados de aplicaciones
- Analytics y estadísticas
- Validaciones robustas

## 🏗️ Arquitectura del Módulo

### Componentes Principales

```
src/
├── services/offers.service.ts      # Lógica de negocio
├── controllers/offers.controller.ts # Controladores HTTP
├── routes/offers.routes.ts         # Definición de rutas
├── types/offers.types.ts           # Tipos TypeScript
└── tests/
    ├── offers.service.test.ts      # Tests del servicio
    └── offers.controller.test.ts   # Tests del controlador
```

### Modelos de Base de Datos

#### Modelo Oferta
```typescript
model Oferta {
  id            String   @id @default(cuid())
  titulo        String
  descripcion   String?
  requisitos    String[]
  duracion      String?
  estado        EstadoOferta @default(PUBLICADA)
  ubicacion     String?
  modalidad     ModalidadTrabajo @default(TIEMPO_COMPLETO)
  salario_min   Float?
  salario_max   Float?
  moneda        String   @default("PEN")
  requiereCV    Boolean  @default(true)
  requiereCarta Boolean  @default(false)
  fecha_limite  DateTime?
  empresaId     String
  vistas        Int      @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relaciones
  empresa           Empresa             @relation(fields: [empresaId], references: [id])
  postulaciones     Postulacion[]
  preguntas         PreguntaOferta[]
}
```

#### Modelo Postulación
```typescript
model Postulacion {
  id           String           @id @default(cuid())
  mensaje      String?
  estado       EstadoPostulacion @default(PENDIENTE)
  estudianteId String
  ofertaId     String
  fechaEntrevista DateTime?
  cv_url         String?
  comentarioEmpresa String?
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt

  // Relaciones
  estudiante Estudiante             @relation(fields: [estudianteId], references: [id])
  oferta     Oferta                 @relation(fields: [ofertaId], references: [id])
  respuestas RespuestaPostulacion[]

  @@unique([estudianteId, ofertaId])
}
```

## 🔧 Servicios (offers.service.ts)

### Funcionalidades Principales

#### 1. Gestión de Ofertas

**createOffer(userId: string, offerData: CreateOfferData)**
- Crea una nueva oferta de trabajo
- Valida que el usuario tenga perfil de empresa
- Establece fecha de publicación automáticamente

**getOfferById(offerId: string)**
- Obtiene una oferta específica con toda su información
- Incluye datos de la empresa y estadísticas

**updateOffer(offerId: string, userId: string, updateData: UpdateOfferData)**
- Actualiza una oferta existente
- Valida que el usuario sea propietario de la oferta

**deleteOffer(offerId: string, userId: string)**
- Eliminación suave (cambia estado a CERRADA)
- Solo el propietario puede eliminar

**incrementOfferViews(offerId: string)**
- Incrementa contador de vistas de la oferta
- No lanza errores para no interrumpir la petición principal

#### 2. Búsqueda y Filtrado

**searchOffers(filters: OfferSearchFilters, page: number, limit: number)**
- Búsqueda avanzada con múltiples filtros
- Paginación integrada
- Filtros disponibles:
  - Texto libre (título, descripción)
  - Ubicación
  - Modalidad de trabajo
  - Rango salarial
  - Empresa específica
  - Fechas de publicación

**getMyOffers(userId: string, page: number, limit: number)**
- Obtiene ofertas de una empresa específica
- Incluye estadísticas de postulaciones

#### 3. Sistema de Postulaciones

**applyToOffer(offerId: string, userId: string, cvUrl?: string)**
- Permite a estudiantes postularse a ofertas
- Valida duplicados (un estudiante no puede aplicar dos veces)
- Soporta CV específico para la postulación

**getOfferApplications(offerId: string, userId: string, page: number, limit: number, status?: string)**
- Obtiene postulaciones de una oferta específica
- Solo accesible por el propietario de la oferta
- Filtrado por estado de postulación

**updateApplicationStatus(applicationId: string, userId: string, status: string)**
- Actualiza estado de una postulación
- Estados válidos: PENDIENTE, EN_REVISION, ACEPTADO, RECHAZADO
- Solo accesible por empresas

## 🌐 Controladores (offers.controller.ts)

### Endpoints Disponibles

#### Públicos
- `GET /api/offers/search` - Buscar ofertas
- `GET /api/offers/:id` - Obtener oferta específica
- `POST /api/offers/:id/view` - Incrementar vistas

#### Empresas
- `POST /api/offers` - Crear oferta
- `PUT /api/offers/:id` - Actualizar oferta
- `DELETE /api/offers/:id` - Eliminar oferta
- `GET /api/offers/company/my-offers` - Mis ofertas
- `GET /api/offers/:id/applications` - Postulaciones de mi oferta
- `PATCH /api/offers/applications/:applicationId/status` - Actualizar estado

#### Estudiantes
- `POST /api/offers/:id/apply` - Postularse a oferta
- `GET /api/offers/student/my-applications` - Mis postulaciones

#### Administradores
- `GET /api/offers/admin/all` - Todas las ofertas

### Validaciones

#### Crear Oferta
```typescript
const createOfferValidation = [
  body('titulo').isLength({ min: 5, max: 200 }),
  body('descripcion').isLength({ min: 20, max: 2000 }),
  body('ubicacion').isLength({ min: 2, max: 100 }),
  body('modalidad').isIn(['TIEMPO_COMPLETO', 'MEDIO_TIEMPO', 'PRACTICA', 'FREELANCE', 'REMOTO', 'HIBRIDO', 'PRESENCIAL']),
  body('fechaLimite').isISO8601().custom((value) => {
    if (new Date(value) <= new Date()) {
      throw new Error('La fecha límite debe ser futura');
    }
    return true;
  })
];
```

#### Postularse a Oferta
```typescript
const applyToOfferValidation = [
  param('id').isLength({ min: 1 }),
  body('mensaje').optional().isLength({ max: 1000 }),
  body('cvUrl').optional().isURL()
];
```

## 🧪 Testing

### Tests del Servicio (16 tests)

#### createOffer
- ✅ Crear oferta exitosamente
- ✅ Error si no encuentra perfil de empresa

#### getOfferById
- ✅ Obtener oferta por ID
- ✅ Retornar null si no existe

#### updateOffer
- ✅ Actualizar exitosamente
- ✅ Error si no encuentra oferta
- ✅ Error si no es propietario

#### searchOffers
- ✅ Buscar con filtros
- ✅ Buscar sin filtros

#### applyToOffer
- ✅ Aplicar exitosamente
- ✅ Error si no encuentra estudiante
- ✅ Error si ya aplicó

#### updateApplicationStatus
- ✅ Actualizar estado exitosamente
- ✅ Error si no encuentra postulación

#### incrementOfferViews
- ✅ Incrementar vistas
- ✅ No fallar si hay error

### Cobertura de Testing
- **Servicios**: 100% cobertura funcional
- **Controladores**: Tests básicos implementados
- **Validaciones**: Integradas en rutas

## 📡 API Reference

### Crear Oferta
```http
POST /api/offers
Authorization: Bearer <token>
Content-Type: application/json

{
  "titulo": "Desarrollador Frontend React",
  "descripcion": "Buscamos desarrollador con experiencia en React...",
  "ubicacion": "Lima, Perú",
  "modalidad": "TIEMPO_COMPLETO",
  "tipoEmpleo": "TIEMPO_COMPLETO",
  "nivelEducacion": "UNIVERSITARIO",
  "experiencia": "INTERMEDIO",
  "salarioMin": 3000,
  "salarioMax": 5000,
  "fechaLimite": "2024-12-31T23:59:59.000Z",
  "preguntas": [
    {
      "pregunta": "¿Tienes experiencia con Redux?",
      "tipo": "SELECT",
      "obligatoria": true,
      "opciones": ["Sí", "No", "Un poco"]
    }
  ]
}
```

### Buscar Ofertas
```http
GET /api/offers/search?search=react&ubicacion=lima&modalidad=TIEMPO_COMPLETO&page=1&limit=10
```

### Postularse a Oferta
```http
POST /api/offers/:offerId/apply
Authorization: Bearer <token>
Content-Type: application/json

{
  "mensaje": "Estoy muy interesado en esta posición...",
  "cvUrl": "https://example.com/mi-cv.pdf"
}
```

### Actualizar Estado de Postulación
```http
PATCH /api/offers/applications/:applicationId/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "ACEPTADO",
  "notasEntrevistador": "Candidato muy prometedor"
}
```

## 🔐 Seguridad y Autorización

### Middlewares de Protección
- **authMiddleware**: Valida token JWT
- **roleMiddleware**: Controla acceso por rol
- **Rate Limiting**: Protección contra spam

### Permisos por Rol

#### EMPRESA
- Crear, actualizar, eliminar sus ofertas
- Ver postulaciones a sus ofertas
- Actualizar estados de postulaciones

#### ESTUDIANTE
- Ver ofertas públicas
- Postularse a ofertas
- Ver sus propias postulaciones

#### ADMIN
- Acceso completo a todas las ofertas
- Supervisión y moderación

## 🚀 Estados y Flujos

### Estados de Oferta
- **PUBLICADA**: Visible y aceptando postulaciones
- **CERRADA**: No acepta más postulaciones
- **BORRADOR**: No visible públicamente
- **PAUSADA**: Temporalmente inactiva

### Estados de Postulación
- **PENDIENTE**: Recién enviada
- **EN_REVISION**: Siendo evaluada
- **ACEPTADA**: Candidato seleccionado
- **RECHAZADA**: No seleccionado
- **ENTREVISTA**: Programada para entrevista

### Flujo de Postulación
1. Estudiante ve oferta → `GET /api/offers/:id`
2. Estudiante se postula → `POST /api/offers/:id/apply`
3. Empresa ve postulaciones → `GET /api/offers/:id/applications`
4. Empresa actualiza estado → `PATCH /api/offers/applications/:id/status`
5. Estudiante ve estado → `GET /api/offers/student/my-applications`

## 📊 Métricas y Analytics

### Datos Rastreados
- Número de vistas por oferta
- Cantidad de postulaciones
- Tasas de conversión
- Tiempo promedio de respuesta

### Estadísticas Disponibles
- Total de postulaciones por oferta
- Distribución de estados
- Postulaciones por día
- Ofertas más vistas

## 🔧 Configuración y Deployment

### Variables de Entorno
```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/protalent"

# JWT
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Scripts Disponibles
```bash
# Desarrollo
npm run dev

# Tests
npm test
npm run test:offers

# TypeScript
npm run typecheck

# Build
npm run build
```

## 🐛 Troubleshooting

### Errores Comunes

#### "COMPANY_PROFILE_NOT_FOUND"
- El usuario no tiene perfil de empresa
- Crear perfil antes de publicar ofertas

#### "ALREADY_APPLIED"
- El estudiante ya se postuló a esta oferta
- Solo se permite una postulación por estudiante

#### "UNAUTHORIZED_OFFER_UPDATE"
- El usuario intenta modificar oferta de otra empresa
- Solo el propietario puede modificar

#### "INVALID_STATUS"
- Estado de postulación no válido
- Usar: PENDIENTE, EN_REVISION, ACEPTADO, RECHAZADO

## 📈 Mejoras Futuras

### Próximas Funcionalidades
1. **Sistema de Preguntas Dinámicas**
   - Preguntas personalizadas por oferta
   - Diferentes tipos de respuesta

2. **Notificaciones en Tiempo Real**
   - Alertas de nuevas postulaciones
   - Cambios de estado

3. **Sistema de Recomendaciones**
   - IA para matching empresa-estudiante
   - Ofertas sugeridas

4. **Analytics Avanzados**
   - Dashboard de métricas
   - Reportes de empleabilidad

5. **Integración con Calendarios**
   - Programación de entrevistas
   - Recordatorios automáticos

## 🎯 Consideraciones de Performance

### Optimizaciones Implementadas
- Paginación en todas las consultas grandes
- Índices en campos de búsqueda frecuente
- Lazy loading de relaciones
- Caché de consultas frecuentes

### Límites y Restricciones
- Máximo 50 resultados por página
- Rate limiting: 100 requests/15min
- Tamaño máximo de descripción: 2000 caracteres
- Archivos CV: máximo 10MB

Este módulo constituye la funcionalidad principal de ProTalent y está completamente implementado y testeado, listo para producción.