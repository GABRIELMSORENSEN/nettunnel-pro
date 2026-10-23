# NetTunnel Pro - Pre-Build Checklist para Android

## 📋 Checklist Crítico Antes do Build

### 1. **Configuração do Projeto React/Capacitor**
- [ ] Remover erros de TypeScript (TestRunner.tsx, storageProxy.ts)
- [ ] Executar `pnpm check` e resolver todos os erros
- [ ] Executar `pnpm test` para validar testes
- [ ] Executar `pnpm build` para verificar build frontend
- [ ] Verificar se todas as rotas estão funcionando (/, /analytics)

### 2. **Integração Capacitor**
- [ ] Instalar Capacitor CLI: `npm install -g @capacitor/cli`
- [ ] Inicializar Capacitor: `npx cap init`
- [ ] Adicionar plataforma Android: `npx cap add android`
- [ ] Sincronizar projeto: `npx cap sync`
- [ ] Verificar se `android/` foi criado corretamente

### 3. **Configuração Android (build.gradle)**
- [ ] Definir `minSdkVersion` = 24 (Android 7.0+)
- [ ] Definir `targetSdkVersion` = 34 (Android 14)
- [ ] Adicionar permissões necessárias em `AndroidManifest.xml`:
  ```xml
  <uses-permission android:name="android.permission.INTERNET" />
  <uses-permission android:name="android.permission.BIND_VPN_SERVICE" />
  <uses-permission android:name="android.permission.CHANGE_NETWORK_STATE" />
  <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
  <uses-permission android:name="android.permission.CHANGE_WIFI_STATE" />
  <uses-permission android:name="android.permission.WAKE_LOCK" />
  <uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />
  ```
- [ ] Adicionar VPN Service em `AndroidManifest.xml`:
  ```xml
  <service
    android:name=".MyVpnService"
    android:permission="android.permission.BIND_VPN_SERVICE"
    android:exported="true">
    <intent-filter>
      <action android:name="android.net.VpnService" />
    </intent-filter>
  </service>
  ```

### 4. **Compilação Xray-core**
- [ ] Baixar `libXray.so` pré-compilado para ARM64
- [ ] Colocar em: `android/app/src/main/jniLibs/arm64-v8a/libXray.so`
- [ ] Verificar se o arquivo existe e tem permissão de leitura
- [ ] Testar carregamento da biblioteca JNI no VpnBridge.java

### 5. **Corrigir Erros TypeScript**
- [ ] **TestRunner.tsx**: Remover import de `getCarrierById` ou implementar função
  ```typescript
  // Adicionar em carriers-database.ts:
  export function getCarrierById(id: string) {
    return CARRIERS.find(c => c.id === id);
  }
  ```
- [ ] **storageProxy.ts**: Corrigir tipo de array
  ```typescript
  // Mudar de: const [0] = Object.entries(...)
  // Para: const entries = Object.entries(...)
  ```

### 6. **Testes Unitários**
- [ ] Criar testes para `xray-config-generator.ts`
- [ ] Criar testes para `vpn-router-extended.ts`
- [ ] Criar testes para `connection-validator.ts`
- [ ] Atingir cobertura mínima de 70%
- [ ] Executar: `pnpm test`

### 7. **Configuração de Assinatura (Keystore)**
- [ ] Gerar keystore: `keytool -genkey -v -keystore nettunnel.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias nettunnel`
- [ ] Guardar senha e alias em local seguro
- [ ] Adicionar em `android/app/build.gradle`:
  ```gradle
  signingConfigs {
    release {
      storeFile file('nettunnel.keystore')
      storePassword 'sua_senha'
      keyAlias 'nettunnel'
      keyPassword 'sua_senha'
    }
  }
  buildTypes {
    release {
      signingConfig signingConfigs.release
    }
  }
  ```

### 8. **Configuração de Versão**
- [ ] Atualizar `versionCode` em `android/app/build.gradle` (incrementar)
- [ ] Atualizar `versionName` em `android/app/build.gradle` (ex: "1.0.0")
- [ ] Atualizar versão em `package.json`
- [ ] Atualizar `CHANGELOG.md` com mudanças

### 9. **Recursos e Assets**
- [ ] Adicionar ícone do app (192x192, 512x512)
- [ ] Adicionar splash screen (1080x1920)
- [ ] Adicionar strings.xml em `android/app/src/main/res/values/`
- [ ] Adicionar colors.xml com cores cyberpunk

### 10. **Validação de Conectividade**
- [ ] Testar conexão com servidor Xray real (não simulado)
- [ ] Validar fragmentação de pacotes
- [ ] Validar TLS fingerprint spoofing
- [ ] Testar em rede 4G/5G real
- [ ] Validar SNI scanning dinâmico

### 11. **Segurança & Privacy**
- [ ] Remover logs sensíveis (senhas, tokens)
- [ ] Habilitar ProGuard/R8 para ofuscação
- [ ] Validar que nenhum dado sensível é armazenado em plain text
- [ ] Implementar certificado pinning (opcional)

### 12. **Build & Testing**
- [ ] Executar: `cd android && ./gradlew clean`
- [ ] Executar: `./gradlew assembleDebug` (teste)
- [ ] Executar: `./gradlew assembleRelease` (produção)
- [ ] Testar APK em emulador Android
- [ ] Testar APK em dispositivo real (se possível)

### 13. **Documentação Final**
- [ ] Criar `ANDROID_BUILD_GUIDE.md` com instruções passo-a-passo
- [ ] Documentar requisitos de sistema (Java 11+, Android SDK 34)
- [ ] Documentar troubleshooting comum
- [ ] Criar guia de deployment na Play Store

### 14. **CI/CD Validation**
- [ ] Verificar se GitHub Actions workflows estão corretos
- [ ] Validar apk-signing.yml
- [ ] Validar playstore-deploy.yml
- [ ] Testar build em CI/CD environment

---

## 🚨 Erros Críticos a Resolver

### Erro 1: TestRunner.tsx - `getCarrierById` não existe
**Solução:**
```typescript
// Em client/src/lib/carriers-database.ts, adicionar:
export function getCarrierById(id: string) {
  return CARRIERS.find(c => c.id === id);
}

// Ou remover o import de TestRunner.tsx se não for usado
```

### Erro 2: storageProxy.ts - Tipo de array inválido
**Solução:**
```typescript
// Mudar de:
const [key] = Object.entries(config)[0];

// Para:
const entries = Object.entries(config);
const [key] = entries.length > 0 ? entries[0] : ['', ''];
```

---

## 📊 Progresso Esperado

| Fase | Status | Prioridade |
|------|--------|-----------|
| TypeScript Errors | 🔴 Crítico | ALTA |
| Capacitor Setup | 🟡 Pendente | ALTA |
| Android Config | 🟡 Pendente | ALTA |
| Xray Compilation | 🟡 Pendente | ALTA |
| Keystore Setup | 🟡 Pendente | MÉDIA |
| Tests | 🟡 Pendente | MÉDIA |
| Security | 🟡 Pendente | MÉDIA |
| Build & Test | 🟡 Pendente | ALTA |

---

## 🎯 Próximos Passos

1. **Hoje**: Corrigir erros TypeScript (30 min)
2. **Hoje**: Instalar Capacitor e sincronizar (20 min)
3. **Hoje**: Configurar Android build.gradle (30 min)
4. **Amanhã**: Compilar Xray-core e testar (1-2 horas)
5. **Amanhã**: Criar keystore e assinar APK (30 min)
6. **Amanhã**: Build e teste em emulador (1 hora)
7. **Depois**: Deploy na Play Store (via CI/CD)

---

## 📞 Suporte & Troubleshooting

### Problema: "Cannot find module 'xray-core'"
**Solução**: Verificar se `libXray.so` está em `android/app/src/main/jniLibs/arm64-v8a/`

### Problema: "VPN Service não inicia"
**Solução**: Verificar se `MyVpnService` está declarado em `AndroidManifest.xml` com permissão `BIND_VPN_SERVICE`

### Problema: "Build falha com erro de Gradle"
**Solução**: Executar `./gradlew clean` e depois `./gradlew assembleDebug`

### Problema: "APK não instala em dispositivo"
**Solução**: Verificar se `minSdkVersion` é compatível com versão do Android do dispositivo

---

## ✅ Checklist Final

- [ ] Todos os erros TypeScript resolvidos
- [ ] Capacitor instalado e sincronizado
- [ ] AndroidManifest.xml configurado
- [ ] libXray.so compilado e colocado
- [ ] Keystore criado
- [ ] Testes passando (70%+ cobertura)
- [ ] APK debug compilado com sucesso
- [ ] APK release compilado com sucesso
- [ ] Testado em emulador
- [ ] Testado em dispositivo real
- [ ] Documentação atualizada
- [ ] Pronto para Play Store

**Status Geral**: 🟡 Em Progresso (Aguardando Implementação)
