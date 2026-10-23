# NetTunnel Pro - Guia Completo de Build APK para Android

## 📱 Status Atual do Projeto

✅ **Completado:**
- React/Vite frontend compilado
- Capacitor instalado e sincronizado
- Android estrutura criada
- Xray-core preparado para integração
- Auto-discovery de servidores implementado
- Auto-correção de conexões implementado

🟡 **Pendente:**
- Android SDK instalação (requer ambiente com SDK)
- Build final do APK (requer Gradle + SDK)

---

## 🚀 Como Compilar o APK

### Pré-requisitos

1. **Java Development Kit (JDK) 11+**
   ```bash
   java -version
   ```

2. **Android SDK**
   - Download: https://developer.android.com/studio
   - Instalar Android SDK Platform 34
   - Instalar Android Build Tools 34.0.0
   - Definir `ANDROID_HOME`

3. **Gradle** (incluído no Android Studio)

### Passo 1: Preparar Ambiente

```bash
# Definir variáveis de ambiente
export ANDROID_HOME=/path/to/android/sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools

# Verificar instalação
sdkmanager --list
```

### Passo 2: Compilar Xray-core (Opcional)

Se quiser compilar do zero:

```bash
# Clonar repositório Xray
git clone https://github.com/XTLS/Xray-core.git
cd Xray-core

# Compilar para Android ARM64
CGO_ENABLED=1 GOOS=android GOARCH=arm64 CC=aarch64-linux-android-gcc go build -o libXray.so -buildmode=c-shared ./main

# Copiar para projeto
cp libXray.so /path/to/nettunnel-pro/android/app/src/main/jniLibs/arm64-v8a/
```

Ou **usar pré-compilado**:
```bash
cd android/app/src/main/jniLibs/arm64-v8a
wget https://github.com/XTLS/Xray-core/releases/download/v1.8.10/Xray-android-arm64.zip
unzip Xray-android-arm64.zip
```

### Passo 3: Configurar Assinatura (Opcional para Debug)

Para build **debug** (sem assinatura):
```bash
cd /path/to/nettunnel-pro/android
./gradlew assembleDebug
```

Para build **release** (com assinatura):

1. Criar keystore:
```bash
keytool -genkey -v -keystore nettunnel.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias nettunnel \
  -storepass sua_senha \
  -keypass sua_senha \
  -dname "CN=NetTunnel,O=NetTunnel,C=BR"
```

2. Configurar em `android/app/build.gradle`:
```gradle
signingConfigs {
  release {
    storeFile file('nettunnel.keystore')
    storePassword 'sua_senha'
    keyAlias 'nettunnel'
    keyPassword 'sua_senha'
  }
}

buildTypes {
  release {
    signingConfig signingConfigs.release
    minifyEnabled true
    proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
  }
}
```

### Passo 4: Build APK

**Debug APK** (para testes):
```bash
cd /path/to/nettunnel-pro/android
./gradlew assembleDebug

# APK gerado em:
# app/build/outputs/apk/debug/app-debug.apk
```

**Release APK** (para produção):
```bash
cd /path/to/nettunnel-pro/android
./gradlew assembleRelease

# APK gerado em:
# app/build/outputs/apk/release/app-release.apk
```

### Passo 5: Instalar em Dispositivo

```bash
# Conectar dispositivo Android via USB
# Ativar Debug Mode no dispositivo

# Instalar APK
adb install app/build/outputs/apk/debug/app-debug.apk

# Ou usar:
adb install-multiple app/build/outputs/apk/debug/app-debug.apk
```

### Passo 6: Testar

1. Abrir app no dispositivo
2. Selecionar operadora e servidor
3. Clicar em "Conectar"
4. Verificar logs em tempo real
5. Testar navegação (Analytics, Settings)

---

## 🔧 Troubleshooting

### Erro: "ANDROID_HOME not set"
```bash
export ANDROID_HOME=/path/to/android/sdk
```

### Erro: "SDK Platform 34 not found"
```bash
sdkmanager "platforms;android-34"
sdkmanager "build-tools;34.0.0"
```

### Erro: "libXray.so not found"
Verificar se arquivo existe em:
```bash
ls -la android/app/src/main/jniLibs/arm64-v8a/libXray.so
```

### Erro: "Gradle build failed"
```bash
cd android
./gradlew clean
./gradlew assembleDebug
```

### APK muito grande (> 100MB)
Usar ProGuard/R8 para ofuscação e redução de tamanho:
```gradle
minifyEnabled true
proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
```

---

## 📊 Estrutura de Arquivos Android

```
android/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── AndroidManifest.xml          ← Permissões e serviços
│   │   │   ├── java/com/nettunnel/pro/
│   │   │   │   ├── MainActivity.java
│   │   │   │   ├── VpnBridge.java           ← Plugin Capacitor
│   │   │   │   ├── MyVpnService.java        ← VPN Service
│   │   │   │   ├── CaptivePortalBypass.java
│   │   │   │   └── SNIScannerService.java
│   │   │   ├── assets/
│   │   │   │   └── public/                  ← Web assets
│   │   │   └── jniLibs/
│   │   │       └── arm64-v8a/
│   │   │           └── libXray.so           ← Xray binary
│   │   └── res/
│   │       ├── values/
│   │       │   ├── strings.xml
│   │       │   └── colors.xml
│   │       └── drawable/
│   │           └── ic_launcher.png
│   ├── build.gradle                         ← Configuração Gradle
│   └── proguard-rules.pro
├── build.gradle
├── settings.gradle
└── gradlew                                  ← Gradle wrapper
```

---

## 🎯 Features Implementadas

### ✅ Frontend
- Interface Cyberpunk Minimalista
- Seletor de operadora (Vivo, Claro, Oi, Tim)
- Seletor de servidor com latência
- Seletor de payload (HTTP, TLS, WebSocket, DNSTT, UDP/53)
- Dashboard de Analytics com 7 gráficos
- Modo Pro/Stealth com fragmentação
- Logs em tempo real
- Export/Import de configurações

### ✅ Backend
- tRPC com autenticação OAuth
- Gerador de config Xray
- Banco de dados com histórico de conexões
- API para testes de conectividade
- Suporte a múltiplas operadoras

### ✅ Android Nativo
- VPN Service com TUN interface
- Suporte a múltiplos protocolos (VLESS, VMESS, Trojan, SS, DNSTT)
- Fragmentação de pacotes (DPI bypass)
- TLS fingerprint spoofing
- Multiplexing (mux)
- Keep-alive persistente
- Captive portal bypass
- SNI scanning dinâmico
- WakeLock para evitar sleep
- Roteamento global (0.0.0.0/0)

### ✅ Auto-Correction
- Auto-discovery de servidores ativos
- Monitoramento contínuo de saúde
- Auto-fallback para servidor saudável
- Taxa de sucesso por servidor
- Latência em tempo real

---

## 📦 Tamanho Esperado do APK

| Tipo | Tamanho |
|------|---------|
| Debug APK | 45-60 MB |
| Release APK (com ProGuard) | 25-35 MB |
| Com Xray-core | +15-20 MB |

---

## 🚀 Deploy na Play Store

1. Gerar Release APK assinado
2. Criar conta de desenvolvedor Google Play ($25)
3. Criar aplicativo na Play Console
4. Fazer upload do APK
5. Preencher informações do app
6. Submeter para review (24-48 horas)

---

## 📞 Suporte

Para problemas ou dúvidas:
- Verificar logs: `adb logcat | grep nettunnel`
- Testar em emulador: `emulator -avd Pixel_4_API_34`
- Documentação: `PROJECT_OVERVIEW.md`

---

## ✅ Checklist Final

- [ ] Android SDK instalado
- [ ] Java 11+ configurado
- [ ] Xray-core compilado/baixado
- [ ] Capacitor sincronizado
- [ ] APK debug compilado
- [ ] APK testado em dispositivo
- [ ] APK release compilado
- [ ] Assinado com keystore
- [ ] Pronto para Play Store

**Status**: 🟡 Aguardando ambiente Android SDK para build final
