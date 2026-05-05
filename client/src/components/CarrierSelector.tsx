import React, { useState } from 'react';
import { CARRIERS_DATABASE, getTopSNIs } from '@/lib/carriers-database';
import { ChevronDown } from 'lucide-react';

interface CarrierSelectorProps {
  selectedCarrier: string;
  selectedServer: string;
  selectedSNI: string;
  selectedPayload: string;
  onCarrierChange: (carrierId: string) => void;
  onServerChange: (serverId: string) => void;
  onSNIChange: (sniDomain: string) => void;
  onPayloadChange: (payload: string) => void;
  disabled?: boolean;
}

/**
 * Advanced Carrier Selector Component
 * 
 * Allows users to select:
 * - Carrier (Vivo, Claro, Oi, Tim)
 * - Server (by region and latency)
 * - SNI (zero-rating domain)
 * - Payload method (HTTP, TLS, WebSocket, Fragment)
 */
export function CarrierSelector({
  selectedCarrier,
  selectedServer,
  selectedSNI,
  selectedPayload,
  onCarrierChange,
  onServerChange,
  onSNIChange,
  onPayloadChange,
  disabled = false,
}: CarrierSelectorProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('carrier');

  const currentCarrier = CARRIERS_DATABASE.find((c) => c.id === selectedCarrier);
  const currentServer = currentCarrier?.servers.find((s) => s.id === selectedServer);
  const currentSNIs = currentCarrier ? getTopSNIs(currentCarrier.id, 5) : [];
  const currentSNI = currentSNIs.find((s) => s.domain === selectedSNI);
  const currentPayloads = currentSNI?.payloads || [];

  return (
    <div className="space-y-3 bg-slate-900/50 border border-slate-700/50 rounded-sm p-4">
      {/* CARRIER SELECTOR */}
      <div className="space-y-2">
        <button
          onClick={() => setExpandedSection(expandedSection === 'carrier' ? null : 'carrier')}
          disabled={disabled}
          className="w-full flex items-center justify-between p-3 bg-slate-800/60 border border-slate-700/50 rounded-sm hover:border-cyan-400/40 transition-colors disabled:opacity-50"
        >
          <div className="text-left">
            <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">Operadora</p>
            <p className="text-sm font-semibold text-slate-100">
              {currentCarrier?.logo} {currentCarrier?.name || 'Selecione'}
            </p>
          </div>
          <ChevronDown
            size={16}
            className={`transition-transform ${expandedSection === 'carrier' ? 'rotate-180' : ''}`}
          />
        </button>

        {expandedSection === 'carrier' && (
          <div className="grid grid-cols-2 gap-2 p-2 bg-slate-800/40 rounded-sm border border-slate-700/30">
            {CARRIERS_DATABASE.map((carrier) => (
              <button
                key={carrier.id}
                onClick={() => {
                  onCarrierChange(carrier.id);
                  onServerChange(carrier.servers[0].id);
                  onSNIChange(carrier.snis[0].domain);
                  onPayloadChange(carrier.snis[0].payloads[0].method);
                  setExpandedSection(null);
                }}
                className={`p-2 rounded-sm text-sm font-mono transition-all ${
                  selectedCarrier === carrier.id
                    ? 'bg-gradient-to-r from-cyan-400/20 to-purple-500/20 border border-cyan-400/60'
                    : 'bg-slate-700/30 border border-slate-600/50 hover:border-purple-500/40'
                }`}
              >
                <span className="text-lg">{carrier.logo}</span>
                <p className="text-xs text-slate-300 mt-1">{carrier.name}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {currentCarrier && (
        <>
          {/* SERVER SELECTOR */}
          <div className="space-y-2">
            <button
              onClick={() => setExpandedSection(expandedSection === 'server' ? null : 'server')}
              disabled={disabled}
              className="w-full flex items-center justify-between p-3 bg-slate-800/60 border border-slate-700/50 rounded-sm hover:border-cyan-400/40 transition-colors disabled:opacity-50"
            >
              <div className="text-left">
                <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">Servidor</p>
                <p className="text-sm font-semibold text-slate-100">
                  {currentServer?.name || 'Selecione'} ({currentServer?.latency || 0}ms)
                </p>
              </div>
              <ChevronDown
                size={16}
                className={`transition-transform ${expandedSection === 'server' ? 'rotate-180' : ''}`}
              />
            </button>

            {expandedSection === 'server' && (
              <div className="space-y-1 p-2 bg-slate-800/40 rounded-sm border border-slate-700/30 max-h-48 overflow-y-auto">
                {currentCarrier.servers.map((server) => (
                  <button
                    key={server.id}
                    onClick={() => {
                      onServerChange(server.id);
                      setExpandedSection(null);
                    }}
                    className={`w-full p-2 rounded-sm text-xs text-left transition-all ${
                      selectedServer === server.id
                        ? 'bg-gradient-to-r from-cyan-400/20 to-purple-500/20 border border-cyan-400/60'
                        : 'bg-slate-700/30 border border-slate-600/50 hover:border-purple-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-semibold text-slate-100">
                        {server.flag} {server.name}
                      </span>
                      <span className="text-cyan-400">{server.latency}ms</span>
                    </div>
                    <p className="text-slate-400 mt-1">
                      {server.protocol.toUpperCase()} • {server.region}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* SNI SELECTOR */}
          <div className="space-y-2">
            <button
              onClick={() => setExpandedSection(expandedSection === 'sni' ? null : 'sni')}
              disabled={disabled}
              className="w-full flex items-center justify-between p-3 bg-slate-800/60 border border-slate-700/50 rounded-sm hover:border-cyan-400/40 transition-colors disabled:opacity-50"
            >
              <div className="text-left">
                <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">SNI (Zero-Rating)</p>
                <p className="text-sm font-semibold text-slate-100 truncate">{selectedSNI || 'Selecione'}</p>
              </div>
              <ChevronDown
                size={16}
                className={`transition-transform ${expandedSection === 'sni' ? 'rotate-180' : ''}`}
              />
            </button>

            {expandedSection === 'sni' && (
              <div className="space-y-1 p-2 bg-slate-800/40 rounded-sm border border-slate-700/30 max-h-48 overflow-y-auto">
                {currentSNIs.map((sni) => (
                  <button
                    key={sni.domain}
                    onClick={() => {
                      onSNIChange(sni.domain);
                      onPayloadChange(sni.payloads[0].method);
                      setExpandedSection(null);
                    }}
                    className={`w-full p-2 rounded-sm text-xs text-left transition-all ${
                      selectedSNI === sni.domain
                        ? 'bg-gradient-to-r from-cyan-400/20 to-purple-500/20 border border-cyan-400/60'
                        : 'bg-slate-700/30 border border-slate-600/50 hover:border-purple-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-semibold text-slate-100">{sni.domain}</span>
                      <span className="text-purple-400 text-xs">
                        {sni.successRate || 0}% ⭐
                      </span>
                    </div>
                    <p className="text-slate-400 mt-1">{sni.description}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* PAYLOAD METHOD SELECTOR */}
          <div className="space-y-2">
            <button
              onClick={() => setExpandedSection(expandedSection === 'payload' ? null : 'payload')}
              disabled={disabled}
              className="w-full flex items-center justify-between p-3 bg-slate-800/60 border border-slate-700/50 rounded-sm hover:border-cyan-400/40 transition-colors disabled:opacity-50"
            >
              <div className="text-left">
                <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">Método de Payload</p>
                <p className="text-sm font-semibold text-slate-100 uppercase">{selectedPayload || 'Selecione'}</p>
              </div>
              <ChevronDown
                size={16}
                className={`transition-transform ${expandedSection === 'payload' ? 'rotate-180' : ''}`}
              />
            </button>

            {expandedSection === 'payload' && (
              <div className="grid grid-cols-2 gap-2 p-2 bg-slate-800/40 rounded-sm border border-slate-700/30">
                {currentPayloads.map((payload) => (
                  <button
                    key={payload.method}
                    onClick={() => {
                      onPayloadChange(payload.method);
                      setExpandedSection(null);
                    }}
                    className={`p-2 rounded-sm text-xs font-mono transition-all ${
                      selectedPayload === payload.method
                        ? 'bg-gradient-to-r from-cyan-400/20 to-purple-500/20 border border-cyan-400/60'
                        : 'bg-slate-700/30 border border-slate-600/50 hover:border-purple-500/40'
                    }`}
                  >
                    <p className="font-semibold text-slate-100 uppercase">{payload.method}</p>
                    {payload.fragment && (
                      <p className="text-slate-400 mt-1">
                        Fragment: {payload.fragment.packets}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* CONFIGURATION SUMMARY */}
          <div className="p-3 bg-slate-800/40 border border-cyan-400/20 rounded-sm">
            <p className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-2">Resumo da Configuração</p>
            <div className="space-y-1 text-xs font-mono text-slate-300">
              <p>
                <span className="text-cyan-400">Operadora:</span> {currentCarrier.name}
              </p>
              <p>
                <span className="text-cyan-400">Servidor:</span> {currentServer?.name} ({currentServer?.protocol})
              </p>
              <p>
                <span className="text-cyan-400">SNI:</span> {selectedSNI}
              </p>
              <p>
                <span className="text-cyan-400">Payload:</span> {selectedPayload}
              </p>
              <p>
                <span className="text-cyan-400">Latência:</span> {currentServer?.latency}ms
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
