/**
 * Xray Configuration Generator
 * 
 * Generates Xray JSON configurations with:
 * - DPI Bypass (packet fragmentation)
 * - TLS Fingerprint spoofing (Chrome)
 * - Multiplexing for speed optimization
 * - Zero-Rating SNI support
 */

export interface XrayFragmentConfig {
  packets: string; // e.g., "1-3"
  length: string; // e.g., "100-200"
  interval: string; // e.g., "5-10"
}

export interface XrayTLSSettings {
  serverName: string;
  fingerprint: "chrome" | "firefox" | "safari" | "edge";
  allowInsecure: boolean;
  allowInsecureHostnames: boolean;
}

export interface XrayMuxSettings {
  enabled: boolean;
  concurrency: number; // 1-1024, recommended 8
}

export interface XrayOutboundConfig {
  protocol: "vless" | "vmess" | "trojan" | "freedom" | string;
  tag?: string;
  settings: {
    vnext?: Array<{
      address: string;
      port: number;
      users: Array<{
        id: string;
        encryption?: string;
        flow?: string;
      }>;
    }>;
    servers?: Array<{
      address: string;
      port: number;
      password: string;
    }>;
  };
  streamSettings?: {
    network: "tcp" | "ws" | "h2" | "quic";
    security: "none" | "tls";
    tlsSettings?: XrayTLSSettings;
    wsSettings?: {
      path: string;
      headers?: {
        Host: string;
      };
    };
    tcpSettings?: {
      header?: {
        type: string;
        request?: {
          version: string;
          method: string;
          path: string[];
          headers: Record<string, string[]>;
        };
      };
    };
  };
  mux?: XrayMuxSettings;
  sockopt?: {
    mark?: number;
    tcpFastOpen?: boolean;
    tproxy?: string;
    domainStrategy?: string;
    dialerProxy?: string;
    acceptProxyProtocol?: boolean;
    tcpKeepAliveInterval?: number;
    tcpKeepAliveIdle?: number;
    interface?: string;
    V6Only?: boolean;
    tcpUserTimeout?: number;
    // DPI Bypass - Packet Fragmentation
    fragment?: XrayFragmentConfig;
  };
}

export interface XrayInboundConfig {
  port: number;
  protocol: "socks" | "http" | "shadowsocks" | "dokodemo-door" | "socks";
  settings: {
    auth?: "noauth" | "password";
    accounts?: Array<{
      user: string;
      pass: string;
    }>;
    network?: string;
    followRedirect?: boolean;
  };
  sniffing?: {
    enabled: boolean;
    destOverride: string[];
    metadataOnly: boolean;
    routeOnly: boolean;
  };
}

export interface XrayConfig {
  log?: {
    loglevel: "debug" | "info" | "warning" | "error" | "none";
    access?: string;
    error?: string;
  };
  inbounds: XrayInboundConfig[];
  outbounds: XrayOutboundConfig[];
  routing?: {
    domainStrategy: "AsIs" | "IPIfNonMatch" | "IPOnDemand";
    rules: Array<{
      type: "field";
      domain?: string[];
      ip?: string[];
      port?: string;
      network?: string;
      outboundTag: string;
      balancerTag?: string;
    }>;
  };
  dns?: {
    servers: Array<{
      address: string;
      port?: number;
      domains?: string[];
    }>;
    clientIp?: string;
    tag?: string;
    queryStrategy?: "UseIP" | "UseIPv4" | "UseIPv6";
    disableCache?: boolean;
    disableFallback?: boolean;
    disableFallbackIfMatch?: boolean;
  };
  stats?: Record<string, unknown>;
  policy?: {
    levels?: Record<string, unknown>;
    system?: Record<string, unknown>;
  };
}

/**
 * Generate Xray configuration with DPI bypass and optimization
 * 
 * @param params Configuration parameters
 * @returns Xray JSON configuration
 */
export function generateXrayConfig(params: {
  protocol: "vless" | "vmess" | "trojan";
  serverAddress: string;
  serverPort: number;
  uuid?: string;
  password?: string;
  encryption?: string;
  flow?: string;
  sni: string;
  network: "tcp" | "ws" | "h2" | "quic";
  wsPath?: string;
  wsHost?: string;
  
  // DPI Bypass Settings
  enableDPIBypass: boolean;
  fragmentPackets?: string; // "1-3"
  fragmentLength?: string; // "100-200"
  fragmentInterval?: string; // "5-10"
  
  // TLS Settings
  enableTLS: boolean;
  tlsFingerprint?: "chrome" | "firefox" | "safari" | "edge";
  
  // Performance Settings
  enableMux: boolean;
  muxConcurrency?: number;
  
  // DNS Settings
  dnsServers?: string[];
  
  // Logging
  logLevel?: "debug" | "info" | "warning" | "error" | "none";
}): XrayConfig {
  const config: XrayConfig = {
    log: {
      loglevel: params.logLevel || "warning",
    },
    inbounds: [
      {
        port: 10808,
        protocol: "socks",
        settings: {
          auth: "noauth",
          network: "tcp,udp",
        },
        sniffing: {
          enabled: true,
          destOverride: ["http", "tls"],
          metadataOnly: false,
          routeOnly: false,
        },
      },
      {
        port: 10809,
        protocol: "http",
        settings: {
          auth: "noauth",
        },
        sniffing: {
          enabled: true,
          destOverride: ["http", "tls"],
          metadataOnly: false,
          routeOnly: false,
        },
      },
    ],
    outbounds: [
      {
        protocol: params.protocol as "vless" | "vmess" | "trojan",
        settings: {
          vnext:
            params.protocol !== "trojan"
              ? [
                  {
                    address: params.serverAddress,
                    port: params.serverPort,
                    users: [
                      {
                        id: params.uuid || "",
                        encryption: params.encryption || "none",
                        flow: params.flow,
                      },
                    ],
                  },
                ]
              : undefined,
          servers:
            params.protocol === "trojan"
              ? [
                  {
                    address: params.serverAddress,
                    port: params.serverPort,
                    password: params.password || "",
                  },
                ]
              : undefined,
        },
        streamSettings: {
          network: params.network,
          security: params.enableTLS ? "tls" : "none",
          tlsSettings: params.enableTLS
            ? {
                serverName: params.sni,
                fingerprint: params.tlsFingerprint || "chrome",
                allowInsecure: false,
                allowInsecureHostnames: false,
              }
            : undefined,
          wsSettings:
            params.network === "ws"
              ? {
                  path: params.wsPath || "/",
                  headers: {
                    Host: params.wsHost || params.sni,
                  },
                }
              : undefined,
        },
        mux: params.enableMux
          ? {
              enabled: true,
              concurrency: params.muxConcurrency || 8,
            }
          : undefined,
        sockopt: {
          mark: 255,
          tcpFastOpen: true,
          tcpKeepAliveInterval: 60,
          tcpKeepAliveIdle: 300,
          ...(params.enableDPIBypass && {
            fragment: {
              packets: params.fragmentPackets || "1-3",
              length: params.fragmentLength || "100-200",
              interval: params.fragmentInterval || "5-10",
            },
          }),
        },
      },
      {
        protocol: "freedom" as any,
        tag: "direct",
        settings: {},
      },
    ],
    routing: {
      domainStrategy: "IPIfNonMatch",
      rules: [
        {
          type: "field",
          domain: ["geosite:private"],
          outboundTag: "direct",
        },
        {
          type: "field",
          ip: ["geoip:private"],
          outboundTag: "direct",
        },
      ],
    },
    dns: {
      servers: (params.dnsServers || ["8.8.8.8", "1.1.1.1"]).map((addr) => ({
        address: addr,
        port: 53,
      })),
      clientIp: undefined,
      queryStrategy: "UseIP",
      disableCache: false,
      disableFallback: false,
    },
  };

  return config;
}

/**
 * Generate Pro/Stealth mode configuration (maximum DPI bypass)
 */
export function generateProStealthConfig(params: {
  serverAddress: string;
  serverPort: number;
  uuid: string;
  sni: string;
}): XrayConfig {
  return generateXrayConfig({
    protocol: "vless",
    serverAddress: params.serverAddress,
    serverPort: params.serverPort,
    uuid: params.uuid,
    encryption: "none",
    flow: "xtls-rprx-vision",
    sni: params.sni,
    network: "ws",
    wsPath: "/",
    wsHost: params.sni,
    
    // Maximum DPI bypass
    enableDPIBypass: true,
    fragmentPackets: "1-3",
    fragmentLength: "100-200",
    fragmentInterval: "5-10",
    
    // Chrome fingerprint for stealth
    enableTLS: true,
    tlsFingerprint: "chrome",
    
    // Maximum performance
    enableMux: true,
    muxConcurrency: 8,
    
    // DNS protection
    dnsServers: ["8.8.8.8", "1.1.1.1"],
    
    logLevel: "warning",
  });
}

/**
 * Generate Standard mode configuration (balanced)
 */
export function generateStandardConfig(params: {
  serverAddress: string;
  serverPort: number;
  uuid: string;
  sni: string;
}): XrayConfig {
  return generateXrayConfig({
    protocol: "vless",
    serverAddress: params.serverAddress,
    serverPort: params.serverPort,
    uuid: params.uuid,
    encryption: "none",
    sni: params.sni,
    network: "ws",
    wsPath: "/",
    wsHost: params.sni,
    
    // Standard DPI bypass
    enableDPIBypass: true,
    fragmentPackets: "1-2",
    fragmentLength: "150-200",
    fragmentInterval: "10-15",
    
    // Standard TLS
    enableTLS: true,
    tlsFingerprint: "chrome",
    
    // Standard performance
    enableMux: true,
    muxConcurrency: 4,
    
    dnsServers: ["8.8.8.8", "1.1.1.1"],
    logLevel: "warning",
  });
}

/**
 * Generate Lite mode configuration (minimal overhead)
 */
export function generateLiteConfig(params: {
  serverAddress: string;
  serverPort: number;
  uuid: string;
  sni: string;
}): XrayConfig {
  return generateXrayConfig({
    protocol: "vless",
    serverAddress: params.serverAddress,
    serverPort: params.serverPort,
    uuid: params.uuid,
    encryption: "none",
    sni: params.sni,
    network: "tcp",
    
    // Minimal DPI bypass
    enableDPIBypass: false,
    
    // TLS enabled
    enableTLS: true,
    tlsFingerprint: "chrome",
    
    // Minimal performance overhead
    enableMux: false,
    
    dnsServers: ["8.8.8.8"],
    logLevel: "warning",
  });
}
