# NetTunnel Pro - Reliability & Stability Guide

## Overview

This guide covers the reliability and stability optimizations implemented in NetTunnel Pro v2.1, including DNSTT/UDP53 support, Captive Portal Bypass, SNI Scanning, Keep-Alive, Global Routing, and WakeLock management.

## 1. DNSTT & UDP Port 53 Support

### What is DNSTT?

DNSTT (DNS Tunnel) is a protocol that encapsulates data inside DNS queries and responses. This allows bypassing DPI by disguising VPN traffic as legitimate DNS traffic.

### When to Use

- **When:** ISP blocks standard VPN protocols but allows DNS queries
- **Advantage:** Very hard to detect (looks like normal DNS)
- **Disadvantage:** Slower than direct connection (DNS overhead)

### Configuration

**Frontend (React):**
```tsx
<CarrierSelector
  selectedPayload="dnstt"
  // or
  selectedPayload="udp53"
/>
```

**Backend (Xray Config):**
```json
{
  "outbounds": [{
    "protocol": "dnstt",
    "settings": {
      "server": "dns.example.com",
      "port": 53
    }
  }]
}
```

### UDP Port 53

UDP/53 is the standard DNS port. Some ISPs allow unlimited DNS queries without counting against data quota.

**Configuration:**
```json
{
  "outbounds": [{
    "protocol": "vless",
    "settings": {
      "vnext": [{
        "address": "server.example.com",
        "port": 53,
        "users": [{"id": "uuid"}]
      }]
    },
    "streamSettings": {
      "network": "udp",
      "udpSettings": {
        "header": {
          "type": "dns"
        }
      }
    }
  }]
}
```

## 2. Captive Portal Bypass

### Problem

Android displays "Sign in to network" notification when it detects a captive portal. This blocks internet access until user "signs in".

### Solution

CaptivePortalBypass intercepts Android's connectivity check (connectivitycheck.gstatic.com) and responds with HTTP 204, making the system believe internet is working.

### Implementation

**File:** `android/CaptivePortalBypass.java`

**How it works:**
1. Starts fake HTTP server on port 8080
2. Listens for requests to `connectivitycheck.gstatic.com/generate_204`
3. Responds with HTTP 204 No Content
4. Android system accepts this as proof of internet connectivity
5. Notification disappears, full internet access enabled

### Activation

Automatically started in `MyVpnService.onStartCommand()`:
```java
startCaptivePortalBypass();
```

### Verification

Check logs:
```
D/NetTunnelPro: Captive portal bypass started on port 8080
D/NetTunnelPro: Sent HTTP 204 response for captive portal detection
```

## 3. SNI Scanning Dinâmico (Auto-Fix)

### Problem

SNI (Server Name Indication) domains get blocked by ISPs. When SNI is blocked, connection fails with "Handshake Timeout".

### Solution

SNIScannerService automatically tries the next SNI in the list until finding one that works.

### Implementation

**File:** `android/SNIScannerService.java`

**Features:**
- Tests multiple SNIs in parallel
- Exponential backoff retry logic
- Tracks success rate per SNI
- Auto-selects best SNI
- Fallback to next SNI on timeout

### How It Works

1. User connects with SNI: `portalrecarga.vivo.com.br`
2. Connection fails (blocked by ISP)
3. SNIScannerService automatically tries: `meuvivo.vivo.com.br`
4. If that fails, tries: `vivo.com.br`
5. Continues until finding working SNI
6. Saves best SNI for future connections

### Usage

**Start SNI Scanning:**
```java
List<SNIScannerService.SNIConfig> snis = Arrays.asList(
    new SNIScannerService.SNIConfig("portalrecarga.vivo.com.br", 10, 95),
    new SNIScannerService.SNIConfig("meuvivo.vivo.com.br", 8, 82),
    new SNIScannerService.SNIConfig("vivo.com.br", 7, 75)
);

vpnService.startSNIScanning(snis);
```

**Get Results:**
```java
String bestSNI = sniScanner.getBestSNI();
List<String> workingSNIs = sniScanner.getWorkingSNIs();
```

### SNI Priority

Higher priority SNIs are tested first:
1. `portalrecarga.vivo.com.br` (priority: 10)
2. `meuvivo.vivo.com.br` (priority: 8)
3. `vivo.com.br` (priority: 7)
4. `telefonica.com.br` (priority: 7)

## 4. Keep-Alive Persistente

### Problem

Carriers drop connections that are inactive for too long (especially zero-rating connections). Connection dies even though user is still connected.

### Solution

Keep-alive sends periodic pings every 15 seconds to maintain connection.

### Implementation

**File:** `android/MyVpnService.java`

**Configuration:**
```java
private static final int KEEP_ALIVE_INTERVAL_MS = 15000; // 15 seconds
private static final int KEEP_ALIVE_TIMEOUT_MS = 25000;  // 25 seconds max
```

### How It Works

1. Every 15 seconds, send keep-alive ping
2. Ping can be:
   - ICMP echo request (ping)
   - UDP packet to keep NAT mapping alive
   - TCP keep-alive flag
3. Carrier sees traffic and doesn't drop connection
4. Connection stays alive indefinitely

### Xray Configuration

**Enable in Xray config:**
```json
{
  "outbounds": [{
    "settings": {
      "persistentKeepalive": 15
    }
  }]
}
```

### Verification

Check logs:
```
D/NetTunnelPro: Keep-alive started (interval: 15000ms)
D/NetTunnelPro: Keep-alive ping sent (maintaining connection)
```

## 5. Roteamento Global (0.0.0.0/0)

### Problem

Without global routing, only browser traffic goes through VPN. System apps (WhatsApp, email, etc.) bypass VPN.

### Solution

Configure VPN to route all traffic (0.0.0.0/0 and ::/0) through TUN interface.

### Implementation

**File:** `android/MyVpnService.java`

```java
// Global routing - route all traffic through VPN
vpnBuilder.addRoute("0.0.0.0", 0);   // IPv4
vpnBuilder.addRoute("::", 0);         // IPv6
```

### What This Means

- **0.0.0.0/0** = All IPv4 addresses (0.0.0.0 to 255.255.255.255)
- **::/0** = All IPv6 addresses
- All apps' traffic goes through VPN
- No app can bypass VPN

### Verification

Check logs:
```
D/NetTunnelPro: Global routing configured (0.0.0.0/0)
```

## 6. WakeLock & Battery Optimization

### Problem

Android's battery optimization puts VPN process to sleep, stopping internet.

### Solution

1. Acquire WakeLock to keep CPU active
2. Show notification to prevent process termination
3. Request user to ignore battery optimization

### Implementation

**File:** `android/MyVpnService.java`

**WakeLock:**
```java
PowerManager powerManager = getSystemService(Context.POWER_SERVICE);
wakeLock = powerManager.newWakeLock(
    PowerManager.PARTIAL_WAKE_LOCK,
    "nettunnel:vpn_wakelock"
);
wakeLock.acquire();  // CPU stays active
```

**Foreground Service:**
```java
Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
    .setContentTitle("NetTunnel VPN")
    .setContentText("VPN conectada • Modo Pro/Stealth")
    .setOngoing(true)  // Prevents termination
    .build();

startForeground(NOTIFICATION_ID, notification);
```

### Battery Impact

- **WakeLock:** 15-30% additional battery usage
- **Foreground Service:** Prevents termination by system
- **Trade-off:** Stable connection vs battery life

### User Prompt

Request user to ignore battery optimization:
```
"NetTunnel VPN works best when battery optimization is disabled.
Go to Settings > Battery > Battery Optimization > Select NetTunnel > Don't Optimize"
```

## 7. MTU Optimization

### What is MTU?

MTU (Maximum Transmission Unit) is the largest packet size that can be transmitted. Default is 1500 bytes.

### Why 1400?

- **1500 bytes:** Standard for desktop/WiFi
- **1400 bytes:** Optimized for 4G/5G networks
- **Smaller packets:** Better compatibility with mobile networks
- **Less fragmentation:** Reduces packet loss

### Implementation

```java
private static final int MTU = 1400;

vpnBuilder.setMtu(MTU);
```

### Verification

Check logs:
```
D/NetTunnelPro: MTU set to 1400
```

## 8. DNS Protection

### Problem

Carriers hijack DNS queries to redirect users to their portals or block certain sites.

### Solution

Use fixed DNS servers (Google, Cloudflare) instead of carrier DNS.

### Implementation

```java
vpnBuilder.addDnsServer("8.8.8.8");      // Google DNS
vpnBuilder.addDnsServer("1.1.1.1");      // Cloudflare DNS
```

### DNS Servers

| Provider | Primary | Secondary | Privacy |
|----------|---------|-----------|---------|
| Google | 8.8.8.8 | 8.8.4.4 | Logs queries |
| Cloudflare | 1.1.1.1 | 1.0.0.1 | No logging |
| Quad9 | 9.9.9.9 | 149.112.112.112 | Security focused |

### Verification

Check logs:
```
D/NetTunnelPro: DNS servers configured
```

## Troubleshooting

### Connection Drops After 5 Minutes

**Cause:** Carrier timeout on inactive connections

**Solution:** 
1. Enable Keep-Alive (already enabled)
2. Reduce keep-alive interval to 10 seconds
3. Try different SNI

### "Sign in to Network" Notification Appears

**Cause:** Captive portal detection not working

**Solution:**
1. Check if CaptivePortalBypass is running
2. Verify port 8080 is not blocked
3. Restart VPN

### SNI Connection Fails

**Cause:** SNI is blocked by ISP

**Solution:**
1. Enable SNI Scanning
2. Wait for auto-fallback to working SNI
3. Manually select different SNI

### VPN Stops When Screen Turns Off

**Cause:** Battery optimization killed process

**Solution:**
1. Disable battery optimization for NetTunnel
2. WakeLock should prevent this
3. Check if WakeLock is acquired

### High Battery Usage

**Cause:** WakeLock and keep-alive running

**Solution:**
1. Reduce keep-alive interval (trade-off: stability vs battery)
2. Disable WakeLock if connection is stable
3. Use WiFi instead of mobile data

## Performance Metrics

### Latency Impact

| Feature | Latency Overhead |
|---------|------------------|
| Fragmentation | +5-10ms |
| TLS Fingerprint | +2-5ms |
| Multiplexing | -10-20ms (faster) |
| Keep-Alive | Negligible |
| DNSTT | +50-100ms |
| UDP/53 | +10-20ms |

### Throughput Impact

| Feature | Throughput |
|---------|-----------|
| No optimization | 100% |
| Fragmentation | 80-90% |
| Multiplexing | 110-120% (faster) |
| DNSTT | 60-70% |
| UDP/53 | 90-95% |

### Battery Impact

| Feature | Battery Usage |
|---------|---------------|
| Baseline | 100% |
| WakeLock | +15-30% |
| Keep-Alive | +5-10% |
| SNI Scanning | +2-5% |
| Captive Portal Bypass | <1% |

## Best Practices

1. **Always enable Keep-Alive** - Prevents connection drops
2. **Use Global Routing** - Ensures all apps work
3. **Enable Captive Portal Bypass** - Removes notification
4. **Start SNI Scanning** - Auto-finds working SNI
5. **Use Fixed DNS** - Prevents hijacking
6. **Set MTU to 1400** - Optimized for mobile
7. **Acquire WakeLock** - Prevents termination
8. **Monitor Logs** - Debug connection issues

## References

- [Xray-core Documentation](https://xtls.github.io/)
- [Android VPN Service](https://developer.android.com/guide/topics/connectivity/vpn)
- [DNS Tunneling](https://en.wikipedia.org/wiki/DNS_tunneling)
- [Keep-Alive Mechanisms](https://tools.ietf.org/html/rfc1122#section-4.2.3.6)
- [MTU Discovery](https://en.wikipedia.org/wiki/Path_MTU_Discovery)
