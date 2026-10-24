# Verificação — 23/10/2026

Galaxy A35: Wi-Fi desligado, rede móvel Claro, sem relay de internet por USB. O Chrome abriu o portfólio e confirmou o IP do PC. Uma aplicação de teste com UID separado confirmou HTTPS IPv4/IPv6 pelos APKs assinados NetTunnel e HomeLink, com transporte CELLULAR/VPN e sem WIFI. Ao desconectar, o transporte voltou a CELLULAR e o IP da operadora; reconectar restaurou o IP do PC. Troca entre os dois aplicativos também passou.

A sessão do teste no Chrome permaneceu ativa por 116 segundos; os APKs de release tiveram três amostras adicionais de estabilidade a intervalos de 15 segundos. O executável empacotado do PC foi usado como gateway. Sua conexão foi vinculada ao adaptador Wi-Fi, com rota confirmada pelo Windows.

Recursos verificados ao vivo: VLESS + WebSocket + TLS, HTTPS IPv4/IPv6, tráfego, autorização VPN, desconexão/reconexão e revogação ao fechar o PC. VMess/Trojan, zero-rating e recursos avançados não foram validados ao vivo. O scanner e os controles experimentais não simulam resultados. Relatório público sem credenciais: `verification/mobile.json`.

Medi??o curta: tr?s downloads HTTPS de 2 MB por modo, endpoint p?blico speed.cloudflare.com. Mediana incluindo conex?o: 4,94 Mbps direto na operadora; 2,20 Mbps pelo HomeLink. N?o houve ganho de velocidade. A capacidade depende da rede m?vel, upload de casa e relay. Relat?rio: `verification/speed.json`.
