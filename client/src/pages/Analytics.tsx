import React, { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  AreaChart,
  Area
} from 'recharts';
import {
  TrendingUp,
  Activity,
  Zap,
  Globe,
  Calendar,
  Download,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocation } from 'wouter';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Mock Analytics Data
const uptimeData = [
  { name: 'Jan', Vivo: 98.5, Claro: 97.2, Oi: 96.8, Tim: 98.1 },
  { name: 'Feb', Vivo: 99.1, Claro: 98.3, Oi: 97.5, Tim: 98.9 },
  { name: 'Mar', Vivo: 98.8, Claro: 97.9, Oi: 98.2, Tim: 98.5 },
  { name: 'Apr', Vivo: 99.3, Claro: 98.7, Oi: 98.9, Tim: 99.1 },
  { name: 'May', Vivo: 99.0, Claro: 98.5, Oi: 98.1, Tim: 98.8 },
];

const latencyData = [
  { name: 'Mon', Vivo: 24, Claro: 35, Oi: 42, Tim: 28 },
  { name: 'Tue', Vivo: 26, Claro: 33, Oi: 40, Tim: 30 },
  { name: 'Wed', Vivo: 22, Claro: 38, Oi: 45, Tim: 25 },
  { name: 'Thu', Vivo: 28, Claro: 36, Oi: 43, Tim: 32 },
  { name: 'Fri', Vivo: 25, Claro: 34, Oi: 41, Tim: 27 },
  { name: 'Sat', Vivo: 23, Claro: 32, Oi: 39, Tim: 26 },
  { name: 'Sun', Vivo: 27, Claro: 37, Oi: 44, Tim: 31 },
];

const carrierSuccessRate = [
  { name: 'Vivo', value: 98.5, fill: '#ef4444' },
  { name: 'Claro', value: 97.2, fill: '#f97316' },
  { name: 'Oi', value: 96.8, fill: '#eab308' },
  { name: 'Tim', value: 98.1, fill: '#3b82f6' },
];

const sniPerformance = [
  { sni: 'portalrecarga.vivo.com.br', carrier: 'Vivo', success: 98.5, latency: 24, tests: 1250 },
  { sni: 'meuvivo.vivo.com.br', carrier: 'Vivo', success: 97.2, latency: 28, tests: 980 },
  { sni: 'm.tim.com.br', carrier: 'Tim', success: 98.1, latency: 28, tests: 1100 },
  { sni: 'tim.com.br', carrier: 'Tim', success: 96.5, latency: 32, tests: 850 },
  { sni: 'claro.com.br', carrier: 'Claro', success: 97.2, latency: 35, tests: 920 },
  { sni: 'meu.claro.com.br', carrier: 'Claro', success: 96.8, latency: 38, tests: 750 },
  { sni: 'oi.com.br', carrier: 'Oi', success: 96.8, latency: 42, tests: 680 },
  { sni: 'oi.net.br', carrier: 'Oi', success: 95.9, latency: 45, tests: 520 },
];

const radarData = [
  { carrier: 'Vivo', uptime: 98.5, latency: 76, stability: 95, speed: 92 },
  { carrier: 'Claro', uptime: 97.2, latency: 65, stability: 90, speed: 88 },
  { carrier: 'Oi', uptime: 96.8, latency: 58, stability: 88, speed: 85 },
  { carrier: 'Tim', uptime: 98.1, latency: 72, stability: 93, speed: 90 },
];

const connectionHistoryData = [
  { time: '00:00', connections: 45, failed: 2, avgLatency: 24 },
  { time: '04:00', connections: 32, failed: 1, avgLatency: 26 },
  { time: '08:00', connections: 78, failed: 3, avgLatency: 28 },
  { time: '12:00', connections: 125, failed: 5, avgLatency: 25 },
  { time: '16:00', connections: 156, failed: 4, avgLatency: 23 },
  { time: '20:00', connections: 98, failed: 2, avgLatency: 27 },
  { time: '23:59', connections: 52, failed: 1, avgLatency: 24 },
];

export default function Analytics() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedCarrier, setSelectedCarrier] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setIsLoading(false);
  };

  const handleExport = () => {
    const data = {
      timestamp: new Date().toISOString(),
      timeRange,
      selectedCarrier,
      uptime: uptimeData,
      latency: latencyData,
      sniPerformance,
      carrierSuccessRate,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nettunnel_analytics_${Date.now()}.json`;
    a.click();
  };

  const bestSNIByCarrier = {
    Vivo: sniPerformance.filter(s => s.carrier === 'Vivo').sort((a, b) => b.success - a.success)[0],
    Claro: sniPerformance.filter(s => s.carrier === 'Claro').sort((a, b) => b.success - a.success)[0],
    Oi: sniPerformance.filter(s => s.carrier === 'Oi').sort((a, b) => b.success - a.success)[0],
    Tim: sniPerformance.filter(s => s.carrier === 'Tim').sort((a, b) => b.success - a.success)[0],
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#E0E0E6] font-sans">
      {/* Hardware Surround Effect */}
      <div className="fixed inset-0 pointer-events-none border-[12px] border-[#1A1B1E] z-50 rounded-[24px]" />
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(0,0,0,0.4)_100%)] z-40" />

      <main className="max-w-7xl mx-auto pt-8 pb-12 px-6 relative z-10">
        
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLocation('/')}
              className="p-2 hover:bg-white/5 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-[#8E9299]" />
            </button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight uppercase">Analytics Dashboard</h1>
              <p className="text-[10px] font-mono text-[#8E9299] tracking-widest uppercase">Real-time Performance Metrics</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className={cn(
                "p-2 hover:bg-white/5 rounded-full transition-colors",
                isLoading && "animate-spin"
              )}
            >
              <RefreshCw className="w-5 h-5 text-[#8E9299]" />
            </button>
            <button
              onClick={handleExport}
              className="p-2 hover:bg-white/5 rounded-full transition-colors"
            >
              <Download className="w-5 h-5 text-[#8E9299]" />
            </button>
          </div>
        </header>

        {/* Controls */}
        <div className="flex gap-4 mb-8">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40 bg-[#151619] border-[#2A2B2F] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#151619] border-[#2A2B2F]">
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedCarrier} onValueChange={setSelectedCarrier}>
            <SelectTrigger className="w-40 bg-[#151619] border-[#2A2B2F] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#151619] border-[#2A2B2F]">
              <SelectItem value="all">All Carriers</SelectItem>
              <SelectItem value="vivo">Vivo</SelectItem>
              <SelectItem value="claro">Claro</SelectItem>
              <SelectItem value="oi">Oi</SelectItem>
              <SelectItem value="tim">Tim</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#151619] border border-[#2A2B2F] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-mono text-[#8E9299] uppercase tracking-wider">Avg Uptime</p>
              <Activity className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-500">98.1%</p>
            <p className="text-xs text-[#8E9299] mt-1">↑ 0.3% from last period</p>
          </div>

          <div className="bg-[#151619] border border-[#2A2B2F] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-mono text-[#8E9299] uppercase tracking-wider">Avg Latency</p>
              <Zap className="w-4 h-4 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold text-yellow-500">32ms</p>
            <p className="text-xs text-[#8E9299] mt-1">↓ 2ms from last period</p>
          </div>

          <div className="bg-[#151619] border border-[#2A2B2F] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-mono text-[#8E9299] uppercase tracking-wider">Total Tests</p>
              <Globe className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-blue-500">6,900</p>
            <p className="text-xs text-[#8E9299] mt-1">↑ 450 tests this period</p>
          </div>

          <div className="bg-[#151619] border border-[#2A2B2F] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-mono text-[#8E9299] uppercase tracking-wider">Success Rate</p>
              <TrendingUp className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-red-500">97.5%</p>
            <p className="text-xs text-[#8E9299] mt-1">↑ 0.8% from last period</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          {/* Uptime Trend */}
          <div className="bg-[#151619] border border-[#2A2B2F] rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Uptime Trend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={uptimeData}>
                <defs>
                  <linearGradient id="colorVivo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorClaro" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#eab308" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorTim" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2B2F" />
                <XAxis dataKey="name" stroke="#8E9299" />
                <YAxis stroke="#8E9299" domain={[95, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#1C1D21', border: '1px solid #2A2B2F' }} />
                <Legend />
                <Area type="monotone" dataKey="Vivo" stroke="#ef4444" fillOpacity={1} fill="url(#colorVivo)" />
                <Area type="monotone" dataKey="Claro" stroke="#f97316" fillOpacity={1} fill="url(#colorClaro)" />
                <Area type="monotone" dataKey="Oi" stroke="#eab308" fillOpacity={1} fill="url(#colorOi)" />
                <Area type="monotone" dataKey="Tim" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTim)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Latency by Carrier */}
          <div className="bg-[#151619] border border-[#2A2B2F] rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Latency by Carrier
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={latencyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2B2F" />
                <XAxis dataKey="name" stroke="#8E9299" />
                <YAxis stroke="#8E9299" />
                <Tooltip contentStyle={{ backgroundColor: '#1C1D21', border: '1px solid #2A2B2F' }} />
                <Legend />
                <Line type="monotone" dataKey="Vivo" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444' }} />
                <Line type="monotone" dataKey="Claro" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316' }} />
                <Line type="monotone" dataKey="Oi" stroke="#eab308" strokeWidth={2} dot={{ fill: '#eab308' }} />
                <Line type="monotone" dataKey="Tim" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Success Rate by Carrier */}
          <div className="bg-[#151619] border border-[#2A2B2F] rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-500" />
              Success Rate by Carrier
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={carrierSuccessRate}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {carrierSuccessRate.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1C1D21', border: '1px solid #2A2B2F' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Carrier Performance Radar */}
          <div className="bg-[#151619] border border-[#2A2B2F] rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-500" />
              Carrier Performance Radar
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#2A2B2F" />
                <PolarAngleAxis dataKey="carrier" stroke="#8E9299" />
                <PolarRadiusAxis stroke="#8E9299" />
                <Radar name="Uptime" dataKey="uptime" stroke="#ef4444" fill="#ef4444" fillOpacity={0.25} />
                <Radar name="Stability" dataKey="stability" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} />
                <Legend />
                <Tooltip contentStyle={{ backgroundColor: '#1C1D21', border: '1px solid #2A2B2F' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Best SNI by Carrier */}
        <div className="bg-[#151619] border border-[#2A2B2F] rounded-xl p-6 mb-8">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-red-500" />
            Best SNI by Carrier
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(bestSNIByCarrier).map(([carrier, sni]) => (
              <div key={carrier} className="bg-[#1C1D21] border border-[#2A2B2F] rounded-lg p-4">
                <p className="text-sm font-bold text-red-500 mb-2">{carrier}</p>
                <p className="text-xs text-[#8E9299] mb-3 break-words">{sni?.sni}</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#8E9299]">Success:</span>
                    <span className="text-green-500 font-bold">{sni?.success}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#8E9299]">Latency:</span>
                    <span className="text-yellow-500 font-bold">{sni?.latency}ms</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#8E9299]">Tests:</span>
                    <span className="text-blue-500 font-bold">{sni?.tests}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Connection History */}
        <div className="bg-[#151619] border border-[#2A2B2F] rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-500" />
            Connection History (24h)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={connectionHistoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2B2F" />
              <XAxis dataKey="time" stroke="#8E9299" />
              <YAxis stroke="#8E9299" />
              <Tooltip contentStyle={{ backgroundColor: '#1C1D21', border: '1px solid #2A2B2F' }} />
              <Legend />
              <Bar dataKey="connections" fill="#3b82f6" name="Connections" />
              <Bar dataKey="failed" fill="#ef4444" name="Failed" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* SNI Performance Table */}
        <div className="bg-[#151619] border border-[#2A2B2F] rounded-xl p-6 mt-8">
          <h3 className="text-lg font-bold mb-4">SNI Performance Details</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2A2B2F]">
                  <th className="text-left py-3 px-4 text-[#8E9299] font-mono text-xs uppercase">SNI</th>
                  <th className="text-left py-3 px-4 text-[#8E9299] font-mono text-xs uppercase">Carrier</th>
                  <th className="text-right py-3 px-4 text-[#8E9299] font-mono text-xs uppercase">Success</th>
                  <th className="text-right py-3 px-4 text-[#8E9299] font-mono text-xs uppercase">Latency</th>
                  <th className="text-right py-3 px-4 text-[#8E9299] font-mono text-xs uppercase">Tests</th>
                </tr>
              </thead>
              <tbody>
                {sniPerformance.map((item, idx) => (
                  <tr key={idx} className="border-b border-[#2A2B2F] hover:bg-[#1C1D21] transition-colors">
                    <td className="py-3 px-4 text-xs break-words max-w-xs">{item.sni}</td>
                    <td className="py-3 px-4 text-xs">{item.carrier}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={cn(
                        "font-bold",
                        item.success > 98 ? "text-green-500" : item.success > 97 ? "text-yellow-500" : "text-red-500"
                      )}>
                        {item.success}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-yellow-500 font-bold">{item.latency}ms</td>
                    <td className="py-3 px-4 text-right text-blue-500 font-bold">{item.tests}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
