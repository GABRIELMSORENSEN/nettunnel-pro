# NetTunnel Pro - Secrets Management Guide

## 🔐 Proteção de Informações Sensíveis

Este documento explica como gerenciar informações sensíveis no NetTunnel Pro de forma segura.

---

## 📋 Variáveis de Ambiente Necessárias

### Banco de Dados
```
DATABASE_URL=mysql://user:password@localhost:3306/nettunnel_pro
```

### Autenticação & OAuth
```
VITE_APP_ID=your_manus_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
JWT_SECRET=your_jwt_secret_key
```

### Manus Built-in APIs
```
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your_forge_api_key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=your_frontend_forge_api_key
```

### Owner Information
```
OWNER_OPEN_ID=your_owner_open_id
OWNER_NAME=Your Name
```

### Analytics
```
VITE_ANALYTICS_ENDPOINT=https://analytics.manus.im
VITE_ANALYTICS_WEBSITE_ID=your_analytics_id
```

### App Configuration
```
VITE_APP_TITLE=NetTunnel Pro VPN
VITE_APP_LOGO=https://your-domain.com/logo.png
```

### Android Signing
```
ANDROID_KEYSTORE_PATH=./nettunnel-pro.keystore
ANDROID_KEYSTORE_PASSWORD=your_keystore_password
ANDROID_KEY_ALIAS=nettunnel-pro
ANDROID_KEY_PASSWORD=your_key_password
```

### Google Play Store
```
GOOGLE_PLAY_SERVICE_ACCOUNT=base64_encoded_json
GOOGLE_PLAY_PACKAGE_NAME=com.nettunnel.pro
GOOGLE_PLAY_TRACK=internal
```

### GitHub
```
GITHUB_TOKEN=your_github_token
```

### Xray Configuration
```
XRAY_SERVER_URL=your_xray_server_url
XRAY_SERVER_PORT=443
XRAY_PROTOCOL=vless
```

### VPN Configuration
```
DEFAULT_CARRIER=vivo
DEFAULT_SNI=portalrecarga.vivo.com.br
DEFAULT_PAYLOAD_METHOD=http
DEFAULT_DPI_BYPASS=true
DEFAULT_KEEP_ALIVE=15
```

---

## 🛡️ Arquivos a Proteger

### Nunca fazer commit destes arquivos:

```
.env
.env.local
.env.*.local
nettunnel-pro.keystore
*.keystore
google-play-service-account.json
github-token.txt
```

### .gitignore já protege:

```
# Environment files
.env*
!.env.example

# Secrets
*.keystore
*.jks
*-service-account.json
*-credentials.json

# Private keys
*.pem
*.key
*.p8
*.p12
```

---

## 🔑 Como Configurar Localmente

### 1. Criar arquivo .env.local

```bash
cp .env.example .env.local
```

### 2. Preencher valores sensíveis

```bash
# Editar .env.local com seus valores
nano .env.local
```

### 3. Verificar .gitignore

```bash
# Confirmar que .env.local está ignorado
git check-ignore .env.local
# Deve retornar: .env.local
```

### 4. Testar configuração

```bash
# Verificar se variáveis estão carregadas
pnpm dev
```

---

## 🚀 Deploy em Produção

### Manus Platform

As variáveis de ambiente são gerenciadas automaticamente:

1. Acesse o painel Manus
2. Vá para Settings → Secrets
3. Adicione cada variável necessária
4. Deploy automático com as variáveis injetadas

### GitHub Actions

Para CI/CD, adicione secrets no GitHub:

1. Repository → Settings → Secrets and variables → Actions
2. Clique em "New repository secret"
3. Adicione cada variável:
   - `DATABASE_URL`
   - `ANDROID_KEYSTORE_PASSWORD`
   - `GOOGLE_PLAY_SERVICE_ACCOUNT`
   - etc.

**Exemplo no workflow:**
```yaml
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  ANDROID_KEYSTORE_PASSWORD: ${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
```

---

## 📱 Android Keystore

### Criar novo keystore

```bash
keytool -genkey -v -keystore nettunnel-pro.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias nettunnel-pro \
  -storepass sua_senha \
  -keypass sua_senha
```

### Usar em build.gradle

```gradle
signingConfigs {
    release {
        storeFile file(System.getenv("ANDROID_KEYSTORE_PATH") ?: "nettunnel-pro.keystore")
        storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
        keyAlias System.getenv("ANDROID_KEY_ALIAS") ?: "nettunnel-pro"
        keyPassword System.getenv("ANDROID_KEY_PASSWORD")
    }
}
```

### ⚠️ IMPORTANTE

- **Nunca** fazer commit do keystore
- **Backup** seguro do keystore (você não consegue recuperar se perder)
- **Senha forte** para o keystore
- **Armazenar** em local seguro (1Password, LastPass, etc)

---

## 🔗 Google Play Service Account

### Criar Service Account

1. Google Cloud Console → Create Project
2. Enable Google Play Developer API
3. Create Service Account
4. Download JSON key
5. Encode em base64:

```bash
base64 -i service-account.json -o service-account.b64
cat service-account.b64
```

6. Adicionar como secret: `GOOGLE_PLAY_SERVICE_ACCOUNT`

### ⚠️ IMPORTANTE

- **Nunca** fazer commit do JSON
- **Proteger** a chave base64
- **Rotacionar** chaves regularmente
- **Limitar** permissões ao mínimo necessário

---

## 🔐 GitHub Token

### Criar Personal Access Token

1. GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. Selecionar scopes:
   - `repo` (full control of private repositories)
   - `workflow` (update GitHub Actions and workflows)
4. Copiar token
5. Adicionar como secret: `GITHUB_TOKEN`

### ⚠️ IMPORTANTE

- **Nunca** fazer commit do token
- **Revogar** token se comprometido
- **Rotacionar** tokens anualmente
- **Usar** fine-grained tokens quando possível

---

## 🛡️ Checklist de Segurança

- [ ] `.env.local` adicionado ao `.gitignore`
- [ ] Nenhum arquivo `.env*` commitado
- [ ] Keystore não commitado
- [ ] Service account JSON não commitado
- [ ] GitHub token não commitado
- [ ] Secrets configurados no Manus
- [ ] Secrets configurados no GitHub Actions
- [ ] `.gitignore` revisado
- [ ] `git log` verificado para dados sensíveis
- [ ] Backup seguro de keystores
- [ ] Senhas fortes em todos os secrets
- [ ] Acesso restrito a secrets (apenas admin)

---

## 🚨 Se Dados Sensíveis Foram Commitados

### Ação Imediata

1. **Revogar** todos os tokens/chaves comprometidos
2. **Criar** novos tokens/chaves
3. **Atualizar** secrets em todos os places
4. **Remover** histórico do Git:

```bash
# Remover arquivo do histórico
git filter-branch --tree-filter 'rm -f .env' HEAD

# Ou usar BFG Repo-Cleaner
bfg --delete-files .env
```

5. **Force push** (com cuidado):

```bash
git push origin --force-with-lease
```

---

## 📚 Recursos Úteis

- [GitHub - Protecting Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [OWASP - Secrets Management](https://owasp.org/www-community/Sensitive_Data_Exposure)
- [12 Factor App - Config](https://12factor.net/config)
- [Git - Removing Sensitive Data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)

---

## ✅ Status

- ✅ Proteção de secrets configurada
- ✅ .gitignore robusto
- ✅ Documentação completa
- ✅ Pronto para repositório público

**Seu projeto está seguro para ser público!** 🔒
