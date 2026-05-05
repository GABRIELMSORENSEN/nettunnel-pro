/**
 * Carriers Database
 * 
 * Comprehensive database of Brazilian carriers with multiple SNI configurations,
 * payload methods, and connection parameters for zero-rating and DPI bypass.
 */

export type ConnectionMethod = 'vless' | 'vmess' | 'trojan' | 'ss' | 'ssr';
export type PayloadMethod = 'http' | 'tls' | 'websocket' | 'fragment' | 'mixed';
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
}

export interface SNIConfig {
  domain: string;
  description: string;
  payloads: PayloadConfig[];
  priority: number; // 1-10, higher = better
  lastTested?: Date;
  successRate?: number; // 0-100
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
  network: 'ws' | 'tcp' | 'kcp' | 'quic';
  tls: boolean;
  region: string;
  country: string;
  flag: string;
  latency: number;
  load: number;
  bandwidth: string;
  uptime: number; // percentage
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
    ],
    successRate: 95,
  },
  {
    domain: 'vivo.com.br',
    description: 'Vivo main domain',
    priority: 9,
    payloads: [
      {
        method: 'http',
        host: 'vivo.com.br',
      },
      {
        method: 'fragment',
        fragment: {
          packets: '2-4',
          length: '15-25',
        },
      },
    ],
    successRate: 88,
  },
  {
    domain: 'meusvivo.vivo.com.br',
    description: 'Vivo app portal',
    priority: 8,
    payloads: [
      {
        method: 'tls',
        fragment: {
          packets: '1-2',
          length: '20-30',
        },
      },
    ],
    successRate: 82,
  },
  {
    domain: 'api.vivo.com.br',
    description: 'Vivo API endpoint',
    priority: 7,
    payloads: [
      {
        method: 'websocket',
        host: 'api.vivo.com.br',
        path: '/api/v1',
      },
    ],
    successRate: 75,
  },
];

const VIVO_SERVERS: ServerConfig[] = [
  {
    id: 'vivo-sp-01',
    name: 'São Paulo 01',
    address: 'vivo-sp-01.example.com',
    port: 443,
    protocol: 'vless',
    uuid: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    encryption: 'none',
    network: 'ws',
    tls: true,
    region: 'Southeast',
    country: 'Brazil',
    flag: '🇧🇷',
    latency: 5,
    load: 45,
    bandwidth: '1Gbps',
    uptime: 99.9,
  },
  {
    id: 'vivo-rj-01',
    name: 'Rio de Janeiro 01',
    address: 'vivo-rj-01.example.com',
    port: 443,
    protocol: 'vless',
    uuid: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    encryption: 'none',
    network: 'ws',
    tls: true,
    region: 'Southeast',
    country: 'Brazil',
    flag: '🇧🇷',
    latency: 12,
    load: 32,
    bandwidth: '1Gbps',
    uptime: 99.8,
  },
  {
    id: 'vivo-mg-01',
    name: 'Minas Gerais 01',
    address: 'vivo-mg-01.example.com',
    port: 443,
    protocol: 'vmess',
    uuid: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    encryption: 'auto',
    network: 'tcp',
    tls: true,
    region: 'Southeast',
    country: 'Brazil',
    flag: '🇧🇷',
    latency: 18,
    load: 28,
    bandwidth: '500Mbps',
    uptime: 99.7,
  },
];

// ============================================================================
// CLARO - Second largest Brazilian carrier
// ============================================================================

const CLARO_SNIS: SNIConfig[] = [
  {
    domain: 'claro.com.br',
    description: 'Official Claro domain',
    priority: 10,
    payloads: [
      {
        method: 'http',
        host: 'claro.com.br',
      },
      {
        method: 'tls',
        fragment: {
          packets: '1-3',
          length: '10-20',
        },
      },
    ],
    successRate: 92,
  },
  {
    domain: 'meuclaro.claro.com.br',
    description: 'Claro app portal',
    priority: 9,
    payloads: [
      {
        method: 'websocket',
        host: 'meuclaro.claro.com.br',
        path: '/app',
      },
    ],
    successRate: 88,
  },
  {
    domain: 'api.claro.com.br',
    description: 'Claro API',
    priority: 8,
    payloads: [
      {
        method: 'tls',
        fragment: {
          packets: '2-4',
          length: '15-25',
        },
      },
    ],
    successRate: 85,
  },
  {
    domain: 'recarga.claro.com.br',
    description: 'Claro recharge',
    priority: 7,
    payloads: [
      {
        method: 'http',
        host: 'recarga.claro.com.br',
      },
    ],
    successRate: 80,
  },
];

const CLARO_SERVERS: ServerConfig[] = [
  {
    id: 'claro-sp-01',
    name: 'São Paulo 01',
    address: 'claro-sp-01.example.com',
    port: 443,
    protocol: 'vless',
    uuid: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    encryption: 'none',
    network: 'ws',
    tls: true,
    region: 'Southeast',
    country: 'Brazil',
    flag: '🇧🇷',
    latency: 8,
    load: 52,
    bandwidth: '1Gbps',
    uptime: 99.8,
  },
  {
    id: 'claro-ba-01',
    name: 'Bahia 01',
    address: 'claro-ba-01.example.com',
    port: 443,
    protocol: 'trojan',
    password: 'password-here',
    network: 'tcp',
    tls: true,
    region: 'Northeast',
    country: 'Brazil',
    flag: '🇧🇷',
    latency: 22,
    load: 38,
    bandwidth: '500Mbps',
    uptime: 99.6,
  },
  {
    id: 'claro-rs-01',
    name: 'Rio Grande do Sul 01',
    address: 'claro-rs-01.example.com',
    port: 443,
    protocol: 'vmess',
    uuid: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    encryption: 'auto',
    network: 'ws',
    tls: true,
    region: 'South',
    country: 'Brazil',
    flag: '🇧🇷',
    latency: 25,
    load: 35,
    bandwidth: '500Mbps',
    uptime: 99.5,
  },
];

// ============================================================================
// OI - Third largest carrier
// ============================================================================

const OI_SNIS: SNIConfig[] = [
  {
    domain: 'oi.com.br',
    description: 'Official Oi domain',
    priority: 10,
    payloads: [
      {
        method: 'http',
        host: 'oi.com.br',
      },
      {
        method: 'fragment',
        fragment: {
          packets: '1-3',
          length: '10-20',
        },
      },
    ],
    successRate: 90,
  },
  {
    domain: 'meuoi.oi.com.br',
    description: 'Oi app portal',
    priority: 9,
    payloads: [
      {
        method: 'websocket',
        host: 'meuoi.oi.com.br',
      },
    ],
    successRate: 85,
  },
  {
    domain: 'recarga.oi.com.br',
    description: 'Oi recharge',
    priority: 8,
    payloads: [
      {
        method: 'tls',
        fragment: {
          packets: '2-4',
          length: '15-25',
        },
      },
    ],
    successRate: 82,
  },
];

const OI_SERVERS: ServerConfig[] = [
  {
    id: 'oi-sp-01',
    name: 'São Paulo 01',
    address: 'oi-sp-01.example.com',
    port: 443,
    protocol: 'vless',
    uuid: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    encryption: 'none',
    network: 'ws',
    tls: true,
    region: 'Southeast',
    country: 'Brazil',
    flag: '🇧🇷',
    latency: 15,
    load: 42,
    bandwidth: '500Mbps',
    uptime: 99.4,
  },
  {
    id: 'oi-rj-01',
    name: 'Rio de Janeiro 01',
    address: 'oi-rj-01.example.com',
    port: 443,
    protocol: 'trojan',
    password: 'password-here',
    network: 'tcp',
    tls: true,
    region: 'Southeast',
    country: 'Brazil',
    flag: '🇧🇷',
    latency: 18,
    load: 38,
    bandwidth: '500Mbps',
    uptime: 99.3,
  },
];

// ============================================================================
// TIM - Fourth carrier
// ============================================================================

const TIM_SNIS: SNIConfig[] = [
  {
    domain: 'tim.com.br',
    description: 'Official Tim domain',
    priority: 10,
    payloads: [
      {
        method: 'http',
        host: 'tim.com.br',
      },
    ],
    successRate: 88,
  },
  {
    domain: 'meutim.tim.com.br',
    description: 'Tim app',
    priority: 9,
    payloads: [
      {
        method: 'websocket',
        host: 'meutim.tim.com.br',
      },
    ],
    successRate: 84,
  },
];

const TIM_SERVERS: ServerConfig[] = [
  {
    id: 'tim-sp-01',
    name: 'São Paulo 01',
    address: 'tim-sp-01.example.com',
    port: 443,
    protocol: 'vless',
    uuid: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    encryption: 'none',
    network: 'ws',
    tls: true,
    region: 'Southeast',
    country: 'Brazil',
    flag: '🇧🇷',
    latency: 10,
    load: 48,
    bandwidth: '500Mbps',
    uptime: 99.2,
  },
];

// ============================================================================
// Master Carriers Database
// ============================================================================

export const CARRIERS_DATABASE: CarrierConfig[] = [
  {
    id: 'vivo',
    name: 'Vivo',
    logo: '📱',
    color: '#E70E0E',
    snis: VIVO_SNIS,
    servers: VIVO_SERVERS,
    description: 'Largest Brazilian carrier with excellent coverage',
    coverage: 'National',
    notes: 'Best zero-rating support, multiple SNI options',
  },
  {
    id: 'claro',
    name: 'Claro',
    logo: '📡',
    color: '#FF0000',
    snis: CLARO_SNIS,
    servers: CLARO_SERVERS,
    description: 'Second largest carrier with good infrastructure',
    coverage: 'National',
    notes: 'Stable connections, good latency',
  },
  {
    id: 'oi',
    name: 'Oi',
    logo: '🔵',
    color: '#0066CC',
    snis: OI_SNIS,
    servers: OI_SERVERS,
    description: 'Third largest carrier',
    coverage: 'National',
    notes: 'Moderate performance, regional variations',
  },
  {
    id: 'tim',
    name: 'Tim',
    logo: '⚪',
    color: '#FF6600',
    snis: TIM_SNIS,
    servers: TIM_SERVERS,
    description: 'Fourth carrier',
    coverage: 'National',
    notes: 'Good coverage in urban areas',
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

export function getCarrierById(carrierId: string): CarrierConfig | undefined {
  return CARRIERS_DATABASE.find((c) => c.id === carrierId);
}

export function getServerById(carrierId: string, serverId: string): ServerConfig | undefined {
  const carrier = getCarrierById(carrierId);
  return carrier?.servers.find((s) => s.id === serverId);
}

export function getSNIById(carrierId: string, sniIndex: number): SNIConfig | undefined {
  const carrier = getCarrierById(carrierId);
  return carrier?.snis[sniIndex];
}

export function getTopSNIs(carrierId: string, limit: number = 3): SNIConfig[] {
  const carrier = getCarrierById(carrierId);
  if (!carrier) return [];
  return carrier.snis.sort((a, b) => b.priority - a.priority).slice(0, limit);
}

export function getServersByRegion(carrierId: string, region: string): ServerConfig[] {
  const carrier = getCarrierById(carrierId);
  if (!carrier) return [];
  return carrier.servers.filter((s) => s.region === region);
}

export function getAllServers(): ServerConfig[] {
  return CARRIERS_DATABASE.flatMap((c) => c.servers);
}

export function getAllSNIs(): SNIConfig[] {
  return CARRIERS_DATABASE.flatMap((c) => c.snis);
}
