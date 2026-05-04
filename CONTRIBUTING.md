# Contribuindo para NetTunnel Pro

Obrigado por considerar contribuir para o NetTunnel Pro! Este documento fornece diretrizes e instruções para contribuir ao projeto.

## 📋 Código de Conduta

Todos os contribuidores devem seguir nosso código de conduta:

- Ser respeitoso com outros contribuidores
- Aceitar críticas construtivas
- Focar no que é melhor para a comunidade
- Ser empático com outros membros

## 🚀 Como Começar

### 1. Fork e Clone

```bash
# Fork o repositório no GitHub
# Clone seu fork
git clone https://github.com/seu-usuario/nettunnel-pro.git
cd nettunnel-pro

# Adicione o repositório original como upstream
git remote add upstream https://github.com/nettunnel/pro.git
```

### 2. Setup de Desenvolvimento

```bash
# Instale dependências
pnpm install

# Husky hooks serão instalados automaticamente
# Verifique se .husky/pre-commit existe

# Inicie o servidor de desenvolvimento
pnpm dev
# Acesse: http://localhost:3000
```

### 3. Crie uma Branch

```bash
# Atualize main
git checkout main
git pull upstream main

# Crie uma branch para sua feature
git checkout -b feat/sua-feature
# ou para bugfix
git checkout -b fix/seu-bugfix
```

## 💻 Desenvolvimento

### Estrutura do Projeto

```
nettunnel-pro/
├── client/                      # Frontend React
│   ├── src/
│   │   ├── pages/               # Páginas da aplicação
│   │   ├── components/          # Componentes reutilizáveis
│   │   ├── contexts/            # Context API (state management)
│   │   ├── hooks/               # Custom React hooks
│   │   ├── lib/                 # Utilitários
│   │   └── index.css            # Estilos globais (Tailwind)
│   └── index.html
├── android/                     # Código nativo Android
│   ├── VpnBridge.java           # Capacitor plugin
│   ├── MyVpnService.java        # VPN Service
│   └── xray-config.json         # Configuração Xray
├── .husky/                      # Git hooks
├── BUILD_GUIDE.md               # Guia de build
├── ARCHITECTURE.md              # Arquitetura técnica
└── README.md                    # Visão geral
```

### Padrões de Código

#### React/TypeScript

```typescript
// ✅ Bom: Componente funcional com tipos
interface ConnectionNodeProps {
  isActive: boolean;
  isConnecting?: boolean;
  label?: string;
}

export function ConnectionNode({ isActive, isConnecting, label }: ConnectionNodeProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      {/* Componente */}
    </div>
  );
}

// ❌ Ruim: Sem tipos, sem interface
export function ConnectionNode(props) {
  return <div>{props.children}</div>;
}
```

#### Styling com Tailwind

```typescript
// ✅ Bom: Usar classes Tailwind
<div className="bg-slate-900 border border-slate-700 rounded-sm p-3 hover:border-purple-500">
  Content
</div>

// ❌ Ruim: CSS inline ou custom CSS
<div style={{ backgroundColor: '#1e293b', border: '1px solid #404854' }}>
  Content
</div>
```

#### Gerenciamento de Estado

```typescript
// ✅ Bom: Usar Context API
const { isConnected, connect } = useVpn();

// ❌ Ruim: Props drilling
<Component isConnected={isConnected} connect={connect} />
```

#### Nomes Significativos

```typescript
// ✅ Bom
const handleToggleConnection = () => {};
const isConnected = true;
const vpnConfig: VpnConfig = {};

// ❌ Ruim
const toggle = () => {};
const connected = true;
const config = {};
```

### Java/Android

```java
// ✅ Bom: Nomes descritivos, comentários
/**
 * Inicia VPN com configuração Xray
 * @param config Configuração JSON do Xray
 */
public void startVpn(String config) {
  // Implementação
}

// ❌ Ruim: Nomes genéricos
public void start(String c) {
  // Implementação
}
```

## 📝 Commits

### Formato de Mensagem

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Tipos:**

- `feat` - Nova funcionalidade
- `fix` - Correção de bug
- `docs` - Documentação
- `style` - Formatação/estilos
- `refactor` - Refatoração
- `perf` - Performance
- `test` - Testes
- `chore` - Tarefas administrativas

**Exemplos:**

```bash
# Feature simples
git commit -m "feat: add connection node animations"

# Bugfix com escopo
git commit -m "fix(android): resolve VPN permission issue"

# Documentação
git commit -m "docs: update build guide with Xray setup"

# Com breaking change
git commit -m "feat!: redesign connection interface"
```

### Validação Automática

Husky valida automaticamente:

```bash
# Prettier formata código
# TypeScript valida tipos
# Mensagem segue Conventional Commits

# Se houver erro, commit é rejeitado
# Corrija e tente novamente
```

## 🧪 Testes

### Executar Testes

```bash
# Testes unitários
pnpm test

# Testes com coverage
pnpm test:coverage

# Testes em watch mode
pnpm test:watch
```

### Escrever Testes

```typescript
// ✅ Bom: Testes descritivos
describe('ConnectionNode', () => {
  it('should render with glow effect when active', () => {
    render(<ConnectionNode isActive={true} />);
    expect(screen.getByRole('img')).toHaveClass('glow-cyan');
  });

  it('should show connecting state', () => {
    render(<ConnectionNode isConnecting={true} />);
    expect(screen.getByText('CONECTANDO')).toBeInTheDocument();
  });
});
```

## 🔍 Code Review

### Antes de Submeter PR

- [ ] Código segue padrões do projeto
- [ ] Testes foram adicionados/atualizados
- [ ] Documentação foi atualizada
- [ ] Sem console.log() ou código de debug
- [ ] Sem breaking changes não documentadas
- [ ] Commits seguem Conventional Commits

### Durante Code Review

- Seja aberto a feedback
- Responda questões e sugestões
- Faça as alterações solicitadas
- Rebase com main se necessário

## 📦 Build e Deployment

### Build Frontend

```bash
# Build para produção
pnpm build

# Preview do build
pnpm preview
```

### Build Android

```bash
# Sincronize com Capacitor
npx cap sync android

# Build APK debug
./gradlew assembleDebug

# Build APK release
./gradlew assembleRelease
```

## 🐛 Reportar Bugs

Ao reportar um bug, inclua:

1. **Descrição clara** do problema
2. **Passos para reproduzir**
3. **Comportamento esperado** vs **comportamento atual**
4. **Screenshots/logs** se aplicável
5. **Ambiente** (OS, versão Android, etc)

**Exemplo:**

```markdown
## Descrição

Ao conectar via São Paulo, a conexão falha após 30 segundos

## Passos para reproduzir

1. Abrir app
2. Selecionar "São Paulo 01"
3. Clicar "Conectar"
4. Aguardar 30 segundos

## Comportamento esperado

Conexão deve permanecer ativa

## Comportamento atual

Conexão desconecta com erro "Core Exit (Status 1)"

## Logs
```

[ERROR] Xray-core exited with status 1

```

## Ambiente
- OS: Android 12
- Dispositivo: Samsung Galaxy S21
```

## 🎨 Sugestões de Features

Tem uma ideia? Abra uma issue com:

1. **Descrição** da feature
2. **Caso de uso** - Por que é útil?
3. **Implementação sugerida** (opcional)
4. **Screenshots/mockups** (se aplicável)

## 📚 Recursos Úteis

- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Android Developers](https://developer.android.com/)
- [Xray-core Docs](https://xtls.github.io/)
- [Conventional Commits](https://www.conventionalcommits.org/)

## ✅ Checklist para PR

Antes de submeter um Pull Request:

- [ ] Branch criada a partir de `main` atualizada
- [ ] Código segue padrões do projeto
- [ ] Testes foram adicionados/atualizados
- [ ] Documentação foi atualizada
- [ ] Commits seguem Conventional Commits
- [ ] Sem conflitos com `main`
- [ ] Husky hooks passaram
- [ ] Build local passou

## 🙏 Obrigado!

Sua contribuição é valiosa para o NetTunnel Pro. Juntos, estamos construindo uma VPN melhor e mais segura!

---

**Versão:** 1.0.0  
**Última atualização:** 2026-05-04
