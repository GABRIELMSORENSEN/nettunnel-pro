@echo off
REM NetTunnel Pro - APK Build Script (Windows)
REM Compila APK Debug e Release automaticamente

setlocal enabledelayedexpansion

echo.
echo 🚀 NetTunnel Pro - APK Build Script (Windows)
echo =============================================
echo.

REM Verificar pré-requisitos
echo 📋 Verificando pré-requisitos...

where java >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Java não encontrado. Instale Java 11 ou superior.
    echo Baixe em: https://www.oracle.com/java/technologies/downloads/
    pause
    exit /b 1
)

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js não encontrado. Instale Node.js 22 ou superior.
    echo Baixe em: https://nodejs.org/
    pause
    exit /b 1
)

where pnpm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ pnpm não encontrado. Execute: npm install -g pnpm
    pause
    exit /b 1
)

echo ✅ Pré-requisitos OK
echo.

REM Passo 1: Instalar dependências
echo 📦 Passo 1: Instalando dependências Node.js...
call pnpm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Falha ao instalar dependências
    pause
    exit /b 1
)
echo ✅ Dependências instaladas
echo.

REM Passo 2: Build frontend
echo 🔨 Passo 2: Compilando frontend React...
call pnpm build
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Falha ao compilar frontend
    pause
    exit /b 1
)
echo ✅ Frontend compilado
echo.

REM Passo 3: Sincronizar Capacitor
echo 🔄 Passo 3: Sincronizando com Capacitor...
call npx cap sync android
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Falha ao sincronizar Capacitor
    pause
    exit /b 1
)
echo ✅ Capacitor sincronizado
echo.

REM Passo 4: Build APK
echo 🏗️  Passo 4: Compilando APKs...
cd android

REM Limpeza
echo   Limpando builds anteriores...
call gradlew clean
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Falha ao limpar builds
    cd ..
    pause
    exit /b 1
)

REM Build Debug
echo   Compilando APK Debug...
call gradlew assembleDebug
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Falha ao compilar APK Debug
    cd ..
    pause
    exit /b 1
)

set DEBUG_APK=app\build\outputs\apk\debug\app-debug.apk
if exist "%DEBUG_APK%" (
    echo   ✅ APK Debug criado: %DEBUG_APK%
    for %%A in ("%DEBUG_APK%") do set DEBUG_SIZE=%%~zA
) else (
    echo   ❌ Falha ao criar APK Debug
    cd ..
    pause
    exit /b 1
)

REM Build Release
echo   Compilando APK Release...
call gradlew assembleRelease
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Falha ao compilar APK Release
    cd ..
    pause
    exit /b 1
)

set RELEASE_APK=app\build\outputs\apk\release\app-release.apk
if exist "%RELEASE_APK%" (
    echo   ✅ APK Release criado: %RELEASE_APK%
    for %%A in ("%RELEASE_APK%") do set RELEASE_SIZE=%%~zA
) else (
    echo   ❌ Falha ao criar APK Release
    cd ..
    pause
    exit /b 1
)

cd ..
echo ✅ APKs compilados com sucesso
echo.

REM Passo 5: Resumo
echo 📊 Resumo da Compilação
echo =======================
echo Debug APK:   %DEBUG_APK% (%DEBUG_SIZE% bytes^)
echo Release APK: %RELEASE_APK% (%RELEASE_SIZE% bytes^)
echo.

REM Passo 6: Instruções de upload
echo 📤 Próximos Passos:
echo 1. Fazer upload dos APKs para GitHub Release v1.0.0
echo    GitHub CLI: gh release upload v1.0.0 %DEBUG_APK% %RELEASE_APK%
echo.
echo 2. Ou via GitHub Web UI:
echo    https://github.com/GABRIELMSORENSEN/nettunnel-pro/releases/tag/v1.0.0
echo.
echo 3. Testar no dispositivo:
echo    adb install -r %DEBUG_APK%
echo.

echo ✅ Build completo!
echo.
pause
