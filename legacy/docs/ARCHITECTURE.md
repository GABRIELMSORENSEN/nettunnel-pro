# NetTunnel Pro VPN - Technical Architecture

## Design Philosophy

**NetTunnel Pro** segue a arquitetura de **camadas isoladas** com comunicação explícita entre elas, permitindo manutenção independente e testes isolados.

### Princípios Arquiteturais

1. **Separação de Responsabilidades:** Cada camada tem uma função clara
2. **Comunicação Explícita:** Interfaces bem definidas entre camadas
3. **Testabilidade:** Cada camada pode ser testada isoladamente
4. **Escalabilidade:** Fácil adicionar novos protocolos ou servidores

---

## Camadas da Arquitetura

### 1. Camada de Apresentação (React UI)

**Localização:** `client/src/`

**Responsabilidades:**
- Renderizar interface Cyberpunk Minimalism
- Gerenciar estado da conexão VPN
- Exibir logs em tempo real
- Permitir seleção de servidor

**Componentes Principais:**

| Componente | Função |
|-----------|--------|
| `Home.tsx` | Página principal com layout assimétrico |
| `ConnectionNode.tsx` | Nó de conexão com animações glow |
| `ServerList.tsx` | Lista de servidores com latência |
| `StatusPanel.tsx` | Painel de status da conexão |
| `ConnectionLogs.tsx` | Terminal de logs com scanlines |

**Context API:**
- `VpnContext.tsx` - Gerencia estado global da VPN

**Fluxo de Dados:**
```
User Interaction (Click Connect)
    ↓
Home.tsx (handleToggleConnection)
    ↓
useVpn() (connect method)
    ↓
VpnContext.connect()
    ↓
Capacitor Bridge (VpnBridge.startVpn)
```

---

### 2. Camada de Bridge (Capacitor)

**Localização:** `capacitor/` (gerado automaticamente)

**Responsabilidades:**
- Traduzir chamadas React para Android nativas
- Gerenciar ciclo de vida da aplicação
- Fornecer acesso a APIs nativas

**Interface Principal:**

```typescript
interface VpnBridge {
  startVpn(config: string): Promise<void>;
  stopVpn(): Promise<void>;
  getStatus(): Promise<VpnStatus>;
}
```

**Fluxo:**
```
JavaScript (React)
    ↓
Capacitor Bridge
    ↓
Java (VpnBridge Plugin)
    ↓
Android Services
```

---

### 3. Camada Nativa Android

**Localização:** `android/`

**Componentes Principais:**

#### 3.1 VpnBridge (Capacitor Plugin)

**Arquivo:** `android/VpnBridge.java`

**Responsabilidades:**
- Receber configuração JSON do React
- Validar permissões VPN
- Iniciar/parar MyVpnService
- Notificar UI sobre eventos

**Métodos:**
```java
startVpn(String config)     // Inicia VPN com configuração Xray
stopVpn()                   // Para VPN
getStatus()                 // Retorna status atual
```

#### 3.2 MyVpnService (Android VPN Service)

**Arquivo:** `android/MyVpnService.java`

**Responsabilidades:**
- Configurar interface TUN
- Integrar com Xray-core via JNI
- Gerenciar ciclo de vida da conexão
- Fornecer estatísticas

**Fluxo de Inicialização:**

```
1. VpnBridge.startVpn(config)
   ↓
2. MyVpnService.onStartCommand()
   ↓
3. Validar permissão VPN (VpnService.prepare)
   ↓
4. Construir interface TUN
   - Address: 10.0.0.2/32
   - Route: 0.0.0.0/0 (todas as rotas)
   - DNS: 8.8.8.8, 8.8.4.4
   - MTU: 1500
   ↓
5. Carregar libXray.so
   ↓
6. Chamar startXray(config, tunFd) via JNI
   ↓
7. Xray inicia SOCKS proxy em localhost:10808
   ↓
8. TUN interface roteia tráfego para SOCKS proxy
```

**Configuração TUN:**

```java
VpnService.Builder vpnBuilder = new VpnService.Builder();
vpnBuilder
    .setSession("NetTunnel Pro")
    .addAddress("10.0.0.2", 32)      // IP local no tunnel
    .addRoute("0.0.0.0", 0)          // Rotear todo tráfego
    .addDnsServer("8.8.8.8")         // DNS primário
    .addDnsServer("8.8.4.4")         // DNS secundário
    .setMtu(1500)                    // MTU padrão
    .setBlocking(false);             // Não bloqueante

ParcelFileDescriptor pfd = vpnBuilder.establish();
```

---

### 4. Camada de Core (Xray-core)

**Arquivo:** `libXray.so` (binary nativo)

**Responsabilidades:**
- Implementar protocolos VLESS, VMESS, Trojan
- Executar bypass DPI (fragmentação de pacotes)
- Gerenciar conexões com servidores remotos
- Fornecer SOCKS proxy em localhost:10808

**Configuração JSON:**

```json
{
  "inbounds": [
    {
      "protocol": "socks",
      "port": 10808,
      "settings": {
        "auth": "noauth",
        "udp": true
      }
    }
  ],
  "outbounds": [
    {
      "protocol": "vless",
      "settings": {
        "vnext": [{
          "address": "br-sp-01.nettunnel.pro",
          "port": 443,
          "users": [{
            "id": "uuid-aqui",
            "encryption": "none"
          }]
        }]
      },
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
    }
  ]
}
```

**DPI Bypass Techniques:**

| Técnica | Implementação | Efeito |
|---------|--------------|--------|
| **Fragment** | Dividir handshake TLS em múltiplos pacotes | Evita detecção de padrão de handshake |
| **SNI Injection** | Mascarar SNI como domínio whitelisted | Bypass de bloqueio por SNI |
| **Obfuscation** | Adicionar ruído aos dados | Evita análise de tráfego |

---

## Fluxo de Dados Completo

### Conexão

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User clica "Conectar" na UI React                        │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│ 2. Home.tsx → handleToggleConnection()                      │
│    - Cria VpnConfig com servidor selecionado                │
│    - Chama useVpn().connect(config)                         │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│ 3. VpnContext.connect()                                     │
│    - setIsConnecting(true)                                  │
│    - addLog("Iniciando conexão...", "info")                 │
│    - Chama Capacitor.Plugins.VpnBridge.startVpn()           │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│ 4. Capacitor Bridge (JavaScript → Java)                     │
│    - Invoca VpnBridge.startVpn(config)                      │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│ 5. VpnBridge.java (Capacitor Plugin)                        │
│    - Valida permissão VPN                                   │
│    - Inicia MyVpnService com Intent                         │
│    - Notifica listeners: "vpnLog"                           │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│ 6. MyVpnService.onStartCommand()                            │
│    - Constrói interface TUN                                 │
│    - Carrega libXray.so                                     │
│    - Inicia thread Xray                                     │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│ 7. Xray-core (JNI)                                          │
│    - Recebe configuração JSON                               │
│    - Inicia SOCKS proxy em localhost:10808                  │
│    - Conecta ao servidor remoto                             │
│    - Aplica DPI bypass (fragment, SNI injection)            │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│ 8. TUN Interface                                            │
│    - Roteia tráfego do dispositivo para SOCKS proxy         │
│    - Tráfego passa por Xray                                 │
│    - Retorna do servidor remoto                             │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│ 9. Notificação de Sucesso                                   │
│    - VpnBridge notifica: "vpnLog" com "success"             │
│    - VpnContext recebe evento                               │
│    - setIsConnected(true)                                   │
│    - UI atualiza: nó fica azul, botão muda para "Desconectar"
└─────────────────────────────────────────────────────────────┘
```

### Desconexão

```
User clica "Desconectar"
    ↓
VpnContext.disconnect()
    ↓
Capacitor.Plugins.VpnBridge.stopVpn()
    ↓
VpnBridge.stopVpn() (Java)
    ↓
MyVpnService.stopVpn()
    ↓
Xray-core.stopXray() (JNI)
    ↓
TUN interface encerrada
    ↓
setIsConnected(false)
    ↓
UI atualiza: nó fica cinza, botão volta para "Conectar"
```

---

## Padrões de Design

### 1. Context API (React)

**Uso:** Gerenciar estado global da VPN sem prop drilling

```typescript
const { isConnected, connect, disconnect } = useVpn();
```

### 2. Observer Pattern (Logs)

**Uso:** Notificar UI sobre eventos de conexão

```typescript
addLog("Conectando...", "info");
// Automaticamente atualiza ConnectionLogs component
```

### 3. Builder Pattern (TUN Configuration)

**Uso:** Construir configuração TUN de forma legível

```java
new VpnService.Builder()
    .setSession("NetTunnel Pro")
    .addAddress("10.0.0.2", 32)
    .addRoute("0.0.0.0", 0)
    .establish();
```

### 4. Singleton Pattern (Xray-core)

**Uso:** Garantir apenas uma instância de Xray rodando

```java
private static MyVpnService instance;
```

---

## Segurança

### Camadas de Proteção

1. **TLS 1.3** para comunicação com servidor
2. **Criptografia de configuração** em repouso
3. **Validação de certificados** (não usar `allowInsecure`)
4. **Android Keystore** para credenciais
5. **ProGuard/R8** para obfuscação de código

### Dados Sensíveis

| Dado | Armazenamento | Proteção |
|------|---------------|----------|
| UUID do usuário | Android Keystore | Criptografia de hardware |
| Configuração Xray | SharedPreferences | Criptografia EncryptedSharedPreferences |
| Logs | Cache interno | Sem dados sensíveis |

---

## Performance

### Otimizações

1. **Frontend:** Code splitting, lazy loading, minificação
2. **Android:** ProGuard, otimização de memória
3. **Xray:** Uso de geoip.dat comprimido, caching de DNS

### Métricas

- **Tempo de conexão:** ~3-5 segundos
- **Overhead de memória:** ~50-100MB (Xray)
- **Latência adicionada:** ~20-50ms (dependendo do servidor)

---

## Extensibilidade

### Adicionar Novo Protocolo

1. Atualizar `xray-config.json` com novo `outbound`
2. Adicionar opção na UI (Settings panel)
3. Testar com `adb logcat | grep Xray`

### Adicionar Novo Servidor

1. Adicionar à lista em `ServerList.tsx`
2. Atualizar configuração Xray
3. Testar latência e conectividade

### Adicionar Novo Recurso

1. Criar novo componente em `client/src/components/`
2. Integrar com `VpnContext` se necessário
3. Adicionar testes unitários

---

## Troubleshooting

### Problema: Conexão lenta

**Diagnóstico:**
```bash
adb logcat | grep Xray
# Procurar por: "fragment", "latency", "timeout"
```

**Solução:**
- Aumentar `fragment.packets` para 2-4
- Testar com servidor diferente
- Verificar latência com `ping`

### Problema: Conexão recusada

**Diagnóstico:**
```bash
adb shell netstat -an | grep 10808
# Verificar se SOCKS proxy está rodando
```

**Solução:**
- Verificar se Xray iniciou corretamente
- Validar JSON da configuração
- Verificar permissões Android

---

## Recursos

- [Xray-core Docs](https://xtls.github.io/)
- [Android VPN API](https://developer.android.com/reference/android/net/VpnService)
- [Capacitor Docs](https://capacitorjs.com/)
- [React Hooks](https://react.dev/reference/react)

---

**Versão:** 1.0.0  
**Última atualização:** 2026-05-04
