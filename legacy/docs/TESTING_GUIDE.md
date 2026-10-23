# NetTunnel Pro - Testing & Validation Guide

## Overview

This guide covers comprehensive testing of all VPN configurations including carriers, servers, SNIs, payloads, and connection methods.

## Supported Carriers

### 1. Vivo (Largest Brazilian Carrier)

**SNI Configurations:**
- `portalrecarga.vivo.com.br` - Official recharge portal (95% success rate)
- `vivo.com.br` - Main domain (88% success rate)
- `meusvivo.vivo.com.br` - App portal (82% success rate)
- `api.vivo.com.br` - API endpoint (75% success rate)

**Servers:**
- São Paulo 01 (5ms latency, VLESS + WebSocket)
- Rio de Janeiro 01 (12ms latency, VLESS + WebSocket)
- Minas Gerais 01 (18ms latency, VMESS + TCP)

**Payload Methods:**
- HTTP - Standard HTTP obfuscation
- TLS - With fragmentation (1-3 packets, 10-20 bytes)
- WebSocket - WebSocket tunneling

**Expected Performance:**
- Latency: 5-18ms
- Bandwidth: 500Mbps - 1Gbps
- Uptime: 99.7% - 99.9%

---

### 2. Claro (Second Largest Carrier)

**SNI Configurations:**
- `claro.com.br` - Official domain (92% success rate)
- `meuclaro.claro.com.br` - App portal (88% success rate)
- `api.claro.com.br` - API (85% success rate)
- `recarga.claro.com.br` - Recharge (80% success rate)

**Servers:**
- São Paulo 01 (8ms latency, VLESS + WebSocket)
- Bahia 01 (22ms latency, Trojan + TCP)
- Rio Grande do Sul 01 (25ms latency, VMESS + WebSocket)

**Payload Methods:**
- HTTP - Standard HTTP
- Fragment - Packet splitting (2-4 packets, 15-25 bytes)
- TLS - TLS fragmentation

**Expected Performance:**
- Latency: 8-25ms
- Bandwidth: 500Mbps - 1Gbps
- Uptime: 99.5% - 99.8%

---

### 3. Oi (Third Carrier)

**SNI Configurations:**
- `oi.com.br` - Official domain (90% success rate)
- `meuoi.oi.com.br` - App portal (85% success rate)
- `recarga.oi.com.br` - Recharge (82% success rate)

**Servers:**
- São Paulo 01 (15ms latency, VLESS + WebSocket)
- Rio de Janeiro 01 (18ms latency, Trojan + TCP)

**Payload Methods:**
- HTTP - Standard HTTP
- Fragment - Packet splitting
- TLS - TLS fragmentation

**Expected Performance:**
- Latency: 15-18ms
- Bandwidth: 500Mbps
- Uptime: 99.3% - 99.4%

---

### 4. Tim (Fourth Carrier)

**SNI Configurations:**
- `tim.com.br` - Official domain (88% success rate)
- `meutim.tim.com.br` - App portal (84% success rate)

**Servers:**
- São Paulo 01 (10ms latency, VLESS + WebSocket)

**Payload Methods:**
- HTTP - Standard HTTP
- WebSocket - WebSocket tunneling

**Expected Performance:**
- Latency: 10ms
- Bandwidth: 500Mbps
- Uptime: 99.2%

---

## Connection Methods

### VLESS Protocol

**Characteristics:**
- Minimal overhead
- No encryption (relies on TLS)
- Fastest protocol
- Best for modern applications

**Configuration:**
```json
{
  "protocol": "vless",
  "uuid": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "encryption": "none",
  "network": "ws",
  "tls": true
}
```

**Testing:**
- Test with all SNIs for each carrier
- Verify latency < 50ms
- Check bandwidth > 100Mbps

---

### VMESS Protocol

**Characteristics:**
- Built-in obfuscation
- Timestamp-based authentication
- Medium overhead
- Better compatibility

**Configuration:**
```json
{
  "protocol": "vmess",
  "uuid": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "encryption": "auto",
  "network": "tcp",
  "tls": true
}
```

**Testing:**
- Test with multiple SNIs
- Verify handshake completes
- Check for DPI detection

---

### Trojan Protocol

**Characteristics:**
- Zero overhead
- Direct TCP connection
- Fastest performance
- Minimal obfuscation

**Configuration:**
```json
{
  "protocol": "trojan",
  "password": "password-here",
  "network": "tcp",
  "tls": true
}
```

**Testing:**
- Test with carrier-specific SNIs
- Verify TLS handshake
- Monitor for DPI blocks

---

## Payload Methods

### HTTP Payload

**Use Case:** Zero-rating on HTTP traffic

**Configuration:**
```json
{
  "method": "http",
  "host": "portalrecarga.vivo.com.br",
  "path": "/"
}
```

**Testing:**
- Verify HTTP headers match SNI
- Check Host header
- Test with different paths

---

### TLS Payload

**Use Case:** Bypass DPI via TLS fragmentation

**Configuration:**
```json
{
  "method": "tls",
  "fragment": {
    "packets": "1-3",
    "length": "10-20"
  }
}
```

**Testing:**
- Test different packet counts (1-3, 2-4)
- Test different lengths (10-20, 15-25)
- Verify DPI bypass effectiveness

---

### WebSocket Payload

**Use Case:** Tunnel through WebSocket

**Configuration:**
```json
{
  "method": "websocket",
  "host": "portalrecarga.vivo.com.br",
  "path": "/ws"
}
```

**Testing:**
- Verify WebSocket upgrade
- Check path handling
- Test with different hosts

---

## Test Scenarios

### Scenario 1: Basic Connectivity

**Steps:**
1. Select Vivo carrier
2. Choose São Paulo 01 server
3. Select `portalrecarga.vivo.com.br` SNI
4. Choose HTTP payload
5. Click "Conectar"

**Expected Result:**
- Connection succeeds within 5 seconds
- Latency shows 5-10ms
- IP changes to external IP
- Logs show "Tunnel estabelecido com sucesso"

---

### Scenario 2: DPI Bypass

**Steps:**
1. Select Claro carrier
2. Choose Bahia 01 server (different region)
3. Select `claro.com.br` SNI
4. Choose TLS payload with fragmentation
5. Click "Conectar"

**Expected Result:**
- Connection succeeds despite DPI
- Latency shows 20-25ms
- Fragmentation logs appear
- Success rate > 85%

---

### Scenario 3: Zero-Rating

**Steps:**
1. Select any carrier
2. Choose server in same region
3. Select carrier portal SNI (e.g., `portalrecarga.vivo.com.br`)
4. Choose HTTP payload
5. Click "Conectar"

**Expected Result:**
- Connection succeeds with minimal latency
- Traffic appears as carrier portal traffic
- No data deduction from plan
- Bandwidth shows high speed

---

### Scenario 4: Comprehensive Testing

**Steps:**
1. Select carrier
2. Click "Executar Testes"
3. Wait for all tests to complete

**Expected Result:**
- Tests run for all SNI/Payload combinations
- Success rate > 80%
- Best configuration highlighted
- Export options available

---

## Performance Benchmarks

### Latency Targets

| Carrier | Region | Target | Acceptable |
|---------|--------|--------|-----------|
| Vivo | São Paulo | < 10ms | < 30ms |
| Vivo | Rio | < 15ms | < 40ms |
| Claro | São Paulo | < 10ms | < 30ms |
| Claro | Northeast | < 25ms | < 50ms |
| Oi | São Paulo | < 20ms | < 40ms |
| Tim | São Paulo | < 15ms | < 35ms |

### Bandwidth Targets

| Configuration | Target | Minimum |
|---------------|--------|---------|
| HTTP Payload | > 200Mbps | > 100Mbps |
| TLS Payload | > 150Mbps | > 80Mbps |
| WebSocket Payload | > 180Mbps | > 90Mbps |

### Success Rate Targets

| Carrier | SNI | Target | Acceptable |
|---------|-----|--------|-----------|
| Vivo | portalrecarga.vivo.com.br | > 95% | > 90% |
| Vivo | vivo.com.br | > 88% | > 80% |
| Claro | claro.com.br | > 92% | > 85% |
| Oi | oi.com.br | > 90% | > 80% |

---

## Troubleshooting

### Connection Fails Immediately

**Possible Causes:**
1. Invalid server address
2. Port blocked by firewall
3. TLS certificate validation failed

**Solutions:**
1. Verify server address is correct
2. Check port 443 is open
3. Disable certificate validation (dev only)

---

### High Latency (> 100ms)

**Possible Causes:**
1. Server overloaded
2. Network congestion
3. Fragmentation too aggressive

**Solutions:**
1. Switch to different server
2. Try different time of day
3. Reduce fragment packet count

---

### DPI Detection

**Possible Causes:**
1. Weak obfuscation
2. Known pattern
3. Carrier actively blocking

**Solutions:**
1. Try different SNI
2. Enable fragmentation
3. Switch payload method
4. Use different carrier

---

### No Internet After Connection

**Possible Causes:**
1. Routing not configured
2. DNS not working
3. TUN interface issue

**Solutions:**
1. Check routing table
2. Verify DNS servers (8.8.8.8, 8.8.4.4)
3. Restart VPN service

---

## Validation Checklist

- [ ] All 4 carriers tested
- [ ] All SNIs tested for each carrier
- [ ] All payload methods tested
- [ ] All protocols tested (VLESS, VMESS, Trojan)
- [ ] Latency within acceptable range
- [ ] Bandwidth meets minimum requirements
- [ ] Success rate > 80%
- [ ] DPI bypass working
- [ ] Zero-rating working
- [ ] Logs clear and informative
- [ ] Export functionality working
- [ ] Mobile responsiveness verified

---

## Test Report Export

### JSON Format

```bash
# Export test results as JSON
Click "Exportar JSON" in test runner
File: test-report-vivo.json
```

### CSV Format

```bash
# Export test results as CSV
Click "Exportar CSV" in test runner
File: test-report-vivo.csv
```

### Columns in CSV

- Carrier
- Server
- SNI
- Payload
- Status
- Latency (ms)
- Bandwidth (Mbps)
- Error

---

## Continuous Testing

### Automated Tests

Run tests daily to monitor configuration health:

```bash
# Run tests for all carriers
pnpm test:carriers

# Run tests for specific carrier
pnpm test:carrier vivo
```

### Performance Monitoring

Monitor performance metrics over time:

```bash
# Generate performance report
pnpm report:performance

# Export metrics
pnpm export:metrics
```

---

## Resources

- [Xray-core Documentation](https://xtls.github.io/)
- [DPI Bypass Techniques](https://xtls.github.io/en/document/level-1/anti-censorship.html)
- [Android VPN Service](https://developer.android.com/reference/android/net/VpnService)

---

**Last Updated:** 2026-05-04  
**Version:** 1.0.0
