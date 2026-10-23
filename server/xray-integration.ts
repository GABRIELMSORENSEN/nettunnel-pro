import { z } from 'zod';
import axios, { AxiosInstance } from 'axios';

/**
 * Xray Real Server Integration
 * Conecta com servidor Xray real para validação de configurações
 */

export interface XrayServerConfig {
  url: string; // http://xray-server:10085
  apiKey?: string;
  timeout?: number;
}

export interface XrayConnectionTest {
  serverId: string;
  protocol: string;
  sni: string;
  latency: number;
  isHealthy: boolean;
  bandwidth?: number;
  error?: string;
  timestamp: Date;
}

export interface XrayStats {
  uptime: number;
  connections: number;
  bytesIn: number;
  bytesOut: number;
  traffic: {
    inbound: number;
    outbound: number;
  };
}

export class XrayIntegration {
  private client: AxiosInstance;
  private config: XrayServerConfig;

  constructor(config: XrayServerConfig) {
    this.config = {
      timeout: 30000,
      ...config,
    };

    this.client = axios.create({
      baseURL: this.config.url,
      timeout: this.config.timeout,
      headers: this.config.apiKey
        ? { Authorization: `Bearer ${this.config.apiKey}` }
        : {},
    });
  }

  /**
   * Testar conexão com servidor Xray
   */
  async testConnection(
    protocol: string,
    serverAddress: string,
    serverPort: number,
    sni: string
  ): Promise<XrayConnectionTest> {
    const startTime = Date.now();

    try {
      // Fazer requisição HTTP através do servidor Xray
      const response = await this.client.get('http://www.gstatic.com/generate_204', {
        headers: {
          Host: sni,
        },
        timeout: 10000,
      });

      const latency = Date.now() - startTime;

      return {
        serverId: `${serverAddress}:${serverPort}`,
        protocol,
        sni,
        latency,
        isHealthy: response.status === 204 || response.status === 200,
        timestamp: new Date(),
      };
    } catch (error) {
      const latency = Date.now() - startTime;

      return {
        serverId: `${serverAddress}:${serverPort}`,
        protocol,
        sni,
        latency,
        isHealthy: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Testar múltiplas conexões em paralelo
   */
  async testMultipleConnections(
    connections: Array<{
      protocol: string;
      serverAddress: string;
      serverPort: number;
      sni: string;
    }>,
    concurrency: number = 3
  ): Promise<XrayConnectionTest[]> {
    const results: XrayConnectionTest[] = [];
    const queue = [...connections];

    while (queue.length > 0) {
      const batch = queue.splice(0, concurrency);
      const batchResults = await Promise.all(
        batch.map((conn) =>
          this.testConnection(
            conn.protocol,
            conn.serverAddress,
            conn.serverPort,
            conn.sni
          )
        )
      );
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Obter estatísticas do servidor Xray
   */
  async getStats(): Promise<XrayStats> {
    try {
      const response = await this.client.get('/api/stats');

      return {
        uptime: response.data.uptime || 0,
        connections: response.data.connections || 0,
        bytesIn: response.data.bytesIn || 0,
        bytesOut: response.data.bytesOut || 0,
        traffic: {
          inbound: response.data.traffic?.inbound || 0,
          outbound: response.data.traffic?.outbound || 0,
        },
      };
    } catch (error) {
      throw new Error(`Failed to get Xray stats: ${error}`);
    }
  }

  /**
   * Verificar saúde do servidor Xray
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/api/health', {
        timeout: 5000,
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  /**
   * Medir velocidade de download através do Xray
   */
  async measureBandwidth(
    url: string = 'http://speedtest.ftp.otenet.gr/files/test10Mb.db',
    duration: number = 5000
  ): Promise<number> {
    const startTime = Date.now();
    let bytesDownloaded = 0;

    try {
      const response = await this.client.get(url, {
        responseType: 'stream',
        timeout: duration + 1000,
      });

      return new Promise((resolve, reject) => {
        response.data.on('data', (chunk: Buffer) => {
          bytesDownloaded += chunk.length;
        });

        response.data.on('end', () => {
          const elapsedSeconds = (Date.now() - startTime) / 1000;
          const mbps = (bytesDownloaded * 8) / (elapsedSeconds * 1000000);
          resolve(mbps);
        });

        response.data.on('error', (error: Error) => {
          reject(error);
        });

        setTimeout(() => {
          response.data.destroy();
          const elapsedSeconds = (Date.now() - startTime) / 1000;
          const mbps = (bytesDownloaded * 8) / (elapsedSeconds * 1000000);
          resolve(mbps);
        }, duration);
      });
    } catch (error) {
      throw new Error(`Failed to measure bandwidth: ${error}`);
    }
  }

  /**
   * Testar SNI específico
   */
  async testSNI(
    sni: string,
    serverAddress: string,
    serverPort: number
  ): Promise<{
    sni: string;
    isAccessible: boolean;
    latency: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      const response = await this.client.get('http://www.gstatic.com/generate_204', {
        headers: {
          Host: sni,
        },
        timeout: 10000,
      });

      return {
        sni,
        isAccessible: response.status === 204 || response.status === 200,
        latency: Date.now() - startTime,
      };
    } catch (error) {
      return {
        sni,
        isAccessible: false,
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Testar múltiplos SNIs
   */
  async testMultipleSNIs(
    snis: string[],
    serverAddress: string,
    serverPort: number
  ): Promise<
    Array<{
      sni: string;
      isAccessible: boolean;
      latency: number;
      error?: string;
    }>
  > {
    return Promise.all(
      snis.map((sni) => this.testSNI(sni, serverAddress, serverPort))
    );
  }

  /**
   * Encontrar melhor SNI
   */
  async findBestSNI(
    snis: string[],
    serverAddress: string,
    serverPort: number
  ): Promise<{
    bestSNI: string | null;
    results: Array<{
      sni: string;
      isAccessible: boolean;
      latency: number;
      error?: string;
    }>;
  }> {
    const results = await this.testMultipleSNIs(snis, serverAddress, serverPort);

    const accessibleResults = results.filter((r) => r.isAccessible);

    if (accessibleResults.length === 0) {
      return {
        bestSNI: null,
        results,
      };
    }

    const bestSNI = accessibleResults.reduce((best, current) =>
      current.latency < best.latency ? current : best
    );

    return {
      bestSNI: bestSNI.sni,
      results,
    };
  }

  /**
   * Monitorar conexão em tempo real
   */
  async monitorConnection(
    protocol: string,
    serverAddress: string,
    serverPort: number,
    sni: string,
    interval: number = 5000,
    duration: number = 60000
  ): Promise<XrayConnectionTest[]> {
    const results: XrayConnectionTest[] = [];
    const startTime = Date.now();

    while (Date.now() - startTime < duration) {
      const result = await this.testConnection(
        protocol,
        serverAddress,
        serverPort,
        sni
      );
      results.push(result);

      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    return results;
  }

  /**
   * Calcular estatísticas de conexão
   */
  calculateStats(results: XrayConnectionTest[]) {
    if (results.length === 0) {
      return {
        totalTests: 0,
        successfulTests: 0,
        failedTests: 0,
        successRate: 0,
        averageLatency: 0,
        minLatency: 0,
        maxLatency: 0,
      };
    }

    const successful = results.filter((r) => r.isHealthy);
    const latencies = successful.map((r) => r.latency);

    return {
      totalTests: results.length,
      successfulTests: successful.length,
      failedTests: results.length - successful.length,
      successRate: (successful.length / results.length) * 100,
      averageLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length,
      minLatency: Math.min(...latencies),
      maxLatency: Math.max(...latencies),
    };
  }
}

/**
 * Criar instância singleton do Xray Integration
 */
let xrayInstance: XrayIntegration | null = null;

export function initializeXrayIntegration(config: XrayServerConfig): XrayIntegration {
  xrayInstance = new XrayIntegration(config);
  return xrayInstance;
}

export function getXrayIntegration(): XrayIntegration {
  if (!xrayInstance) {
    throw new Error(
      'Xray Integration not initialized. Call initializeXrayIntegration first.'
    );
  }
  return xrayInstance;
}
