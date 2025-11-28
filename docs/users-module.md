# Módulo de Usuarios y Perfiles - ProTalent Backend

## 📋 Descripción General

El módulo de usuarios gestiona los perfiles de todos los tipos de usuarios en la plataforma ProTalent: estudiantes, empresas, instituciones y administradores. Proporciona funcionalidades para crear, leer, actualizar perfiles específicos y gestionar relaciones sociales como seguir/no seguir usuarios.

## 🏗️ Arquitectura del Módulo

### Estructura de Archivos
```
src/
├── services/users.service.ts     # Lógica de negocio
├── controllers/users.controller.ts # Controladores HTTP
├── routes/users.routes.ts        # Definición de rutas
├── types/user.types.ts          # Tipos TypeScript
└── utils/validators.ts          # Validaciones específicas
```

## 🎯 Funcionalidades Principales

### 1. Gestión de Perfiles
- **Perfiles por Rol**: Cada tipo de usuario (estudiante, empresa, institución) tiene campos específicos
- **Información Básica**: Nombre, apellido, email, avatar para todos los usuarios
- **Perfiles Específicos**: 
  - Estudiantes: carrera, universidad, habilidades, CV, portafolio
  - Empresas: RUC, nombre comercial, rubro, descripción, verificación
  - Instituciones: código institucional, tipo de institución

### 2. Sistema de Seguimiento
- **Seguir/No Seguir**: Los usuarios pueden seguirse entre sí
- **Validaciones**: No permite auto-seguimiento, verifica usuarios existentes
- **Estados**: Tracking de relaciones bidireccionales

### 3. Búsqueda y Filtrado
- **Búsqueda Global**: Por nombre, apellido, email
- **Filtros Avanzados**: Por rol, estado de verificación, estado activo
- **Paginación**: Resultados paginados con metadata

### 4. Administración
- **Activar/Desactivar**: Solo administradores pueden cambiar estados de cuenta
- **Gestión de Perfiles**: Completitud de perfiles automática

## 🔄 Flujo de Datos

### Obtener Perfil de Usuario
```
Cliente -> Router -> Controller -> Service -> Prisma -> Base de datos
                                      ↓
                               Verificar rol de usuario
                                      ↓
                              Obtener perfil específico
                                      ↓
Cliente <- Respuesta <- Controller <- Service <- Datos formateados
```

### Actualizar Perfil
```
Cliente -> Validación -> Middleware Auth -> Controller -> Service
                                                            ↓
                                                   Verificar permisos
                                                            ↓
                                                   Actualizar en BD
                                                            ↓
                                               Verificar completitud
                                                            ↓
Cliente <- Respuesta <- Controller <- Service <- Perfil actualizado
```

## 🛡️ Seguridad y Validaciones

### Autenticación y Autorización
- **JWT Required**: Todas las operaciones de modificación requieren autenticación
- **Role-Based Access**: Solo el propietario puede actualizar su perfil
- **Admin Privileges**: Administradores pueden gestionar cualquier usuario

### Validaciones de Entrada
- **Datos Básicos**: Nombre, apellido con formato válido
- **Emails**: Validación de formato y unicidad
- **URLs**: Validación de formato para portafolios, LinkedIn, GitHub
- **Teléfonos**: Formato válido para números telefónicos
- **Habilidades**: Array de strings con longitud limitada

### Validaciones de Negocio
- **RUC Único**: Para empresas, validación de formato y unicidad
- **Código Institucional**: Para instituciones, debe ser único
- **Auto-seguimiento**: Prevención de seguirse a sí mismo
- **Seguimiento Duplicado**: Prevención de seguimiento múltiple

## 📊 Modelos de Datos

### Usuario Base
```typescript
interface UserProfile {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  avatar?: string;
  rol: UserRole;
  activo: boolean;
  emailVerificado: boolean;
  perfilCompleto: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Estudiante
```typescript
interface StudentProfile extends UserProfile {
  cv?: string;
  carrera: string;
  universidad?: string;
  anio_ingreso?: number;
  anio_egreso?: number;
  telefono?: string;
  habilidades: string[];
  experiencia?: string;
  portafolio?: string;
  linkedin?: string;
  github?: string;
  ubicacion?: string;
  tipo: StudentType;
}
```

### Empresa
```typescript
interface CompanyProfile extends UserProfile {
  ruc: string;
  nombre_empresa: string;
  rubro: string;
  descripcion?: string;
  direccion?: string;
  telefono?: string;
  website?: string;
  logo_url?: string;
  verificada: boolean;
}
```

## 🔗 API Endpoints

### Endpoints Principales
| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| GET | `/api/users/me` | Obtener perfil propio | Requerida |
| PUT | `/api/users/me` | Actualizar info básica | Requerida |
| PUT | `/api/users/me/student` | Actualizar perfil estudiante | Estudiante |
| PUT | `/api/users/me/company` | Actualizar perfil empresa | Empresa |
| PUT | `/api/users/me/institution` | Actualizar perfil institución | Institución |
| GET | `/api/users/:userId` | Obtener perfil público | Opcional |
| GET | `/api/users/search` | Buscar usuarios | Opcional |
| POST | `/api/users/:userId/follow` | Seguir usuario | Requerida |
| DELETE | `/api/users/:userId/follow` | Dejar de seguir | Requerida |

### Administración (Solo Admin)
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| PUT | `/api/users/:userId/activate` | Activar usuario |
| PUT | `/api/users/:userId/deactivate` | Desactivar usuario |

## 🔧 Configuración y Uso

### Inicialización del Servicio
```typescript
import usersService from '../services/users.service';

// Obtener perfil de estudiante
const studentProfile = await usersService.getStudentProfile(userId);

// Actualizar perfil
const updatedProfile = await usersService.updateStudentProfile(userId, updateData);

// Seguir usuario
const followInfo = await usersService.followUser(followerId, followedId);
```

### Validaciones Personalizadas
```typescript
// En routes
validators.student.updateProfile(),
validators.company.updateProfile(),
handleValidationErrors
```

## 📈 Métricas y Logging

### Eventos Loggeados
- Actualización de perfiles
- Seguimiento de usuarios
- Búsquedas de usuarios
- Activación/desactivación de cuentas
- Errores de validación y negocio

### Información de Context
- ID del usuario que realiza la acción
- Datos de actualización (sin información sensible)
- IP del cliente
- Timestamp de la operación

## 🚀 Escalabilidad y Rendimiento

### Optimizaciones Implementadas
- **Queries Selectivos**: Solo campos necesarios en consultas
- **Paginación**: Resultados limitados y paginados
- **Índices de BD**: En campos de búsqueda frecuente
- **Validaciones Tempranas**: Fallos rápidos en validaciones

### Consideraciones Futuras
- **Caché de Perfiles**: Redis para perfiles frecuentemente accedidos
- **Búsqueda Avanzada**: ElasticSearch para búsquedas complejas
- **Compresión de Imágenes**: Optimización automática de avatares
- **CDN**: Para archivos estáticos (CVs, logos)

## 🧪 Testing

### Casos de Prueba Principales
- Creación y actualización de perfiles por rol
- Validaciones de entrada y negocio
- Sistema de seguimiento (seguir/no seguir)
- Búsqueda y filtrado
- Autorización por roles
- Gestión de errores

### Configuración de Tests
```typescript
// Estructura de tests
describe('Users Module', () => {
  describe('Profile Management', () => {
    test('should update student profile');
    test('should validate required fields');
    test('should check profile completion');
  });
  
  describe('Follow System', () => {
    test('should follow user successfully');
    test('should prevent self-following');
    test('should handle duplicate follows');
  });
});
```

## 🔄 Estados y Transiciones

### Estados de Usuario
- **Activo/Inactivo**: Control de acceso a la plataforma
- **Email Verificado/No Verificado**: Control de funcionalidades
- **Perfil Completo/Incompleto**: Determinado automáticamente

### Estados de Seguimiento
- **No Seguido**: Estado inicial
- **Seguido**: Relación activa
- **Removido**: Seguimiento eliminado

## 🛠️ Mantenimiento

### Tareas de Mantenimiento
- Verificación periódica de completitud de perfiles
- Limpieza de relaciones de seguimiento huérfanas
- Validación de consistencia de datos
- Monitoreo de patrones de uso

### Logs de Auditoría
- Cambios en perfiles con timestamp
- Actividades de seguimiento
- Acciones administrativas
- Intentos de acceso no autorizado