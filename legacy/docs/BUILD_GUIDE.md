# NetTunnel Pro VPN - Build & Deployment Guide

## Project Overview

**NetTunnel Pro** é um aplicativo VPN mobile que combina:
- **Frontend:** React 19 + Vite + Tailwind CSS (UI Cyberpunk Minimalism)
- **Mobile Bridge:** Capacitor + TypeScript
- **Native Android:** VPN Service + Xray-core (JNI)
- **Core Engine:** Xray-core para bypass DPI e zero-rating

### Arquitetura

```
┌─────────────────────────────────────────────────┐
│         React UI (Cyberpunk Design)             │
│  - Connection Node com glow effects             │
│  - Server List com latency badges               │
│  - Terminal-style logs com scanlines            │
└──────────────┬──────────────────────────────────┘
               │ Capacitor Bridge
┌──────────────▼──────────────────────────────────┐
│         VpnBridge (Capacitor Plugin)            │
│  - startVpn(config)                             │
│  - stopVpn()                                    │
│  - getStatus()                                  │
└──────────────┬──────────────────────────────────┘
               │ JNI / Intent
┌──────────────▼──────────────────────────────────┐
│      MyVpnService (Android VPN Service)         │
│  - TUN Interface Configuration                  │
│  - Xray-core Integration                        │
│  - Connection Lifecycle                         │
└──────────────┬──────────────────────────────────┘
               │ JNI Calls
┌──────────────▼──────────────────────────────────┐
│      Xray-core (libXray.so)                     │
│  - VLESS/VMESS/Trojan Protocols                 │
│  - DPI Bypass (Fragment + Obfuscation)          │
│  - Zero-rating via SNI Injection                │
└─────────────────────────────────────────────────┘
```

---

## Prerequisites

### Sistema Operacional
- **macOS** (recomendado para desenvolvimento iOS/Android)
- **Linux** (Ubuntu 20.04+ para Android apenas)
- **Windows** com WSL2 (para Android apenas)

### Ferramentas Necessárias

```bash
# Node.js e npm/pnpm
node --version  # v22.13.0 ou superior
pnpm --version  # v10.15.1 ou superior

# Android Development Kit
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools

# Java Development Kit
java -version  # OpenJDK 11 ou superior

# Capacitor CLI
npm install -g @capacitor/cli

# Xray-core (para compilação nativa)
# Download em: https://github.com/XTLS/Xray-core/releases
```

---

## Setup Inicial

### 1. Instalar Dependências

```bash
cd /home/ubuntu/nettunnel-pro

# Instalar dependências do projeto
pnpm install

# Instalar Capacitor
pnpm add @capacitor/core @capacitor/cli @capacitor/android
```

### 2. Configurar Variáveis de Ambiente

Criar `.env.local`:

```env
# Xray Configuration
VITE_XRAY_CONFIG_URL=https://config.nettunnel.pro/xray.json
VITE_XRAY_LOG_LEVEL=warning

# Server Configuration
VITE_API_BASE_URL=https://api.nettunnel.pro
VITE_DEFAULT_SERVER=br-sp-01

# Analytics (opcional)
VITE_ANALYTICS_ENABLED=true
```

### 3. Compilar Frontend

```bash
# Build para produção
pnpm build

# Resultado: dist/public/
```

---

## Android Development

### 1. Preparar Projeto Android

```bash
# Sincronizar com Capacitor
npx cap sync android

# Abrir Android Studio
npx cap open android
```

### 2. Estrutura de Arquivos Android

```
android/
├── app/src/main/
│   ├── AndroidManifest.xml          # Permissões VPN
│   ├── java/com/nettunnelpro/vpn/
│   │   ├── VpnBridge.java           # Capacitor Plugin
│   │   └── MyVpnService.java        # VPN Service
│   ├── jniLibs/arm64-v8a/
│   │   └── libXray.so               # Xray-core binary
│   └── assets/
│       ├── geoip.dat                # Geo IP database
│       ├── geosite.dat              # Geo site database
│       └── xray-config.json         # Default config
```

### 3. Compilar Xray-core para Android

```bash
# Clone Xray-core repository
git clone https://github.com/XTLS/Xray-core.git
cd Xray-core

# Compilar para ARM64
GOOS=android GOARCH=arm64 CGO_ENABLED=1 \
  CC=aarch64-linux-android-gcc \
  CXX=aarch64-linux-android-g++ \
  go build -o libXray.so -buildmode=c-shared ./main

# Copiar para projeto
cp libXray.so /home/ubuntu/nettunnel-pro/android/app/src/main/jniLibs/arm64-v8a/
```

### 4. Configurar Permissões

O arquivo `android/AndroidManifest.xml` já contém:

```xml
<uses-permission android:name="android.permission.BIND_VPN_SERVICE" />
<uses-permission android:name="android.permission.INTERNET" />

<service
    android:name=".MyVpnService"
    android:permission="android.permission.BIND_VPN_SERVICE"
    android:exported="true">
    <intent-filter>
        <action android:name="android.net.VpnService" />
    </intent-filter>
</service>
```

### 5. Build APK

```bash
# Debug APK
./gradlew assembleDebug
# Resultado: android/app/build/outputs/apk/debug/app-debug.apk

# Release APK (com assinatura)
./gradlew assembleRelease
# Resultado: android/app/build/outputs/apk/release/app-release.apk
```

### 6. Instalar no Dispositivo

```bash
# Conectar dispositivo Android via USB
adb devices

# Instalar APK
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# Executar
adb shell am start -n com.nettunnelpro.vpn/.MainActivity
```

---

## Xray Configuration

### Estrutura de Configuração

O arquivo `android/xray-config.json` define:

#### Inbounds (Entrada)
- **SOCKS5** na porta 10808 (proxy local)
- **HTTP** na porta 10809 (proxy HTTP)

#### Outbounds (Saída)
- **VLESS** com WebSocket + TLS
- **SNI Injection** para zero-rating (e.g., `portalrecarga.vivo.com.br`)
- **Fragment** para DPI bypass (1-3 packets, 10-20 bytes)

#### Routing
- Tráfego doméstico (geoip:cn, geosite:private) → direct
- Tráfego internacional → VLESS tunnel

### Customizar para Operadora

Para **Vivo**, **Claro**, **Oi**, etc:

```json
{
  "outbounds": [{
    "streamSettings": {
      "tlsSettings": {
        "serverName": "portalrecarga.vivo.com.br"  // ← SNI da operadora
      },
      "wsSettings": {
        "headers": {
          "Host": "br-sp-01.nettunnel.pro"
        }
      }
    }
  }]
}
```

---

## Troubleshooting

### Erro: "Permission Denied" ao iniciar VPN

**Causa:** Falta de permissão `BIND_VPN_SERVICE`

**Solução:**
1. Verificar `AndroidManifest.xml` contém `<uses-permission android:name="android.permission.BIND_VPN_SERVICE" />`
2. Executar `npx cap sync android`
3. Limpar build: `./gradlew clean`
4. Reconstruir: `./gradlew assembleDebug`

### Erro: "Core Exit (Status 1)"

**Causa:** Erro de sintaxe JSON na configuração Xray ou arquivos `.dat` faltando

**Solução:**
1. Validar JSON: `jq . android/xray-config.json`
2. Verificar se `geoip.dat` e `geosite.dat` existem em `assets/`
3. Verificar logs: `adb logcat | grep Xray`

### Erro: "No Internet" após conectar

**Causa:** TUN interface não está roteando tráfego corretamente

**Solução:**
1. Verificar configuração TUN em `MyVpnService.java`:
   - Address: `10.0.0.2/32`
   - Route: `0.0.0.0/0`
   - DNS: `8.8.8.8`
2. Verificar SOCKS proxy está rodando na porta 10808
3. Testar conectividade: `adb shell ping 8.8.8.8`

---

## Testing

### Testes Unitários (Frontend)

```bash
pnpm test
```

### Testes de Integração (Android)

```bash
# Executar testes no dispositivo
adb shell am instrument -w com.nettunnelpro.vpn.test/androidx.test.runner.AndroidJUnitRunner
```

### Testes Manuais

1. **Conexão Básica**
   - Abrir app
   - Clicar "Conectar"
   - Verificar se nó de conexão fica azul
   - Verificar logs mostram "Tunnel estabelecido"

2. **Bypass DPI**
   - Conectar via NetTunnel Pro
   - Acessar site bloqueado (e.g., YouTube em rede restrita)
   - Verificar se carrega normalmente

3. **Zero-rating**
   - Desativar dados móveis
   - Conectar via WiFi com zero-rating ativo
   - Verificar se tráfego passa pelo tunnel

---

## Deployment

### Play Store

1. **Preparar Release APK**
   ```bash
   ./gradlew bundleRelease
   ```

2. **Assinar APK**
   ```bash
   jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 \
     -keystore ~/.android/release.keystore \
     app-release.apk alias_name
   ```

3. **Upload para Play Store**
   - Acessar Google Play Console
   - Criar novo app
   - Upload de `app-release.aab`
   - Preencher store listing e screenshots
   - Submeter para review

### Distribuição Direta

```bash
# Gerar APK assinado
./gradlew assembleRelease

# Distribuir via link
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

---

## Performance Optimization

### Frontend
- Lazy load de componentes
- Code splitting via Vite
- Minificação automática em produção

### Android
- ProGuard/R8 para obfuscação de código
- Otimização de memória (Xray usa ~50-100MB)
- Compressão de assets

### Xray-core
- Usar `geoip.dat` e `geosite.dat` comprimidos
- Ativar `allowInsecure: false` em produção
- Monitorar latência com `sockopt.fragment`

---

## Segurança

### Checklist

- [ ] Usar HTTPS para todas as conexões
- [ ] Validar certificados TLS (não usar `allowInsecure: true` em produção)
- [ ] Não armazenar credenciais em plain text
- [ ] Usar ProGuard/R8 para obfuscação
- [ ] Auditar permissões Android
- [ ] Testar com ferramentas de segurança (MobSF, etc)

### Dados Sensíveis

- **UUID do usuário:** Armazenar em Android Keystore
- **Configuração Xray:** Criptografar em repouso
- **Logs:** Não incluir IPs ou dados pessoais

---

## Recursos Adicionais

- [Xray-core Documentation](https://xtls.github.io/en/)
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android VPN Service](https://developer.android.com/reference/android/net/VpnService)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)

---

## Suporte

Para problemas, consulte:
1. Logs: `adb logcat | grep NetTunnelPro`
2. GitHub Issues: https://github.com/nettunnel/pro/issues
3. Documentação: https://docs.nettunnel.pro

---

**Versão:** 1.0.0  
**Última atualização:** 2026-05-04  
**Mantido por:** NetTunnel Pro Team
