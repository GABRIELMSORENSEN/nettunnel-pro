# NetTunnel Pro - TODO List

## DPI Bypass & Performance Optimization Update

### Phase 1: Backend Configuration
- [x] Criar gerador de config Xray com fragmentação (sockopt)
- [x] Implementar TLS fingerprint chrome em tlsSettings
- [x] Adicionar multiplexing (mux) com concurrency: 8
- [x] Criar tipos TypeScript para nova config estrutura
- [x] Adicionar suporte a modo Pro/Stealth no banco de dados

### Phase 2: Frontend Configuration
- [x] Atualizar CarrierSelector com toggle Pro/Stealth
- [x] Implementar gerador de config Xray no client
- [x] Adicionar visualização de fragmentação settings
- [x] Criar UI para seleção de TLS fingerprint

### Phase 3: Logs em Tempo Real
- [x] Implementar VpnBridge.java com captura de logs libXray.so
- [x] Criar listener Capacitor para vpnLog events
- [x] Atualizar ConnectionLogs.tsx para usar logs reais
- [x] Remover logs simulados

### Phase 4: Otimizações Android
- [x] Ajustar MTU para 1400 em MyVpnService.java
- [x] Configurar DNS fixo (8.8.8.8, 1.1.1.1)
- [x] Testar compatibilidade 4G/5G

### Phase 5: Documentação
- [x] Criar DPI_BYPASS_GUIDE.md
- [x] Documentar estrutura de config Xray
- [x] Criar guia de uso modo Pro/Stealth
- [x] Atualizar PROJECT_OVERVIEW.md

### Completed
- [x] Criar projeto base NetTunnel Pro
- [x] Implementar UI Cyberpunk Minimalista
- [x] Adicionar múltiplas operadoras (Vivo, Claro, Oi, Tim)
- [x] Criar sistema de testes
- [x] Implementar backend com tRPC
- [x] Adicionar autenticação OAuth
- [x] Criar documentação completa
- [x] Implementar Xray config generator com fragmentação
- [x] Criar vpn-router-extended com APIs tRPC
- [x] Atualizar VpnBridge com real-time log capture
- [x] Adicionar modo Pro/Stealth na UI
- [x] Criar DPI_BYPASS_GUIDE.md completo


## Reliability & Stability Optimization (v2.1)

### Phase 1: DNSTT & UDP Port 53
- [ ] Adicionar protocolo DNSTT ao seletor de protocolos
- [ ] Implementar suporte a UDP porta 53 no Xray config generator
- [ ] Criar UI para seleção de DNS tunneling
- [ ] Documentar DNSTT vs VLESS/VMESS

### Phase 2: Captive Portal Bypass
- [ ] Implementar resposta fake para connectivitycheck.gstatic.com
- [ ] Criar CaptivePortalBypass.java
- [ ] Integrar no MyVpnService.java
- [ ] Testar com diferentes versões do Android

### Phase 3: SNI Scanning Dinâmico
- [ ] Criar SNIScannerService.java
- [ ] Implementar auto-fallback para próximo SNI
- [ ] Adicionar retry logic com exponential backoff
- [ ] Criar UI para visualizar SNI scanning progress

### Phase 4: Keep-Alive Persistente
- [ ] Configurar persistentKeepalive: 15-25s no Xray
- [ ] Implementar heartbeat no VpnBridge
- [ ] Adicionar keep-alive para conexões sem saldo
- [ ] Testar em redes com timeout agressivo

### Phase 5: Roteamento Global & WakeLock
- [ ] Implementar roteamento 0.0.0.0/0 (global)
- [ ] Adicionar PowerManager.WakeLock
- [ ] Criar dialog para "Ignorar Otimizações de Bateria"
- [ ] Implementar foreground service com notification

### Phase 6: Documentação & Testes
- [ ] Criar RELIABILITY_GUIDE.md
- [ ] Documentar cada otimização
- [ ] Criar guia de troubleshooting
- [ ] Adicionar testes de conectividade
