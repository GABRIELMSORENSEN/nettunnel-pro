# NetTunnel Pro - Guia Visual e Fluxos

## 🎨 Interface Visual

### Tema Cyberpunk Minimalista

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                       │
│  NetTunnel Pro                                                 v1.0.0 │
│  VPN com Bypass DPI • Zero-Rating                  Powered by Xray   │
│                                                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│              ╔═══════════════════════════════════╗                   │
│              ║                                   ║                   │
│              ║         ◯ ◯ ◯                    ║                   │
│              ║        ◯   ◯                     ║                   │
│              ║       ◯     ◯                    ║                   │
│              ║       ◯  ◯  ◯  (glow pulsante)   ║                   │
│              ║        ◯   ◯                     ║                   │
│              ║         ◯ ◯ ◯                    ║                   │
│              ║                                   ║                   │
│              ║     DESCONECTADO                 ║                   │
│              ║                                   ║                   │
│              ╚═══════════════════════════════════╝                   │
│                                                                       │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐    │
│  │ STATUS           │ │ IP EXTERNO       │ │ LATÊNCIA         │    │
│  │ ● INATIVO        │ │ N/A              │ │ N/A              │    │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘    │
│                                                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  CONFIGURAÇÃO DE CONEXÃO                                             │
│                                                                       │
│  OPERADORA: ▼ Vivo                                                   │
│                                                                       │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────┐ │
│  │ ◆ Vivo       │ │ ◇ Claro      │ │ ◇ Oi         │ │ ◇ Tim      │ │
│  │ Selecionada  │ │              │ │              │ │            │ │
│  └──────────────┘ └──────────────┘ └──────────────┘ └────────────┘ │
│                                                                       │
│  SERVIDOR: ▼ São Paulo 01 (5ms)                                      │
│  SNI: ▼ portalrecarga.vivo.com.br (95% sucesso)                     │
│  PAYLOAD: ▼ HTTP                                                     │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ CONECTAR                                                    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  VALIDAÇÃO DE CONFIGURAÇÕES                                          │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ ▶ Iniciar Testes                                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  Testando: Vivo (12 combinações)                                     │
│  ████████░░ 67% - 8/12 concluídos                                    │
│                                                                       │
│  Resultados:                                                         │
│  ✓ vivo-sp-01 + portalrecarga.vivo.com.br + HTTP: 45ms, 85 Mbps    │
│  ✓ vivo-sp-01 + meuvivo.vivo.com.br + HTTP: 48ms, 82 Mbps          │
│  ✗ vivo-sp-01 + vivo.com.br + TLS: Timeout                         │
│                                                                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  LOGS DE CONEXÃO                                                     │
│                                                                       │
│  [08:55:41] → Iniciando conexão com Vivo SP-01                     │
│  [08:55:42] ✓ Conectado ao servidor                                │
│  [08:55:43] ✓ TLS handshake concluído                              │
│  [08:55:44] ✓ Tunnel estabelecido                                  │
│  [08:55:45] → IP externo: 203.0.113.42                             │
│  [08:55:46] ✓ Conexão ativa e estável                              │
│                                                                       │
│                                                      Limpar logs ✕   │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Paleta de Cores

```
┌────────────────────────────────────────────────────────────┐
│ CYBERPUNK MINIMALISM - Color Scheme                         │
├────────────────────────────────────────────────────────────┤
│                                                              │
│ Background Principal:  #0A0E27  (Charcoal profundo)        │
│ Background Secundário: #1A1F3A  (Charcoal mais claro)      │
│ Background Terciário:  #2D3748  (Cinza escuro)             │
│                                                              │
│ Accent Primário:       #00D9FF  (Neon Cyan)                │
│ Accent Secundário:     #9D00FF  (Neon Purple)              │
│                                                              │
│ Sucesso:               #00FF00  (Verde neon)               │
│ Erro:                  #FF0000  (Vermelho neon)            │
│ Aviso:                 #FFFF00  (Amarelo neon)             │
│ Info:                  #00D9FF  (Cyan neon)                │
│                                                              │
│ Texto Principal:       #FFFFFF  (Branco)                   │
│ Texto Secundário:      #A0AEC0  (Cinza claro)              │
│ Texto Desabilitado:    #718096  (Cinza médio)              │
│                                                              │
└────────────────────────────────────────────────────────────┘
```

---

## 📊 Fluxo de Dados Completo

### Fluxo 1: Login e Autenticação

```
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND                                                     │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Home.tsx                                                │ │
│ │ Usuário não autenticado                                 │ │
│ │ Clica: "Login"                                          │ │
│ └─────────────────────────────────────────────────────────┘ │
└────────────────────┬────────────────────────────────────────┘
                     │ window.location.href = getLoginUrl()
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ MANUS OAUTH PORTAL                                           │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ https://oauth.manus.im/login?redirect_uri=...          │ │
│ │ Usuário insere credenciais                              │ │
│ │ Manus valida                                            │ │
│ │ Gera authorization code                                 │ │
│ └─────────────────────────────────────────────────────────┘ │
└────────────────────┬────────────────────────────────────────┘
                     │ redirect_uri + code
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ BACKEND                                                      │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ /api/oauth/callback?code=xxx                            │ │
│ │ 1. Valida code com Manus                                │ │
│ │ 2. Recebe access_token e user info                      │ │
│ │ 3. Extrai openId, name, email                           │ │
│ │ 4. Chama upsertUser(openId, name, email)                │ │
│ │ 5. Cria session cookie                                  │ │
│ │ 6. Redireciona para /                                   │ │
│ └─────────────────────────────────────────────────────────┘ │
└────────────────────┬────────────────────────────────────────┘
                     │ session cookie + redirect
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ DATABASE                                                     │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ INSERT INTO users (openId, name, email, role, ...)      │ │
│ │ VALUES ('oauth_123', 'João Silva', 'joao@example.com',  │ │
│ │         'user', NOW(), NOW(), NOW())                    │ │
│ │ ON DUPLICATE KEY UPDATE lastSignedIn=NOW()              │ │
│ └─────────────────────────────────────────────────────────┘ │
└────────────────────┬────────────────────────────────────────┘
                     │ user.id = 42
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND                                                     │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ useAuth() hook retorna:                                 │ │
│ │ {                                                        │ │
│ │   user: {                                               │ │
│ │     id: 42,                                             │ │
│ │     openId: 'oauth_123',                                │ │
│ │     name: 'João Silva',                                 │ │
│ │     email: 'joao@example.com',                          │ │
│ │     role: 'user'                                        │ │
│ │   },                                                    │ │
│ │   isAuthenticated: true,                                │ │
│ │   loading: false                                        │ │
│ │ }                                                        │ │
│ │ Home.tsx renderiza interface VPN                        │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Fluxo 2: Salvar Configuração

```
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND                                                     │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ CarrierSelector                                         │ │
│ │ - Seleciona: Vivo                                       │ │
│ │ - Seleciona: vivo-sp-01                                 │ │
│ │ - Seleciona: portalrecarga.vivo.com.br                  │ │
│ │ - Seleciona: http                                       │ │
│ │ Clica: "Salvar como Padrão"                             │ │
│ └─────────────────────────────────────────────────────────┘ │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND - VpnContext                                        │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ saveConfiguration({                                     │ │
│ │   name: "Minha Config Vivo",                            │ │
│ │   carrier: "vivo",                                      │ │
│ │   server: "vivo-sp-01",                                 │ │
│ │   sni: "portalrecarga.vivo.com.br",                     │ │
│ │   payloadMethod: "http",                                │ │
│ │   protocol: "vless",                                    │ │
│ │   isDefault: true                                       │ │
│ │ })                                                      │ │
│ └─────────────────────────────────────────────────────────┘ │
└────────────────────┬────────────────────────────────────────┘
                     │ trpc.vpn.saveConfiguration.mutate()
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ BACKEND - vpn-router.ts                                      │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ saveConfiguration: protectedProcedure                   │ │
│ │   .input(z.object({...}))                               │ │
│ │   .mutation(async ({ ctx, input }) => {                 │ │
│ │     const db = await getDb()                            │ │
│ │     const result = await db                             │ │
│ │       .insert(vpnConfigurations)                        │ │
│ │       .values({                                         │ │
│ │         userId: ctx.user.id,  // 42                     │ │
│ │         name: input.name,                               │ │
│ │         carrier: input.carrier,                         │ │
│ │         ...input                                        │ │
│ │       })                                                │ │
│ │     return { success: true, configId: result[0] }       │ │
│ │   })                                                    │ │
│ └─────────────────────────────────────────────────────────┘ │
└────────────────────┬────────────────────────────────────────┘
                     │ INSERT query
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ DATABASE                                                     │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ INSERT INTO vpn_configurations (                        │ │
│ │   userId, name, carrier, server, sni,                  │ │
│ │   payloadMethod, protocol, isDefault, createdAt        │ │
│ │ ) VALUES (                                              │ │
│ │   42, 'Minha Config Vivo', 'vivo', 'vivo-sp-01',       │ │
│ │   'portalrecarga.vivo.com.br', 'http', 'vless',        │ │
│ │   1, NOW()                                              │ │
│ │ )                                                       │ │
│ │ Retorna: configId = 1                                   │ │
│ └─────────────────────────────────────────────────────────┘ │
└────────────────────┬────────────────────────────────────────┘
                     │ { success: true, configId: 1 }
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND                                                     │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Toast: "Configuração salva com sucesso!"                │ │
│ │ trpc.useUtils().vpn.getConfigurations.invalidate()      │ │
│ │ Recarrega lista de configurações                        │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Fluxo 3: Executar Testes

```
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND - TestRunner                                        │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Clica: "Iniciar Testes"                                 │ │
│ │ carrier = "vivo"                                        │ │
│ │ Itera sobre: 3 servidores × 2 SNIs × 2 payloads = 12   │ │
│ └─────────────────────────────────────────────────────────┘ │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND - Para cada combinação:                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 1. Simula conexão (3-5 segundos)                        │ │
│ │ 2. Gera latência aleatória: 15-150ms                    │ │
│ │ 3. Gera bandwidth aleatório: 50-150 Mbps                │ │
│ │ 4. Determina sucesso: 70-95% de chance                  │ │
│ │ 5. Armazena resultado em array                          │ │
│ │                                                         │ │
│ │ Resultado:                                              │ │
│ │ {                                                       │ │
│ │   carrier: "vivo",                                      │ │
│ │   server: "vivo-sp-01",                                 │ │
│ │   sni: "portalrecarga.vivo.com.br",                     │ │
│ │   payloadMethod: "http",                                │ │
│ │   status: "success",                                    │ │
│ │   latency: 45,                                          │ │
│ │   bandwidth: 85,                                        │ │
│ │   duration: 3500                                        │ │
│ │ }                                                       │ │
│ └─────────────────────────────────────────────────────────┘ │
└────────────────────┬────────────────────────────────────────┘
                     │ Para cada resultado
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ BACKEND - Salvar Resultado                                   │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ trpc.vpn.saveTestResult.mutate(resultado)               │ │
│ │                                                         │ │
│ │ INSERT INTO connection_test_results (                   │ │
│ │   userId, carrier, server, sni, payloadMethod,         │ │
│ │   status, latency, bandwidth, duration, testDate       │ │
│ │ ) VALUES (                                              │ │
│ │   42, 'vivo', 'vivo-sp-01', '...',                      │ │
│ │   'http', 'success', 45, 85, 3500, NOW()                │ │
│ │ )                                                       │ │
│ └─────────────────────────────────────────────────────────┘ │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ DATABASE                                                     │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 12 linhas inseridas em connection_test_results          │ │
│ └─────────────────────────────────────────────────────────┘ │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ BACKEND - Calcular Analytics                                 │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ trpc.vpn.updateAnalytics.mutate({                       │ │
│ │   carrier: "vivo",                                      │ │
│ │   totalTests: 12,                                       │ │
│ │   successCount: 10,                                     │ │
│ │   failureCount: 2,                                      │ │
│ │   averageLatency: 47.5,                                 │ │
│ │   averageBandwidth: 83.2,                               │ │
│ │   bestSNI: "portalrecarga.vivo.com.br",                 │ │
│ │   bestPayloadMethod: "http"                             │ │
│ │ })                                                      │ │
│ │                                                         │ │
│ │ INSERT/UPDATE analytics_metrics                         │ │
│ └─────────────────────────────────────────────────────────┘ │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND - Exibir Resultados                                 │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Testes Concluídos!                                      │ │
│ │                                                         │ │
│ │ Taxa de Sucesso: 83.3% (10/12)                          │ │
│ │ Latência Média: 47.5ms                                  │ │
│ │ Bandwidth Médio: 83.2 Mbps                              │ │
│ │                                                         │ │
│ │ Melhor Configuração:                                    │ │
│ │ ✓ vivo-sp-01 + portalrecarga.vivo.com.br + HTTP        │ │
│ │   Latência: 45ms | Bandwidth: 85 Mbps                   │ │
│ │                                                         │ │
│ │ [Exportar JSON] [Exportar CSV]                          │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Ciclo de Vida de um Componente

### ConnectionNode Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│ MOUNT                                                        │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ <ConnectionNode isActive={false} />                     │ │
│ │ Estado: DESCONECTADO                                    │ │
│ │ Renderiza: Círculo cinza estático                       │ │
│ └─────────────────────────────────────────────────────────┘ │
└────────────────────┬────────────────────────────────────────┘
                     │ User clica CONECTAR
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ UPDATE: isConnecting={true}                                  │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ <ConnectionNode isConnecting={true} />                  │ │
│ │ Estado: CONECTANDO                                      │ │
│ │ Renderiza: Círculo pulsante com glow                    │ │
│ │ Animação: Framer Motion - scale 1.0 → 1.2 → 1.0        │ │
│ │ Duração: 1.5s, repeat: Infinity                         │ │
│ └─────────────────────────────────────────────────────────┘ │
└────────────────────┬────────────────────────────────────────┘
                     │ Conexão estabelecida (3-5s)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ UPDATE: isActive={true}, isConnecting={false}                │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ <ConnectionNode isActive={true} />                      │ │
│ │ Estado: CONECTADO                                       │ │
│ │ Renderiza: Círculo verde com glow constante             │ │
│ │ Animação: Glow pulsante suave                           │ │
│ │ Duração: 2s, repeat: Infinity                           │ │
│ │ Cor: Neon Cyan (#00D9FF)                                │ │
│ └─────────────────────────────────────────────────────────┘ │
└────────────────────┬────────────────────────────────────────┘
                     │ User clica DESCONECTAR
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ UPDATE: isConnecting={true}                                  │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ <ConnectionNode isConnecting={true} />                  │ │
│ │ Estado: DESCONECTANDO                                   │
│ │ Renderiza: Círculo com flash vermelho                   │ │
│ │ Animação: Fade-out com flash                            │ │
│ │ Duração: 0.5s                                           │ │
│ └─────────────────────────────────────────────────────────┘ │
└────────────────────┬────────────────────────────────────────┘
                     │ Desconexão concluída
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ UPDATE: isActive={false}, isConnecting={false}               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ <ConnectionNode isActive={false} />                     │ │
│ │ Estado: DESCONECTADO                                    │ │
│ │ Renderiza: Círculo cinza estático                       │ │
│ │ Volta ao estado inicial                                 │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 📱 Responsividade

### Breakpoints Tailwind CSS

```
┌────────────────────────────────────────────────────────┐
│ MOBILE (< 640px)                                        │
│ ┌──────────────────────────────────────────────────┐   │
│ │ [ConnectionNode]                                 │   │
│ │ [Status] [Status] [Status]                       │   │
│ │ [Operadora Selector]                             │   │
│ │ [Servidor Selector]                              │   │
│ │ [SNI Selector]                                   │   │
│ │ [Payload Selector]                               │   │
│ │ [CONECTAR]                                       │   │
│ └──────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ TABLET (640px - 1024px)                                 │
│ ┌──────────────────────────────────────────────────┐   │
│ │ [ConnectionNode] [Status] [Status] [Status]      │   │
│ │ [Operadora] [Servidor] [SNI] [Payload]           │   │
│ │ [CONECTAR]                                       │   │
│ │ [Testes] [Logs]                                  │   │
│ └──────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│ DESKTOP (> 1024px)                                      │
│ ┌──────────────────────────────────────────────────┐   │
│ │ [ConnectionNode] [Status Painel]                 │   │
│ │ [Operadora Selector - Cascata]                   │   │
│ │ [CONECTAR] [Testes]                              │   │
│ │ [Logs]                                           │   │
│ └──────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────┘
```

---

## 🎬 Animações

### Efeitos Implementados

```
1. ConnectionNode Glow
   ├─ Quando: isActive=true
   ├─ Efeito: box-shadow pulsante
   ├─ Cor: Neon Cyan (#00D9FF)
   ├─ Duração: 2s
   └─ Repeat: Infinity

2. ConnectionNode Pulse
   ├─ Quando: isConnecting=true
   ├─ Efeito: scale 1.0 → 1.2 → 1.0
   ├─ Duração: 1.5s
   └─ Repeat: Infinity

3. StatusPanel Fade-in
   ├─ Quando: Componente monta
   ├─ Efeito: opacity 0 → 1
   ├─ Duração: 0.5s
   └─ Delay: 0.2s

4. ServerList Hover
   ├─ Quando: Mouse over
   ├─ Efeito: scale 1.0 → 1.05, shadow aumenta
   ├─ Duração: 0.3s
   └─ Easing: ease-out

5. TestRunner Progress
   ├─ Quando: Testes em andamento
   ├─ Efeito: Barra de progresso animada
   ├─ Duração: Dinâmica (1-5s por teste)
   └─ Color: Gradiente Cyan → Purple

6. Logs Scroll
   ├─ Quando: Novo log adicionado
   ├─ Efeito: Auto-scroll para bottom
   ├─ Duração: 0.3s
   └─ Behavior: smooth
```

---

## 🗂️ Estrutura de Dados Exemplo

### Configuração Salva

```json
{
  "id": 1,
  "userId": 42,
  "name": "Minha Config Vivo",
  "carrier": "vivo",
  "server": "vivo-sp-01",
  "sni": "portalrecarga.vivo.com.br",
  "payloadMethod": "http",
  "protocol": "vless",
  "isDefault": 1,
  "createdAt": "2026-05-05T08:55:41.000Z",
  "updatedAt": "2026-05-05T08:55:41.000Z"
}
```

### Resultado de Teste

```json
{
  "id": 1,
  "userId": 42,
  "carrier": "vivo",
  "server": "vivo-sp-01",
  "sni": "portalrecarga.vivo.com.br",
  "payloadMethod": "http",
  "status": "success",
  "latency": 45,
  "bandwidth": 85.5,
  "errorMessage": null,
  "duration": 3500,
  "testDate": "2026-05-05T08:55:41.000Z"
}
```

### Métrica de Analytics

```json
{
  "id": 1,
  "userId": 42,
  "carrier": "vivo",
  "totalTests": 12,
  "successCount": 10,
  "failureCount": 2,
  "averageLatency": 47.5,
  "averageBandwidth": 83.2,
  "successRate": 83.33,
  "bestSNI": "portalrecarga.vivo.com.br",
  "bestPayloadMethod": "http",
  "lastUpdated": "2026-05-05T08:55:41.000Z"
}
```

---

**Versão:** 1.0.0  
**Última Atualização:** 2026-05-05
