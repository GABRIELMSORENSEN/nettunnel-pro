# Git Hooks com Husky

Este projeto utiliza **Husky** para automatizar validações antes de commits, garantindo qualidade e consistência de código.

## 🎯 Hooks Configurados

### 1. Pre-commit Hook

**Localização:** `.husky/pre-commit`

**O que faz:**

- Executa `lint-staged` para validar arquivos em staging
- Formata código com Prettier
- Valida tipos TypeScript com `tsc --noEmit`
- Impede commits com código mal formatado ou com erros de tipo

**Arquivos validados:**

- `*.ts`, `*.tsx`, `*.js`, `*.jsx` - TypeScript/JavaScript
- `*.json`, `*.md`, `*.css` - Configuração e documentação
- `*.java` - Código nativo Android

**Exemplo:**

```bash
$ git commit -m "feat: add new component"
# Husky executa pre-commit hook
# → Prettier formata arquivos
# → TypeScript valida tipos
# → Se OK, commit é aceito
# → Se erro, commit é rejeitado
```

### 2. Commit-msg Hook

**Localização:** `.husky/commit-msg`

**O que faz:**

- Valida o formato da mensagem de commit
- Garante que commits seguem Conventional Commits
- Rejeita mensagens mal formatadas

**Formatos aceitos:**

| Tipo       | Descrição                 | Exemplo                                |
| ---------- | ------------------------- | -------------------------------------- |
| `feat`     | Nova funcionalidade       | `feat: add connection animations`      |
| `fix`      | Correção de bug           | `fix(android): resolve VPN permission` |
| `docs`     | Documentação              | `docs: update README`                  |
| `style`    | Formatação/estilos        | `style: adjust spacing`                |
| `refactor` | Refatoração de código     | `refactor: simplify connection logic`  |
| `perf`     | Otimização de performance | `perf: reduce bundle size`             |
| `test`     | Testes                    | `test: add connection tests`           |
| `chore`    | Tarefas administrativas   | `chore: update dependencies`           |
| `ci`       | CI/CD                     | `ci: add GitHub Actions workflow`      |
| `build`    | Build system              | `build: update Gradle config`          |

**Exemplo com escopo:**

```bash
feat(ui): add connection node animations
fix(android): resolve VPN permission issue
docs(build): update build guide
```

**Exemplo com breaking change:**

```bash
feat!: redesign connection interface
feat(api)!: change authentication flow
```

## 📋 Configuração

### `.lintstagedrc.json`

Define quais ferramentas rodam em cada tipo de arquivo:

```json
{
  "*.{ts,tsx,js,jsx}": ["prettier --write", "tsc --noEmit"],
  "*.{json,md,css}": ["prettier --write"]
}
```

### `.prettierrc`

Configuração de formatação de código:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

## 🚀 Uso

### Instalação

Husky é instalado automaticamente via `prepare` script:

```bash
pnpm install
# Husky instala hooks automaticamente
```

### Validação Manual

Validar código sem fazer commit:

```bash
# Verificar linting
pnpm lint

# Corrigir formatação
pnpm lint:fix

# Validar tipos TypeScript
pnpm check

# Formatar código
pnpm format
```

### Fazer Commit

```bash
# Adicionar arquivos
git add .

# Fazer commit (Husky valida automaticamente)
git commit -m "feat: add new feature"

# Se houver erros:
# ❌ Prettier formata arquivo
# ❌ TypeScript encontra erro de tipo
# → Commit é rejeitado
# → Corrija os erros e tente novamente
```

### Ignorar Hooks (Não Recomendado)

Se precisar ignorar hooks temporariamente:

```bash
# Ignorar todos os hooks
git commit --no-verify -m "message"

# Ou usar flag curta
git commit -n -m "message"
```

⚠️ **Aviso:** Ignorar hooks pode permitir código com problemas. Use apenas em emergências.

## 🔧 Troubleshooting

### Erro: "Hook not found"

**Causa:** Husky não foi instalado corretamente

**Solução:**

```bash
pnpm install
npx husky install
```

### Erro: "Permission denied"

**Causa:** Hooks não têm permissão de execução

**Solução:**

```bash
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
```

### Erro: "Prettier formatting failed"

**Causa:** Arquivo tem formatação inconsistente

**Solução:**

```bash
pnpm format
git add .
git commit -m "message"
```

### Erro: "TypeScript compilation failed"

**Causa:** Código tem erros de tipo

**Solução:**

```bash
# Verificar erros
pnpm check

# Corrigir erros manualmente
# Depois tentar commit novamente
```

### Erro: "Commit message format invalid"

**Causa:** Mensagem não segue Conventional Commits

**Solução:**

```bash
# Formato correto:
git commit -m "feat: description"
git commit -m "fix(scope): description"

# Exemplos válidos:
git commit -m "feat: add connection animations"
git commit -m "fix(android): resolve permission issue"
git commit -m "docs: update build guide"
```

## 📚 Recursos

- [Husky Documentation](https://typicode.github.io/husky/)
- [lint-staged](https://github.com/okonet/lint-staged)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Prettier](https://prettier.io/)

## ✅ Checklist de Setup

- [ ] Executar `pnpm install` para instalar Husky
- [ ] Verificar se `.husky/pre-commit` existe e é executável
- [ ] Verificar se `.husky/commit-msg` existe e é executável
- [ ] Testar commit com mensagem válida
- [ ] Testar commit com mensagem inválida (deve rejeitar)
- [ ] Testar commit com código mal formatado (deve rejeitar)

---

**Versão:** 1.0.0  
**Última atualização:** 2026-05-04
