import { useVpn } from '@/contexts/VpnContext';
import { useAuth } from '@/_core/hooks/useAuth';
import { CarrierSelector } from '@/components/CarrierSelector';
import { TestRunner } from '@/components/TestRunner';
import { ConnectionNode } from '@/components/ConnectionNode';
import { Button } from '@/components/ui/button';
import { Trash2, Copy } from 'lucide-react';

/**
 * NetTunnel Pro - Advanced VPN Configuration Interface
 * 
 * Features:
 * - Multiple carrier support (Vivo, Claro, Oi, Tim)
 * - Advanced SNI and payload configuration
 * - Connection testing and validation
 * - Real-time logs and diagnostics
 */
export default function Home() {
  // The userAuth hooks provides authentication state
  // To implement login/logout functionality, simply call logout() or redirect to getLoginUrl()
  let { user, loading, error, isAuthenticated, logout } = useAuth();

  const {
    isConnected,
    isConnecting,
    selectedCarrier,
    selectedServer,
    selectedSNI,
    selectedPayload,
    logs,
    currentIp,
    latency,
    bandwidth,
    connect,
    disconnect,
    selectCarrier,
    selectServer,
    selectSNI,
    selectPayload,
    clearLogs,
  } = useVpn();

  const handleConnect = async () => {
    // Create config from selected settings
    const config = {
      protocol: 'vless' as const,
      serverAddress: 'server.example.com',
      serverPort: 443,
      uuid: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
      encryption: 'none',
      network: 'ws' as const,
      tlsServerName: selectedSNI,
      host: selectedSNI,
    };
    
    await connect(config);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* HEADER */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-transparent bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text">
              NetTunnel Pro
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-1">VPN com Bypass DPI • Zero-Rating</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 font-mono">v1.0.0</p>
            <p className="text-xs text-slate-500 mt-1">Powered by Xray-core</p>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-6">
        {/* STATUS SECTION */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* CONNECTION NODE */}
          <div className="lg:col-span-1 flex justify-center items-center">
            <ConnectionNode
              isActive={isConnected}
              isConnecting={isConnecting}
              label={isConnected ? 'CONECTADO' : 'DESCONECTADO'}
            />
          </div>

          {/* STATUS PANEL */}
          <div className="lg:col-span-2 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 bg-slate-800/60 border border-slate-700/50 rounded-sm">
                <p className="text-xs font-mono text-slate-400 uppercase">Status</p>
                <p className={`text-sm font-bold mt-1 ${isConnected ? 'text-green-400' : 'text-slate-400'}`}>
                  {isConnected ? '● ATIVO' : '● INATIVO'}
                </p>
              </div>

              <div className="p-3 bg-slate-800/60 border border-slate-700/50 rounded-sm">
                <p className="text-xs font-mono text-slate-400 uppercase">IP Externo</p>
                <p className="text-sm font-mono text-cyan-400 mt-1 truncate">
                  {currentIp || 'N/A'}
                </p>
              </div>

              <div className="p-3 bg-slate-800/60 border border-slate-700/50 rounded-sm">
                <p className="text-xs font-mono text-slate-400 uppercase">Latência</p>
                <p className={`text-sm font-bold mt-1 ${latency && latency < 50 ? 'text-green-400' : 'text-yellow-400'}`}>
                  {latency ? `${latency}ms` : 'N/A'}
                </p>
              </div>
            </div>

            {bandwidth && (
              <div className="p-3 bg-slate-800/60 border border-slate-700/50 rounded-sm">
                <p className="text-xs font-mono text-slate-400 uppercase">Velocidade</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-purple-500"
                      style={{ width: `${Math.min(bandwidth, 100)}%` }}
                    />
                  </div>
                  <p className="text-sm font-bold text-cyan-400">{bandwidth}Mbps</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* CONFIGURATION SECTION */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-mono font-semibold text-slate-300 uppercase tracking-widest mb-3">
              Configuração de Conexão
            </h2>
            <CarrierSelector
              selectedCarrier={selectedCarrier}
              selectedServer={selectedServer}
              selectedSNI={selectedSNI}
              selectedPayload={selectedPayload}
              onCarrierChange={selectCarrier}
              onServerChange={selectServer}
              onSNIChange={selectSNI}
              onPayloadChange={selectPayload}
              disabled={isConnected || isConnecting}
            />
          </div>

          {/* CONNECT BUTTON */}
          <div className="flex gap-3">
            {!isConnected ? (
              <Button
                onClick={handleConnect}
                disabled={isConnecting}
                className="flex-1 h-12 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 disabled:opacity-50 text-white font-bold text-lg rounded-sm transition-all"
              >
                {isConnecting ? 'CONECTANDO...' : 'CONECTAR'}
              </Button>
            ) : (
              <Button
                onClick={disconnect}
                disabled={isConnecting}
                className="flex-1 h-12 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-lg rounded-sm transition-all"
              >
                {isConnecting ? 'DESCONECTANDO...' : 'DESCONECTAR'}
              </Button>
            )}
          </div>
        </section>

        {/* TEST SECTION */}
        <section className="space-y-4">
          <h2 className="text-lg font-mono font-semibold text-slate-300 uppercase tracking-widest">
            Validação de Configurações
          </h2>
          <TestRunner carrierId={selectedCarrier} disabled={isConnected || isConnecting} />
        </section>

        {/* LOGS SECTION */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-mono font-semibold text-slate-300 uppercase tracking-widest">
              Logs de Conexão
            </h2>
            <button
              onClick={clearLogs}
              className="flex items-center gap-1 px-3 py-1 text-xs font-mono text-slate-400 hover:text-slate-300 bg-slate-800/60 border border-slate-700/50 rounded-sm hover:border-slate-600 transition-colors"
            >
              <Trash2 size={14} />
              Limpar
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto bg-slate-950 border border-slate-700/50 rounded-sm p-4 space-y-2 font-mono text-xs">
            {logs.length === 0 ? (
              <p className="text-slate-500">Aguardando eventos...</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className={`flex items-start gap-2 ${
                  log.level === 'success' ? 'text-green-400' :
                  log.level === 'error' ? 'text-red-400' :
                  log.level === 'warning' ? 'text-yellow-400' :
                  'text-cyan-400'
                }`}>
                  <span className="text-slate-600 flex-shrink-0">
                    [{log.timestamp.toLocaleTimeString()}]
                  </span>
                  <span className="flex-shrink-0">
                    {log.level === 'success' ? '✓' :
                     log.level === 'error' ? '✗' :
                     log.level === 'warning' ? '⚠' :
                     '→'}
                  </span>
                  <span className="flex-1">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-slate-700/50 pt-6 mt-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-slate-400 font-mono">
            <div>
              <p className="text-slate-500 uppercase mb-1">Operadoras</p>
              <p>Vivo, Claro, Oi, Tim</p>
            </div>
            <div>
              <p className="text-slate-500 uppercase mb-1">Protocolos</p>
              <p>VLESS, VMESS, Trojan</p>
            </div>
            <div>
              <p className="text-slate-500 uppercase mb-1">Métodos</p>
              <p>HTTP, TLS, WS, Fragment</p>
            </div>
            <div>
              <p className="text-slate-500 uppercase mb-1">Versão</p>
              <p>1.0.0 • MIT License</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
