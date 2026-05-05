# NetTunnel Pro - Security & Privacy

## 🔐 Segurança do Projeto

Este documento descreve as práticas de segurança implementadas no NetTunnel Pro.

---

## ✅ Proteção de Dados Sensíveis

### Arquivos Protegidos

O projeto está configurado para **nunca** fazer commit dos seguintes arquivos:

```
# Environment variables
.env
.env.local
.env.*.local

# Android Keystores
*.keystore
*.jks
release.keystore
debug.keystore

# Certificates and Keys
*.pem
*.key
*.crt
*.cert

# Service Accounts
*-service-account.json
*-credentials.json
google-play-service-account.json
service-account.json

# Tokens
github-token.txt
*.token

# Secrets
.secrets/
secrets.json
*.secret
```

### Verificação

```bash
# Verificar se um arquivo está protegido
git check-ignore .env.local
# Deve retornar: .env.local

# Listar todos os arquivos ignorados
git status --ignored
```

---

## 🛡️ Configuração de Segurança

### 1. Variáveis de Ambiente

**Nunca** adicione valores reais ao repositório:

```bash
# ❌ ERRADO - Nunca faça isso
DATABASE_URL=mysql://admin:senha123@localhost/db
ANDROID_KEYSTORE_PASSWORD=minha_senha_secreta

# ✅ CORRETO - Use .env.local
cp .env.example .env.local
# Editar .env.local com valores reais (nunca commit)
```

### 2. Keystores Android

**Backup seguro obrigatório:**

```bash
# Criar backup do keystore
cp nettunnel-pro.keystore ~/backup/nettunnel-pro.keystore.backup

# Armazenar em local seguro:
# - 1Password, LastPass, Bitwarden
# - Google Drive (criptografado)
# - Pendrive criptografado
# - Servidor seguro
```

⚠️ **IMPORTANTE:** Se perder o keystore, não conseguirá atualizar o app na Play Store!

### 3. Service Accounts Google Play

**Proteção máxima:**

```bash
# Nunca fazer commit
git check-ignore google-play-service-account.json

# Armazenar em local seguro
# - GitHub Secrets (para CI/CD)
# - Manus Secrets (para deploy)
# - 1Password (para backup)
```

### 4. GitHub Tokens

**Rotação regular:**

```bash
# Criar novo token anualmente
# GitHub → Settings → Developer settings → Personal access tokens
# Revogar token antigo
# Atualizar em GitHub Secrets
```

---

## 🔒 Checklist de Segurança

Antes de fazer push para repositório público:

- [ ] `.env.local` adicionado ao `.gitignore`
- [ ] Nenhum arquivo `.env*` no repositório
- [ ] Keystores não commitados
- [ ] Service accounts não commitados
- [ ] Tokens não commitados
- [ ] `git log` verificado para dados sensíveis
- [ ] `.gitignore` revisado
- [ ] Backup seguro de keystores
- [ ] Senhas fortes em todos os secrets
- [ ] Acesso restrito a secrets (apenas admin)

---

## 🚨 Se Dados Sensíveis Foram Expostos

### Ação Imediata

1. **Revogar** todos os tokens/chaves
2. **Criar** novos tokens/chaves
3. **Atualizar** secrets em todos os places
4. **Remover** do histórico Git:

```bash
# Remover arquivo do histórico
git filter-branch --tree-filter 'rm -f .env.local' HEAD

# Ou usar BFG Repo-Cleaner
bfg --delete-files .env.local
```

5. **Force push:**

```bash
git push origin --force-with-lease
```

---

## 📚 Documentação de Segurança

- **SECRETS_MANAGEMENT.md** - Guia completo de gerenciamento de secrets
- **.gitignore** - Proteção automática de arquivos sensíveis
- **.env.example** - Template de variáveis (sem valores reais)

---

## ✅ Status de Segurança

- ✅ Proteção de .env files
- ✅ Proteção de keystores
- ✅ Proteção de service accounts
- ✅ Proteção de tokens
- ✅ .gitignore robusto
- ✅ Documentação completa
- ✅ **Pronto para repositório público**

---

## 🔗 Recursos

- [GitHub - Protecting Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [OWASP - Secrets Management](https://owasp.org/www-community/Sensitive_Data_Exposure)
- [Git - Removing Sensitive Data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)

---

**Seu projeto está seguro para ser público!** 🔒
