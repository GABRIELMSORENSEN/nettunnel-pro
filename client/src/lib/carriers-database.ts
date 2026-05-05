/**
 * Carriers Database
 * 
 * Comprehensive database of Brazilian carriers with multiple SNI configurations,
 * payload methods, and connection parameters for zero-rating and DPI bypass.
 * 
 * Updated with DNSTT, UDP/53, and advanced reliability features.
 */

export type ConnectionMethod = 'vless' | 'vmess' | 'trojan' | 'ss' | 'ssr' | 'dnstt' | 'udp53';
export type PayloadMethod = 'http' | 'tls' | 'websocket' | 'fragment' | 'mixed' | 'dnstt' | 'udp53';
export type NetworkType = 'wifi' | '4g' | '5g' | 'all';

export interface PayloadConfig {
  method: PayloadMethod;
  host?: string;
  path?: string;
  fragment?: {
    packets: string;
    length: string;
  };
  obfuscation?: string;
  dnsServer?: string; // For DNSTT/UDP53
  port?: number; // For UDP53
}

export interface SNIConfig {
  domain: string;
  description: string;
  payloads: PayloadConfig[];
  priority: number; // 1-10, higher = better
  lastTested?: Date;
  successRate?: number; // 0-100
  keepAliveInterval?: number; // seconds
  autoFallback?: boolean; // Enable SNI scanning
}

export interface ServerConfig {
  id: string;
  name: string;
  address: string;
  port: number;
  protocol: ConnectionMethod;
  uuid?: string;
  password?: string;
  encryption?: string;
  network: 'ws' | 'tcp' | 'kcp' | 'quic' | 'udp';
  tls: boolean;
  region: string;
  country: string;
  flag: string;
  latency: number;
  load: number;
  bandwidth: string;
  uptime: number; // percentage
  keepAliveEnabled?: boolean;
  captivePortalBypass?: boolean;
}

export interface CarrierConfig {
  id: string;
  name: string;
  logo: string;
  color: string;
  snis: SNIConfig[];
  servers: ServerConfig[];
  description: string;
  coverage: string;
  notes: string;
  dnsServers?: string[]; // For DNSTT/UDP53
}

// ============================================================================
// VIVO - Largest Brazilian carrier
// ============================================================================

const VIVO_SNIS: SNIConfig[] = [
  {
    domain: 'portalrecarga.vivo.com.br',
    description: 'Official Vivo recharge portal',
    priority: 10,
    payloads: [
      {
        method: 'http',
        host: 'portalrecarga.vivo.com.br',
        path: '/',
      },
      {
        method: 'tls',
        fragment: {
          packets: '1-3',
          length: '10-20',
        },
      },
      {
        method: 'websocket',
        host: 'portalrecarga.vivo.com.br',
        path: '/ws',
      },
      {
        method: 'dnstt',
        dnsServer: 'dns.vivo.com.br',
      },
      {
        method: 'udp53',
        port: 53,
      },
    ],
    successRate: 95,
    keepAliveInterval: 20,
    autoFallback: true,
  },
  {
    domain: 'vivo.com.br',
    description: 'Vivo main domain',
    priority: 9,
    payloads: [
      {
        method: 'http',
        host: 'vivo.com.br',
        path: '/',
      },
      {
        method: 'tls',
      },
      {
        method: 'dnstt',
        dnsServer: 'dns.vivo.com.br',
      },
    ],
    successRate: 88,
    keepAliveInterval: 20,
    autoFallback: true,
  },
  {
    domain: 'meuvivo.vivo.com.br',
    description: 'Vivo My Account portal',
    priority: 8,
    payloads: [
      {
        method: 'http',
        host: 'meuvivo.vivo.com.br',
        path: '/',
      },
      {
        method: 'tls',
      },
      {
        method: 'udp53',
        port: 53,
      },
    ],
    successRate: 82,
    keepAliveInterval: 20,
    autoFallback: true,
  },
  {
    domain: 'telefonica.com.br',
    description: 'Telefonica main domain',
    priority: 7,
    payloads: [
      {
        method: 'http',
      },
      {
        method: 'dnstt',
      },
    ],
    successRate: 75,
    keepAliveInterval: 25,
    autoFallback: true,
  },
];

const VIVO_SERVERS: ServerConfig[] = [
  {
    id: 'vivo-sp-01',
    name: 'São Paulo 01',
    address: 'sp01.vivo.example.com',
    port: 443,
    protocol: 'vless',
    uuid: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    network: 'ws',
    tls: true,
    region: 'Southeast',
    country: 'BR',
    flag: '🇧🇷',
    latency: 5,
    load: 45,
    bandwidth: '1Gbps',
    uptime: 99.9,
    keepAliveEnabled: true,
    captivePortalBypass: true,
  },
  {
    id: 'vivo-rj-01',
    name: 'Rio de Janeiro 01',
    address: 'rj01.vivo.example.com',
    port: 443,
    protocol: 'vless',
    uuid: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    network: 'ws',
    tls: true,
    region: 'Southeast',
    country: 'BR',
    flag: '🇧🇷',
    latency: 8,
    load: 52,
    bandwidth: '1Gbps',
    uptime: 99.8,
    keepAliveEnabled: true,
    captivePortalBypass: true,
  },
  {
    id: 'vivo-mg-01',
    name: 'Minas Gerais 01',
    address: 'mg01.vivo.example.com',
    port: 443,
    protocol: 'vless',
    uuid: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    network: 'ws',
    tls: true,
    region: 'Southeast',
    country: 'BR',
    flag: '🇧🇷',
    latency: 12,
    load: 38,
    bandwidth: '1Gbps',
    uptime: 99.7,
    keepAliveEnabled: true,
    captivePortalBypass: true,
  },
];

// ============================================================================
// CLARO - Second largest Brazilian carrier
// ============================================================================

const CLARO_SNIS: SNIConfig[] = [
  {
    domain: 'claro.com.br',
    description: 'Claro main domain',
    priority: 9,
    payloads: [
      {
        method: 'http',
        host: 'claro.com.br',
        path: '/',
      },
      {
        method: 'tls',
      },
      {
        method: 'dnstt',
        dnsServer: 'dns.claro.com.br',
      },
      {
        method: 'udp53',
        port: 53,
      },
    ],
    successRate: 90,
    keepAliveInterval: 20,
    autoFallback: true,
  },
  {
    domain: 'meuclaro.claro.com.br',
    description: 'Claro My Account',
    priority: 8,
    payloads: [
      {
        method: 'http',
      },
      {
        method: 'tls',
      },
      {
        method: 'dnstt',
      },
    ],
    successRate: 85,
    keepAliveInterval: 20,
    autoFallback: true,
  },
  {
    domain: 'recarga.claro.com.br',
    description: 'Claro recharge portal',
    priority: 7,
    payloads: [
      {
        method: 'http',
      },
      {
        method: 'udp53',
      },
    ],
    successRate: 78,
    keepAliveInterval: 25,
    autoFallback: true,
  },
];

const CLARO_SERVERS: ServerConfig[] = [
  {
    id: 'claro-sp-01',
    name: 'São Paulo 01',
    address: 'sp01.claro.example.com',
    port: 443,
    protocol: 'vless',
    uuid: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    network: 'ws',
    tls: true,
    region: 'Southeast',
    country: 'BR',
    flag: '🇧🇷',
    latency: 6,
    load: 48,
    bandwidth: '1Gbps',
    uptime: 99.8,
    keepAliveEnabled: true,
    captivePortalBypass: true,
  },
  {
    id: 'claro-ba-01',
    name: 'Bahia 01',
    address: 'ba01.claro.example.com',
    port: 443,
    protocol: 'vless',
    uuid: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    network: 'ws',
    tls: true,
    region: 'Northeast',
    country: 'BR',
    flag: '🇧🇷',
    latency: 15,
    load: 42,
    bandwidth: '1Gbps',
    uptime: 99.6,
    keepAliveEnabled: true,
    captivePortalBypass: true,
  },
];

// ============================================================================
// OI - Third largest carrier
// ============================================================================

const OI_SNIS: SNIConfig[] = [
  {
    domain: 'oi.com.br',
    description: 'Oi main domain',
    priority: 8,
    payloads: [
      {
        method: 'http',
      },
      {
        method: 'tls',
      },
      {
        method: 'dnstt',
      },
      {
        method: 'udp53',
      },
    ],
    successRate: 82,
    keepAliveInterval: 20,
    autoFallback: true,
  },
  {
    domain: 'meuoi.oi.com.br',
    description: 'Oi My Account',
    priority: 7,
    payloads: [
      {
        method: 'http',
      },
      {
        method: 'tls',
      },
    ],
    successRate: 75,
    keepAliveInterval: 25,
    autoFallback: true,
  },
];

const OI_SERVERS: ServerConfig[] = [
  {
    id: 'oi-sp-01',
    name: 'São Paulo 01',
    address: 'sp01.oi.example.com',
    port: 443,
    protocol: 'vless',
    uuid: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    network: 'ws',
    tls: true,
    region: 'Southeast',
    country: 'BR',
    flag: '🇧🇷',
    latency: 10,
    load: 55,
    bandwidth: '500Mbps',
    uptime: 99.5,
    keepAliveEnabled: true,
    captivePortalBypass: true,
  },
];

// ============================================================================
// TIM - Fourth largest carrier
// ============================================================================

const TIM_SNIS: SNIConfig[] = [
  {
    domain: 'tim.com.br',
    description: 'Tim main domain',
    priority: 8,
    payloads: [
      {
        method: 'http',
      },
      {
        method: 'tls',
      },
      {
        method: 'dnstt',
      },
      {
        method: 'udp53',
      },
    ],
    successRate: 80,
    keepAliveInterval: 20,
    autoFallback: true,
  },
  {
    domain: 'meutim.tim.com.br',
    description: 'Tim My Account',
    priority: 7,
    payloads: [
      {
        method: 'http',
      },
      {
        method: 'tls',
      },
    ],
    successRate: 73,
    keepAliveInterval: 25,
    autoFallback: true,
  },
];

const TIM_SERVERS: ServerConfig[] = [
  {
    id: 'tim-sp-01',
    name: 'São Paulo 01',
    address: 'sp01.tim.example.com',
    port: 443,
    protocol: 'vless',
    uuid: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    network: 'ws',
    tls: true,
    region: 'Southeast',
    country: 'BR',
    flag: '🇧🇷',
    latency: 9,
    load: 50,
    bandwidth: '500Mbps',
    uptime: 99.4,
    keepAliveEnabled: true,
    captivePortalBypass: true,
  },
];

// ============================================================================
// CARRIERS DATABASE
// ============================================================================

export const CARRIERS_DATABASE: CarrierConfig[] = [
  {
    id: 'vivo',
    name: 'Vivo',
    logo: '📱',
    color: '#E30613',
    snis: VIVO_SNIS,
    servers: VIVO_SERVERS,
    description: 'Vivo - Maior operadora do Brasil',
    coverage: 'Nacional',
    notes: 'Melhor cobertura e estabilidade',
    dnsServers: ['8.8.8.8', '1.1.1.1', 'dns.vivo.com.br'],
  },
  {
    id: 'claro',
    name: 'Claro',
    logo: '📡',
    color: '#EC1C24',
    snis: CLARO_SNIS,
    servers: CLARO_SERVERS,
    description: 'Claro - Segunda maior operadora',
    coverage: 'Nacional',
    notes: 'Boa cobertura em áreas urbanas',
    dnsServers: ['8.8.8.8', '1.1.1.1', 'dns.claro.com.br'],
  },
  {
    id: 'oi',
    name: 'Oi',
    logo: '🔵',
    color: '#0066CC',
    snis: OI_SNIS,
    servers: OI_SERVERS,
    description: 'Oi - Terceira maior operadora',
    coverage: 'Nacional',
    notes: 'Cobertura em áreas rurais',
    dnsServers: ['8.8.8.8', '1.1.1.1'],
  },
  {
    id: 'tim',
    name: 'Tim',
    logo: '🟣',
    color: '#6B2D5C',
    snis: TIM_SNIS,
    servers: TIM_SERVERS,
    description: 'Tim - Quarta maior operadora',
    coverage: 'Nacional',
    notes: 'Cobertura em regiões metropolitanas',
    dnsServers: ['8.8.8.8', '1.1.1.1'],
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getTopSNIs(carrierId: string, limit: number = 5): SNIConfig[] {
  const carrier = CARRIERS_DATABASE.find((c) => c.id === carrierId);
  if (!carrier) return [];

  return carrier.snis
    .sort((a, b) => (b.priority || 0) - (a.priority || 0))
    .slice(0, limit);
}

export function getSNIsByMethod(carrierId: string, method: PayloadMethod): SNIConfig[] {
  const carrier = CARRIERS_DATABASE.find((c) => c.id === carrierId);
  if (!carrier) return [];

  return carrier.snis.filter((sni) =>
    sni.payloads.some((p) => p.method === method)
  );
}

export function getCarrierDNSServers(carrierId: string): string[] {
  const carrier = CARRIERS_DATABASE.find((c) => c.id === carrierId);
  return carrier?.dnsServers || ['8.8.8.8', '1.1.1.1'];
}

export function getRecommendedSNI(carrierId: string): SNIConfig | undefined {
  const snis = getTopSNIs(carrierId, 1);
  return snis[0];
}

export function getSNIWithAutoFallback(carrierId: string): SNIConfig[] {
  const carrier = CARRIERS_DATABASE.find((c) => c.id === carrierId);
  if (!carrier) return [];

  return carrier.snis.filter((sni) => sni.autoFallback === true);
}
