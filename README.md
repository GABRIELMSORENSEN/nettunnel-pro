# NetTunnel Pro · G4T0XX

Cliente VPN Android com WireGuard real, perfis protegidos pelo Android Keystore e interface preta/vermelha. A aplicação ativa está em `native/`.

## Instalar

Baixe o APK em [Releases](https://github.com/GABRIELMSORENSEN/nettunnel-pro/releases). Android 8 ou superior.

1. Obtenha uma configuração WireGuard `.conf` do seu próprio servidor/provedor.
2. Use **Importar arquivo .conf** ou **Adicionar configuração**.
3. Selecione o perfil, toque em **Conectar** e conceda a permissão VPN do Android.
4. A interface diferencia túnel iniciado de conexão com **handshake confirmado**. Transferência e handshake vêm do núcleo real.
5. **Desconectar** encerra o túnel; uma notificação permanece disponível durante a conexão.

O app não fornece servidor, internet gratuita, zero-rating ou credenciais. VLESS/VMess/Trojan e os antigos serviços SSH/DNS não fazem parte desta versão funcional. A pasta web/Android antiga registra o protótipo anterior e não é usada no APK atual.

## Segurança e estado

Perfis são criptografados com AES-GCM e chave não exportável no Android Keystore. Chaves privadas ficam ocultas no editor por padrão; backups automáticos são desabilitados. Não há métricas aleatórias, anúncios ou API pessoal embutida. A política de rotas é a de `AllowedIPs` do perfil importado; use uma configuração do seu servidor adequada ao tráfego desejado.

## Compilar

JDK 17, Android SDK 36, Gradle 8.14.3.

```powershell
cd native
./gradlew assembleDebug
```

A compilação de release usa uma chave própria, fora do repositório, via variáveis `G4T0XX_ANDROID_KEYSTORE`, `G4T0XX_ANDROID_STORE_PASSWORD`, `G4T0XX_ANDROID_KEY_PASSWORD` e `G4T0XX_ANDROID_KEY_ALIAS`. Sem essas variáveis, `assembleRelease` gera um APK sem assinatura.

`app/src/androidTest/` contém o teste de integração para dois dispositivos. O transporte auxiliar USB existe somente no APK de testes. Ele não entra no aplicativo distribuído. Veja `VALIDACAO.md`.

Núcleo: [WireGuard para Android](https://www.wireguard.com/embedding/), licença Apache 2.0. O aplicativo mantém sua licença MIT.
