# NetTunnel Pro - GitHub Releases & APK Downloads

## 📥 Como Baixar o APK

### Opção 1: Releases Automáticas (Recomendado)

Toda vez que uma nova versão é lançada, o GitHub Actions compila automaticamente o APK e disponibiliza para download:

1. Acesse: https://github.com/GABRIELMSORENSEN/nettunnel-pro/releases
2. Selecione a versão desejada
3. Baixe o APK (Debug ou Release)
4. Instale no seu dispositivo Android

### Opção 2: Compilar Localmente

Se preferir compilar você mesmo:

```bash
# Clonar repositório
git clone https://github.com/GABRIELMSORENSEN/nettunnel-pro.git
cd nettunnel-pro

# Instalar dependências
pnpm install

# Build frontend
pnpm build

# Sincronizar Capacitor
npx cap sync android

# Build APK
cd android
./gradlew assembleDebug

# APK gerado em: app/build/outputs/apk/debug/app-debug.apk
```

---

## 🚀 Workflows Automáticos

### 1. Build & Release APK (`build-release-apk.yml`)

**Acionado por:**
- Push de tags (ex: `git tag v1.0.0 && git push --tags`)
- Manual via "Run workflow" no GitHub Actions

**Gera:**
- APK Debug (~50 MB)
- APK Release (~30 MB)
- Release no GitHub com downloads

**Exemplo:**
```bash
# Criar tag e fazer push
git tag v1.0.0
git push origin v1.0.0

# GitHub Actions compila automaticamente
# APK disponível em: https://github.com/GABRIELMSORENSEN/nettunnel-pro/releases/tag/v1.0.0
```

### 2. Auto Release (`auto-release.yml`)

**Acionado por:**
- Push na branch `main` com mudança em `package.json`
- Detecta automaticamente nova versão

**Processo:**
1. Compara versão em `package.json` com última tag
2. Se versão mudou, compila APK automaticamente
3. Cria release no GitHub com APK

**Exemplo:**
```bash
# Atualizar versão em package.json
# "version": "1.0.1"

# Fazer commit e push
git add package.json
git commit -m "chore: bump version to 1.0.1"
git push origin main

# GitHub Actions detecta mudança e cria release automaticamente
```

---

## 📦 Tipos de APK

### APK Debug
- **Arquivo:** `app-debug.apk`
- **Tamanho:** ~50 MB
- **Uso:** Testes e desenvolvimento
- **Assinatura:** Debug key (padrão)
- **Performance:** Normal
- **Logs:** Completos

**Quando usar:**
- Testes em dispositivo
- Desenvolvimento
- Verificar features
- Debug de problemas

### APK Release
- **Arquivo:** `app-release.apk`
- **Tamanho:** ~30 MB (com ProGuard)
- **Uso:** Produção
- **Assinatura:** Release key (se configurado)
- **Performance:** Otimizado
- **Logs:** Reduzidos

**Quando usar:**
- Distribuição em produção
- Play Store
- Uso final
- Performance crítica

---

## 🔧 Como Instalar APK

### Via ADB (Recomendado)

```bash
# Conectar dispositivo via USB
# Ativar Debug Mode

# Instalar APK
adb install app-debug.apk

# Ou instalar e iniciar
adb install -r app-debug.apk
adb shell am start -n com.nettunnel.pro/.MainActivity
```

### Via Arquivo (Manual)

1. Baixar APK do GitHub
2. Transferir para dispositivo (USB, email, etc)
3. Abrir arquivo no dispositivo
4. Permitir instalação de "Fontes desconhecidas"
5. Clicar em "Instalar"

### Via Play Store (Futuro)

Quando publicado na Play Store:
1. Abrir Google Play Store
2. Buscar "NetTunnel Pro"
3. Clicar em "Instalar"

---

## 📊 Histórico de Releases

| Versão | Data | Tipo | Tamanho | Download |
|--------|------|------|---------|----------|
| v3.0.0 | 2026-05-05 | Debug | 50 MB | [Link](https://github.com/GABRIELMSORENSEN/nettunnel-pro/releases/tag/v3.0.0) |
| v2.0.0 | 2026-05-04 | Debug | 48 MB | [Link](https://github.com/GABRIELMSORENSEN/nettunnel-pro/releases/tag/v2.0.0) |
| v1.0.0 | 2026-05-03 | Debug | 45 MB | [Link](https://github.com/GABRIELMSORENSEN/nettunnel-pro/releases/tag/v1.0.0) |

---

## 🎯 Próximas Releases Planejadas

### v3.1.0 (Próxima)
- [ ] Testes unitários com Vitest (80%+ cobertura)
- [ ] Dashboard de monitoramento em tempo real
- [ ] Notificações push integradas
- [ ] Melhorias de performance

### v4.0.0 (Futuro)
- [ ] Publicação na Play Store
- [ ] Suporte a iOS via Capacitor
- [ ] Sincronização em nuvem de configurações
- [ ] Modo offline com cache

---

## 🐛 Troubleshooting

### APK não instala

```bash
# Desinstalar versão anterior
adb uninstall com.nettunnel.pro

# Instalar novamente
adb install app-debug.apk
```

### Erro: "App não é compatível"

- Verificar versão do Android: `adb shell getprop ro.build.version.release`
- Requisito mínimo: Android 7.0 (API 24)
- Usar emulador com API 34 para testes

### Build falha no GitHub Actions

- Verificar logs em: https://github.com/GABRIELMSORENSEN/nettunnel-pro/actions
- Comum: Android SDK não instalado (resolvido automaticamente)
- Comum: Gradle cache corrompido (limpar com `./gradlew clean`)

---

## 📝 Versionamento

Seguimos [Semantic Versioning](https://semver.org/):

- **MAJOR** (v1.0.0): Mudanças incompatíveis
- **MINOR** (v1.1.0): Novas features compatíveis
- **PATCH** (v1.0.1): Bug fixes

**Exemplo:**
```bash
# Feature nova
git tag v1.1.0

# Bug fix
git tag v1.0.1

# Breaking change
git tag v2.0.0
```

---

## 🔐 Segurança

### Verificar Integridade do APK

```bash
# Verificar assinatura
jarsigner -verify -verbose app-debug.apk

# Verificar hash
sha256sum app-debug.apk
```

### Permissões Solicitadas

O app solicita apenas permissões necessárias:
- `INTERNET` - Conectar à VPN
- `BIND_VPN_SERVICE` - Criar serviço VPN
- `CHANGE_NETWORK_STATE` - Alterar roteamento
- `WAKE_LOCK` - Manter CPU ativa

---

## 📞 Suporte

- **Issues:** https://github.com/GABRIELMSORENSEN/nettunnel-pro/issues
- **Discussions:** https://github.com/GABRIELMSORENSEN/nettunnel-pro/discussions
- **Releases:** https://github.com/GABRIELMSORENSEN/nettunnel-pro/releases

---

## ✅ Checklist de Download & Instalação

- [ ] Acessar página de releases no GitHub
- [ ] Selecionar versão desejada
- [ ] Baixar APK (Debug ou Release)
- [ ] Conectar dispositivo Android via USB
- [ ] Ativar Debug Mode no dispositivo
- [ ] Executar: `adb install app-debug.apk`
- [ ] Abrir app no dispositivo
- [ ] Permitir permissões solicitadas
- [ ] Testar conexão VPN
- [ ] Verificar Analytics e Logs

**Status:** ✅ Pronto para download!
