import React from 'react';

interface ConnectionNodeProps {
  isActive: boolean;
  isConnecting?: boolean;
  label?: string;
}

export function ConnectionNode({ isActive, isConnecting, label }: ConnectionNodeProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-24 h-24">
        {/* Outer ring - animated when connecting */}
        {(isActive || isConnecting) && (
          <div className="absolute inset-0 rounded-full border-2 border-cyan-400/30 animate-spin"
               style={{ animationDuration: '3s' }} />
        )}
        
        {/* Middle ring - pulsing when active */}
        <div className={`absolute inset-2 rounded-full border border-purple-500/40 ${
          isActive ? 'animate-pulse-glow' : ''
        }`} />
        
        {/* Core node */}
        <div className={`absolute inset-4 rounded-full transition-all duration-300 ${
          isActive 
            ? 'bg-gradient-to-br from-cyan-400 to-purple-500 glow-cyan' 
            : isConnecting
            ? 'bg-gradient-to-br from-yellow-400 to-orange-500 animate-pulse'
            : 'bg-gradient-to-br from-slate-600 to-slate-700'
        }`} />
        
        {/* Inner dot */}
        <div className="absolute inset-6 rounded-full bg-black/40 flex items-center justify-center">
          <div className={`w-2 h-2 rounded-full ${
            isActive ? 'bg-cyan-300 animate-pulse' : 'bg-slate-500'
          }`} />
        </div>
      </div>
      
      {label && (
        <div className="text-center">
          <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">
            {label}
          </p>
          {isActive && (
            <p className="text-xs font-mono text-cyan-400 animate-pulse mt-1">
              ● ATIVO
            </p>
          )}
          {isConnecting && (
            <p className="text-xs font-mono text-yellow-400 animate-pulse mt-1">
              ● CONECTANDO
            </p>
          )}
        </div>
      )}
    </div>
  );
}
