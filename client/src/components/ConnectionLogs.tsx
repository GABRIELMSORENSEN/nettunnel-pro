import React, { useEffect, useRef } from 'react';
import { useVpn } from '@/contexts/VpnContext';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

/**
 * ConnectionLogs Component
 * 
 * Displays real-time logs from Xray process via VpnBridge
 * Features:
 * - Real-time log streaming from libXray.so
 * - Color-coded log levels
 * - Terminal-style UI with cyberpunk aesthetic
 * - Auto-scroll to latest logs
 * - Log statistics
 */
export function ConnectionLogs() {
  const { logs, clearLogs, isConnected } = useVpn();
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
      case 'debug':
        return 'text-blue-400';
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
      case 'debug':
        return 'D';
      default:
        return '→';
    }
  };

  const getLevelBgColor = (level: string) => {
    switch (level) {
      case 'success':
        return 'bg-green-500/10 border-green-500/30';
      case 'error':
        return 'bg-red-500/10 border-red-500/30';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/30';
      case 'debug':
        return 'bg-blue-500/10 border-blue-500/30';
      default:
        return 'bg-slate-800/60 border-slate-700/50';
    }
  };

  const errorCount = logs.filter((l) => l.level === 'error').length;
  const warningCount = logs.filter((l) => l.level === 'warning').length;
  const successCount = logs.filter((l) => l.level === 'success').length;

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-mono font-semibold text-slate-300 uppercase tracking-widest">
            Logs de Conexão
          </h3>
          {isConnected && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-green-400 font-mono">AO VIVO</span>
            </div>
          )}
        </div>
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
            <p className="animate-pulse">Aguardando eventos...</p>
            <p className="text-xs mt-2 text-slate-600">Logs em tempo real do Xray</p>
          </div>
        ) : (
          <div className="space-y-1">
            {logs.map((log, idx) => (
              <div
                key={idx}
                className={`flex gap-2 items-start p-1 rounded border transition-colors hover:bg-slate-900/30 ${getLevelBgColor(
                  log.level
                )}`}
              >
                <span className="text-slate-600 flex-shrink-0 w-12">
                  [{log.timestamp.toLocaleTimeString('pt-BR')}]
                </span>
                <span className={`flex-shrink-0 w-4 text-center font-bold ${getLevelColor(log.level)}`}>
                  {getLevelIcon(log.level)}
                </span>
                <span className={`flex-1 ${getLevelColor(log.level)}`}>
                  {log.message}
                </span>
                <span
                  className={`flex-shrink-0 text-xs px-2 py-0.5 rounded uppercase font-semibold ${
                    log.level === 'error'
                      ? 'bg-red-500/20 text-red-400'
                      : log.level === 'warning'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : log.level === 'success'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-slate-700/50 text-slate-400'
                  }`}
                >
                  {log.level}
                </span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>

      {/* Log Statistics */}
      {logs.length > 0 && (
        <div className="grid grid-cols-4 gap-2 text-xs">
          <div className="p-2 bg-slate-800/60 border border-slate-700/50 rounded-sm">
            <p className="text-slate-400 font-mono">Total</p>
            <p className="text-cyan-400 font-bold">{logs.length}</p>
          </div>
          <div className="p-2 bg-slate-800/60 border border-slate-700/50 rounded-sm">
            <p className="text-slate-400 font-mono">Erros</p>
            <p className="text-red-400 font-bold">{errorCount}</p>
          </div>
          <div className="p-2 bg-slate-800/60 border border-slate-700/50 rounded-sm">
            <p className="text-slate-400 font-mono">Avisos</p>
            <p className="text-yellow-400 font-bold">{warningCount}</p>
          </div>
          <div className="p-2 bg-slate-800/60 border border-slate-700/50 rounded-sm">
            <p className="text-slate-400 font-mono">Sucesso</p>
            <p className="text-green-400 font-bold">{successCount}</p>
          </div>
        </div>
      )}

      {/* Info Text */}
      <p className="text-xs text-slate-500 font-mono">
        💡 Logs em tempo real do processo Xray • Atualização automática a cada evento
      </p>
    </div>
  );
}
