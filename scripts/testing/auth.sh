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

# Archivo para guardar el token
TOKEN_FILE="/tmp/protalent_token.txt"

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}       PROTALENT API - TESTING AUTH MODULE      ${NC}"
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
        
        # Extraer token si es login exitoso
        if [[ "$endpoint" == *"/auth/login"* ]] && [ $http_code -eq 200 ]; then
            token=$(echo "$body" | jq -r '.data.accessToken' 2>/dev/null)
            if [ "$token" != "null" ] && [ ! -z "$token" ]; then
                echo "$token" > "$TOKEN_FILE"
                echo -e "${GREEN}🔑 Token guardado para próximas requests${NC}"
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

# Verificar si el servidor está corriendo
echo -e "${CYAN}🔍 Verificando servidor...${NC}"
if ! curl -s "$BASE_URL/health" > /dev/null; then
    echo -e "${RED}❌ Servidor no está corriendo en $BASE_URL${NC}"
    echo -e "${YELLOW}💡 Ejecuta: pnpm run dev${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Servidor funcionando${NC}"
echo ""

# 1. Health Check
make_request "GET" "/health" "" "Health Check del servidor" ""

# 2. Registro de empresa
empresa_data='{
    "nombre": "Tech Innovations",
    "apellido": "SAC",
    "email": "admin@techinnovations.com",
    "password": "TechPass123!",
    "rol": "EMPRESA",
    "empresa": {
        "ruc": "20123456789",
        "nombre_empresa": "Tech Innovations SAC",
        "rubro": "Tecnología",
        "descripcion": "Empresa de desarrollo de software y soluciones tecnológicas",
        "direccion": "Av. Tecnología 123, San Isidro, Lima",
        "telefono": "+51-1-2345678",
        "website": "https://techinnovations.com"
    }
}'

make_request "POST" "/auth/register" "$empresa_data" "Registro de Empresa" ""

# 3. Registro de estudiante
estudiante_data='{
    "nombre": "Carlos",
    "apellido": "Rodriguez",
    "email": "carlos.rodriguez@universidad.edu.pe",
    "password": "EstudiantePass123!",
    "rol": "ESTUDIANTE",
    "estudiante": {
        "carrera": "Ingeniería de Sistemas",
        "universidad": "Universidad Nacional Mayor de San Marcos",
        "anio_ingreso": 2020,
        "telefono": "+51-987654321",
        "ubicacion": "Lima, Perú",
        "tipo": "ESTUDIANTE",
        "habilidades": ["JavaScript", "React", "Node.js", "Python", "SQL"]
    }
}'

make_request "POST" "/auth/register" "$estudiante_data" "Registro de Estudiante" ""

# 4. Login empresa
empresa_login='{
    "email": "admin@techinnovations.com",
    "password": "TechPass123!"
}'

make_request "POST" "/auth/login" "$empresa_login" "Login Empresa" ""

# 5. Login estudiante (sin guardar token para no sobrescribir)
estudiante_login='{
    "email": "carlos.rodriguez@universidad.edu.pe",
    "password": "EstudiantePass123!"
}'

make_request "POST" "/auth/login" "$estudiante_login" "Login Estudiante" ""

# 6. Verificar perfil con token (empresa)
if [ -f "$TOKEN_FILE" ]; then
    TOKEN=$(cat "$TOKEN_FILE")
    make_request "GET" "/auth/profile" "" "Obtener perfil autenticado" "$TOKEN"
    
    # 7. Refresh token
    refresh_data='{
        "refreshToken": "token_de_ejemplo"
    }'
    make_request "POST" "/auth/refresh" "$refresh_data" "Refresh Token" ""
    
    # 8. Logout
    make_request "POST" "/auth/logout" "" "Logout" "$TOKEN"
fi

# 9. Intentar acceder sin token
make_request "GET" "/auth/profile" "" "Acceso sin token (debe fallar)" ""

# 10. Login inválido
invalid_login='{
    "email": "usuario@inexistente.com",
    "password": "PasswordIncorrecto123!"
}'

make_request "POST" "/auth/login" "$invalid_login" "Login con credenciales inválidas" ""

echo -e "${GREEN}🎉 Testing de autenticación completado${NC}"
echo -e "${YELLOW}📄 Token guardado en: $TOKEN_FILE${NC}"
echo -e "${CYAN}💡 Usa este token para testing de otros módulos${NC}"