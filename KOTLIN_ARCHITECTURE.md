# Nexus Tunnel - Arquitetura Kotlin/VpnService

## 📋 Visão Geral

Nexus Tunnel é um aplicativo VPN nativo em Kotlin que utiliza a VpnService API do Android para criar uma solução robusta, segura e eficiente de tunelamento de tráfego.

---

## 🏗️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    Aplicativo Android                        │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              MainActivity (UI)                        │  │
│  │  - Conectar/Desconectar                              │  │
│  │  - Exibir Logs                                       │  │
│  │  - Gerenciar Tempo (Monetização)                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                            ↓                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            Camada de Serviços                         │  │
│  │                                                       │  │
│  │  ┌─────────────────┐  ┌─────────────────┐           │  │
│  │  │ NexusVpnService │  │ SshTunnelService│           │  │
│  │  │ (VPN + TUN)     │  │ (SSH + Custom)  │           │  │
│  │  └─────────────────┘  └─────────────────┘           │  │
│  │                                                       │  │
│  │  ┌─────────────────┐  ┌─────────────────┐           │  │
│  │  │DnsForwarding    │  │KeepAliveService │           │  │
│  │  │Service          │  │ (Auto-ping)     │           │  │
│  │  └─────────────────┘  └─────────────────┘           │  │
│  └──────────────────────────────────────────────────────┘  │
│                            ↓                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Camada de Segurança                          │  │
│  │                                                       │  │
│  │  - SecurityManager (Assinatura + Torrent)           │  │
│  │  - Verificação de Integridade                        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Sistema Operacional (Android)                   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Interface TUN (0.0.0.0/0)                          │   │
│  │  - Captura todo tráfego IPv4                        │   │
│  │  - MTU: 1400 (otimizado)                            │   │
│  │  - DNS: 1.1.1.1, 8.8.8.8                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                            ↓                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Proxy SOCKS5 Local (127.0.0.1:1080)                │   │
│  │  - Encaminha tráfego TUN                            │   │
│  │  - Integração com tun2socks/hev-socks5             │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Servidor Remoto SSH                             │
│                                                              │
│  - SSH Tunneling                                            │
│  - Custom Payloads (HTTP Injection)                         │
│  - SNI Spoofing                                             │
│  - DPI Bypass                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Estrutura de Diretórios

```
android/app/src/main/
├── java/com/nexustunnel/
│   ├── MainActivity.kt                 # Interface principal
│   ├── service/
│   │   ├── NexusVpnService.kt         # Serviço VPN (TUN)
│   │   ├── SshTunnelService.kt        # SSH Tunneling + Custom Payloads
│   │   ├── DnsForwardingService.kt    # DNS Forwarding
│   │   └── KeepAliveService.kt        # Keep-Alive (Auto-ping)
│   ├── security/
│   │   └── SecurityManager.kt         # Verificação de assinatura + Torrent
│   ├── receiver/
│   │   ├── BootCompleteReceiver.kt    # Auto-iniciar na boot
│   │   └── NetworkChangeReceiver.kt   # Detectar mudanças de rede
│   └── utils/
│       ├── LogManager.kt              # Gerenciamento de logs
│       └── PreferencesManager.kt      # Gerenciamento de preferências
├── res/
│   ├── layout/
│   │   └── activity_main.xml          # Layout principal
│   ├── values/
│   │   ├── strings.xml
│   │   ├── colors.xml
│   │   └── styles.xml
│   └── drawable/
│       └── ic_launcher.xml
└── AndroidManifest.xml
```

---

## 🔧 Componentes Principais

### 1. NexusVpnService

**Responsabilidades:**
- Criar interface TUN que captura todo tráfego IPv4 (0.0.0.0/0)
- Processar pacotes IP
- Encaminhar tráfego para proxy SOCKS5 local
- Configurar DNS (1.1.1.1, 8.8.8.8)
- Otimizar MTU para 1400 (4G/5G)

**Fluxo:**
```
1. onCreate() → Inicializar
2. onStartCommand() → Processar ação (CONNECT/DISCONNECT)
3. startVpn() → Criar interface TUN
4. startPacketProcessing() → Loop de processamento
5. processPacket() → Processar cada pacote
6. forwardToSocks5() → Encaminhar para proxy
```

### 2. SshTunnelService

**Responsabilidades:**
- Estabelecer conexão SSH com servidor remoto
- Gerenciar port forwarding SOCKS5
- Implementar Custom Payloads (HTTP Injection)
- Suporte a SNI (Server Name Indication)

**Recursos:**
- Autenticação por senha ou chave privada
- Keep-alive automático (30s)
- Timeout configurável (30s padrão)

### 3. DnsForwardingService

**Responsabilidades:**
- Encaminhar requisições DNS para servidores configurados
- Evitar DNS leaks
- Suportar múltiplos servidores DNS
- Fallback automático

**Configuração:**
- DNS Primário: 1.1.1.1 (Cloudflare)
- DNS Secundário: 8.8.8.8 (Google)

### 4. KeepAliveService

**Responsabilidades:**
- Enviar pings periodicamente (15s)
- Detectar desconexões
- Reconectar automaticamente

### 5. SecurityManager

**Responsabilidades:**
- Verificar assinatura do app
- Bloquear tráfego de Torrent
- Validar integridade do app

**Bloqueios de Torrent:**
- Portas: 6881-6889, 6969, 51413, etc
- Assinaturas: "BitTorrent protocol", "d8:announce", etc

---

## 🔐 Fluxo de Segurança

```
Inicialização do App
    ↓
[1] Verificar assinatura do app
    ↓
[2] Validar integridade
    ↓
[3] Verificar permissões VPN
    ↓
[4] Carregar tempo restante (SharedPreferences)
    ↓
[5] Iniciar serviços (VPN, SSH, DNS, Keep-Alive)
    ↓
[6] Monitorar tráfego de Torrent
    ↓
[7] Manter conexão ativa (Keep-Alive)
```

---

## 💰 Sistema de Monetização

### Fluxo de Tempo:

```
SharedPreferences
├── remaining_time: Long (em ms)
└── last_ip: String

Conexão VPN
├── Verificar: remaining_time > 0
├── Se SIM → Conectar
└── Se NÃO → Mostrar anúncio recompensado

Anúncio Recompensado
├── Usuário assiste anúncio (30s)
├── Ganhar 1 hora (3600000 ms)
└── Salvar em SharedPreferences
```

### Integração Google AdMob:

```kotlin
// Configuração no AndroidManifest.xml
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy" />

// Uso no MainActivity
MobileAds.initialize(this)
showRewardedAd() // Mostrar anúncio recompensado
```

---

## 📊 Permissões Necessárias

```xml
<!-- VPN -->
<uses-permission android:name="android.permission.BIND_VPN_SERVICE" />

<!-- Rede -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.CHANGE_NETWORK_STATE" />

<!-- Sistema -->
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.READ_PHONE_STATE" />

<!-- Armazenamento -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />

<!-- Segurança -->
<uses-permission android:name="android.permission.GET_PACKAGE_SIZE" />
<uses-permission android:name="android.permission.QUERY_ALL_PACKAGES" />

<!-- AdMob -->
<uses-permission android:name="android.permission.ACCESS_ADSERVICES_AD_ID" />
```

---

## 🚀 Compilação e Build

### Requisitos:
- Android Studio 2023.1+
- Android SDK 34
- Kotlin 1.9+
- Gradle 8.0+

### Build Debug:
```bash
./gradlew assembleDebug
```

### Build Release:
```bash
./gradlew assembleRelease
```

### Assinatura:
```bash
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
  -keystore keystore.jks app-release-unsigned.apk alias_name
```

---

## 🧪 Testes

### Testes Unitários:
```bash
./gradlew test
```

### Testes de Instrumentação:
```bash
./gradlew connectedAndroidTest
```

---

## 📝 Dependências Principais

| Dependência | Versão | Propósito |
|------------|--------|----------|
| JSch | 0.1.55 | SSH Tunneling |
| OkHttp | 4.11.0 | Requisições HTTP |
| Retrofit | 2.9.0 | REST API |
| Google Play Services | 22.6.0 | Google AdMob |
| Kotlin Coroutines | 1.7.3 | Programação assíncrona |

---

## 🔍 Troubleshooting

### Problema: "VPN permission denied"
**Solução:** Chamar `VpnService.prepare()` antes de iniciar

### Problema: "DNS leak detectado"
**Solução:** Verificar se DnsForwardingService está rodando

### Problema: "Conexão cai frequentemente"
**Solução:** Aumentar intervalo de Keep-Alive (15s → 30s)

### Problema: "Tráfego de Torrent não bloqueado"
**Solução:** Verificar se SecurityManager está validando portas

---

## 📚 Referências

- [Android VpnService API](https://developer.android.com/reference/android/net/VpnService)
- [JSch Documentation](http://www.jcraft.com/jsch/)
- [Google AdMob Integration](https://developers.google.com/admob)
- [Kotlin Coroutines](https://kotlinlang.org/docs/coroutines-overview.html)

---

**Versão:** 1.0.0  
**Última Atualização:** 2026-05-15  
**Autor:** Engenheiro de Software Sênior
