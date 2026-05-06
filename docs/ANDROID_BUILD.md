# Android build sem erros - NetTunnel Pro

Este guia é o caminho recomendado para gerar o APK Android do NetTunnel Pro com Capacitor + Xray-core.

## 1. Pré-requisitos

Instale no ambiente de build:

- Node.js 22+ e pnpm 10+.
- JDK 17.
- Android Studio com Android SDK, Platform Tools e Build Tools instalados.
- `ANDROID_HOME` apontando para o SDK Android.
- Um dispositivo Android físico com depuração USB ativada para teste real de VPN.

Exemplo Linux/macOS:

```bash
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"
```

## 2. Dependências JavaScript e Capacitor

Instale as dependências do projeto e confirme que o Capacitor está disponível:

```bash
pnpm install
pnpm add @capacitor/core @capacitor/android
pnpm add -D @capacitor/cli
pnpm exec cap --version
```

> Se o registry NPM retornar `403`, configure um registry/autenticação válidos antes de repetir os comandos acima.

## 3. Configuração Capacitor

O projeto usa `capacitor.config.ts` com:

- `appId`: `com.nettunnelpro.vpn`
- `appName`: `NetTunnel Pro`
- `webDir`: `dist/public`

O `webDir` precisa bater com o `outDir` do Vite, porque o build web publica os arquivos em `dist/public`.

## 4. Gerar ou sincronizar o projeto Android

O build Gradle real do Capacitor precisa da estrutura `android/app`, `android/settings.gradle` e `android/gradlew`. Se o repositório estiver apenas com os arquivos legados diretamente em `android/` (`AndroidManifest.xml`, `VpnBridge.java`, `MyVpnService.java`), faça a migração uma vez antes do primeiro APK:

```bash
mkdir -p /tmp/nettunnel-pro-native-backup
cp android/AndroidManifest.xml android/VpnBridge.java android/MyVpnService.java android/xray-config.json /tmp/nettunnel-pro-native-backup/
rm -rf android
pnpm exec cap add android
```

Depois copie/adapte os arquivos nativos do backup para os caminhos padrão do projeto Android gerado:

```bash
mkdir -p android/app/src/main/java/com/nettunnelpro/vpn
cp /tmp/nettunnel-pro-native-backup/VpnBridge.java android/app/src/main/java/com/nettunnelpro/vpn/VpnBridge.java
cp /tmp/nettunnel-pro-native-backup/MyVpnService.java android/app/src/main/java/com/nettunnelpro/vpn/MyVpnService.java
```

Mescle manualmente as permissões/serviços de `/tmp/nettunnel-pro-native-backup/AndroidManifest.xml` dentro de `android/app/src/main/AndroidManifest.xml`, sem apagar a `MainActivity` gerada pelo Capacitor.

Em todo build, compile a UI e sincronize os assets web para Android:

```bash
pnpm build
pnpm exec cap sync android
```

Se `pnpm exec cap sync android` criar apenas `android/app/src/main/assets` mas não houver `android/gradlew`, pare e refaça a etapa de migração acima; isso indica que o diretório Android ainda não é um projeto Gradle completo.

## 5. Colocar os binários obrigatórios do Xray

Antes de compilar o APK, coloque os arquivos físicos nestes caminhos exatos:

```text
android/app/src/main/jniLibs/arm64-v8a/libXray.so
android/app/src/main/assets/geoip.dat
android/app/src/main/assets/geosite.dat
```

Crie as pastas, se necessário:

```bash
mkdir -p android/app/src/main/jniLibs/arm64-v8a
mkdir -p android/app/src/main/assets
```

Confirme os arquivos:

```bash
test -f android/app/src/main/jniLibs/arm64-v8a/libXray.so
test -f android/app/src/main/assets/geoip.dat
test -f android/app/src/main/assets/geosite.dat
```

Sem `libXray.so`, o app compila apenas se a referência JNI não for carregada em runtime; para VPN real, `System.loadLibrary("Xray")` falhará. Sem `geoip.dat` e `geosite.dat`, regras de roteamento Xray podem falhar ou ficar incompletas.

## 6. Conferir Manifest e código nativo

No projeto Android gerado pelo Capacitor, o Manifest final precisa declarar:

- Permissão de VPN: `android.permission.BIND_VPN_SERVICE`.
- Permissão de internet: `android.permission.INTERNET`.
- Serviço `MyVpnService` com `android:permission="android.permission.BIND_VPN_SERVICE"`.
- Intent filter com `android.net.VpnService`.

Se você estiver migrando os arquivos legados que estão hoje em `android/`, copie/adapte após `pnpm exec cap add android`:

```text
android/VpnBridge.java
android/MyVpnService.java
android/AndroidManifest.xml
```

para a estrutura Capacitor padrão:

```text
android/app/src/main/java/com/nettunnelpro/vpn/VpnBridge.java
android/app/src/main/java/com/nettunnelpro/vpn/MyVpnService.java
android/app/src/main/AndroidManifest.xml
```

## 7. Build debug

Na raiz do repo:

```bash
pnpm build
pnpm exec cap sync android
cd android
./gradlew assembleDebug
```

APK esperado:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Instalação:

```bash
adb devices
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n com.nettunnelpro.vpn/.MainActivity
```

## 8. Build release

Gere uma keystore uma vez:

```bash
keytool -genkeypair \
  -v \
  -keystore ~/.android/nettunnel-release.keystore \
  -alias nettunnel \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

Configure assinatura no Android Studio ou em `android/app/build.gradle`, depois rode:

```bash
pnpm build
pnpm exec cap sync android
cd android
./gradlew assembleRelease
```

APK/AAB release esperado em `android/app/build/outputs/`.

## 9. Checklist rápido para evitar erros

Antes de subir ou testar no celular, rode:

```bash
pnpm exec tsc --noEmit
pnpm build
pnpm exec cap sync android
test -f android/app/src/main/jniLibs/arm64-v8a/libXray.so
test -f android/app/src/main/assets/geoip.dat
test -f android/app/src/main/assets/geosite.dat
cd android && ./gradlew assembleDebug
```

## 10. Erros comuns

### `npx cap sync android` não encontra config

Confirme que `capacitor.config.ts` existe na raiz e que `webDir` aponta para `dist/public`.

### `System.loadLibrary("Xray")` falha

Confirme o caminho e o nome case-sensitive:

```text
android/app/src/main/jniLibs/arm64-v8a/libXray.so
```

### `geoip.dat` ou `geosite.dat` ausentes

Coloque ambos em:

```text
android/app/src/main/assets/
```

### Conflito entre arquivos legados e Capacitor

O build real do Capacitor usa `android/app/...`. Arquivos diretamente em `android/` são referência/migração e não substituem a estrutura Gradle gerada por `pnpm exec cap add android`.
