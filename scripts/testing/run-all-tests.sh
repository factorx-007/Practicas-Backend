#!/bin/bash

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}████████████████████████████████████████████████${NC}"
echo -e "${BLUE}█                                              █${NC}"
echo -e "${BLUE}█           PROTALENT API TESTING              █${NC}"
echo -e "${BLUE}█              SUITE COMPLETA                  █${NC}"
echo -e "${BLUE}█                                              █${NC}"
echo -e "${BLUE}████████████████████████████████████████████████${NC}"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Ejecuta este script desde la raíz del proyecto${NC}"
    exit 1
fi

# Verificar dependencias
if ! command -v curl &> /dev/null; then
    echo -e "${RED}❌ Error: curl no está instalado${NC}"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}⚠️  Warning: jq no está instalado (formato JSON limitado)${NC}"
    echo -e "${CYAN}💡 Instala con: sudo apt install jq (Ubuntu) o brew install jq (Mac)${NC}"
fi

# Dar permisos de ejecución a los scripts
chmod +x scripts/testing/*.sh

# Función para mostrar tiempo transcurrido
start_time=$(date +%s)

show_step() {
    local step=$1
    local description=$2
    echo ""
    echo -e "${PURPLE}▶▶▶ PASO $step: $description${NC}"
    echo -e "${PURPLE}════════════════════════════════════════${NC}"
}

# Función para mostrar resultados
show_results() {
    local exit_code=$1
    local module=$2
    
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✅ $module: PASÓ TODAS LAS PRUEBAS${NC}"
    else
        echo -e "${RED}❌ $module: ALGUNAS PRUEBAS FALLARON${NC}"
    fi
}

echo -e "${CYAN}🚀 Iniciando suite completa de testing...${NC}"
echo ""

# Verificar servidor
echo -e "${CYAN}🔍 Verificando que el servidor esté corriendo...${NC}"
if ! curl -s "http://localhost:5000/health" > /dev/null; then
    echo -e "${RED}❌ Servidor no está corriendo${NC}"
    echo -e "${YELLOW}💡 Inicia el servidor con: pnpm run dev${NC}"
    echo -e "${YELLOW}💡 Luego ejecuta este script en otra terminal${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Servidor funcionando correctamente${NC}"

# PASO 1: Tests unitarios
show_step "1" "TESTS UNITARIOS (Jest)"
echo -e "${CYAN}🧪 Ejecutando tests unitarios...${NC}"
pnpm test --passWithNoTests --silent
unit_test_result=$?
show_results $unit_test_result "Tests Unitarios"

# PASO 2: Tests de integración con curl
show_step "2" "TESTS DE AUTENTICACIÓN"
./scripts/testing/auth.sh
auth_result=$?
show_results $auth_result "Módulo de Autenticación"

# Pausa breve entre módulos
sleep 2

show_step "3" "TESTS DE USUARIOS"
./scripts/testing/usuarios.sh
users_result=$?
show_results $users_result "Módulo de Usuarios"

# Pausa breve entre módulos
sleep 2

show_step "4" "TESTS DE OFERTAS"
./scripts/testing/ofertas.sh
offers_result=$?
show_results $offers_result "Módulo de Ofertas"

# Calcular tiempo total
end_time=$(date +%s)
total_time=$((end_time - start_time))
minutes=$((total_time / 60))
seconds=$((total_time % 60))

# RESUMEN FINAL
echo ""
echo -e "${BLUE}████████████████████████████████████████████████${NC}"
echo -e "${BLUE}█               RESUMEN FINAL                  █${NC}"
echo -e "${BLUE}████████████████████████████████████████████████${NC}"
echo ""

# Mostrar resultados
echo -e "${CYAN}📊 RESULTADOS POR MÓDULO:${NC}"
echo ""

if [ $unit_test_result -eq 0 ]; then
    echo -e "${GREEN}✅ Tests Unitarios (Jest)${NC}"
else
    echo -e "${RED}❌ Tests Unitarios (Jest)${NC}"
fi

if [ $auth_result -eq 0 ]; then
    echo -e "${GREEN}✅ Autenticación (HTTP)${NC}"
else
    echo -e "${RED}❌ Autenticación (HTTP)${NC}"
fi

if [ $users_result -eq 0 ]; then
    echo -e "${GREEN}✅ Usuarios (HTTP)${NC}"
else
    echo -e "${RED}❌ Usuarios (HTTP)${NC}"
fi

if [ $offers_result -eq 0 ]; then
    echo -e "${GREEN}✅ Ofertas (HTTP)${NC}"
else
    echo -e "${RED}❌ Ofertas (HTTP)${NC}"
fi

echo ""

# Calcular total de errores
total_errors=$((unit_test_result + auth_result + users_result + offers_result))

if [ $total_errors -eq 0 ]; then
    echo -e "${GREEN}🎉 TODOS LOS TESTS PASARON EXITOSAMENTE${NC}"
    echo -e "${GREEN}🚀 API lista para producción${NC}"
else
    echo -e "${RED}⚠️  ALGUNOS TESTS FALLARON${NC}"
    echo -e "${YELLOW}🔧 Revisa los logs arriba para más detalles${NC}"
fi

echo ""
echo -e "${CYAN}⏱️  Tiempo total: ${minutes}m ${seconds}s${NC}"
echo ""

# Información adicional
echo -e "${YELLOW}📋 INFORMACIÓN ADICIONAL:${NC}"
echo -e "  • Logs detallados disponibles arriba"
echo -e "  • Token guardado en: /tmp/protalent_token.txt"
echo -e "  • IDs de prueba en: /tmp/*.txt"
echo ""

# URLs útiles
echo -e "${CYAN}🔗 ENDPOINTS PRINCIPALES:${NC}"
echo -e "  • Health: http://localhost:5000/health"
echo -e "  • API Base: http://localhost:5000/api"
echo -e "  • Auth: http://localhost:5000/api/auth"
echo -e "  • Users: http://localhost:5000/api/users"
echo -e "  • Offers: http://localhost:5000/api/offers"

echo ""
echo -e "${BLUE}████████████████████████████████████████████████${NC}"
echo -e "${BLUE}█            TESTING COMPLETADO               █${NC}"
echo -e "${BLUE}████████████████████████████████████████████████${NC}"

# Exit con código apropiado
exit $total_errors