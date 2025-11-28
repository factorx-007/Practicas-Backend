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
echo -e "${BLUE}      PROTALENT API - TESTING OFERTAS MODULE    ${NC}"
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
        
        # Extraer ID de oferta si es creación exitosa
        if [[ "$endpoint" == *"/offers"* ]] && [ $http_code -eq 201 ] && [[ "$method" == "POST" ]]; then
            offer_id=$(echo "$body" | jq -r '.data.id' 2>/dev/null)
            if [ "$offer_id" != "null" ] && [ ! -z "$offer_id" ]; then
                echo "$offer_id" > "/tmp/offer_id.txt"
                echo -e "${GREEN}🆔 ID de oferta guardado: $offer_id${NC}"
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

# 1. Buscar ofertas (público - sin token)
make_request "GET" "/offers/search" "" "Buscar ofertas públicas" ""

# 2. Buscar ofertas con filtros
make_request "GET" "/offers/search?search=desarrollador&ubicacion=lima&page=1&limit=5" "" "Buscar con filtros" ""

# 3. Crear oferta (empresa autenticada)
oferta_data='{
    "titulo": "Desarrollador Frontend React Senior",
    "descripcion": "Buscamos un desarrollador frontend con sólida experiencia en React, TypeScript y herramientas modernas de desarrollo. Te unirás a un equipo dinámico trabajando en productos innovadores que impactan a miles de usuarios.",
    "ubicacion": "Lima, Perú",
    "modalidad": "HIBRIDO",
    "tipoEmpleo": "TIEMPO_COMPLETO",
    "nivelEducacion": "UNIVERSITARIO",
    "experiencia": "SENIOR",
    "salarioMin": 4000,
    "salarioMax": 7000,
    "fechaLimite": "2024-12-31T23:59:59.000Z",
    "preguntas": [
        {
            "pregunta": "¿Cuántos años de experiencia tienes con React?",
            "tipo": "SELECT",
            "obligatoria": true,
            "opciones": ["1-2 años", "3-4 años", "5+ años"]
        },
        {
            "pregunta": "Describe tu proyecto más desafiante con React",
            "tipo": "TEXTAREA",
            "obligatoria": true
        }
    ]
}'

make_request "POST" "/offers" "$oferta_data" "Crear oferta como empresa" "$TOKEN"

# 4. Crear segunda oferta
oferta_data2='{
    "titulo": "Analista de Datos Junior",
    "descripcion": "Únete a nuestro equipo de análisis de datos. Trabajarás con Python, SQL y herramientas de visualización para generar insights que impulsen decisiones estratégicas.",
    "ubicacion": "Lima, Perú",
    "modalidad": "PRESENCIAL",
    "tipoEmpleo": "PRACTICA",
    "nivelEducacion": "TECNICO",
    "experiencia": "JUNIOR",
    "salarioMin": 1500,
    "salarioMax": 2500,
    "fechaLimite": "2024-11-30T23:59:59.000Z"
}'

make_request "POST" "/offers" "$oferta_data2" "Crear segunda oferta" "$TOKEN"

# 5. Obtener ofertas de la empresa
make_request "GET" "/offers/company/my-offers?page=1&limit=10" "" "Mis ofertas (empresa)" "$TOKEN"

# 6. Obtener oferta específica (si se creó exitosamente)
if [ -f "/tmp/offer_id.txt" ]; then
    OFFER_ID=$(cat "/tmp/offer_id.txt")
    make_request "GET" "/offers/$OFFER_ID" "" "Obtener oferta específica" ""
    
    # 7. Incrementar vista de oferta
    make_request "POST" "/offers/$OFFER_ID/view" "" "Incrementar vista" ""
    
    # 8. Actualizar oferta
    update_data='{
        "titulo": "Desarrollador Frontend React Senior - ACTUALIZADO",
        "descripcion": "DESCRIPCIÓN ACTUALIZADA: Buscamos un desarrollador frontend con experiencia en React...",
        "salarioMax": 8000
    }'
    
    make_request "PUT" "/offers/$OFFER_ID" "$update_data" "Actualizar oferta" "$TOKEN"
    
    # 9. Obtener postulaciones de la oferta (vacío por ahora)
    make_request "GET" "/offers/$OFFER_ID/applications?page=1&limit=10" "" "Postulaciones de la oferta" "$TOKEN"
fi

# 10. Intentar crear oferta sin autenticación
make_request "POST" "/offers" "$oferta_data" "Crear oferta sin token (debe fallar)" ""

# 11. Buscar ofertas con filtros avanzados
make_request "GET" "/offers/search?salarioMin=3000&salarioMax=8000&modalidad=HIBRIDO" "" "Filtros avanzados" ""

# 12. Búsqueda por texto
make_request "GET" "/offers/search?search=react+javascript" "" "Búsqueda por texto" ""

# 13. Paginación
make_request "GET" "/offers/search?page=2&limit=3" "" "Test de paginación" ""

# 14. Obtener todas las ofertas (admin - debería fallar con token de empresa)
make_request "GET" "/offers/admin/all" "" "Todas las ofertas (admin)" "$TOKEN"

# 15. Intentar eliminar oferta
if [ -f "/tmp/offer_id.txt" ]; then
    OFFER_ID=$(cat "/tmp/offer_id.txt")
    make_request "DELETE" "/offers/$OFFER_ID" "" "Eliminar oferta" "$TOKEN"
fi

echo -e "${GREEN}🎉 Testing de ofertas completado${NC}"
echo -e "${CYAN}💡 Verifica que las respuestas sean correctas${NC}"
echo -e "${YELLOW}📊 Estadísticas esperadas:${NC}"
echo -e "  • Creación: 201 Created"
echo -e "  • Búsqueda: 200 OK con datos"
echo -e "  • Actualización: 200 OK"
echo -e "  • Sin auth: 401 Unauthorized"
echo -e "  • Admin con token empresa: 403 Forbidden"