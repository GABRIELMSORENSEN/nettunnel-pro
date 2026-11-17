# NetTunnel Pro — Plano de implementação para Codex

Status: especificação de trabalho, **não** confirmação de funcionalidades implementadas. Data: 2026-11-16.

## Objetivo
Um único aplicativo Android, com dois modos bem separados:
1. **Túneis avançados**: conectar a servidores próprios/autorizados por protocolos suportados, com diagnóstico real.
2. **Internet de casa**: um Samsung Galaxy A17 fica em casa, conectado ao Wi-Fi residencial, como **gateway/saída**; o celular principal na rua atua como **cliente**. O PC Windows 11 serve para desenvolver e compilar, **não** precisa permanecer ligado 24h. Não depender do G4T0XX HomeLink como solução pronta: usuário relata que ele não conseguiu transmitir tráfego no cenário desejado.

## Premissas técnicas fundamentais
- O A17 deve compartilhar sua conectividade residencial **via túnel sobre uma conexão já existente** no celular remoto. Sinal 4G/5G ou acesso exclusivo a portal de recarga não implica acesso ao servidor. Não prometer internet sem dados, bypass de franquia ou zero-rating.
- Android pode impor restrições a VPNService, tethering, encaminhamento de pacotes, NAT, processos em segundo plano e bateria. **Verificar em dispositivo real** se um Android sem root pode atuar como exit node para outro Android. Não marcar como funcional sem prova; considerar fallback com gateway autorizado no roteador ou pequeno servidor sempre ligado, sem exigir PC 24h.
- Para dispositivos atrás de CGNAT, investigar NAT traversal e relay seguro. Relay externo pode ser necessário; pareamento e transporte devem usar autenticação forte e criptografia.
- Pesquisa de segurança/bug bounty: testes somente em laboratório, infraestrutura própria ou escopo explicitamente autorizado. Diagnóstico não deve automatizar evasão de cobrança, contornar portal cativo ou controles de acesso da Claro. Divulgação responsável e critérios do programa devem ser verificados antes de testar redes de terceiros.

## Modo A — Túneis avançados
- Auditar implementação existente antes de alterar; preservar interface React e funcionalidades efetivas.
- Inventariar cada opção visual: **implementado, parcial, simulado, quebrado, não implementado**. Controles não funcionais devem ficar indisponíveis, sem falso estado de conexão.
- Protocolos candidatos, com suporte condicionado à biblioteca e testes: SSH TCP e encaminhamento SOCKS5, HTTP CONNECT, TLS/stunnel, WebSocket/TLS, VLESS/VMess/Trojan via Xray-core, Shadowsocks, Hysteria/QUIC, IPv4/IPv6 e DNS configurável. Distinguir protocolos, transportes e resolvedores DNS; não tratar SNI ou CDN como método de obter franquia gratuita.
- Importação de perfis/URLs com validação, gerenciamento de servidores autorizados, certificados TLS validados, armazenamento seguro de segredos, reconexão com limites, métricas de tráfego/latência, logs redigidos sem credenciais e mensagens claras.
- Compatibilidade por protocolo documentada individualmente; **README atual só declara teste real de VLESS + WS + TLS**.

## Modo B — Internet de casa (A17 gateway → celular remoto cliente)
- Uma APK com seleção de papel na tela inicial: **Compartilhar internet de casa** (A17) e **Usar internet de casa** (celular remoto). Papéis independentes, sem precisar de dois aplicativos.
- Fluxo do A17: verificar Wi-Fi e capacidade de saída, iniciar serviço/gateway autorizado, gerar código QR de pareamento com expiração, exibir status, dispositivos conectados, upload/download, bateria, Wi-Fi, consumo e botão parar.
- Fluxo do remoto: ler QR, autenticar/parear, solicitar permissão VPNService, conectar, validar tráfego real e IP de saída, mostrar erro e reconexão. Nunca exibir “conectado” apenas porque um socket abriu.
- Prototipar primeiro **prova de conceito de forwarding real** A17 → remoto, com teste HTTPS por app separado e comparação de IP de saída; verificar limitação Android sem root e capacidade de permanecer ativo com tela apagada. Só depois integrar UI definitiva.
- Segurança: chaves por dispositivo, revogação, autorização explícita no A17, limites de clientes, proteção contra uso por terceiros, kill switch opcional e nenhum serviço público sem autenticação.
- Se o A17 não conseguir ser gateway IP completo em Android padrão, registrar evidência e oferecer arquitetura alternativa honesta; não mascarar como implementado.

## Diagnóstico e testes
- Matriz por recurso: compilação, conexão inicial, transferência efetiva, DNS, IPv4/IPv6, troca Wi-Fi/4G, reconexão, tela apagada, bateria, vazamento de IP/DNS, falhas TLS e logs.
- Testar primeiro com internet normal no celular remoto e A17 no Wi-Fi; depois avaliar condições de acesso restrito apenas onde houver autorização. A operadora do celular principal é **Claro**.
- Dispositivos: Samsung Galaxy A17 em casa; celular principal na rua (confirmar modelo/versão antes de fixar matriz). PC Windows 11 para Codex/build.
- Métrica de aceite do modo B: celular remoto navega por túnel autenticado, IP público de saída corresponde à rede residencial (ou saída de gateway explicitamente documentada), transferência bidirecional e estabilidade com A17 sem tela ligada. Registrar se usa relay.
- Testes automatizados unitários e de integração onde possível; testes instrumentados Android e evidências reproduzíveis no README.

## Execução Codex — etapas
1. **Auditoria sem alterar comportamento**: mapear árvore, módulos Android, React, Xray, Hev, HomeLink e dependências; relatório de lacunas e riscos.
2. **Prova de conceito do A17 gateway**: investigar viabilidade real no Android sem root, forwarding, VPNService, roteamento e persistência; decisão go/no-go com evidências.
3. **Arquitetura modular**: interfaces de transporte, gestão de perfis, serviço VPN, diagnóstico, papel gateway/cliente, pareamento e observabilidade.
4. **Implementação incremental**: priorizar o modo residencial comprovado e protocolos já suportados; demais protocolos em tarefas separadas.
5. **QA e release**: testes reais, documentação de suporte, assinatura, privacidade, limites e rollback.

## Regras de entrega
- Não apagar código legado sem inventário; não reescrever UI sem motivo.
- Cada PR deve ter escopo, testes e resultado verificável; sem alegar conectividade com base apenas no estado visual.
- Não colocar credenciais, links de pareamento permanentes ou chaves privadas no Git.
- O modo residencial **não deve depender do PC ligado**.
- Nenhuma alteração de código foi realizada por este documento; Codex deve começar pela auditoria e pela prova de viabilidade.
