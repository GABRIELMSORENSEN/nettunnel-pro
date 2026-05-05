import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import {
  Shield,
  Zap,
  Globe,
  Settings,
  Activity,
  Terminal,
  Wifi,
  Cpu,
  Lock,
  ChevronDown,
  Power,
  RefreshCw,
  Info,
  Plus,
  Download,
  Upload,
  FileJson,
  Trash2,
  X,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Types
interface Server {
  id: string;
  name: string;
  country: string;
  flag: string;
  latency: number;
}

type PayloadMethod = 'SSH' | 'TLS' | 'V2RAY' | 'VLESS' | 'VMESS' | 'TROJAN' | 'WS+TLS' | 'SLOWDNS' | 'DNSTT' | 'HYSTERIA';

interface Payload {
  id: string;
  name: string;
  carrier: string;
  sni: string;
  method: PayloadMethod;
  isCustom?: boolean;
}

// Mock Data
const SERVERS: Server[] = [
  { id: 'br-1', name: 'São Paulo Premium', country: 'Brazil', flag: '🇧🇷', latency: 24 },
  { id: 'us-1', name: 'New York High-Speed', country: 'USA', flag: '🇺🇸', latency: 120 },
  { id: 'de-1', name: 'Frankfurt Core', country: 'Germany', flag: '🇩🇪', latency: 180 },
  { id: 'sg-1', name: 'Singapore Edge', country: 'Singapore', flag: '🇸🇬', latency: 240 },
];

const PAYLOADS: Payload[] = [
  { id: 'vivo-1', name: 'Vivo Zero-Rating', carrier: 'Vivo', sni: 'portalrecarga.vivo.com.br', method: 'VLESS' },
  { id: 'tim-1', name: 'Tim Social Free', carrier: 'Tim', sni: 'm.tim.com.br', method: 'VLESS' },
  { id: 'claro-1', name: 'Claro Unlimited', carrier: 'Claro', sni: 'claro.com.br', method: 'VLESS' },
  { id: 'generic-1', name: 'Cloudflare Bypass', carrier: 'Universal', sni: '1.1.1.1', method: 'VLESS' },
  { id: 'dns-1', name: 'SlowDNS Global', carrier: 'Universal', sni: '8.8.8.8', method: 'SLOWDNS' },
];

export default function Home() {
  const { user, logout } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedServer, setSelectedServer] = useState(SERVERS[0]);
  const [selectedPayload, setSelectedPayload] = useState(PAYLOADS[0]);
  const [customPayloads, setCustomPayloads] = useState<Payload[]>(() => {
    const saved = localStorage.getItem('net_tunnel_custom_payloads');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Modals
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [isPayloadModalOpen, setIsPayloadModalOpen] = useState(false);
  const [isAddPayloadModalOpen, setIsAddPayloadModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Advanced Features
  const [hotspotEnabled, setHotspotEnabled] = useState(false);
  const [autoHealing, setAutoHealing] = useState(true);
  const [obfuscationStrength, setObfuscationStrength] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [exitPoint, setExitPoint] = useState<'CLOUDFLARE' | 'VPS'>('CLOUDFLARE');
  const [dpiBypass, setDpiBypass] = useState(true);
  const [fragmentation, setFragmentation] = useState(true);

  // Form State
  const [newPayload, setNewPayload] = useState<Partial<Payload>>({
    name: '',
    carrier: 'Custom',
    sni: '',
    method: 'TLS'
  });
  const [formErrors, setFormErrors] = useState<{ name?: string; sni?: string }>({});

  // Logs & Stats
  const [logs, setLogs] = useState<string[]>([]);
  const [stats, setStats] = useState({ down: '0.0', up: '0.0', time: '00:00:00' });
  const logEndRef = useRef<HTMLDivElement>(null);

  // Persist custom payloads
  useEffect(() => {
    localStorage.setItem('net_tunnel_custom_payloads', JSON.stringify(customPayloads));
  }, [customPayloads]);

  // Auto-scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isConnected) {
      const startTime = Date.now();
      interval = setInterval(() => {
        const diff = Date.now() - startTime;
        const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
        const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
        const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
        setStats(prev => ({
          ...prev,
          time: `${h}:${m}:${s}`,
          down: (Math.random() * 5).toFixed(1),
          up: (Math.random() * 2).toFixed(1)
        }));
      }, 1000);
    } else {
      setStats({ down: '0.0', up: '0.0', time: '00:00:00' });
    }
    return () => clearInterval(interval);
  }, [isConnected]);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [...prev, `[${time}] ${msg}`].slice(-50));
  };

  const handleToggle = async () => {
    if (isConnected) {
      setIsConnected(false);
      setObfuscationStrength(0);
      addLog("Disconnection requested...");
      addLog("Tunnel closed.");
      return;
    }

    setIsConnecting(true);
    setLogs([]);
    setObfuscationStrength(0);

    try {
      addLog(`Initializing Xray-core wrapper...`);
      await new Promise(r => setTimeout(r, 500));
      addLog(`Exit Point: ${exitPoint === 'CLOUDFLARE' ? 'Cloudflare Pages (gRPC)' : 'Back-to-Back VPS'}`);
      addLog(`Protocol: ${selectedPayload.method} | SNI: ${selectedPayload.sni}`);

      // Simulate connection steps
      switch (selectedPayload.method) {
        case 'WS+TLS':
          addLog("Establishing WebSocket over TLS (CDN Edge)...");
          await new Promise(r => setTimeout(r, 800));
          setObfuscationStrength(75);
          break;
        case 'TROJAN':
          addLog("Initiating Trojan-GFW obfuscation...");
          await new Promise(r => setTimeout(r, 1000));
          setObfuscationStrength(90);
          break;
        case 'VLESS':
        case 'VMESS':
          addLog("Handshaking with Xray-Core server (gRPC mode)...");
          await new Promise(r => setTimeout(r, 1000));
          setObfuscationStrength(95);
          break;
        default:
          addLog("Standard SSH/TLS tunnel initiation...");
          await new Promise(r => setTimeout(r, 800));
          setObfuscationStrength(40);
      }

      addLog("Connected! Tunneling all traffic.");
      setIsConnected(true);
      toast.success('VPN Connected Successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown connection error";
      addLog(`CRITICAL ERROR: ${message}`);
      setObfuscationStrength(0);
      setIsConnected(false);
      toast.error('Connection Failed');
    } finally {
      setIsConnecting(false);
    }
  };

  const startScanner = async () => {
    setIsScanning(true);
    addLog("Starting Silent SNI Scanner...");
    const hosts = ['m.whatsapp.net', 'portalrecarga.vivo.com.br', 'm.tim.com.br', 'claro.com.br'];
    for (const host of hosts) {
      addLog(`Testing host: ${host}...`);
      await new Promise(r => setTimeout(r, 1000));
      if (Math.random() > 0.5) {
        addLog(`Success! Host ${host} is open.`);
        setSelectedPayload(prev => ({ ...prev, sni: host }));
        break;
      }
    }
    setIsScanning(false);
    addLog("Scanner finished.");
  };

  const handleAddPayload = () => {
    const errors: { name?: string; sni?: string } = {};
    if (!newPayload.name?.trim()) errors.name = 'Payload name is required';
    if (!newPayload.sni?.trim()) errors.sni = 'SNI/Host is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const payload: Payload = {
      id: `custom-${Date.now()}`,
      name: newPayload.name!,
      carrier: newPayload.carrier || 'Custom',
      sni: newPayload.sni!,
      method: (newPayload.method as PayloadMethod) || 'TLS',
      isCustom: true
    };
    setCustomPayloads(prev => [...prev, payload]);
    setNewPayload({ name: '', carrier: 'Custom', sni: '', method: 'TLS' });
    setFormErrors({});
    setIsAddPayloadModalOpen(false);
    addLog(`Custom payload added: ${payload.name}`);
    toast.success('Payload added successfully');
  };

  const handleDeletePayload = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomPayloads(prev => prev.filter(p => p.id !== id));
    if (selectedPayload.id === id) setSelectedPayload(PAYLOADS[0]);
    toast.success('Payload deleted');
  };

  const exportConfig = () => {
    const config = {
      version: '5.0.0',
      customPayloads,
      selectedServer,
      selectedPayload,
      settings: {
        hotspotEnabled,
        autoHealing,
        exitPoint,
        dpiBypass,
        fragmentation
      }
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nettunnel_config_${Date.now()}.json`;
    a.click();
    addLog("Configuration exported successfully.");
    toast.success('Configuration exported');
  };

  const importConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const config = JSON.parse(event.target?.result as string);
        if (config.customPayloads) setCustomPayloads(config.customPayloads);
        if (config.selectedServer) setSelectedServer(config.selectedServer);
        if (config.selectedPayload) setSelectedPayload(config.selectedPayload);
        if (config.settings) {
          setHotspotEnabled(config.settings.hotspotEnabled);
          setAutoHealing(config.settings.autoHealing);
          setExitPoint(config.settings.exitPoint);
          setDpiBypass(config.settings.dpiBypass);
          setFragmentation(config.settings.fragmentation);
        }
        addLog("Configuration imported successfully.");
        toast.success('Configuration imported');
      } catch (err) {
        addLog("Error: Invalid configuration file.");
        toast.error('Invalid configuration file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#E0E0E6] font-sans selection:bg-red-500/30">
      {/* Hardware Surround Effect */}
      <div className="fixed inset-0 pointer-events-none border-[12px] border-[#1A1B1E] z-50 rounded-[24px]" />
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(0,0,0,0.4)_100%)] z-40" />

      <main className="max-w-md mx-auto pt-12 pb-24 px-6 relative z-10">
        
        {/* Header */}
        <header className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20">
              <Shield className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight uppercase">NetTunnel <span className="text-red-500">Pro</span></h1>
              <p className="text-[10px] font-mono text-[#8E9299] tracking-widest uppercase">v5.0.0-merged</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={startScanner}
              disabled={isScanning}
              className={cn(
                "p-2 hover:bg-white/5 rounded-full transition-colors",
                isScanning && "animate-spin text-red-500"
              )}
              title="Scan SNI"
            >
              <Activity className="w-5 h-5 text-[#8E9299]" />
            </button>
            <label className="p-2 hover:bg-white/5 rounded-full transition-colors cursor-pointer" title="Import Config">
              <Upload className="w-5 h-5 text-[#8E9299]" />
              <input type="file" className="hidden" onChange={importConfig} accept=".json" />
            </label>
            <button onClick={exportConfig} className="p-2 hover:bg-white/5 rounded-full transition-colors" title="Export Config">
              <Download className="w-5 h-5 text-[#8E9299]" />
            </button>
            <button 
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-2 hover:bg-white/5 rounded-full transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5 text-[#8E9299]" />
            </button>
            {user && (
              <button 
                onClick={logout}
                className="p-2 hover:bg-white/5 rounded-full transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5 text-[#8E9299]" />
              </button>
            )}
          </div>
        </header>

        {/* Connection Status Card */}
        <section className="bg-[#151619] border border-[#2A2B2F] rounded-2xl p-6 mb-8 shadow-2xl relative overflow-hidden">
          <AnimatePresence>
            {isConnecting && (
              <motion.div 
                initial={{ top: '-100%' }}
                animate={{ top: '100%' }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 right-0 h-20 bg-gradient-to-b from-transparent via-red-500/10 to-transparent z-0 pointer-events-none"
              />
            )}
          </AnimatePresence>

          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Activity className="w-24 h-24" />
          </div>

          <div className="flex justify-between items-start mb-8 relative z-10">
            <div>
              <p className="text-[10px] font-mono text-[#8E9299] uppercase tracking-wider mb-1">Status</p>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  isConnected ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" : 
                  isConnecting ? "bg-yellow-500 animate-bounce" : "bg-red-500"
                )} />
                <span className={cn(
                  "text-lg font-bold uppercase tracking-tight",
                  isConnected ? "text-green-500" : isConnecting ? "text-yellow-500" : "text-red-500"
                )}>
                  {isConnected ? "Connected" : isConnecting ? "Connecting..." : "Disconnected"}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-mono text-[#8E9299] uppercase tracking-wider mb-1">Obfuscation</p>
              <p className={cn(
                "text-lg font-mono font-bold",
                obfuscationStrength > 80 ? "text-green-500" : obfuscationStrength > 50 ? "text-yellow-500" : "text-red-500"
              )}>{obfuscationStrength}%</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8 relative z-10">
            <div className="bg-[#1C1D21] border border-[#2A2B2F] rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <ChevronDown className="w-3 h-3 text-green-500" />
                <span className="text-[10px] font-mono text-[#8E9299] uppercase">Download</span>
              </div>
              <p className="text-xl font-mono font-bold">{stats.down} <span className="text-xs font-normal text-[#8E9299]">MB/s</span></p>
            </div>
            <div className="bg-[#1C1D21] border border-[#2A2B2F] rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <ChevronDown className="w-3 h-3 text-blue-500 rotate-180" />
                <span className="text-[10px] font-mono text-[#8E9299] uppercase">Upload</span>
              </div>
              <p className="text-xl font-mono font-bold">{stats.up} <span className="text-xs font-normal text-[#8E9299]">MB/s</span></p>
            </div>
          </div>

          {/* Connection Time */}
          <div className="bg-[#1C1D21] border border-[#2A2B2F] rounded-xl p-3 mb-8 relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-3 h-3 text-yellow-500" />
              <span className="text-[10px] font-mono text-[#8E9299] uppercase">Connection Time</span>
            </div>
            <p className="text-xl font-mono font-bold">{stats.time}</p>
          </div>

          {/* Main Toggle Button */}
          <div className="flex justify-center relative z-10">
            <button 
              onClick={handleToggle}
              disabled={isConnecting}
              className="group relative"
            >
              <div className={cn(
                "absolute inset-0 rounded-full blur-2xl transition-opacity duration-500",
                isConnected ? "bg-green-500/20 opacity-100" : "bg-red-500/10 opacity-0 group-hover:opacity-100"
              )} />
              <div className={cn(
                "relative w-24 h-24 rounded-full border-4 flex items-center justify-center transition-all duration-300",
                isConnected ? "border-green-500 bg-green-500/10" : "border-[#2A2B2F] bg-[#1C1D21] hover:border-red-500/50"
              )}>
                {isConnecting ? (
                  <RefreshCw className="w-10 h-10 text-yellow-500 animate-spin" />
                ) : (
                  <Power className={cn(
                    "w-10 h-10 transition-colors",
                    isConnected ? "text-green-500" : "text-[#8E9299] group-hover:text-red-500"
                  )} />
                )}
              </div>
            </button>
          </div>
        </section>

        {/* Configuration Selectors */}
        <div className="space-y-4 mb-8">
          {/* Server Selector */}
          <button
            onClick={() => setIsServerModalOpen(true)}
            className="w-full bg-[#151619] border border-[#2A2B2F] rounded-xl p-4 hover:border-red-500/30 transition-colors text-left"
          >
            <p className="text-[10px] font-mono text-[#8E9299] uppercase tracking-wider mb-2">Server</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold">{selectedServer.name}</p>
                <p className="text-xs text-[#8E9299]">{selectedServer.flag} {selectedServer.latency}ms</p>
              </div>
              <Globe className="w-5 h-5 text-red-500" />
            </div>
          </button>

          {/* Payload Selector */}
          <button
            onClick={() => setIsPayloadModalOpen(true)}
            className="w-full bg-[#151619] border border-[#2A2B2F] rounded-xl p-4 hover:border-red-500/30 transition-colors text-left"
          >
            <p className="text-[10px] font-mono text-[#8E9299] uppercase tracking-wider mb-2">Payload</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold">{selectedPayload.name}</p>
                <p className="text-xs text-[#8E9299]">{selectedPayload.sni}</p>
              </div>
              <Lock className="w-5 h-5 text-red-500" />
            </div>
          </button>
        </div>

        {/* Logs Terminal */}
        <div className="bg-[#0A0A0B] border border-[#2A2B2F] rounded-xl p-4 mb-8 max-h-64 overflow-y-auto font-mono text-xs">
          <p className="text-[10px] font-mono text-[#8E9299] uppercase tracking-wider mb-3">Logs</p>
          {logs.length === 0 ? (
            <p className="text-[#8E9299]">Waiting for connection...</p>
          ) : (
            logs.map((log, i) => (
              <p key={i} className="text-green-500/70 mb-1 break-words">{log}</p>
            ))
          )}
          <div ref={logEndRef} />
        </div>
      </main>

      {/* Server Selection Modal */}
      <Dialog open={isServerModalOpen} onOpenChange={setIsServerModalOpen}>
        <DialogContent className="bg-[#151619] border-[#2A2B2F]">
          <DialogHeader>
            <DialogTitle className="text-white">Select Server</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {SERVERS.map(server => (
              <button
                key={server.id}
                onClick={() => {
                  setSelectedServer(server);
                  setIsServerModalOpen(false);
                }}
                className={cn(
                  "w-full p-3 rounded-lg border text-left transition-colors",
                  selectedServer.id === server.id
                    ? "bg-red-500/10 border-red-500"
                    : "bg-[#1C1D21] border-[#2A2B2F] hover:border-red-500/30"
                )}
              >
                <p className="font-bold">{server.flag} {server.name}</p>
                <p className="text-xs text-[#8E9299]">{server.latency}ms</p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Payload Selection Modal */}
      <Dialog open={isPayloadModalOpen} onOpenChange={setIsPayloadModalOpen}>
        <DialogContent className="bg-[#151619] border-[#2A2B2F]">
          <DialogHeader>
            <DialogTitle className="text-white">Select Payload</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {[...PAYLOADS, ...customPayloads].map(payload => (
              <button
                key={payload.id}
                onClick={() => {
                  setSelectedPayload(payload);
                  setIsPayloadModalOpen(false);
                }}
                className={cn(
                  "w-full p-3 rounded-lg border text-left transition-colors flex justify-between items-start",
                  selectedPayload.id === payload.id
                    ? "bg-red-500/10 border-red-500"
                    : "bg-[#1C1D21] border-[#2A2B2F] hover:border-red-500/30"
                )}
              >
                <div>
                  <p className="font-bold">{payload.name}</p>
                  <p className="text-xs text-[#8E9299]">{payload.carrier} • {payload.method}</p>
                  <p className="text-xs text-[#8E9299]">{payload.sni}</p>
                </div>
                {payload.isCustom && (
                  <button
                    onClick={(e) => handleDeletePayload(payload.id, e)}
                    className="p-1 hover:bg-red-500/20 rounded"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                )}
              </button>
            ))}
            <button
              onClick={() => {
                setIsPayloadModalOpen(false);
                setIsAddPayloadModalOpen(true);
              }}
              className="w-full p-3 rounded-lg border border-dashed border-[#2A2B2F] hover:border-red-500/30 transition-colors flex items-center justify-center gap-2 text-[#8E9299]"
            >
              <Plus className="w-4 h-4" />
              Add Custom Payload
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Payload Modal */}
      <Dialog open={isAddPayloadModalOpen} onOpenChange={setIsAddPayloadModalOpen}>
        <DialogContent className="bg-[#151619] border-[#2A2B2F]">
          <DialogHeader>
            <DialogTitle className="text-white">Add Custom Payload</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-[#8E9299]">Payload Name</Label>
              <Input
                value={newPayload.name || ''}
                onChange={(e) => setNewPayload({ ...newPayload, name: e.target.value })}
                placeholder="e.g., My Custom Payload"
                className="bg-[#1C1D21] border-[#2A2B2F] text-white"
              />
              {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
            </div>
            <div>
              <Label className="text-[#8E9299]">Carrier</Label>
              <Input
                value={newPayload.carrier || ''}
                onChange={(e) => setNewPayload({ ...newPayload, carrier: e.target.value })}
                placeholder="e.g., Vivo"
                className="bg-[#1C1D21] border-[#2A2B2F] text-white"
              />
            </div>
            <div>
              <Label className="text-[#8E9299]">SNI/Host</Label>
              <Input
                value={newPayload.sni || ''}
                onChange={(e) => setNewPayload({ ...newPayload, sni: e.target.value })}
                placeholder="e.g., portalrecarga.vivo.com.br"
                className="bg-[#1C1D21] border-[#2A2B2F] text-white"
              />
              {formErrors.sni && <p className="text-red-500 text-xs mt-1">{formErrors.sni}</p>}
            </div>
            <div>
              <Label className="text-[#8E9299]">Method</Label>
              <Select value={newPayload.method} onValueChange={(value) => setNewPayload({ ...newPayload, method: value as PayloadMethod })}>
                <SelectTrigger className="bg-[#1C1D21] border-[#2A2B2F] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#151619] border-[#2A2B2F]">
                  <SelectItem value="TLS">TLS</SelectItem>
                  <SelectItem value="VLESS">VLESS</SelectItem>
                  <SelectItem value="VMESS">VMESS</SelectItem>
                  <SelectItem value="TROJAN">TROJAN</SelectItem>
                  <SelectItem value="WS+TLS">WS+TLS</SelectItem>
                  <SelectItem value="SLOWDNS">SLOWDNS</SelectItem>
                  <SelectItem value="DNSTT">DNSTT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleAddPayload}
              className="w-full bg-red-500 hover:bg-red-600"
            >
              Add Payload
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Modal */}
      <Dialog open={isSettingsModalOpen} onOpenChange={setIsSettingsModalOpen}>
        <DialogContent className="bg-[#151619] border-[#2A2B2F] max-h-96 overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Advanced Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[#8E9299]">Hotspot Mode</Label>
                <Switch checked={hotspotEnabled} onCheckedChange={setHotspotEnabled} />
              </div>
              <p className="text-xs text-[#8E9299]">Share VPN via mobile hotspot</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[#8E9299]">Auto Healing</Label>
                <Switch checked={autoHealing} onCheckedChange={setAutoHealing} />
              </div>
              <p className="text-xs text-[#8E9299]">Automatically reconnect on failure</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[#8E9299]">DPI Bypass</Label>
                <Switch checked={dpiBypass} onCheckedChange={setDpiBypass} />
              </div>
              <p className="text-xs text-[#8E9299]">Enable packet fragmentation</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[#8E9299]">Fragmentation</Label>
                <Switch checked={fragmentation} onCheckedChange={setFragmentation} />
              </div>
              <p className="text-xs text-[#8E9299]">Split packets to evade detection</p>
            </div>

            <div className="space-y-2">
              <Label className="text-[#8E9299]">Exit Point</Label>
              <Select value={exitPoint} onValueChange={(value) => setExitPoint(value as 'CLOUDFLARE' | 'VPS')}>
                <SelectTrigger className="bg-[#1C1D21] border-[#2A2B2F] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#151619] border-[#2A2B2F]">
                  <SelectItem value="CLOUDFLARE">Cloudflare (gRPC)</SelectItem>
                  <SelectItem value="VPS">Back-to-Back VPS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {user && (
              <div className="pt-4 border-t border-[#2A2B2F]">
                <p className="text-xs text-[#8E9299] mb-2">Logged in as: <span className="text-white font-bold">{user.name || user.email}</span></p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
