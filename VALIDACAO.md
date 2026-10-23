# Validação — 23/10/2026

- APK de release assinado instalado no Galaxy A35 (Android 16) e Quest 3S (Android 14).
- Serviço real do aplicativo iniciou a VPN, leu perfis protegidos pelo Android Keystore e confirmou handshake WireGuard.
- Ping de ida e volta e tráfego criptografado confirmado entre os dois dispositivos, com rotas de teste limitadas a 10.203.0.0/24.
- O teste usou um relay UDP por USB/ADB, presente somente no APK de instrumentação. Comunicação direta entre os aparelhos pela rede Wi-Fi estava indisponível (host unreachable); não foi declarada como validada.
- Permissões temporárias e redirecionamentos ADB foram restaurados. Configurações de teste foram removidas do app. Dados anteriores da instalação de teste foram preservados localmente antes da troca de assinatura.
- Nenhuma credencial pessoal, servidor VPN ou chave de assinatura foi incorporada ao repositório/APK.

O teste valida o núcleo e o serviço do app em aparelhos reais. A conexão a um servidor público e sua política de rotas dependem de um perfil válido do próprio usuário.
