# NetTunnel Pro - Guia Completo de Compilação de APK

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

### 1. Java Development Kit (JDK)
```bash
# Windows/Mac/Linux
# Baixe de: https://www.oracle.com/java/technologies/downloads/#java11

# Verificar instalação
java -version
javac -version
```

**Versão recomendada:** Java 11 ou superior

### 2. Android SDK
```bash
# Opção 1: Android Studio (Recomendado)
# Baixe de: https://developer.android.com/studio

# Opção 2: Command-line tools
# Baixe de: https://developer.android.com/studio#command-tools
```

**Componentes necessários:**
- Android SDK Platform 34
- Android SDK Build-Tools 34.0.0
- Android Emulator (opcional, para testes)

### 3. Node.js e pnpm
```bash
# Node.js 22+
node --version

# pnpm
npm install -g pnpm
pnpm --version
```

### 4. Git
```bash
git --version
```

---

## 🚀 Passo 1: Clonar o Repositório

```bash
# Clonar repositório
git clone https://github.com/GABRIELMSORENSEN/nettunnel-pro.git
cd nettunnel-pro

# Checkout da tag v1.0.0
git checkout v1.0.0
```

---

## 📦 Passo 2: Instalar Dependências

```bash
# Instalar dependências Node.js
pnpm install

# Instalar Capacitor CLI
pnpm add -D @capacitor/cli

# Adicionar plataforma Android (se não existir)
npx cap add android
```

---

## 🔨 Passo 3: Compilar Frontend

```bash
# Build do frontend React
pnpm build

# Resultado: dist/ directory criado
```

---

## 🔄 Passo 4: Sincronizar com Capacitor

```bash
# Copiar web assets para Android
npx cap sync android

# Resultado: android/app/src/main/assets/public/ atualizado
```

---

## 🏗️ Passo 5: Compilar APK

### Opção A: APK Debug (Recomendado para Testes)

```bash
cd android

# Compilar APK Debug
./gradlew assembleDebug

# Resultado: app/build/outputs/apk/debug/app-debug.apk
```

**Características:**
- Tamanho: ~50 MB
- Assinatura: Debug key (padrão)
- Performance: Normal
- Logs: Completos
- Uso: Testes e desenvolvimento

### Opção B: APK Release (Para Produção)

```bash
cd android

# Compilar APK Release (sem assinatura)
./gradlew assembleRelease

# Resultado: app/build/outputs/apk/release/app-release.apk
```

**Características:**
- Tamanho: ~30 MB (otimizado)
- Assinatura: Requer keystore
- Performance: Otimizado
- Logs: Reduzidos
- Uso: Produção e Play Store

### Opção C: Ambos APKs

```bash
cd android

# Compilar ambos
./gradlew assemble

# Resultado:
# - app/build/outputs/apk/debug/app-debug.apk
# - app/build/outputs/apk/release/app-release.apk
```

---

## 🔐 Passo 6: Assinar APK Release (Opcional)

Se quiser assinar o APK Release com sua própria chave:

### Criar Keystore

```bash
# Criar keystore (primeira vez)
keytool -genkey -v -keystore nettunnel-pro.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias nettunnel-pro \
  -storepass sua_senha \
  -keypass sua_senha

# Informações solicitadas:
# - First and last name: NetTunnel Pro
# - Organization: Seu Nome
# - City: São Paulo
# - State: SP
# - Country: BR
```

### Assinar APK

```bash
# Assinar APK Release
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 \
  -keystore nettunnel-pro.keystore \
  app/build/outputs/apk/release/app-release.apk \
  nettunnel-pro

# Zipalign (otimização)
zipalign -v 4 app/build/outputs/apk/release/app-release.apk \
  app/build/outputs/apk/release/app-release-signed.apk
```

---

## 📤 Passo 7: Upload para GitHub Release

### Opção A: Via GitHub Web UI (Recomendado)

1. Acesse: https://github.com/GABRIELMSORENSEN/nettunnel-pro/releases/tag/v1.0.0
2. Clique em "Edit" (ícone de lápis)
3. Scroll até "Attachments"
4. Arraste e solte os APKs:
   - `app-debug.apk`
   - `app-release.apk`
5. Clique em "Update release"

### Opção B: Via GitHub CLI

```bash
# Instalar GitHub CLI
# https://cli.github.com/

# Fazer login
gh auth login

# Upload de arquivos para release
gh release upload v1.0.0 \
  android/app/build/outputs/apk/debug/app-debug.apk \
  android/app/build/outputs/apk/release/app-release.apk \
  --repo GABRIELMSORENSEN/nettunnel-pro
```

### Opção C: Via cURL

```bash
# Obter token GitHub
# https://github.com/settings/tokens (Personal access tokens)

# Upload APK Debug
curl -X POST \
  -H "Authorization: token SEU_TOKEN" \
  -H "Content-Type: application/octet-stream" \
  --data-binary @android/app/build/outputs/apk/debug/app-debug.apk \
  "https://uploads.github.com/repos/GABRIELMSORENSEN/nettunnel-pro/releases/$(gh release view v1.0.0 --json id -q)/assets?name=app-debug.apk"

# Upload APK Release
curl -X POST \
  -H "Authorization: token SEU_TOKEN" \
  -H "Content-Type: application/octet-stream" \
  --data-binary @android/app/build/outputs/apk/release/app-release.apk \
  "https://uploads.github.com/repos/GABRIELMSORENSEN/nettunnel-pro/releases/$(gh release view v1.0.0 --json id -q)/assets?name=app-release.apk"
```

---

## 📊 Passo 8: Verificar Upload

```bash
# Listar arquivos da release
gh release view v1.0.0 --repo GABRIELMSORENSEN/nettunnel-pro

# Ou acesse:
# https://github.com/GABRIELMSORENSEN/nettunnel-pro/releases/tag/v1.0.0
```

---

## 🧪 Passo 9: Testar APK

### Via ADB

```bash
# Conectar dispositivo Android via USB
# Ativar USB Debug Mode

# Instalar APK
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Ou reinstalar (força)
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# Iniciar app
adb shell am start -n com.nettunnel.pro/.MainActivity

# Ver logs
adb logcat | grep nettunnel
```

### Via Arquivo

1. Baixar APK do GitHub
2. Transferir para dispositivo (USB, email, etc)
3. Abrir arquivo no dispositivo
4. Permitir instalação de "Fontes desconhecidas"
5. Clicar em "Instalar"

---

## 🐛 Troubleshooting

### Erro: "Android SDK not found"

```bash
# Definir ANDROID_HOME
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools

# Ou adicionar permanentemente em ~/.bashrc ou ~/.zshrc
```

### Erro: "Gradle build failed"

```bash
# Limpar cache Gradle
cd android
./gradlew clean

# Tentar novamente
./gradlew assembleDebug
```

### Erro: "Java version not compatible"

```bash
# Verificar versão Java
java -version

# Deve ser Java 11 ou superior
# Se necessário, atualizar JAVA_HOME
export JAVA_HOME=/path/to/java11
```

### APK não instala no dispositivo

```bash
# Desinstalar versão anterior
adb uninstall com.nettunnel.pro

# Instalar novamente
adb install app-debug.apk

# Verificar compatibilidade
adb shell getprop ro.build.version.release  # Deve ser 7.0+
```

### Erro: "Insufficient storage"

- Liberar espaço no dispositivo (mínimo 100 MB)
- Ou usar emulador com mais espaço

---

## 📋 Checklist de Compilação

- [ ] Java 11+ instalado
- [ ] Android SDK instalado
- [ ] Node.js 22+ instalado
- [ ] pnpm instalado
- [ ] Repositório clonado
- [ ] Tag v1.0.0 checkout
- [ ] `pnpm install` executado
- [ ] `pnpm build` executado
- [ ] `npx cap sync android` executado
- [ ] `./gradlew assembleDebug` executado com sucesso
- [ ] `./gradlew assembleRelease` executado com sucesso
- [ ] APKs gerados verificados
- [ ] APKs enviados para GitHub Release
- [ ] Release publicada
- [ ] APK testado em dispositivo

---

## 📊 Tamanho Esperado dos APKs

| Tipo | Tamanho | Descrição |
|------|---------|-----------|
| Debug | ~50 MB | Completo com símbolos de debug |
| Release | ~30 MB | Otimizado com ProGuard |
| Release Assinado | ~30 MB | Pronto para Play Store |

---

## 🔗 Recursos Úteis

- [Android Studio](https://developer.android.com/studio)
- [Capacitor Documentation](https://capacitorjs.com/)
- [Gradle Build Tool](https://gradle.org/)
- [GitHub Releases API](https://docs.github.com/en/rest/releases)
- [Android Debug Bridge (ADB)](https://developer.android.com/studio/command-line/adb)

---

## ✅ Próximas Etapas

1. **Compilar APKs** - Seguir este guia
2. **Upload para GitHub** - Adicionar APKs à release v1.0.0
3. **Testar em Dispositivo** - Instalar e validar funcionamento
4. **Publicar na Play Store** - Seguir PLAYSTORE_DEPLOYMENT_GUIDE.md
5. **Criar v1.1.0** - Próxima versão com melhorias

---

**Status:** ✅ Guia Completo Pronto para Uso
