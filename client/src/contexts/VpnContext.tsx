import React, { createContext, useContext, useState, useCallback } from 'react';

export interface VpnConfig {
  protocol: 'vless' | 'vmess' | 'trojan';
  serverAddress: string;
  serverPort: number;
  uuid: string;
  encryption: string;
  network: 'ws' | 'tcp';
  tlsServerName: string;
  host: string;
}

export interface VpnLog {
  timestamp: Date;
  message: string;
  level: 'info' | 'warning' | 'error' | 'success';
}

export interface VpnContextType {
  isConnected: boolean;
  isConnecting: boolean;
  selectedCarrier: string;
  selectedServer: string;
  selectedSNI: string;
  selectedPayload: string;
  logs: VpnLog[];
  config: VpnConfig | null;
  currentIp: string | null;
  latency: number | null;
  bandwidth: number | null;
  
  connect: (config: VpnConfig) => Promise<void>;
  disconnect: () => Promise<void>;
  selectCarrier: (carrierId: string) => void;
  selectServer: (serverId: string) => void;
  selectSNI: (sniDomain: string) => void;
  selectPayload: (payload: string) => void;
  addLog: (message: string, level: VpnLog['level']) => void;
  clearLogs: () => void;
  setCurrentIp: (ip: string) => void;
  setLatency: (ms: number) => void;
  setBandwidth: (mbps: number) => void;
}

const VpnContext = createContext<VpnContextType | undefined>(undefined);

export function VpnProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState('vivo');
  const [selectedServer, setSelectedServer] = useState('vivo-sp-01');
  const [selectedSNI, setSelectedSNI] = useState('portalrecarga.vivo.com.br');
  const [selectedPayload, setSelectedPayload] = useState('http');
  const [logs, setLogs] = useState<VpnLog[]>([]);
  const [config, setConfig] = useState<VpnConfig | null>(null);
  const [currentIp, setCurrentIp] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [bandwidth, setBandwidth] = useState<number | null>(null);

  const addLog = useCallback((message: string, level: VpnLog['level']) => {
    setLogs(prev => [...prev, {
      timestamp: new Date(),
      message,
      level
    }]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const connect = useCallback(async (vpnConfig: VpnConfig) => {
    try {
      setIsConnecting(true);
      addLog('Iniciando conexão...', 'info');
      
      // Log configuration details
      addLog(`Operadora: ${selectedCarrier.toUpperCase()}`, 'info');
      addLog(`Servidor: ${selectedServer}`, 'info');
      addLog(`SNI: ${selectedSNI}`, 'info');
      addLog(`Payload: ${selectedPayload}`, 'info');
      
      // Simulate Xray configuration
      setConfig(vpnConfig);
      addLog(`Conectando ao servidor: ${vpnConfig.serverAddress}:${vpnConfig.serverPort}`, 'info');
      
      // Simulate handshake
      await new Promise(resolve => setTimeout(resolve, 2000));
      addLog('Handshake TLS iniciado...', 'info');
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      addLog('Tunnel estabelecido com sucesso', 'success');
      
      setIsConnected(true);
      setCurrentIp('203.0.113.42');
      setLatency(45);
      setBandwidth(85);
    } catch (error) {
      addLog(`Erro na conexão: ${error instanceof Error ? error.message : 'Desconhecido'}`, 'error');
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  }, [addLog, selectedCarrier, selectedServer, selectedSNI, selectedPayload]);

  const disconnect = useCallback(async () => {
    try {
      setIsConnecting(true);
      addLog('Desconectando...', 'info');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      addLog('Conexão encerrada', 'info');
      
      setIsConnected(false);
      setConfig(null);
      setCurrentIp(null);
      setLatency(null);
      setBandwidth(null);
    } catch (error) {
      addLog(`Erro ao desconectar: ${error instanceof Error ? error.message : 'Desconhecido'}`, 'error');
    } finally {
      setIsConnecting(false);
    }
  }, [addLog]);

  const value: VpnContextType = {
    isConnected,
    isConnecting,
    selectedCarrier,
    selectedServer,
    selectedSNI,
    selectedPayload,
    logs,
    config,
    currentIp,
    latency,
    bandwidth,
    connect,
    disconnect,
    selectCarrier: setSelectedCarrier,
    selectServer: setSelectedServer,
    selectSNI: setSelectedSNI,
    selectPayload: setSelectedPayload,
    addLog,
    clearLogs,
    setCurrentIp,
    setLatency,
    setBandwidth,
  };

  return (
    <VpnContext.Provider value={value}>
      {children}
    </VpnContext.Provider>
  );
}

export function useVpn() {
  const context = useContext(VpnContext);
  if (!context) {
    throw new Error('useVpn must be used within VpnProvider');
  }
  return context;
}
