# Projeto separado: Wi-Fi Security Lab (Android)

**Instrução para Codex:** manter o NetTunnel Pro e o aplicativo Wi-Fi Security Lab como **dois produtos distintos**, com módulos, identificadores de pacote, builds, dados, interfaces e documentação independentes. Este arquivo é uma especificação; **nenhum aplicativo novo foi implementado ainda**. Não misturar scanners Wi-Fi com a VPN NetTunnel.

## Objetivo
Criar aplicativo Android de **auditoria de segurança Wi-Fi em redes próprias ou expressamente autorizadas**, inspirado na experiência simples de listar redes do WPSApp, mas sem pressupor que exista um PIN universal ou uma maneira genérica de entrar em WPA3. Interface em português brasileiro, acessível e leve.

## Escopo inicial
1. Descobrir redes próximas com APIs Android oficiais e permissões explícitas: SSID (quando disponível), BSSID, intensidade RSSI, frequência/canal, capacidades de segurança anunciadas, WPA2-Personal, WPA3-SAE, modo de transição, OWE e sinais de WPS quando observáveis.
2. Diferenciar corretamente **Wi-Fi 5/6/6E/7 (padrões de rádio)** de **WPS/WPA2/WPA3/OWE (configurações de autenticação/segurança)**. Não inferir fabricante/modelo/versão de firmware com certeza apenas pelo SSID ou OUI; exibir nível de confiança e dados ausentes.
3. Inventário de rede própria: permitir entrada manual de modelo, firmware e fabricante, ou consulta autenticada ao roteador quando houver API/documentação apropriada. Não tentar logins padrão ou adivinhação de credenciais.
4. Relacionar modelo/firmware comprovados com avisos de segurança/CVEs, links para fornecedores e medidas de mitigação. Distinguir **potencialmente afetado** de **falha confirmada**.
5. Verificações de configuração não invasivas e testes de associação **somente com credenciais fornecidas pelo proprietário** ou rede de laboratório. Mostrar resultados reais, sem falso 'vulnerável' ou 'conectado'.
6. Relatório exportável: rede, data, informações observadas, limitações de Android, riscos, recomendações, evidências e classificação (informativo / possível / confirmado).
7. Modo laboratório com cenários simulados ou AP próprio configurado para demonstrar diferenças entre WPA2, WPA3-SAE e OWE. Se for necessário hardware de modo monitor, tratar como ferramenta externa opcional, não prometer suporte Android genérico.

## Segurança e limites
- Sem exploração automática de redes de terceiros, ataques de desautenticação, captura de credenciais, quebra de senhas, brute force, bypass de autenticação ou tentativas de acesso sem autorização.
- Não alegar que WPA3 pode ser acessado sem senha por 'um botão'; vulnerabilidades dependem de implementação, firmware e condições específicas.
- Não coletar ou publicar localização, SSIDs, BSSIDs e credenciais sem consentimento; armazenamento local seguro, opção apagar dados.
- Respeitar restrições Android sobre localização, varredura Wi-Fi, limites de frequência e necessidade de aprovação do usuário para conectar. Verificar documentação e comportamento na versão Android alvo.

## Arquitetura proposta
- **Projeto Android independente** em diretório futuro `wifi-security-lab/` (ou repositório próprio se o proprietário decidir). Não criar código misturado dentro do módulo VPN.
- Kotlin + Jetpack Compose para app leve; camadas: scan/permissions, security classification, device inventory, advisory matching, authorized connectivity tests, reports.
- Testes unitários para classificação de capacidades Wi-Fi e mapeamento de alertas; instrumentados para permissões/scan/conexão; casos simulados para aparelhos sem Wi-Fi ou permissões.
- Nenhum serviço remoto obrigatório para o scanner básico; sincronização de CVEs opcional com fonte e data.

## Ordem para Codex
1. Auditar estrutura do repositório e registrar o que pertence ao NetTunnel, sem modificar o produto existente.
2. Propor estrutura independente e verificar permissões/API Android atuais.
3. Criar esqueleto Android e tela de descoberta; testar em dispositivo real.
4. Implementar classificação, inventário, checagens passivas, consulta a avisos e relatórios.
5. Testar conectividade autorizada em roteador WPA3 do proprietário, com credenciais válidas, e documentar limitações.
6. Gerar APK de teste e instruções de instalação; nunca afirmar teste real sem evidência.

## Relação com NetTunnel Pro
- NetTunnel Pro continua com dois modos: túneis avançados e internet de casa (A17 gateway → celular remoto).
- Wi-Fi Security Lab é **outro aplicativo**, voltado à auditoria Wi-Fi; não incorporar a ferramenta ao menu NetTunnel.
- Este documento apenas instrui o Codex. Para criar repositório separado, obter decisão explícita do proprietário.
