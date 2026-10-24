# NetTunnel Pro

Interface original React preservada, agora ligada a uma VPN Android real com Xray-core e Hev Socks5 Tunnel. As cores, fontes e organização anteriores foram mantidas. O backend e as integrações antigas continuam no repositório.

## Usar no Android

Android 10 ou superior, ARM64. Instale o APK assinado da release, abra **Server → Importar servidor autorizado** e cole um link `vless://`, `vmess://` ou `trojan://` do seu servidor. Toque em conectar e autorize a VPN. O estado conectado só aparece após HTTPS verificado pelo servidor; tráfego e tempo são medidos.

Os nomes de regiões e operadoras da interface anterior são exemplos, não credenciais de servidor. Um SNI não fornece internet gratuita. É preciso ter internet móvel/Wi-Fi para alcançar o servidor. Os controles avançados ainda não implementados ficam indisponíveis no Android, sem simular sucesso.

Para usar a conexão de casa, gere o pareamento com o **G4T0XX HomeLink** no PC e importe esse link. O PC precisa continuar ligado; o tráfego do celular continua consumindo dados móveis.

## Verificação real

Galaxy A35 conectado exclusivamente por dados móveis, Wi-Fi desligado, sem relay de internet por USB. Navegação no Chrome, HTTPS por IPv4 e IPv6 em um aplicativo de teste com UID separado, diferença entre IP móvel e IP do PC, desconexão/reconexão e troca entre os clientes NetTunnel/HomeLink foram verificados. O gateway do PC foi testado no executável Windows empacotado. O protocolo testado ao vivo foi VLESS + WebSocket + TLS; não declarar VMess/Trojan ou recursos de zero-rating validados por esse teste.

## Compilar o cliente Android

Requer Python 3.11, Node 22+, JDK 17 e Android SDK 36:

```powershell
python scripts/prepare_android.py
npm ci --prefix android/web
node scripts/build_android_ui.mjs
$env:ANDROID_HOME = "$env:LOCALAPPDATA/Android/Sdk"
android/gradlew.bat -p android :app:assembleNettunnelDebug
```

Os componentes nativos vêm de releases oficiais, com SHA256 fixado em `android/dependencies.json`. A UI é empacotada localmente; o APK não depende de um servidor web para abrir. A implementação ativa está em `android/app/src/runtime`; os arquivos Kotlin anteriores foram preservados. O aplicativo de verificação em `android/mobileverify` é separado, marcado como somente teste e não integra o APK de produção.

Releases usam uma chave própria fora do repositório pelas variáveis `G4T0XX_ANDROID_KEYSTORE`, `G4T0XX_ANDROID_STORE_PASSWORD`, `G4T0XX_ANDROID_KEY_ALIAS` e `G4T0XX_ANDROID_KEY_PASSWORD`. Sem elas, não há assinatura de produção. As credenciais de VPN são armazenadas com AES-GCM/Android Keystore e não acompanham o pacote.

Para gerar o cliente independente HomeLink, defina `G4T0XX_HOMELINK_CLIENT` com o caminho do HTML desse projeto antes do build de UI e compile `:app:assembleHomelinkRelease`.
