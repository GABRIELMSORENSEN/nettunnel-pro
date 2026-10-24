import { nativeVpn } from '../native-vpn';
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
      
      const native = nativeVpn();
      if (!native) throw new Error('A VPN exige o aplicativo Android.');
      const params = new URLSearchParams({type: vpnConfig.network, security: vpnConfig.tlsServerName ? 'tls' : 'none', sni: vpnConfig.tlsServerName, host: vpnConfig.host});
      const link = vpnConfig.protocol === 'vmess'
        ? 'vmess://' + btoa(JSON.stringify({v:'2',ps:'Servidor importado',add:vpnConfig.serverAddress,port:String(vpnConfig.serverPort),id:vpnConfig.uuid,net:vpnConfig.network,host:vpnConfig.host,sni:vpnConfig.tlsServerName,tls:vpnConfig.tlsServerName?'tls':'',path:'/'}))
        : `${vpnConfig.protocol}://${encodeURIComponent(vpnConfig.uuid)}@${vpnConfig.serverAddress}:${vpnConfig.serverPort}?${params.toString()}`;
      const imported = JSON.parse(native.configure(link));
      if (!imported.ok) throw new Error(imported.error);
      const response = JSON.parse(native.connect());
      if (!response.ok) throw new Error(response.error);
      setConfig(vpnConfig);
      const deadline = Date.now() + 90000;
      while (Date.now() < deadline) {
        const state = JSON.parse(native.status());
        if (state.phase === 'error') throw new Error(state.error);
        if (state.phase === 'connected') {
          setIsConnected(true); setCurrentIp(state.ip); setLatency(null); setBandwidth(null);
          addLog('HTTPS verificado pelo servidor.', 'success'); return;
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      throw new Error('A conex?o n?o foi confirmada no tempo esperado.');
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
      
      nativeVpn()?.disconnect();
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
