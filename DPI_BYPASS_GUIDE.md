# NetTunnel Pro - DPI Bypass & Pro/Stealth Mode Guide

## Overview

NetTunnel Pro v2.0 introduces advanced DPI (Deep Packet Inspection) bypass techniques and Pro/Stealth mode for maximum connection evasion and performance optimization.

## Features Implemented

### 1. Packet Fragmentation (sockopt.fragment)

**What it does:** Breaks outgoing packets into smaller fragments to evade DPI detection.

**Configuration:**
```json
{
  "sockopt": {
    "fragment": {
      "packets": "1-3",      // Fragment 1-3 packets
      "length": "100-200",   // Fragment size 100-200 bytes
      "interval": "5-10"     // Interval 5-10ms between fragments
    }
  }
}
```

**Modes:**
- **Lite:** Disabled (no fragmentation)
- **Standard:** packets: "1-2", length: "150-200", interval: "10-15"
- **Pro:** packets: "1-3", length: "100-200", interval: "5-10"

### 2. TLS Fingerprint Spoofing

**What it does:** Makes Xray appear as a legitimate browser (Chrome, Firefox, Safari, Edge) instead of a VPN client.

**Configuration:**
```json
{
  "streamSettings": {
    "tlsSettings": {
      "fingerprint": "chrome",  // Spoof Chrome browser
      "serverName": "example.com",
      "allowInsecure": false,
      "allowInsecureHostnames": false
    }
  }
}
```

**Supported Fingerprints:**
- `chrome` (Recommended) - Most compatible
- `firefox` - Alternative option
- `safari` - macOS/iOS simulation
- `edge` - Windows browser simulation

### 3. Multiplexing (mux)

**What it does:** Combines multiple streams into one connection for faster page loading.

**Configuration:**
```json
{
  "mux": {
    "enabled": true,
    "concurrency": 8  // Number of concurrent streams
  }
}
```

**Modes:**
- **Lite:** Disabled (concurrency: 1)
- **Standard:** Enabled (concurrency: 4)
- **Pro:** Enabled (concurrency: 8)

### 4. DNS Protection

**What it does:** Prevents carrier DNS hijacking by using fixed DNS servers.

**Configuration:**
```json
{
  "dns": {
    "servers": [
      { "address": "8.8.8.8", "port": 53 },
      { "address": "1.1.1.1", "port": 53 }
    ],
    "queryStrategy": "UseIP"
  }
}
```

### 5. MTU Optimization

**What it does:** Adjusts Maximum Transmission Unit for 4G/5G networks.

**Configuration (Android):**
```java
vpnService.setMTU(1400);  // Optimized for mobile networks
```

## Pro/Stealth Mode

### What is Pro/Stealth Mode?

Pro/Stealth mode combines all DPI bypass techniques for maximum evasion:

| Feature | Lite | Standard | Pro/Stealth |
|---------|------|----------|-------------|
| Packet Fragmentation | ❌ | ✅ Moderate | ✅ Aggressive |
| TLS Fingerprint | ✅ Chrome | ✅ Chrome | ✅ Chrome |
| Multiplexing | ❌ | ✅ 4x | ✅ 8x |
| Fragment Packets | - | 1-2 | 1-3 |
| Fragment Length | - | 150-200 | 100-200 |
| Fragment Interval | - | 10-15ms | 5-10ms |
| DNS Protection | ✅ | ✅ | ✅ |
| Recommended For | Low latency | Balanced | Maximum bypass |

### Enabling Pro/Stealth Mode

**Frontend (React):**
```tsx
<CarrierSelector
  mode="pro"
  onModeChange={(mode) => {
    // mode: 'lite' | 'standard' | 'pro'
  }}
/>
```

**Backend (tRPC):**
```typescript
const config = await trpc.vpnExtended.generateXrayConfigForConnection.query({
  configId: 1,
  serverAddress: 'server.example.com',
  serverPort: 443,
  uuid: 'uuid-here'
});
// Returns Xray config with Pro/Stealth settings
```

**Android (Capacitor):**
```typescript
await VpnBridge.startVpn({
  config: JSON.stringify(xrayConfig),
  mode: 'pro'  // Enables Pro/Stealth mode
});
```

## Real-time Logs

### VpnBridge Log Capture

VpnBridge now captures real-time logs from libXray.so process:

```java
// In VpnBridge.java
private void startLogReader() {
  logReaderThread = new Thread(() -> {
    BufferedReader reader = new BufferedReader(
      new InputStreamReader(xrayProcess.getInputStream())
    );
    
    String line;
    while ((line = reader.readLine()) != null) {
      // Send to frontend
      notifyListeners("vpnLog", logEvent);
    }
  });
}
```

### Frontend Log Display

ConnectionLogs component displays real-time logs with statistics:

```tsx
<ConnectionLogs
  logs={logs}
  onClearLogs={clearLogs}
  isConnected={isConnected}
/>
```

**Log Statistics:**
- Total logs count
- Error count
- Warning count
- Success count

## Configuration Generation

### Using Xray Config Generator

```typescript
import { generateXrayConfig, generateProStealthConfig } from './xray-config-generator';

// Pro/Stealth mode
const config = generateProStealthConfig({
  serverAddress: 'server.example.com',
  serverPort: 443,
  uuid: 'your-uuid',
  sni: 'portalrecarga.vivo.com.br'
});

// Custom configuration
const customConfig = generateXrayConfig({
  protocol: 'vless',
  serverAddress: 'server.example.com',
  serverPort: 443,
  uuid: 'your-uuid',
  sni: 'example.com',
  network: 'ws',
  enableDPIBypass: true,
  fragmentPackets: '1-3',
  fragmentLength: '100-200',
  fragmentInterval: '5-10',
  enableTLS: true,
  tlsFingerprint: 'chrome',
  enableMux: true,
  muxConcurrency: 8
});
```

## Performance Impact

### Latency

- **Lite Mode:** Lowest latency (no fragmentation overhead)
- **Standard Mode:** ~5-10ms additional latency
- **Pro Mode:** ~10-20ms additional latency

### Throughput

- **Lite Mode:** Highest throughput (no multiplexing)
- **Standard Mode:** ~80-90% throughput (4x multiplexing)
- **Pro Mode:** ~70-85% throughput (8x multiplexing, fragmentation)

### Battery Usage (Mobile)

- **Lite Mode:** Lowest battery usage
- **Standard Mode:** ~10-15% more battery usage
- **Pro Mode:** ~20-30% more battery usage

## Troubleshooting

### Connection Fails in Pro Mode

**Solution:** Try Standard mode first. Some ISPs may block aggressive fragmentation.

```typescript
// Fallback to standard mode
const config = generateStandardConfig({...});
```

### High Latency in Pro Mode

**Solution:** Reduce fragment concurrency or switch to Standard mode.

```typescript
// Reduce fragmentation
fragmentPackets: "1-2",
fragmentLength: "150-200",
fragmentInterval: "10-15"
```

### DNS Not Working

**Solution:** Ensure DNS servers are reachable and not blocked by carrier.

```typescript
// Try alternative DNS
dnsServers: ["1.0.0.1", "1.1.1.1"]  // Cloudflare
```

## API Reference

### VpnBridge Methods

```typescript
// Start VPN with Pro/Stealth mode
await VpnBridge.startVpn({
  config: xrayConfigJson,
  mode: 'pro'
});

// Stop VPN
await VpnBridge.stopVpn();

// Get status
const status = await VpnBridge.getStatus();

// Get logs
const logs = await VpnBridge.getLogs({ limit: 100 });

// Clear logs
await VpnBridge.clearLogs();

// Configure DNS
await VpnBridge.configureDNS({
  dns1: '8.8.8.8',
  dns2: '1.1.1.1'
});

// Set MTU
await VpnBridge.setMTU({ mtu: 1400 });

// Test connection
const result = await VpnBridge.testConnection({
  serverAddress: 'server.example.com',
  serverPort: 443
});
```

### tRPC Procedures

```typescript
// Generate Xray config for saved configuration
trpc.vpnExtended.generateXrayConfigForConnection.query({
  configId: number,
  serverAddress: string,
  serverPort: number,
  uuid: string
});

// Generate custom Xray config
trpc.vpnExtended.generateCustomXrayConfig.query({
  protocol: 'vless' | 'vmess' | 'trojan',
  serverAddress: string,
  serverPort: number,
  sni: string,
  network: 'tcp' | 'ws' | 'h2' | 'quic',
  enableDPIBypass: boolean,
  tlsFingerprint: 'chrome' | 'firefox' | 'safari' | 'edge',
  enableMux: boolean,
  muxConcurrency: number
});

// Get recommended config for carrier
trpc.vpnExtended.getRecommendedConfig.query({
  carrier: string,
  mode: 'lite' | 'standard' | 'pro'
});

// Get DPI bypass settings
trpc.vpnExtended.getDPIBypassSettings.query({
  mode: 'lite' | 'standard' | 'pro'
});

// Get multiplexing settings
trpc.vpnExtended.getMuxSettings.query({
  mode: 'lite' | 'standard' | 'pro'
});

// Get TLS fingerprint options
trpc.vpnExtended.getTLSFingerprintOptions.query();
```

## Best Practices

1. **Start with Standard Mode:** Most reliable and balanced performance
2. **Use Pro Mode for Restricted Networks:** When Standard mode fails
3. **Monitor Logs:** Check real-time logs for connection issues
4. **Test Configurations:** Use TestRunner before committing to a config
5. **Adjust DNS if Needed:** Some carriers block public DNS
6. **Set Appropriate MTU:** 1400 for mobile, 1500 for desktop

## Security Notes

- All configurations use TLS encryption
- DNS queries are protected
- No credentials stored in logs
- All sensitive data encrypted in transit
- Pro/Stealth mode does not compromise security

## References

- [Xray-core Documentation](https://xtls.github.io/)
- [DPI Bypass Techniques](https://github.com/net4people/bbs/issues/127)
- [TLS Fingerprinting](https://tlsfingerprint.io/)
- [Multiplexing in VPN](https://en.wikipedia.org/wiki/Multiplexing)
