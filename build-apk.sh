#!/bin/bash

# NetTunnel Pro - APK Build Script
# Compila APK Debug e Release automaticamente

set -e

echo "🚀 NetTunnel Pro - APK Build Script"
echo "===================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar pré-requisitos
echo "📋 Verificando pré-requisitos..."

if ! command -v java &> /dev/null; then
    echo -e "${RED}❌ Java não encontrado. Instale Java 11 ou superior.${NC}"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não encontrado. Instale Node.js 22 ou superior.${NC}"
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}❌ pnpm não encontrado. Execute: npm install -g pnpm${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Pré-requisitos OK${NC}"
echo ""

# Passo 1: Instalar dependências
echo "📦 Passo 1: Instalando dependências Node.js..."
pnpm install
echo -e "${GREEN}✅ Dependências instaladas${NC}"
echo ""

# Passo 2: Build frontend
echo "🔨 Passo 2: Compilando frontend React..."
pnpm build
echo -e "${GREEN}✅ Frontend compilado${NC}"
echo ""

# Passo 3: Sincronizar Capacitor
echo "🔄 Passo 3: Sincronizando com Capacitor..."
npx cap sync android
echo -e "${GREEN}✅ Capacitor sincronizado${NC}"
echo ""

# Passo 4: Build APK
echo "🏗️  Passo 4: Compilando APKs..."
cd android

# Limpeza (opcional)
echo "  Limpando builds anteriores..."
./gradlew clean

# Build Debug
echo "  Compilando APK Debug..."
./gradlew assembleDebug
DEBUG_APK="app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$DEBUG_APK" ]; then
    echo -e "  ${GREEN}✅ APK Debug criado: $DEBUG_APK${NC}"
    DEBUG_SIZE=$(du -h "$DEBUG_APK" | cut -f1)
    echo "     Tamanho: $DEBUG_SIZE"
else
    echo -e "  ${RED}❌ Falha ao criar APK Debug${NC}"
    exit 1
fi

# Build Release
echo "  Compilando APK Release..."
./gradlew assembleRelease
RELEASE_APK="app/build/outputs/apk/release/app-release.apk"
if [ -f "$RELEASE_APK" ]; then
    echo -e "  ${GREEN}✅ APK Release criado: $RELEASE_APK${NC}"
    RELEASE_SIZE=$(du -h "$RELEASE_APK" | cut -f1)
    echo "     Tamanho: $RELEASE_SIZE"
else
    echo -e "  ${RED}❌ Falha ao criar APK Release${NC}"
    exit 1
fi

cd ..
echo -e "${GREEN}✅ APKs compilados com sucesso${NC}"
echo ""

# Passo 5: Resumo
echo "📊 Resumo da Compilação"
echo "======================"
echo -e "Debug APK:   ${GREEN}$DEBUG_APK${NC} ($DEBUG_SIZE)"
echo -e "Release APK: ${GREEN}$RELEASE_APK${NC} ($RELEASE_SIZE)"
echo ""

# Passo 6: Instruções de upload
echo "📤 Próximos Passos:"
echo "1. Fazer upload dos APKs para GitHub Release v1.0.0"
echo "   GitHub CLI: gh release upload v1.0.0 $DEBUG_APK $RELEASE_APK"
echo ""
echo "2. Ou via GitHub Web UI:"
echo "   https://github.com/GABRIELMSORENSEN/nettunnel-pro/releases/tag/v1.0.0"
echo ""
echo "3. Testar no dispositivo:"
echo "   adb install -r $DEBUG_APK"
echo ""

echo -e "${GREEN}✅ Build completo!${NC}"
echo ""
