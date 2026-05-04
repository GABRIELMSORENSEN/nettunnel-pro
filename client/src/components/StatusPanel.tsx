import React from 'react';
import { useVpn } from '@/contexts/VpnContext';
import { Shield, Globe, Zap } from 'lucide-react';

export function StatusPanel() {
  const { isConnected, currentIp, latency, config } = useVpn();

  const statusItems = [
    {
      icon: Shield,
      label: 'Protocolo',
      value: config?.protocol.toUpperCase() || 'N/A',
      color: isConnected ? 'text-cyan-400' : 'text-slate-500'
    },
    {
      icon: Globe,
      label: 'IP Externo',
      value: currentIp || 'Desconectado',
      color: isConnected ? 'text-green-400' : 'text-slate-500'
    },
    {
      icon: Zap,
      label: 'Latência',
      value: latency ? `${latency}ms` : 'N/A',
      color: latency && latency < 50 ? 'text-green-400' : latency && latency < 100 ? 'text-yellow-400' : 'text-red-400'
    }
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-mono font-semibold text-slate-300 uppercase tracking-widest">
        Status da Conexão
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {statusItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="bg-slate-900/50 border border-slate-700/50 rounded-sm p-3 hover:border-purple-500/40 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${item.color}`} />
                <span className="text-xs text-slate-400 font-mono uppercase">
                  {item.label}
                </span>
              </div>
              <p className={`text-sm font-mono font-semibold ${item.color}`}>
                {item.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Encryption details */}
      {config && isConnected && (
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-sm p-3 space-y-2">
          <p className="text-xs text-slate-400 font-mono uppercase">Detalhes de Criptografia</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-500">Rede:</span>
              <p className="text-cyan-400 font-mono">{config.network.toUpperCase()}</p>
            </div>
            <div>
              <span className="text-slate-500">TLS SNI:</span>
              <p className="text-cyan-400 font-mono truncate">{config.tlsServerName}</p>
            </div>
            <div>
              <span className="text-slate-500">Host:</span>
              <p className="text-cyan-400 font-mono truncate">{config.host}</p>
            </div>
            <div>
              <span className="text-slate-500">Porta:</span>
              <p className="text-cyan-400 font-mono">{config.serverPort}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
