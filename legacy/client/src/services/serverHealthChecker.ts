/**
 * Server Health Checker & Auto-Correction Service
 * 
 * Monitora a saúde dos servidores VPN em tempo real e se auto-corrige
 * quando detecta conexões caindo ou servidores offline.
 */

import { ServerConfig } from '@/lib/carriers-database';

export interface ServerHealth {
  serverId: string;
  isOnline: boolean;
  latency: number;
  lastChecked: Date;
  consecutiveFailures: number;
  successRate: number; // 0-100
  bandwidth: number; // Mbps
  isRecommended: boolean;
}

export interface HealthCheckResult {
  healthy: boolean;
  latency: number;
  error?: string;
}

class ServerHealthChecker {
  private healthCache: Map<string, ServerHealth> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 segundos
  private readonly LATENCY_THRESHOLD = 5000; // 5 segundos
  private readonly FAILURE_THRESHOLD = 3; // 3 falhas consecutivas
  private listeners: ((health: Map<string, ServerHealth>) => void)[] = [];

  /**
   * Inicia o monitoramento contínuo de saúde dos servidores
   */
  startHealthChecking(servers: ServerConfig[]): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Inicializar cache com todos os servidores
    servers.forEach(server => {
      if (!this.healthCache.has(server.id)) {
        this.healthCache.set(server.id, {
          serverId: server.id,
          isOnline: true,
          latency: server.latency || 0,
          lastChecked: new Date(),
          consecutiveFailures: 0,
          successRate: 100,
          bandwidth: 0,
          isRecommended: false,
        });
      }
    });

    // Executar verificação inicial
    this.checkAllServers(servers);

    // Configurar verificação periódica
    this.checkInterval = setInterval(() => {
      this.checkAllServers(servers);
    }, this.HEALTH_CHECK_INTERVAL);
  }

  /**
   * Para o monitoramento de saúde
   */
  stopHealthChecking(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Verifica a saúde de todos os servidores
   */
  private async checkAllServers(servers: ServerConfig[]): Promise<void> {
    const checks = servers.map(server => this.checkServerHealth(server));
    await Promise.all(checks);
    this.notifyListeners();
  }

  /**
   * Verifica a saúde de um servidor específico
   */
  async checkServerHealth(server: ServerConfig): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Simular verificação de conectividade (em produção, seria um ping real)
      const result = await this.performHealthCheck(server);
      const latency = Date.now() - startTime;

      const health = this.healthCache.get(server.id) || {
        serverId: server.id,
        isOnline: true,
        latency: 0,
        lastChecked: new Date(),
        consecutiveFailures: 0,
        successRate: 100,
        bandwidth: 0,
        isRecommended: false,
      };

      if (result.healthy) {
        // Servidor está online
        health.isOnline = true;
        health.latency = latency;
        health.lastChecked = new Date();
        health.consecutiveFailures = 0;
        health.successRate = Math.min(100, health.successRate + 5);
        health.bandwidth = this.calculateBandwidth(latency);
        health.isRecommended = latency < 100 && health.successRate > 95;
      } else {
        // Servidor está offline ou lento
        health.consecutiveFailures++;
        health.successRate = Math.max(0, health.successRate - 10);
        health.lastChecked = new Date();

        if (health.consecutiveFailures >= this.FAILURE_THRESHOLD) {
          health.isOnline = false;
          health.isRecommended = false;
        }
      }

      this.healthCache.set(server.id, health);
      return result;
    } catch (error) {
      const health = this.healthCache.get(server.id) || {
        serverId: server.id,
        isOnline: false,
        latency: this.LATENCY_THRESHOLD,
        lastChecked: new Date(),
        consecutiveFailures: 0,
        successRate: 0,
        bandwidth: 0,
        isRecommended: false,
      };

      health.consecutiveFailures++;
      health.successRate = Math.max(0, health.successRate - 20);

      if (health.consecutiveFailures >= this.FAILURE_THRESHOLD) {
        health.isOnline = false;
        health.isRecommended = false;
      }

      this.healthCache.set(server.id, health);
      return {
        healthy: false,
        latency: this.LATENCY_THRESHOLD,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Realiza a verificação de saúde do servidor
   */
  private async performHealthCheck(server: ServerConfig): Promise<HealthCheckResult> {
    // Em produção, isso seria um ping real ou teste de conexão
    // Por enquanto, simulamos com base na latência conhecida
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve({
          healthy: false,
          latency: this.LATENCY_THRESHOLD,
          error: 'Health check timeout',
        });
      }, 5000);

      // Simular latência variável
      const simulatedLatency = server.latency + Math.random() * 50 - 25;
      const isHealthy = simulatedLatency < this.LATENCY_THRESHOLD;

      setTimeout(() => {
        clearTimeout(timeout);
        resolve({
          healthy: isHealthy,
          latency: Math.max(0, simulatedLatency),
        });
      }, simulatedLatency);
    });
  }

  /**
   * Calcula a largura de banda baseada na latência
   */
  private calculateBandwidth(latency: number): number {
    // Estimativa simplificada: menor latência = maior bandwidth
    if (latency < 50) return 100;
    if (latency < 100) return 80;
    if (latency < 200) return 50;
    return 20;
  }

  /**
   * Obtém o servidor mais saudável para auto-correção
   */
  getHealthiestServer(servers: ServerConfig[]): ServerConfig | null {
    let healthiestServer: ServerConfig | null = null;
    let bestScore = -1;

    servers.forEach(server => {
      const health = this.healthCache.get(server.id);
      if (!health) return;

      // Calcular score: servidores online com menor latência e maior taxa de sucesso
      const score = (health.isOnline ? 100 : 0) + 
                   (100 - health.latency / 10) + 
                   (health.successRate * 2);

      if (score > bestScore) {
        bestScore = score;
        healthiestServer = server;
      }
    });

    return healthiestServer;
  }

  /**
   * Obtém servidores recomendados (online e com boa saúde)
   */
  getRecommendedServers(servers: ServerConfig[]): ServerConfig[] {
    return servers.filter(server => {
      const health = this.healthCache.get(server.id);
      return health && health.isOnline && health.isRecommended;
    });
  }

  /**
   * Obtém todos os servidores online
   */
  getOnlineServers(servers: ServerConfig[]): ServerConfig[] {
    return servers.filter(server => {
      const health = this.healthCache.get(server.id);
      return health && health.isOnline;
    });
  }

  /**
   * Obtém a saúde de um servidor específico
   */
  getServerHealth(serverId: string): ServerHealth | undefined {
    return this.healthCache.get(serverId);
  }

  /**
   * Obtém todas as informações de saúde
   */
  getAllHealth(): Map<string, ServerHealth> {
    return new Map(this.healthCache);
  }

  /**
   * Registra um listener para mudanças de saúde
   */
  onHealthChange(callback: (health: Map<string, ServerHealth>) => void): void {
    this.listeners.push(callback);
  }

  /**
   * Remove um listener
   */
  offHealthChange(callback: (health: Map<string, ServerHealth>) => void): void {
    this.listeners = this.listeners.filter(l => l !== callback);
  }

  /**
   * Notifica todos os listeners sobre mudanças
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      listener(this.getAllHealth());
    });
  }

  /**
   * Auto-corrige a conexão se o servidor atual estiver offline
   */
  async autoCorrectConnection(
    currentServer: ServerConfig | null,
    availableServers: ServerConfig[]
  ): Promise<ServerConfig | null> {
    // Se não há servidor atual, retornar o mais saudável
    if (!currentServer) {
      return this.getHealthiestServer(availableServers);
    }

    const currentHealth = this.healthCache.get(currentServer.id);
    
    // Se o servidor atual está saudável, manter
    if (currentHealth && currentHealth.isOnline && currentHealth.successRate > 80) {
      return currentServer;
    }

    // Servidor atual está com problema, encontrar alternativa
    const healthierServer = this.getHealthiestServer(availableServers);
    
    if (healthierServer && healthierServer.id !== currentServer.id) {
      console.log(`[AutoCorrect] Mudando de ${currentServer.name} para ${healthierServer.name}`);
      return healthierServer;
    }

    return currentServer;
  }

  /**
   * Reseta a saúde de um servidor (útil após manual fix)
   */
  resetServerHealth(serverId: string): void {
    const health = this.healthCache.get(serverId);
    if (health) {
      health.consecutiveFailures = 0;
      health.successRate = 100;
      health.isOnline = true;
      this.notifyListeners();
    }
  }
}

// Exportar singleton
export const serverHealthChecker = new ServerHealthChecker();
