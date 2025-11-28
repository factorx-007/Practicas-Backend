#!/bin/bash

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuración
BASE_URL="http://localhost:5000"
API_URL="$BASE_URL/api"
TOKEN_FILE="/tmp/protalent_token.txt"

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}     PROTALENT API - TESTING USUARIOS MODULE    ${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Función para hacer requests con formato bonito
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    local auth_header=$5
    
    echo -e "${CYAN}🔄 $description${NC}"
    echo -e "${YELLOW}$method $endpoint${NC}"
    
    if [ ! -z "$data" ]; then
        echo -e "${PURPLE}📤 Request Body:${NC}"
        echo "$data" | jq . 2>/dev/null || echo "$data"
    fi
    
    echo -e "${PURPLE}📥 Response:${NC}"
    
    if [ ! -z "$auth_header" ]; then
        response=$(curl -s -X $method "$API_URL$endpoint" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $auth_header" \
            -d "$data" \
            -w "\n%{http_code}")
    else
        response=$(curl -s -X $method "$API_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data" \
            -w "\n%{http_code}")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ $http_code -ge 200 ] && [ $http_code -lt 300 ]; then
        echo -e "${GREEN}✅ Success ($http_code)${NC}"
        echo "$body" | jq . 2>/dev/null || echo "$body"
        
        # Extraer user ID si es necesario
        if [[ "$endpoint" == *"/users/profile"* ]] && [ $http_code -eq 200 ]; then
            user_id=$(echo "$body" | jq -r '.data.id' 2>/dev/null)
            if [ "$user_id" != "null" ] && [ ! -z "$user_id" ]; then
                echo "$user_id" > "/tmp/user_id.txt"
                echo -e "${GREEN}🆔 User ID guardado: $user_id${NC}"
            fi
        fi
    else
        echo -e "${RED}❌ Error ($http_code)${NC}"
        echo "$body" | jq . 2>/dev/null || echo "$body"
    fi
    
    echo ""
    echo -e "${BLUE}================================================${NC}"
    echo ""
}

# Verificar token
if [ ! -f "$TOKEN_FILE" ]; then
    echo -e "${RED}❌ No se encontró token de autenticación${NC}"
    echo -e "${YELLOW}💡 Ejecuta primero: ./auth.sh${NC}"
    exit 1
fi

TOKEN=$(cat "$TOKEN_FILE")
echo -e "${GREEN}🔑 Token cargado exitosamente${NC}"
echo ""

# Verificar si el servidor está corriendo
echo -e "${CYAN}🔍 Verificando servidor...${NC}"
if ! curl -s "$BASE_URL/health" > /dev/null; then
    echo -e "${RED}❌ Servidor no está corriendo en $BASE_URL${NC}"
    echo -e "${YELLOW}💡 Ejecuta: pnpm run dev${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Servidor funcionando${NC}"
echo ""

# 1. Obtener mi perfil
make_request "GET" "/users/profile" "" "Obtener mi perfil" "$TOKEN"

# 2. Actualizar datos básicos del usuario
update_data='{
    "nombre": "Tech Innovations Updated",
    "telefono": "+51-1-2345679"
}'

make_request "PUT" "/users/profile" "$update_data" "Actualizar perfil básico" "$TOKEN"

# 3. Actualizar perfil de empresa
empresa_update='{
    "descripcion": "Empresa líder en desarrollo de software con más de 10 años de experiencia creando soluciones tecnológicas innovadoras.",
    "website": "https://techinnovations-updated.com",
    "telefono": "+51-1-9876543"
}'

make_request "PUT" "/users/company-profile" "$empresa_update" "Actualizar perfil empresa" "$TOKEN"

# 4. Buscar usuarios
make_request "GET" "/users/search?search=carlos&tipo=ESTUDIANTE&page=1&limit=5" "" "Buscar usuarios" ""

# 5. Buscar con filtros específicos
make_request "GET" "/users/search?carrera=ingenieria&universidad=nacional&ubicacion=lima" "" "Buscar con filtros" ""

# 6. Obtener perfil específico (necesitamos un ID)
# Simularemos con un ID de ejemplo
make_request "GET" "/users/profile/user-example-id" "" "Obtener perfil por ID" ""

# 7. Seguir usuario (necesitamos un ID válido)
follow_data='{
    "targetUserId": "user-example-id"
}'

make_request "POST" "/users/follow" "$follow_data" "Seguir usuario" "$TOKEN"

# 8. Obtener seguidores
make_request "GET" "/users/followers?page=1&limit=10" "" "Obtener mis seguidores" "$TOKEN"

# 9. Obtener seguidos
make_request "GET" "/users/following?page=1&limit=10" "" "Obtener mis seguidos" "$TOKEN"

# 10. Dejar de seguir usuario
unfollow_data='{
    "targetUserId": "user-example-id"
}'

make_request "POST" "/users/unfollow" "$unfollow_data" "Dejar de seguir" "$TOKEN"

# 11. Búsqueda avanzada con múltiples filtros
make_request "GET" "/users/search?tipo=ESTUDIANTE&habilidades=javascript,react&experiencia=junior" "" "Búsqueda avanzada" ""

# 12. Paginación en búsqueda
make_request "GET" "/users/search?page=2&limit=3" "" "Test paginación" ""

# 13. Búsqueda de empresas
make_request "GET" "/users/search?tipo=EMPRESA&rubro=tecnologia" "" "Buscar empresas" ""

# 14. Intentar acceder sin autenticación
make_request "GET" "/users/profile" "" "Acceso sin token (debe fallar)" ""

# 15. Intentar actualizar sin autenticación
make_request "PUT" "/users/profile" "$update_data" "Update sin token (debe fallar)" ""

# 16. Búsqueda con parámetros inválidos
make_request "GET" "/users/search?page=abc&limit=xyz" "" "Parámetros inválidos" ""

# 17. Obtener estadísticas de perfil (si existe)
make_request "GET" "/users/profile/stats" "" "Estadísticas de perfil" "$TOKEN"

# 18. Validar perfil completo
make_request "GET" "/users/profile/validation" "" "Validar perfil completo" "$TOKEN"

echo -e "${GREEN}🎉 Testing de usuarios completado${NC}"
echo -e "${CYAN}💡 Verifica las respuestas del servidor${NC}"
echo -e "${YELLOW}📊 Patrones esperados:${NC}"
echo -e "  • Perfil propio: 200 OK con datos completos"
echo -e "  • Búsquedas: 200 OK con array y paginación"
echo -e "  • Updates: 200 OK con datos actualizados"
echo -e "  • Sin auth: 401 Unauthorized"
echo -e "  • IDs inválidos: 404 Not Found"
echo -e "  • Params inválidos: 400 Bad Request"