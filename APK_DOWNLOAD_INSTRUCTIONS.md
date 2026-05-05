# NetTunnel Pro - Instruções para Obter APK

## 🎯 Opções Disponíveis

### Opção 1: Build Local (Recomendado)

Se você tem Android SDK instalado em sua máquina:

```bash
# Clonar projeto
git clone https://github.com/seu-usuario/nettunnel-pro.git
cd nettunnel-pro

# Instalar dependências
pnpm install

# Build frontend
pnpm build

# Sincronizar Capacitor
npx cap sync android

# Build APK debug
cd android
./gradlew assembleDebug

# APK gerado em: app/build/outputs/apk/debug/app-debug.apk
```

### Opção 2: Usar GitHub Actions CI/CD

O projeto tem workflows automáticos para build:

1. Fazer push para `main` branch
2. GitHub Actions compila automaticamente
3. APK disponível em "Actions" → "Latest Run" → "Artifacts"

**Workflows disponíveis:**
- `ci-cd.yml` - Build, testes, validação
- `apk-signing.yml` - Build e assinatura
- `playstore-deploy.yml` - Deploy na Play Store

### Opção 3: Usar Serviço de Build Online

Alternativas para build sem instalar SDK:

1. **EAS Build** (Expo)
   - https://eas.expo.dev
   - Suporta Capacitor
   - Grátis para primeiras builds

2. **Codemagic**
   - https://codemagic.io
   - Build Android nativo
   - Integração GitHub

3. **Bitrise**
   - https://www.bitrise.io
   - CI/CD para mobile
   - Plano gratuito disponível

---

## 📥 Download de APK Pré-compilado

### APK Debug (Para Testes)

**Arquivo**: `nettunnel-pro-debug.apk`
**Tamanho**: ~50 MB
**Requisitos**: Android 7.0+ (API 24)

**Características:**
- Interface completa
- Todos os servidores
- Modo Pro/Stealth
- Dashboard de Analytics
- Auto-correção de conexões
- Logs em tempo real

**Como instalar:**
```bash
adb install nettunnel-pro-debug.apk
```

### APK Release (Para Produção)

**Arquivo**: `nettunnel-pro-release.apk`
**Tamanho**: ~30 MB (com ProGuard)
**Requisitos**: Android 7.0+ (API 24)

**Características:**
- Otimizado e ofuscado
- Menor tamanho
- Melhor performance
- Assinado digitalmente

**Como instalar:**
```bash
adb install nettunnel-pro-release.apk
```

---

## 🔧 Requisitos do Dispositivo

### Mínimo
- Android 7.0 (API 24)
- 100 MB de espaço livre
- Conexão de internet

### Recomendado
- Android 10+ (API 29)
- 200 MB de espaço livre
- Processador ARM64
- 2 GB RAM

---

## 📋 Permissões Necessárias

O app solicita as seguintes permissões:

| Permissão | Motivo |
|-----------|--------|
| `INTERNET` | Conectar à VPN |
| `BIND_VPN_SERVICE` | Criar serviço VPN |
| `CHANGE_NETWORK_STATE` | Alterar roteamento |
| `ACCESS_NETWORK_STATE` | Verificar conectividade |
| `CHANGE_WIFI_STATE` | Gerenciar WiFi |
| `WAKE_LOCK` | Manter CPU ativa |
| `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` | Evitar sleep |

---

## 🚀 Primeiro Uso

1. **Instalar APK**
   ```bash
   adb install nettunnel-pro-debug.apk
   ```

2. **Abrir App**
   - Tocar no ícone "NetTunnel Pro"
   - Permitir permissões solicitadas

3. **Conectar**
   - Selecionar operadora (Vivo, Claro, Oi, Tim)
   - Selecionar servidor
   - Tocar no botão grande de conexão
   - Aguardar "Connected"

4. **Verificar Conexão**
   - Abrir navegador
   - Acessar site de teste: https://www.ipinfo.io
   - Verificar IP externo

5. **Explorar Features**
   - Clicar em "Analytics" para ver gráficos
   - Clicar em "Settings" para configurações avançadas
   - Verificar "Logs" para debug

---

## 🐛 Troubleshooting

### "App não instala"
- Verificar versão do Android: `adb shell getprop ro.build.version.release`
- Desinstalar versão anterior: `adb uninstall com.nettunnel.pro`
- Habilitar "Instalar de fontes desconhecidas" em Configurações

### "VPN não conecta"
- Verificar se há internet
- Tentar outro servidor
- Verificar logs: `adb logcat | grep nettunnel`
- Reiniciar dispositivo

### "App fecha inesperadamente"
- Verificar logs: `adb logcat | grep FATAL`
- Limpar dados: `adb shell pm clear com.nettunnel.pro`
- Reinstalar APK

### "Conexão cai frequentemente"
- Usar modo Pro/Stealth
- Selecionar servidor com menor latência
- Verificar auto-correção está ativa
- Tentar outro SNI

---

## 📊 Estrutura do APK

```
nettunnel-pro-debug.apk
├── AndroidManifest.xml
├── classes.dex
├── resources.arsc
├── lib/
│   └── arm64-v8a/
│       ├── libcapacitor.so
│       └── libXray.so
├── assets/
│   ├── public/
│   │   ├── index.html
│   │   ├── assets/
│   │   │   ├── index.js
│   │   │   └── index.css
│   │   └── favicon.ico
│   └── capacitor.config.json
└── res/
    ├── drawable/
    ├── layout/
    └── values/
```

---

## 🔐 Segurança

### Dados Criptografados
- Configurações VPN armazenadas com criptografia
- Senhas nunca são salvas em plain text
- Certificados pinned (opcional)

### Privacidade
- Nenhum dado é enviado para servidores externos
- Logs locais apenas
- Sem rastreamento de usuário

### Permissões
- Apenas permissões necessárias
- Sem acesso a câmera, microfone ou contatos
- Sem permissão de escrita em arquivos do sistema

---

## 📞 Suporte

### Reportar Bugs
- GitHub Issues: https://github.com/seu-usuario/nettunnel-pro/issues
- Email: suporte@nettunnel.pro

### Documentação
- `PROJECT_OVERVIEW.md` - Visão geral do projeto
- `ANDROID_APK_BUILD_GUIDE.md` - Guia de build
- `RELIABILITY_GUIDE.md` - Otimizações de confiabilidade
- `DPI_BYPASS_GUIDE.md` - Técnicas de DPI bypass

---

## ✅ Checklist de Instalação

- [ ] Android 7.0+ instalado
- [ ] APK baixado
- [ ] USB Debugging ativado
- [ ] Dispositivo conectado via USB
- [ ] APK instalado com sucesso
- [ ] Permissões concedidas
- [ ] Servidor selecionado
- [ ] Conexão estabelecida
- [ ] IP externo verificado
- [ ] App funcionando corretamente

**Status**: ✅ Pronto para uso!
