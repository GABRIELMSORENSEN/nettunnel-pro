import React, { useState } from 'react';
import { useVpn, VpnConfig } from '@/contexts/VpnContext';
import { ConnectionNode } from '@/components/ConnectionNode';
import { ServerList } from '@/components/ServerList';
import { StatusPanel } from '@/components/StatusPanel';
import { ConnectionLogs } from '@/components/ConnectionLogs';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';

/**
 * NetTunnel Pro VPN - Home Page
 * 
 * Design: Cyberpunk Minimalism
 * - Deep charcoal background with neon cyan/purple accents
 * - Asymmetric layout: status panel left, connection controls center-right
 * - Animated connection nodes with glow effects
 * - Terminal-style logs with scanline overlay
 */
export default function Home() {
  const { 
    isConnected, 
    isConnecting, 
    connect, 
    disconnect, 
    selectedServer 
  } = useVpn();
  
  const [showSettings, setShowSettings] = useState(false);

  const handleToggleConnection = async () => {
    if (isConnected) {
      await disconnect();
    } else {
      // Create Xray configuration for selected server
      const config: VpnConfig = {
        protocol: 'vless',
        serverAddress: 'br-sp-01.nettunnel.pro',
        serverPort: 443,
        uuid: 'a3c14198-dc1f-40a3-9d4a-8c37609f59f2',
        encryption: 'none',
        network: 'ws',
        tlsServerName: 'portalrecarga.vivo.com.br',
        host: 'br-sp-01.nettunnel.pro'
      };
      
      await connect(config);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Diagonal divider background */}
      <div className="fixed inset-0 pointer-events-none">
        <svg className="absolute top-0 right-0 w-96 h-96 opacity-5" viewBox="0 0 400 400">
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00D9FF" />
              <stop offset="100%" stopColor="#9D00FF" />
            </linearGradient>
          </defs>
          <polygon points="0,0 400,0 400,400 0,400" fill="url(#grad1)" />
        </svg>
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-slate-700/50 bg-slate-950/80 backdrop-blur-sm">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center glow-cyan">
              <span className="text-sm font-mono font-bold text-black">NT</span>
            </div>
            <div>
              <h1 className="text-lg font-mono font-bold text-slate-100">
                NetTunnel Pro
              </h1>
              <p className="text-xs text-slate-400 font-mono">
                VPN com Bypass DPI
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="text-slate-400 hover:text-cyan-400"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left panel - Status and Servers */}
          <div className="lg:col-span-1 space-y-6">
            <StatusPanel />
            <div className="border-t border-slate-700/50 pt-6">
              <ServerList />
            </div>
          </div>

          {/* Center - Connection Node and Control */}
          <div className="lg:col-span-1 flex flex-col items-center justify-center gap-8">
            <ConnectionNode 
              isActive={isConnected}
              isConnecting={isConnecting}
              label={isConnected ? 'CONECTADO' : isConnecting ? 'CONECTANDO' : 'DESCONECTADO'}
            />

            <Button
              onClick={handleToggleConnection}
              disabled={isConnecting}
              className={`w-full max-w-xs h-12 font-mono font-bold uppercase tracking-wider transition-all duration-300 ${
                isConnected
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-black'
              } ${isConnecting ? 'opacity-75' : ''}`}
            >
              {isConnecting 
                ? 'Conectando...' 
                : isConnected 
                ? 'Desconectar' 
                : 'Conectar'}
            </Button>

            {/* Diagonal divider */}
            <div className="w-full h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
          </div>

          {/* Right panel - Logs */}
          <div className="lg:col-span-1 flex flex-col h-96">
            <ConnectionLogs />
          </div>
        </div>

        {/* Settings panel */}
        {showSettings && (
          <div className="mt-8 p-6 bg-slate-900/50 border border-slate-700/50 rounded-sm animate-diagonal-slide">
            <h2 className="text-lg font-mono font-bold text-slate-100 mb-4">
              Configurações
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-2">
                  Protocolo
                </label>
                <select className="w-full bg-slate-800 border border-slate-700 rounded-sm px-3 py-2 text-sm text-slate-100 font-mono">
                  <option>VLESS</option>
                  <option>VMESS</option>
                  <option>TROJAN</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-2">
                  Rede
                </label>
                <select className="w-full bg-slate-800 border border-slate-700 rounded-sm px-3 py-2 text-sm text-slate-100 font-mono">
                  <option>WebSocket (WS)</option>
                  <option>TCP</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-2">
                  TLS SNI
                </label>
                <input 
                  type="text" 
                  placeholder="portalrecarga.vivo.com.br"
                  className="w-full bg-slate-800 border border-slate-700 rounded-sm px-3 py-2 text-sm text-slate-100 font-mono placeholder-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-2">
                  Fragment (DPI Bypass)
                </label>
                <select className="w-full bg-slate-800 border border-slate-700 rounded-sm px-3 py-2 text-sm text-slate-100 font-mono">
                  <option>1-3 packets</option>
                  <option>2-4 packets</option>
                  <option>3-5 packets</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button 
                onClick={() => setShowSettings(false)}
                className="bg-cyan-600 hover:bg-cyan-700 text-black font-mono font-bold"
              >
                Salvar
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowSettings(false)}
                className="border-slate-700 text-slate-300 hover:text-slate-100"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-700/50 bg-slate-950/80 backdrop-blur-sm mt-12">
        <div className="container py-4 text-center">
          <p className="text-xs text-slate-500 font-mono">
            NetTunnel Pro v1.0.0 • Powered by Xray-core • Capacitor + React
          </p>
        </div>
      </footer>
    </div>
  );
}
