# NetTunnel Pro VPN

**VPN mobile com bypass DPI e zero-rating, construída com React, Capacitor e Xray-core**

![NetTunnel Pro](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Android-brightgreen)

## 🎯 Visão Geral

**NetTunnel Pro** é um aplicativo VPN de alto desempenho que combina:

- **Frontend Moderno:** React 19 + Vite + Tailwind CSS com design Cyberpunk Minimalism
- **Mobile Native:** Capacitor + Android VPN Service para integração profunda
- **Core Engine:** Xray-core para protocolos VLESS/VMESS/Trojan com bypass DPI
- **Zero-rating:** Suporte a operadoras brasileiras (Vivo, Claro, Oi, etc)

### Recursos Principais

✅ **Bypass DPI** - Fragmentação de pacotes + SNI injection  
✅ **Zero-rating** - Acesso gratuito via redes whitelisted  
✅ **Múltiplos Protocolos** - VLESS, VMESS, Trojan  
✅ **Seleção de Servidor** - 6+ servidores com latência em tempo real  
✅ **Logs em Tempo Real** - Terminal com scanlines e cores cyberpunk  
✅ **Interface Intuitiva** - Design minimalista com animações glow  

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────┐
│   React UI (Cyberpunk Minimalism)   │
│  - Connection Node com glow effects  │
│  - Server List com latency badges    │
│  - Terminal-style logs               │
└────────────┬────────────────────────┘
             │ Capacitor Bridge
┌────────────▼────────────────────────┐
│  VpnBridge (Capacitor Plugin)       │
│  - startVpn() / stopVpn()           │
│  - getStatus()                      │
└────────────┬────────────────────────┘
             │ JNI
┌────────────▼────────────────────────┐
│  MyVpnService (Android VPN Service) │
│  - TUN Interface                    │
│  - Xray-core Integration            │
└────────────┬────────────────────────┘
             │ JNI Calls
┌────────────▼────────────────────────┐
│  Xray-core (libXray.so)             │
│  - VLESS/VMESS/Trojan               │
│  - DPI Bypass                       │
│  - Zero-rating                      │
└─────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Pré-requisitos

```bash
# Node.js 22.13.0+
node --version

# pnpm 10.15.1+
pnpm --version

# Android SDK + JDK 11+
export ANDROID_HOME=$HOME/Android/Sdk
```

### Instalação

```bash
# Clone o repositório
git clone https://github.com/nettunnel/pro.git
cd nettunnel-pro

# Instale dependências
pnpm install

# Instale Capacitor
pnpm add @capacitor/core @capacitor/cli @capacitor/android
```

### Desenvolvimento

```bash
# Inicie o servidor de desenvolvimento
pnpm dev
# Acesse: http://localhost:3000

# Build para produção
pnpm build

# Sincronize com Android
npx cap sync android

# Abra Android Studio
npx cap open android
```

### Build APK

```bash
# Debug APK
./gradlew assembleDebug
# Resultado: android/app/build/outputs/apk/debug/app-debug.apk

# Release APK
./gradlew assembleRelease
# Resultado: android/app/build/outputs/apk/release/app-release.apk
```

---

## 📱 Interface

### Tela Principal

A interface segue o design **Cyberpunk Minimalism** com:

- **Painel de Status (Esquerda):** Protocolo, IP externo, latência
- **Nó de Conexão (Centro):** Animação com glow cyan/purple
- **Logs (Direita):** Terminal com scanlines e cores neon
- **Botão de Controle:** Toggle grande para conectar/desconectar

### Componentes

| Componente | Função |
|-----------|--------|
| `ConnectionNode` | Nó animado com glow effects |
| `ServerList` | Lista de servidores com badges |
| `StatusPanel` | Status da conexão e criptografia |
| `ConnectionLogs` | Terminal de logs em tempo real |

---

## ⚙️ Configuração

### Variáveis de Ambiente

Crie `.env.local`:

```env
VITE_XRAY_CONFIG_URL=https://config.nettunnel.pro/xray.json
VITE_API_BASE_URL=https://api.nettunnel.pro
VITE_DEFAULT_SERVER=br-sp-01
```

### Configuração Xray

O arquivo `android/xray-config.json` define:

```json
{
  "outbounds": [{
    "protocol": "vless",
    "streamSettings": {
      "network": "ws",
      "security": "tls",
      "tlsSettings": {
        "serverName": "portalrecarga.vivo.com.br"  // SNI para zero-rating
      },
      "sockopt": {
        "fragment": {
          "packets": "1-3",
          "length": "10-20"
        }
      }
    }
  }]
}
```

### Customizar para Operadora

Para **Vivo**, **Claro**, **Oi**, etc:

```json
{
  "tlsSettings": {
    "serverName": "portalrecarga.vivo.com.br"  // Mude conforme operadora
  }
}
```

---

## 🔐 Segurança

### Checklist

- ✅ TLS 1.3 para comunicação
- ✅ Criptografia de configuração em repouso
- ✅ Validação de certificados
- ✅ Android Keystore para credenciais
- ✅ ProGuard/R8 para obfuscação

### Dados Sensíveis

- **UUID:** Armazenado em Android Keystore
- **Configuração:** Criptografada com EncryptedSharedPreferences
- **Logs:** Sem dados sensíveis

---

## 📊 Performance

| Métrica | Valor |
|---------|-------|
| Tempo de conexão | ~3-5 segundos |
| Overhead de memória | ~50-100MB |
| Latência adicionada | ~20-50ms |
| Suporte a protocolos | VLESS, VMESS, Trojan |

---

## 🐛 Troubleshooting

### Erro: "Permission Denied"

```bash
# Verificar permissões
adb shell pm list permissions | grep VPN

# Sincronizar Capacitor
npx cap sync android

# Limpar build
./gradlew clean
./gradlew assembleDebug
```

### Erro: "Core Exit (Status 1)"

```bash
# Verificar logs Xray
adb logcat | grep Xray

# Validar JSON
jq . android/xray-config.json

# Verificar se geoip.dat e geosite.dat existem
adb shell ls -la /data/data/com.nettunnelpro.vpn/assets/
```

### Sem Internet após conectar

```bash
# Verificar TUN interface
adb shell ifconfig tun0

# Testar SOCKS proxy
adb shell netstat -an | grep 10808

# Testar conectividade
adb shell ping 8.8.8.8
```

---

## 📚 Documentação

- **[BUILD_GUIDE.md](./BUILD_GUIDE.md)** - Guia completo de build e deployment
- **[docs/ANDROID_BUILD.md](./docs/ANDROID_BUILD.md)** - Passo a passo direto para gerar APK Android com Capacitor e Xray
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Arquitetura técnica detalhada
- **[ideas.md](./ideas.md)** - Conceitos de design explorados

---

## 🛠️ Stack Técnico

### Frontend
- React 19
- Vite 7
- Tailwind CSS 4
- shadcn/ui
- Wouter (routing)

### Mobile
- Capacitor 6
- Android SDK 34+
- Java 11+

### Core
- Xray-core (protocolos)
- libXray.so (JNI)
- geoip.dat / geosite.dat

### Build
- Gradle
- ProGuard/R8
- pnpm

---

## 📦 Estrutura de Arquivos

```
nettunnel-pro/
├── client/                          # Frontend React
│   ├── src/
│   │   ├── pages/Home.tsx           # Página principal
│   │   ├── components/              # Componentes UI
│   │   ├── contexts/VpnContext.tsx  # State management
│   │   └── index.css                # Cyberpunk theme
│   └── index.html
├── android/                         # Código nativo Android
│   ├── VpnBridge.java               # Capacitor plugin
│   ├── MyVpnService.java            # VPN service
│   ├── AndroidManifest.xml          # Permissões
│   └── xray-config.json             # Configuração Xray
├── BUILD_GUIDE.md                   # Guia de build
├── ARCHITECTURE.md                  # Arquitetura técnica
└── README.md                        # Este arquivo
```

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o repositório
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está licenciado sob a MIT License - veja o arquivo [LICENSE](./LICENSE) para detalhes.

---

## 📞 Suporte

Para problemas ou dúvidas:

1. Verifique a [documentação](./BUILD_GUIDE.md)
2. Procure por issues similares
3. Abra uma nova issue com detalhes

---

## 🙏 Agradecimentos

- [Xray-core](https://github.com/XTLS/Xray-core) - Core engine
- [Capacitor](https://capacitorjs.com/) - Mobile bridge
- [React](https://react.dev/) - UI framework
- [Tailwind CSS](https://tailwindcss.com/) - Styling

---

**NetTunnel Pro** - Conecte-se com segurança, liberdade e velocidade.

**Versão:** 1.0.0  
**Última atualização:** 2026-05-04  
**Mantido por:** NetTunnel Pro Team
