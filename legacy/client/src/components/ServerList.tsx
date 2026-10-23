import React from 'react';
import { useVpn } from '@/contexts/VpnContext';

interface Server {
  id: string;
  name: string;
  region: string;
  country: string;
  flag: string;
  latency: number;
  load: number;
}

const SERVERS: Server[] = [
  { id: 'br-sp-01', name: 'São Paulo 01', region: 'SP', country: 'BR', flag: '🇧🇷', latency: 5, load: 45 },
  { id: 'br-rj-01', name: 'Rio de Janeiro 01', region: 'RJ', country: 'BR', flag: '🇧🇷', latency: 12, load: 32 },
  { id: 'br-mg-01', name: 'Belo Horizonte 01', region: 'MG', country: 'BR', flag: '🇧🇷', latency: 18, load: 28 },
  { id: 'us-ny-01', name: 'New York 01', region: 'NY', country: 'US', flag: '🇺🇸', latency: 95, load: 62 },
  { id: 'us-ca-01', name: 'California 01', region: 'CA', country: 'US', flag: '🇺🇸', latency: 120, load: 55 },
  { id: 'eu-de-01', name: 'Frankfurt 01', region: 'DE', country: 'EU', flag: '🇩🇪', latency: 140, load: 48 },
];

export function ServerList() {
  const { selectedServer, selectServer, isConnected, isConnecting } = useVpn();

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-mono font-semibold text-slate-300 uppercase tracking-widest">
        Servidores Disponíveis
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {SERVERS.map(server => (
          <button
            key={server.id}
            onClick={() => !isConnected && selectServer(server.id)}
            disabled={isConnected || isConnecting}
            className={`relative p-3 rounded-sm transition-all duration-200 group ${
              selectedServer === server.id
                ? 'bg-slate-800/80 border border-cyan-400/60 glow-cyan'
                : 'bg-slate-900/50 border border-slate-700/50 hover:border-purple-500/40'
            } ${isConnected || isConnecting ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {/* Hexagonal badge effect */}
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-purple-500 to-cyan-400 rounded-full flex items-center justify-center text-xs font-bold text-black">
              {server.load}%
            </div>

            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-1">
                <span className="text-lg">{server.flag}</span>
                <div className="text-left flex-1">
                  <p className="text-xs font-mono font-semibold text-slate-100">
                    {server.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {server.region} • {server.country}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <p className={`text-xs font-mono font-bold ${
                  server.latency < 50 
                    ? 'text-green-400' 
                    : server.latency < 100 
                    ? 'text-yellow-400' 
                    : 'text-red-400'
                }`}>
                  {server.latency}ms
                </p>
              </div>
            </div>

            {/* Hover indicator */}
            {selectedServer === server.id && (
              <div className="absolute top-1 left-1 w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
