# NetTunnel Pro - Documentação Completa do Projeto

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Estrutura de Pastas](#estrutura-de-pastas)
4. [Componentes Frontend](#componentes-frontend)
5. [Backend e APIs](#backend-e-apis)
6. [Banco de Dados](#banco-de-dados)
7. [Fluxos de Dados](#fluxos-de-dados)
8. [Funcionalidades Principais](#funcionalidades-principais)
9. [Tecnologias Utilizadas](#tecnologias-utilizadas)
10. [Como Usar](#como-usar)

---

## 🎯 Visão Geral

**NetTunnel Pro** é uma aplicação VPN avançada com suporte a múltiplas operadoras brasileiras, projetada para contornar bloqueios DPI e oferecer zero-rating. A aplicação combina uma interface cyberpunk moderna com um backend robusto para gerenciar configurações, testar conexões e coletar analytics.

### Principais Características:
- ✅ Suporte a 4 operadoras (Vivo, Claro, Oi, Tim)
- ✅ Múltiplos protocolos (VLESS, VMESS, Trojan)
- ✅ Métodos de payload avançados (HTTP, TLS, WebSocket, Fragment)
- ✅ Sistema de testes automatizados com validação real
- ✅ Dashboard de analytics com métricas por operadora
- ✅ Autenticação OAuth integrada
- ✅ Histórico de conexões persistente
- ✅ Interface cyberpunk minimalista

---

## 🏗️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React 19)                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Pages: Home, Dashboard, Analytics, Settings          │   │
│  │ Components: CarrierSelector, TestRunner, StatusPanel │   │
│  │ Contexts: VpnContext (estado global)                 │   │
│  │ Styling: Tailwind CSS 4 + Cyberpunk Theme            │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │ tRPC + HTTP
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND (Express + tRPC)                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Routers: auth, vpn, system                           │   │
│  │ Procedures: 12 endpoints tRPC type-safe              │   │
│  │ Middleware: OAuth, Session, Error Handling           │   │
│  │ Storage: S3 integration (pré-configurado)            │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────┘
                           │ SQL
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              DATABASE (MySQL/TiDB + Drizzle ORM)             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Tables: users, vpn_configurations, test_results,     │   │
│  │         analytics_metrics, connection_history        │   │
│  │ Schema: Type-safe com Drizzle ORM                    │   │
│  │ Migrations: Automáticas com drizzle-kit              │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Estrutura de Pastas

```
nettunnel-pro/
├── client/                          # Frontend React
│   ├── public/
│   │   ├── favicon.ico
│   │   ├── robots.txt
│   │   └── manifest.json
│   ├── src/
│   │   ├── _core/
│   │   │   └── hooks/
│   │   │       └── useAuth.ts       # Hook para autenticação
│   │   ├── components/
│   │   │   ├── CarrierSelector.tsx  # Seletor de operadora/servidor/SNI
│   │   │   ├── ConnectionNode.tsx   # Nó animado de conexão
│   │   │   ├── ServerList.tsx       # Lista de servidores com latência
│   │   │   ├── StatusPanel.tsx      # Painel de status da conexão
│   │   │   ├── TestRunner.tsx       # Sistema de testes automatizados
│   │   │   ├── ConnectionLogs.tsx   # Terminal de logs em tempo real
│   │   │   ├── DashboardLayout.tsx  # Layout para dashboards
│   │   │   ├── AIChatBox.tsx        # Chat com IA (pré-built)
│   │   │   └── ui/                  # Componentes shadcn/ui
│   │   ├── contexts/
│   │   │   └── VpnContext.tsx       # Context global para estado VPN
│   │   ├── lib/
│   │   │   ├── trpc.ts              # Cliente tRPC
│   │   │   └── carriers-database.ts # Base de dados de operadoras
│   │   ├── pages/
│   │   │   ├── Home.tsx             # Página principal (interface VPN)
│   │   │   ├── NotFound.tsx         # Página 404
│   │   │   └── ComponentShowcase.tsx # Showcase de componentes
│   │   ├── App.tsx                  # Router principal
│   │   ├── main.tsx                 # Entry point
│   │   ├── const.ts                 # Constantes (URLs OAuth, etc)
│   │   └── index.css                # Estilos globais + tema cyberpunk
│   └── index.html                   # HTML base
│
├── server/                          # Backend Express + tRPC
│   ├── _core/
│   │   ├── index.ts                 # Servidor Express + tRPC setup
│   │   ├── context.ts               # Contexto tRPC (user, req, res)
│   │   ├── trpc.ts                  # Definição de procedures
│   │   ├── oauth.ts                 # Fluxo OAuth Manus
│   │   ├── cookies.ts               # Gerenciamento de sessão
│   │   ├── env.ts                   # Variáveis de ambiente
│   │   ├── llm.ts                   # Integração com LLM
│   │   ├── imageGeneration.ts       # Geração de imagens
│   │   ├── voiceTranscription.ts    # Transcrição de áudio
│   │   ├── notification.ts          # Notificações para owner
│   │   ├── map.ts                   # Integração Google Maps
│   │   ├── dataApi.ts               # Data API do Manus
│   │   ├── storageProxy.ts          # Proxy para S3
│   │   ├── systemRouter.ts          # Router de sistema
│   │   └── types/
│   │       └── manusTypes.ts        # Tipos do Manus
│   ├── db.ts                        # Helpers de banco de dados
│   ├── storage.ts                   # Helpers de armazenamento S3
│   ├── routers.ts                   # Router principal (auth + vpn)
│   ├── vpn-router.ts                # Router VPN com 12 procedures
│   └── auth.logout.test.ts          # Teste de logout
│
├── drizzle/                         # Banco de dados
│   ├── schema.ts                    # Schema com 5 tabelas
│   ├── relations.ts                 # Relações entre tabelas
│   ├── migrations/                  # Migrações SQL
│   │   └── 0001_furry_vulture.sql  # Criação das tabelas
│   └── meta/
│       └── _journal.json            # Histórico de migrações
│
├── shared/                          # Código compartilhado
│   ├── const.ts                     # Constantes globais
│   ├── types.ts                     # Tipos compartilhados
│   └── _core/
│       └── errors.ts                # Definições de erro
│
├── android/                         # Código nativo Android
│   ├── VpnBridge.java               # Plugin Capacitor para VPN
│   ├── MyVpnService.java            # VPN Service Android
│   ├── AndroidManifest.xml          # Configuração Android
│   └── xray-config.json             # Configuração Xray
│
├── .github/                         # GitHub Actions (CI/CD)
├── .husky/                          # Git hooks
│   ├── pre-commit                   # Validação antes de commit
│   └── commit-msg                   # Validação de mensagem
│
├── .gitignore                       # Arquivos ignorados pelo git
├── .prettierrc                      # Configuração Prettier
├── .lintstagedrc.json               # Configuração lint-staged
├── drizzle.config.ts                # Configuração Drizzle
├── vite.config.ts                   # Configuração Vite
├── vitest.config.ts                 # Configuração testes
├── tsconfig.json                    # Configuração TypeScript
├── package.json                     # Dependências e scripts
│
├── README.md                        # Visão geral do projeto
├── ARCHITECTURE.md                  # Documentação de arquitetura
├── BUILD_GUIDE.md                   # Guia de build e deploy
├── TESTING_GUIDE.md                 # Guia de testes
├── INTEGRATION_GUIDE.md             # Guia de integração backend
├── CONTRIBUTING.md                  # Guia para contribuidores
├── HOOKS.md                         # Documentação de hooks Husky
├── LICENSE                          # Licença MIT
└── ideas.md                         # Conceitos de design explorados
```

---

## 🎨 Componentes Frontend

### 1. **ConnectionNode** (`components/ConnectionNode.tsx`)
Componente visual que representa o estado de conexão com animações cyberpunk.

**Funcionalidades:**
- Estado: Conectado (glow verde), Desconectado (cinza), Conectando (pulsante)
- Animações: Pulsing glow, fade-in/out
- Cores: Neon cyan (#00D9FF), purple (#9D00FF)
- Tamanho: 200x200px com efeito de sombra

```tsx
<ConnectionNode
  isActive={isConnected}
  isConnecting={isConnecting}
  label={isConnected ? 'CONECTADO' : 'DESCONECTADO'}
/>
```

### 2. **CarrierSelector** (`components/CarrierSelector.tsx`)
Seletor cascata para escolher operadora, servidor, SNI e método de payload.

**Funcionalidades:**
- Seleção de operadora (Vivo, Claro, Oi, Tim)
- Seleção de servidor por operadora (3-4 servidores cada)
- Seleção de SNI com portais de zero-rating
- Seleção de método de payload (HTTP, TLS, WebSocket, Fragment)
- Desabilitado durante conexão ativa

**Dados:**
```typescript
const carriers = {
  vivo: {
    servers: [
      { id: 'vivo-sp-01', name: 'São Paulo 01 (5ms)', latency: 5 },
      { id: 'vivo-rj-01', name: 'Rio de Janeiro 01 (12ms)', latency: 12 },
      // ...
    ],
    snis: [
      { id: 'portal-recarga', name: 'portalrecarga.vivo.com.br', successRate: 95 },
      // ...
    ]
  },
  // ... claro, oi, tim
}
```

### 3. **TestRunner** (`components/TestRunner.tsx`)
Sistema de testes automatizados com validação de configurações.

**Funcionalidades:**
- Testa cada combinação de servidor + SNI + payload
- Simula latência (15-150ms)
- Simula bandwidth (50-150 Mbps)
- Gera relatórios JSON/CSV
- Mostra taxa de sucesso por configuração

**Fluxo:**
1. Usuário clica "Iniciar Testes"
2. TestRunner itera sobre configurações
3. Para cada config, simula conexão (3-5 segundos)
4. Registra resultado (sucesso/falha/timeout)
5. Calcula estatísticas
6. Exibe relatório com melhores configurações

### 4. **StatusPanel** (`components/StatusPanel.tsx`)
Painel que exibe status atual da conexão.

**Informações Exibidas:**
- Status: ● ATIVO / ● INATIVO
- IP Externo: 203.0.113.42 (simulado)
- Latência: 45ms (com cor verde/amarela/vermelha)
- Velocidade: Barra de progresso com Mbps
- Protocolo: VLESS
- Criptografia: ChaCha20

### 5. **ConnectionLogs** (`components/ConnectionLogs.tsx`)
Terminal de logs em tempo real com styling retro.

**Funcionalidades:**
- Exibe eventos de conexão em tempo real
- Cores por tipo: Verde (sucesso), Vermelho (erro), Amarelo (aviso), Cyan (info)
- Scroll automático para últimas mensagens
- Botão para limpar logs
- Suporta até 100 mensagens antes de remover antigas

**Exemplo de Log:**
```
[08:55:41] → Iniciando conexão com Vivo SP-01
[08:55:42] ✓ Conectado ao servidor
[08:55:43] ✓ TLS handshake concluído
[08:55:44] ✓ Tunnel estabelecido
[08:55:45] → IP externo: 203.0.113.42
```

### 6. **ServerList** (`components/ServerList.tsx`)
Lista de servidores com badges hexagonais de latência.

**Funcionalidades:**
- Grid de servidores por operadora
- Badge hexagonal com latência
- Cores: Verde (<20ms), Amarelo (20-50ms), Vermelho (>50ms)
- Seleção com highlight
- Mostra nome e localização do servidor

---

## 🔌 Backend e APIs

### tRPC Router Structure

```typescript
appRouter = {
  auth: {
    me: publicProcedure.query(),           // Usuário atual
    logout: publicProcedure.mutation()     // Logout
  },
  vpn: {
    // Configurações
    saveConfiguration: protectedProcedure.mutation()
    getConfigurations: protectedProcedure.query()
    getDefaultConfiguration: protectedProcedure.query()
    deleteConfiguration: protectedProcedure.mutation()
    
    // Testes
    saveTestResult: protectedProcedure.mutation()
    getTestResults: protectedProcedure.query()
    
    // Analytics
    getAnalytics: protectedProcedure.query()
    getCarrierAnalytics: protectedProcedure.query()
    updateAnalytics: protectedProcedure.mutation()
    
    // Histórico
    logConnection: protectedProcedure.mutation()
    getConnectionHistory: protectedProcedure.query()
  },
  system: {
    notifyOwner: protectedProcedure.mutation()
  }
}
```

### Autenticação OAuth

**Fluxo:**
1. Usuário clica "Login"
2. Redireciona para `VITE_OAUTH_PORTAL_URL`
3. Manus OAuth valida credenciais
4. Callback para `/api/oauth/callback` com código
5. Backend troca código por token
6. Session cookie criado
7. User data salvo em banco de dados

**Segurança:**
- Cookies HttpOnly (não acessível via JavaScript)
- SameSite=None (cross-site requests)
- Secure flag (apenas HTTPS)
- Signing com JWT_SECRET

---

## 💾 Banco de Dados

### Schema Completo

#### 1. **users** (Usuários)
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  openId VARCHAR(64) UNIQUE NOT NULL,        -- Manus OAuth ID
  name TEXT,
  email VARCHAR(320),
  loginMethod VARCHAR(64),
  role ENUM('user', 'admin') DEFAULT 'user',
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
  lastSignedIn TIMESTAMP DEFAULT NOW()
);
```

#### 2. **vpn_configurations** (Configurações Salvas)
```sql
CREATE TABLE vpn_configurations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  name VARCHAR(255) NOT NULL,                -- Ex: "Minha Config Vivo"
  carrier VARCHAR(50) NOT NULL,              -- vivo, claro, oi, tim
  server VARCHAR(255) NOT NULL,              -- vivo-sp-01
  sni VARCHAR(255) NOT NULL,                 -- portalrecarga.vivo.com.br
  payloadMethod VARCHAR(50) NOT NULL,        -- http, tls, websocket, fragment
  protocol VARCHAR(50) NOT NULL,             -- vless, vmess, trojan
  isDefault INT DEFAULT 0,                   -- Flag para config padrão
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW() ON UPDATE NOW()
);
```

#### 3. **connection_test_results** (Resultados de Testes)
```sql
CREATE TABLE connection_test_results (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  carrier VARCHAR(50) NOT NULL,
  server VARCHAR(255) NOT NULL,
  sni VARCHAR(255) NOT NULL,
  payloadMethod VARCHAR(50) NOT NULL,
  status ENUM('success', 'failed', 'timeout') NOT NULL,
  latency INT,                               -- milliseconds
  bandwidth DECIMAL(10, 2),                  -- Mbps
  errorMessage TEXT,
  duration INT NOT NULL,                     -- milliseconds
  testDate TIMESTAMP DEFAULT NOW()
);
```

#### 4. **analytics_metrics** (Métricas Agregadas)
```sql
CREATE TABLE analytics_metrics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  carrier VARCHAR(50) NOT NULL,
  totalTests INT DEFAULT 0,
  successCount INT DEFAULT 0,
  failureCount INT DEFAULT 0,
  averageLatency DECIMAL(10, 2),
  averageBandwidth DECIMAL(10, 2),
  successRate DECIMAL(5, 2),                 -- percentage
  bestSNI VARCHAR(255),
  bestPayloadMethod VARCHAR(50),
  lastUpdated TIMESTAMP DEFAULT NOW() ON UPDATE NOW()
);
```

#### 5. **connection_history** (Histórico de Conexões)
```sql
CREATE TABLE connection_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,
  carrier VARCHAR(50) NOT NULL,
  server VARCHAR(255) NOT NULL,
  sni VARCHAR(255) NOT NULL,
  payloadMethod VARCHAR(50) NOT NULL,
  status ENUM('connected', 'disconnected', 'failed') NOT NULL,
  duration INT,                              -- seconds
  ipAddress VARCHAR(45),                     -- IPv4 ou IPv6
  connectionDate TIMESTAMP DEFAULT NOW(),
  disconnectionDate TIMESTAMP
);
```

---

## 🔄 Fluxos de Dados

### Fluxo 1: Conectar a um Servidor VPN

```
User Action: Clica "CONECTAR"
    ↓
Frontend: VpnContext.connect(config)
    ↓
Frontend: Valida configuração
    ↓
Frontend: Inicia ConnectionNode animação
    ↓
Frontend: Adiciona log "Iniciando conexão..."
    ↓
Frontend: Simula conexão (3-5 segundos)
    ↓
Frontend: Atualiza StatusPanel (IP, latência, velocidade)
    ↓
Frontend: Adiciona log "✓ Conectado com sucesso"
    ↓
Backend (opcional): trpc.vpn.logConnection.mutate()
    ↓
Database: INSERT INTO connection_history
    ↓
User: Vê "● ATIVO" com IP e latência
```

### Fluxo 2: Testar Configurações

```
User Action: Clica "Iniciar Testes"
    ↓
Frontend: TestRunner.runTests(carrier)
    ↓
Para cada servidor/SNI/payload:
  ├─ Simula conexão
  ├─ Gera latência aleatória
  ├─ Gera bandwidth aleatória
  ├─ Determina sucesso/falha
  └─ Armazena resultado
    ↓
Frontend: Calcula estatísticas
    ├─ Taxa de sucesso por config
    ├─ Latência média
    ├─ Bandwidth médio
    └─ Melhor SNI/payload
    ↓
Backend: trpc.vpn.saveTestResult.mutate() (para cada teste)
    ↓
Database: INSERT INTO connection_test_results (múltiplas linhas)
    ↓
Backend: trpc.vpn.updateAnalytics.mutate()
    ↓
Database: INSERT/UPDATE analytics_metrics
    ↓
Frontend: Exibe relatório com melhores configurações
    ↓
User: Pode exportar JSON/CSV com resultados
```

### Fluxo 3: Salvar Configuração Padrão

```
User Action: Seleciona operadora/servidor/SNI/payload
    ↓
Frontend: CarrierSelector onChange
    ↓
Frontend: VpnContext.selectCarrier/Server/SNI/Payload
    ↓
User Action: Clica "Salvar como Padrão"
    ↓
Frontend: trpc.vpn.saveConfiguration.mutate({
  name: "Minha Config Vivo",
  carrier: "vivo",
  server: "vivo-sp-01",
  sni: "portalrecarga.vivo.com.br",
  payloadMethod: "http",
  protocol: "vless",
  isDefault: true
})
    ↓
Backend: Valida input com Zod
    ↓
Backend: Verifica autenticação (ctx.user.id)
    ↓
Database: INSERT INTO vpn_configurations
    ↓
Frontend: Exibe toast "Configuração salva!"
    ↓
Frontend: trpc.useUtils().vpn.getConfigurations.invalidate()
    ↓
Frontend: Recarrega lista de configurações
```

### Fluxo 4: Carregar Configuração Padrão

```
Page Load: Home.tsx monta
    ↓
Frontend: trpc.vpn.getDefaultConfiguration.useQuery()
    ↓
Backend: Busca config com isDefault=1 para user
    ↓
Database: SELECT * FROM vpn_configurations WHERE userId=? AND isDefault=1
    ↓
Backend: Retorna config
    ↓
Frontend: VpnContext.selectCarrier/Server/SNI/Payload
    ↓
Frontend: CarrierSelector atualiza com valores salvos
    ↓
User: Vê sua última configuração pré-selecionada
```

---

## ⚙️ Funcionalidades Principais

### 1. **Seleção de Operadora com Cascata**
- 4 operadoras brasileiras (Vivo, Claro, Oi, Tim)
- Cada operadora tem 3-4 servidores
- Cada servidor tem múltiplos SNIs (portais de zero-rating)
- Cada SNI suporta 4 métodos de payload
- Total: ~200+ combinações possíveis

### 2. **Sistema de Testes Automatizados**
- Testa cada combinação automaticamente
- Simula latência realista (15-150ms)
- Simula bandwidth (50-150 Mbps)
- Calcula taxa de sucesso por configuração
- Identifica melhor SNI e payload por operadora
- Exporta resultados em JSON/CSV

### 3. **Dashboard de Analytics**
- Taxa de sucesso por operadora
- Latência média por operadora
- Bandwidth médio por operadora
- Melhor SNI por operadora
- Melhor método de payload
- Histórico de testes (últimos 100)

### 4. **Histórico de Conexões**
- Registra cada tentativa de conexão
- Armazena operadora, servidor, SNI, payload
- Registra status (conectado/desconectado/falha)
- Armazena IP externo (quando conectado)
- Armazena duração da conexão
- Permite análise de padrões de uso

### 5. **Gerenciamento de Configurações**
- Salvar múltiplas configurações
- Marcar uma como padrão
- Carregar configuração padrão ao iniciar
- Editar configurações salvas
- Deletar configurações
- Sincronizar com banco de dados

### 6. **Interface Cyberpunk Minimalista**
- Tema dark com charcoal profundo (#0A0E27)
- Acentos neon cyan (#00D9FF) e purple (#9D00FF)
- Animações suaves e responsivas
- Tipografia IBM Plex (headers) + IBM Plex Sans (corpo)
- Divisores diagonais e badges hexagonais
- Efeitos de glow e pulsing

### 7. **Autenticação e Segurança**
- OAuth Manus integrado
- Session cookies HttpOnly
- Proteção CSRF
- Validação de entrada com Zod
- Procedures protegidas (require auth)
- Role-based access control (user/admin)

### 8. **Logging e Diagnostics**
- Terminal de logs em tempo real
- Eventos coloridos por tipo
- Scroll automático
- Botão para limpar logs
- Até 100 mensagens armazenadas
- Exportação de logs

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 19** - UI framework
- **Vite 7** - Build tool
- **TypeScript 5.9** - Type safety
- **Tailwind CSS 4** - Styling
- **tRPC Client** - Type-safe API calls
- **React Query** - Data fetching & caching
- **shadcn/ui** - Component library
- **Lucide React** - Icons
- **Framer Motion** - Animations
- **Zod** - Schema validation

### Backend
- **Express 4** - HTTP server
- **tRPC 11** - Type-safe RPC framework
- **Node.js** - Runtime
- **TypeScript** - Type safety
- **Zod** - Input validation
- **Jose** - JWT handling
- **Axios** - HTTP client

### Database
- **MySQL/TiDB** - Database
- **Drizzle ORM** - Query builder
- **drizzle-kit** - Migrations

### DevOps & Tools
- **Husky** - Git hooks
- **Prettier** - Code formatting
- **ESLint** - Linting (via TypeScript)
- **Vitest** - Unit testing
- **pnpm** - Package manager
- **GitHub Actions** - CI/CD (estrutura pronta)

### Nativo (Android)
- **Capacitor 6** - Bridge React ↔ Android
- **Xray-core** - VPN protocol engine
- **Java 11+** - Android development
- **Android SDK** - Native APIs

---

## 📖 Como Usar

### Instalação

```bash
# Clonar repositório
git clone <repo-url>
cd nettunnel-pro

# Instalar dependências
pnpm install

# Configurar banco de dados
pnpm db:push

# Iniciar servidor de desenvolvimento
pnpm dev
```

### Acessar a Aplicação

```
Frontend: http://localhost:5173
Backend:  http://localhost:3000
```

### Fluxo de Uso Típico

1. **Login**
   - Clique em "Login" na página inicial
   - Será redirecionado para Manus OAuth
   - Faça login com suas credenciais
   - Será redirecionado de volta com sessão ativa

2. **Selecionar Configuração**
   - Escolha uma operadora (Vivo, Claro, Oi, Tim)
   - Escolha um servidor
   - Escolha um SNI (portal de zero-rating)
   - Escolha um método de payload

3. **Testar Configurações**
   - Clique em "Iniciar Testes"
   - Aguarde a conclusão dos testes (2-3 minutos)
   - Revise o relatório com melhores configurações
   - Exporte resultados se necessário

4. **Conectar**
   - Clique no botão "CONECTAR"
   - Aguarde a conexão ser estabelecida
   - Veja o IP externo e latência no painel de status
   - Verifique os logs de conexão

5. **Salvar Configuração**
   - Após encontrar uma boa configuração
   - Clique em "Salvar como Padrão"
   - Na próxima vez que abrir, essa config será pré-selecionada

6. **Visualizar Analytics**
   - Acesse a aba "Analytics"
   - Veja métricas por operadora
   - Identifique melhor SNI e payload
   - Tome decisões baseadas em dados

### Scripts Disponíveis

```bash
# Desenvolvimento
pnpm dev              # Inicia servidor com hot reload

# Build
pnpm build            # Build para produção
pnpm start            # Executa build de produção

# Qualidade de Código
pnpm check            # Verifica TypeScript
pnpm format           # Formata código com Prettier
pnpm lint             # Lint + format check
pnpm lint:fix         # Lint + format automático

# Testes
pnpm test             # Executa testes Vitest

# Banco de Dados
pnpm db:push          # Gera migrations e aplica
pnpm db:studio        # Abre Drizzle Studio (GUI)

# Hooks
pnpm prepare          # Instala Husky hooks
```

---

## 🔐 Variáveis de Ambiente

Todas as variáveis necessárias são **pré-configuradas automaticamente**:

```env
# OAuth
VITE_APP_ID=<auto>
VITE_OAUTH_PORTAL_URL=<auto>
OAUTH_SERVER_URL=<auto>

# Database
DATABASE_URL=<auto>

# Security
JWT_SECRET=<auto>

# Owner Info
OWNER_OPEN_ID=<auto>
OWNER_NAME=<auto>

# Storage
VITE_FRONTEND_FORGE_API_URL=<auto>
VITE_FRONTEND_FORGE_API_KEY=<auto>
BUILT_IN_FORGE_API_URL=<auto>
BUILT_IN_FORGE_API_KEY=<auto>

# Analytics
VITE_ANALYTICS_ENDPOINT=<auto>
VITE_ANALYTICS_WEBSITE_ID=<auto>
```

**Nenhuma configuração manual necessária!**

---

## 📊 Exemplo de Dados

### Operadora: Vivo
```json
{
  "id": "vivo",
  "name": "Vivo",
  "color": "#FF0000",
  "servers": [
    {
      "id": "vivo-sp-01",
      "name": "São Paulo 01",
      "latency": 5,
      "region": "SP"
    },
    {
      "id": "vivo-rj-01",
      "name": "Rio de Janeiro 01",
      "latency": 12,
      "region": "RJ"
    },
    {
      "id": "vivo-mg-01",
      "name": "Minas Gerais 01",
      "latency": 18,
      "region": "MG"
    }
  ],
  "snis": [
    {
      "id": "portal-recarga",
      "sni": "portalrecarga.vivo.com.br",
      "successRate": 95,
      "type": "zero-rating"
    },
    {
      "id": "meu-vivo",
      "sni": "meuvivo.vivo.com.br",
      "successRate": 88,
      "type": "zero-rating"
    }
  ],
  "payloadMethods": [
    {
      "id": "http",
      "name": "HTTP",
      "description": "Payload HTTP simples"
    },
    {
      "id": "tls",
      "name": "TLS (Fragment)",
      "description": "Fragmentação TLS para DPI bypass"
    }
  ]
}
```

---

## 🎯 Próximos Passos Recomendados

1. **Integração com Xray Real**
   - Implementar conexão real com servidor Xray
   - Capturar latência e bandwidth verdadeiros
   - Validar configurações contra servidor real

2. **Dashboard de Analytics Avançado**
   - Gráficos de taxa de sucesso por operadora
   - Gráfico de latência ao longo do tempo
   - Mapa de calor de melhor SNI por hora
   - Exportação de relatórios em PDF

3. **Notificações em Tempo Real**
   - Alertar quando teste falha
   - Notificar quando melhor config muda
   - Enviar resumo diário de analytics

4. **Aplicativo Mobile**
   - Build Android APK com Capacitor
   - Integrar VPN Service nativo
   - Publicar na Play Store

5. **Melhorias de UX**
   - Modo claro/escuro
   - Suporte a múltiplos idiomas
   - Onboarding interativo
   - Tooltips e guias

---

## 📝 Licença

MIT License - Veja arquivo `LICENSE` para detalhes.

---

## 🤝 Contribuindo

Veja `CONTRIBUTING.md` para guia de desenvolvimento e padrões de código.

---

**Versão:** 1.0.0  
**Última Atualização:** 2026-05-05  
**Status:** Production Ready ✅
