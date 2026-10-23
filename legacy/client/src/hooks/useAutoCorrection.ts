/**
 * Hook para auto-correção automática de conexões VPN
 * 
 * Monitora a saúde da conexão e se auto-corrige quando necessário
 */

import { useEffect, useCallback, useRef } from 'react';
import { serverHealthChecker, type ServerHealth } from '@/services/serverHealthChecker';
import { CARRIERS_DATABASE } from '@/lib/carriers-database';
import type { ServerConfig } from '@/lib/carriers-database';

interface UseAutoCorrectionOptions {
  enabled?: boolean;
  checkInterval?: number;
  onServerChange?: (newServer: ServerConfig) => void;
  onHealthChange?: (health: Map<string, ServerHealth>) => void;
}

export function useAutoCorrection(
  currentServer: ServerConfig | null,
  options: UseAutoCorrectionOptions = {}
) {
  const {
    enabled = true,
    checkInterval = 30000,
    onServerChange,
    onHealthChange,
  } = options;

  const correctionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastServerIdRef = useRef<string | null>(currentServer?.id || null);

  // Obter todos os servidores disponíveis
  const allServers = CARRIERS_DATABASE.flatMap(carrier => carrier.servers);

  // Iniciar monitoramento de saúde
  useEffect(() => {
    if (!enabled) return;

    serverHealthChecker.startHealthChecking(allServers);

    return () => {
      serverHealthChecker.stopHealthChecking();
    };
  }, [enabled, allServers]);

  // Registrar listener para mudanças de saúde
  useEffect(() => {
    if (!onHealthChange) return;

    serverHealthChecker.onHealthChange(onHealthChange);

    return () => {
      serverHealthChecker.offHealthChange(onHealthChange);
    };
  }, [onHealthChange]);

  // Auto-corrigir conexão se necessário
  const performAutoCorrection = useCallback(async () => {
    if (!enabled || !currentServer) return;

    const onlineServers = serverHealthChecker.getOnlineServers(allServers);
    
    if (onlineServers.length === 0) {
      console.warn('[AutoCorrection] Nenhum servidor online disponível');
      return;
    }

    const correctedServer = await serverHealthChecker.autoCorrectConnection(
      currentServer,
      onlineServers
    );

    if (correctedServer && correctedServer.id !== lastServerIdRef.current) {
      lastServerIdRef.current = correctedServer.id;
      onServerChange?.(correctedServer);
    }
  }, [enabled, currentServer, allServers, onServerChange]);

  // Executar auto-correção periodicamente
  useEffect(() => {
    if (!enabled) return;

    performAutoCorrection();

    correctionTimeoutRef.current = setInterval(
      performAutoCorrection,
      checkInterval
    );

    return () => {
      if (correctionTimeoutRef.current) {
        clearInterval(correctionTimeoutRef.current);
      }
    };
  }, [enabled, checkInterval, performAutoCorrection]);

  // Retornar funções úteis
  return {
    getHealthiestServer: () => serverHealthChecker.getHealthiestServer(allServers),
    getRecommendedServers: () => serverHealthChecker.getRecommendedServers(allServers),
    getOnlineServers: () => serverHealthChecker.getOnlineServers(allServers),
    getServerHealth: (serverId: string) => serverHealthChecker.getServerHealth(serverId),
    getAllHealth: () => serverHealthChecker.getAllHealth(),
    performAutoCorrection,
    resetServerHealth: (serverId: string) => serverHealthChecker.resetServerHealth(serverId),
  };
}
