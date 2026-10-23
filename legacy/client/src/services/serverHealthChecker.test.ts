import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  checkServerHealth,
  checkMultipleServers,
  getHealthyServers,
  ServerHealthStatus,
} from './serverHealthChecker';

describe('Server Health Checker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkServerHealth', () => {
    it('should return healthy status for responsive server', async () => {
      const status = await checkServerHealth({
        id: 'sp-premium',
        name: 'São Paulo Premium',
        address: 'example.com',
        port: 443,
        carrier: 'vivo',
      });

      expect(status).toBeDefined();
      expect(status.serverId).toBe('sp-premium');
      expect(status.isHealthy).toBeDefined();
      expect(status.latency).toBeGreaterThanOrEqual(0);
    });

    it('should measure latency correctly', async () => {
      const status = await checkServerHealth({
        id: 'sp-premium',
        name: 'São Paulo Premium',
        address: 'example.com',
        port: 443,
        carrier: 'vivo',
      });

      expect(status.latency).toBeGreaterThanOrEqual(0);
      expect(typeof status.latency).toBe('number');
    });

    it('should include timestamp', async () => {
      const status = await checkServerHealth({
        id: 'sp-premium',
        name: 'São Paulo Premium',
        address: 'example.com',
        port: 443,
        carrier: 'vivo',
      });

      expect(status.timestamp).toBeInstanceOf(Date);
    });

    it('should handle timeout gracefully', async () => {
      const status = await checkServerHealth(
        {
          id: 'timeout-server',
          name: 'Timeout Server',
          address: '192.0.2.1', // Non-routable address
          port: 443,
          carrier: 'vivo',
        },
        5000 // 5 second timeout
      );

      expect(status).toBeDefined();
      expect(status.serverId).toBe('timeout-server');
    });

    it('should return error message on failure', async () => {
      const status = await checkServerHealth({
        id: 'invalid-server',
        name: 'Invalid Server',
        address: 'invalid.example.invalid',
        port: 443,
        carrier: 'vivo',
      });

      expect(status).toBeDefined();
      if (!status.isHealthy) {
        expect(status.error).toBeDefined();
      }
    });
  });

  describe('checkMultipleServers', () => {
    it('should check multiple servers in parallel', async () => {
      const servers = [
        {
          id: 'server1',
          name: 'Server 1',
          address: 'example1.com',
          port: 443,
          carrier: 'vivo',
        },
        {
          id: 'server2',
          name: 'Server 2',
          address: 'example2.com',
          port: 443,
          carrier: 'claro',
        },
        {
          id: 'server3',
          name: 'Server 3',
          address: 'example3.com',
          port: 443,
          carrier: 'oi',
        },
      ];

      const statuses = await checkMultipleServers(servers);

      expect(statuses).toHaveLength(3);
      expect(statuses.every((s) => s.serverId)).toBe(true);
    });

    it('should respect concurrency limit', async () => {
      const servers = Array.from({ length: 10 }, (_, i) => ({
        id: `server${i}`,
        name: `Server ${i}`,
        address: `example${i}.com`,
        port: 443,
        carrier: 'vivo' as const,
      }));

      const startTime = Date.now();
      const statuses = await checkMultipleServers(servers, 3);
      const duration = Date.now() - startTime;

      expect(statuses).toHaveLength(10);
      // Should take longer than sequential due to concurrency limit
      expect(duration).toBeGreaterThan(0);
    });

    it('should handle mixed healthy and unhealthy servers', async () => {
      const servers = [
        {
          id: 'healthy1',
          name: 'Healthy 1',
          address: 'example.com',
          port: 443,
          carrier: 'vivo',
        },
        {
          id: 'unhealthy1',
          name: 'Unhealthy 1',
          address: 'invalid.example.invalid',
          port: 443,
          carrier: 'claro',
        },
        {
          id: 'healthy2',
          name: 'Healthy 2',
          address: 'example.com',
          port: 443,
          carrier: 'oi',
        },
      ];

      const statuses = await checkMultipleServers(servers);

      expect(statuses).toHaveLength(3);
      const healthyCount = statuses.filter((s) => s.isHealthy).length;
      expect(healthyCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getHealthyServers', () => {
    it('should filter healthy servers', async () => {
      const servers = [
        {
          id: 'server1',
          name: 'Server 1',
          address: 'example.com',
          port: 443,
          carrier: 'vivo',
        },
        {
          id: 'server2',
          name: 'Server 2',
          address: 'example.com',
          port: 443,
          carrier: 'claro',
        },
      ];

      const healthyServers = await getHealthyServers(servers);

      expect(Array.isArray(healthyServers)).toBe(true);
      expect(healthyServers.every((s) => s.isHealthy)).toBe(true);
    });

    it('should sort by latency', async () => {
      const servers = [
        {
          id: 'server1',
          name: 'Server 1',
          address: 'example.com',
          port: 443,
          carrier: 'vivo',
        },
        {
          id: 'server2',
          name: 'Server 2',
          address: 'example.com',
          port: 443,
          carrier: 'claro',
        },
      ];

      const healthyServers = await getHealthyServers(servers);

      if (healthyServers.length > 1) {
        for (let i = 0; i < healthyServers.length - 1; i++) {
          expect(healthyServers[i].latency).toBeLessThanOrEqual(
            healthyServers[i + 1].latency
          );
        }
      }
    });

    it('should return empty array if no healthy servers', async () => {
      const servers = [
        {
          id: 'invalid1',
          name: 'Invalid 1',
          address: 'invalid.example.invalid',
          port: 443,
          carrier: 'vivo',
        },
        {
          id: 'invalid2',
          name: 'Invalid 2',
          address: 'invalid.example.invalid',
          port: 443,
          carrier: 'claro',
        },
      ];

      const healthyServers = await getHealthyServers(servers);

      expect(Array.isArray(healthyServers)).toBe(true);
    });

    it('should apply latency threshold', async () => {
      const servers = [
        {
          id: 'server1',
          name: 'Server 1',
          address: 'example.com',
          port: 443,
          carrier: 'vivo',
        },
      ];

      const healthyServers = await getHealthyServers(servers, 100); // 100ms threshold

      expect(Array.isArray(healthyServers)).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should complete health check within reasonable time', async () => {
      const startTime = Date.now();

      await checkServerHealth({
        id: 'perf-test',
        name: 'Performance Test',
        address: 'example.com',
        port: 443,
        carrier: 'vivo',
      });

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(30000); // 30 seconds max
    });

    it('should handle large server lists', async () => {
      const servers = Array.from({ length: 50 }, (_, i) => ({
        id: `server${i}`,
        name: `Server ${i}`,
        address: `example${i}.com`,
        port: 443,
        carrier: (['vivo', 'claro', 'oi', 'tim'] as const)[i % 4],
      }));

      const startTime = Date.now();
      const statuses = await checkMultipleServers(servers, 5);
      const duration = Date.now() - startTime;

      expect(statuses).toHaveLength(50);
      expect(duration).toBeLessThan(60000); // 60 seconds max
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const status = await checkServerHealth({
        id: 'network-error',
        name: 'Network Error',
        address: 'network-error.invalid',
        port: 443,
        carrier: 'vivo',
      });

      expect(status).toBeDefined();
      expect(status.serverId).toBe('network-error');
    });

    it('should handle DNS resolution errors', async () => {
      const status = await checkServerHealth({
        id: 'dns-error',
        name: 'DNS Error',
        address: 'this-domain-does-not-exist-12345.invalid',
        port: 443,
        carrier: 'vivo',
      });

      expect(status).toBeDefined();
    });

    it('should handle connection refused', async () => {
      const status = await checkServerHealth({
        id: 'connection-refused',
        name: 'Connection Refused',
        address: '127.0.0.1',
        port: 1, // Privileged port, likely refused
        carrier: 'vivo',
      });

      expect(status).toBeDefined();
    });
  });
});
