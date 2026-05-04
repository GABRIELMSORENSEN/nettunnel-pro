import React, { useEffect, useRef } from 'react';
import { useVpn } from '@/contexts/VpnContext';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

export function ConnectionLogs() {
  const { logs, clearLogs } = useVpn();
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      default:
        return 'text-cyan-400';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'success':
        return '✓';
      case 'error':
        return '✗';
      case 'warning':
        return '⚠';
      default:
        return '→';
    }
  };

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-mono font-semibold text-slate-300 uppercase tracking-widest">
          Logs de Conexão
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearLogs}
          className="h-6 w-6 p-0 text-slate-400 hover:text-red-400"
          title="Limpar logs"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 bg-slate-950/50 border border-slate-700/50 rounded-sm p-3 overflow-y-auto font-mono text-xs scanline">
        {logs.length === 0 ? (
          <div className="text-slate-500 text-center py-8">
            <p>Aguardando eventos...</p>
          </div>
        ) : (
          <div className="space-y-1">
            {logs.map((log, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <span className="text-slate-500 flex-shrink-0">
                  [{log.timestamp.toLocaleTimeString('pt-BR')}]
                </span>
                <span className={`flex-shrink-0 ${getLevelColor(log.level)}`}>
                  {getLevelIcon(log.level)}
                </span>
                <span className={`flex-1 ${getLevelColor(log.level)}`}>
                  {log.message}
                </span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}
