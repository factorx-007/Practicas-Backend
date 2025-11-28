# 🧪 Scripts de Testing Automático - ProTalent API

Este directorio contiene scripts de bash para testing automático de la API usando curl. Los scripts verifican que todos los endpoints funcionen correctamente y devuelvan las respuestas esperadas.

## 📋 Scripts Disponibles

### 🚀 Script Principal
- **`run-all-tests.sh`** - Ejecuta toda la suite de testing (unitarios + HTTP)

### 🔐 Scripts Individuales
- **`auth.sh`** - Testing del módulo de autenticación
- **`usuarios.sh`** - Testing del módulo de usuarios  
- **`ofertas.sh`** - Testing del módulo de ofertas

## 🛠️ Requisitos

### Dependencias del Sistema
```bash
# Ubuntu/Debian
sudo apt install curl jq

# macOS
brew install curl jq

# Windows (WSL)
sudo apt install curl jq
```

### Servidor Corriendo
```bash
# Terminal 1: Iniciar servidor
pnpm run dev

# Terminal 2: Ejecutar tests
./scripts/testing/run-all-tests.sh
```

## 🚀 Uso Rápido

### Ejecutar Todo
```bash
# Desde la raíz del proyecto
chmod +x scripts/testing/*.sh
./scripts/testing/run-all-tests.sh
```

### Ejecutar Módulos Individuales
```bash
# Solo autenticación
./scripts/testing/auth.sh

# Solo usuarios (requiere token de auth.sh)
./scripts/testing/usuarios.sh

# Solo ofertas (requiere token de auth.sh)
./scripts/testing/ofertas.sh
```

## 📊 Qué Testean los Scripts

### 🔐 Autenticación (`auth.sh`)
- ✅ Health check del servidor
- ✅ Registro de empresa
- ✅ Registro de estudiante
- ✅ Login empresa/estudiante
- ✅ Obtener perfil autenticado
- ✅ Refresh token
- ✅ Logout
- ❌ Acceso sin token (debe fallar)
- ❌ Credenciales inválidas (debe fallar)

### 👥 Usuarios (`usuarios.sh`)
- ✅ Obtener mi perfil
- ✅ Actualizar perfil básico
- ✅ Actualizar perfil empresa/estudiante
- ✅ Buscar usuarios con filtros
- ✅ Seguir/dejar de seguir usuarios
- ✅ Obtener seguidores/seguidos
- ✅ Búsquedas avanzadas
- ✅ Paginación
- ❌ Acceso sin token (debe fallar)

### 💼 Ofertas (`ofertas.sh`)
- ✅ Buscar ofertas (público)
- ✅ Crear ofertas (empresa autenticada)
- ✅ Actualizar ofertas
- ✅ Obtener ofertas específicas
- ✅ Incrementar vistas
- ✅ Mis ofertas (empresa)
- ✅ Postulaciones a ofertas
- ✅ Filtros avanzados
- ✅ Eliminación de ofertas
- ❌ Crear sin autenticación (debe fallar)

## 🎨 Formato de Salida

Los scripts usan códigos de color para facilitar la lectura:

- 🔵 **Azul**: Títulos y separadores
- 🟢 **Verde**: Respuestas exitosas (200-299)
- 🔴 **Rojo**: Errores y fallos
- 🟡 **Amarillo**: Advertencias y tips
- 🟣 **Púrpura**: Datos de request/response
- 🔷 **Cian**: Descripciones de acciones

### Ejemplo de Salida
```bash
🔄 Registro de Empresa
POST /auth/register
📤 Request Body:
{
  "nombre": "Tech Innovations SAC",
  "email": "admin@techinnovations.com",
  ...
}
📥 Response:
✅ Success (201)
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": { ... }
}
```

## 📁 Archivos Temporales

Los scripts crean archivos temporales para mantener estado:

- `/tmp/protalent_token.txt` - Token JWT para requests autenticados
- `/tmp/offer_id.txt` - ID de oferta creada para tests subsecuentes
- `/tmp/user_id.txt` - ID de usuario para tests relacionados

## 🔍 Verificación de Resultados

### Códigos HTTP Esperados
- **200 OK**: Consultas exitosas
- **201 Created**: Creación exitosa
- **400 Bad Request**: Datos inválidos
- **401 Unauthorized**: Sin token/token inválido
- **403 Forbidden**: Sin permisos
- **404 Not Found**: Recurso no existe
- **409 Conflict**: Conflicto (ej: email duplicado)

### Estructura de Respuesta Esperada
```json
{
  "success": true,
  "message": "Descripción de la operación",
  "data": { /* datos de respuesta */ }
}
```

## 🐛 Troubleshooting

### Problema: "Servidor no está corriendo"
```bash
# Solución: Iniciar servidor en otra terminal
pnpm run dev
```

### Problema: "No se encontró token"
```bash
# Solución: Ejecutar auth.sh primero
./scripts/testing/auth.sh
```

### Problema: "command not found: jq"
```bash
# Ubuntu/Debian
sudo apt install jq

# macOS
brew install jq
```

### Problema: "Permission denied"
```bash
# Dar permisos de ejecución
chmod +x scripts/testing/*.sh
```

## 🧹 Limpieza

Para limpiar archivos temporales:
```bash
rm -f /tmp/protalent_*.txt /tmp/offer_id.txt /tmp/user_id.txt
```

## 🔧 Personalización

### Cambiar URL Base
Edita la variable `BASE_URL` en cada script:
```bash
BASE_URL="http://localhost:5000"  # Cambiar según necesidad
```

### Agregar Nuevos Tests
1. Copia un script existente
2. Modifica los endpoints y datos
3. Agrega al script principal `run-all-tests.sh`

## 📈 Integración con CI/CD

Estos scripts pueden usarse en pipelines de CI/CD:

```yaml
# GitHub Actions ejemplo
- name: Run API Tests
  run: |
    npm run dev &
    sleep 10
    ./scripts/testing/run-all-tests.sh
```

## 🤝 Contribuir

Para agregar nuevos tests:
1. Sigue el formato existente
2. Usa colores consistentes
3. Agrega validaciones de errores
4. Documenta endpoints nuevos

## 🎯 Próximas Mejoras

- [ ] Tests de carga con múltiples requests paralelos
- [ ] Validación de esquemas JSON de respuesta
- [ ] Tests de timing y performance
- [ ] Generación de reportes HTML
- [ ] Integración con herramientas de monitoreo