import React, { useState } from 'react';
import { Play, Download, RotateCcw, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { CARRIERS_DATABASE, getCarrierById } from '@/lib/carriers-database';
import {
  testCarrierConfigurations,
  generateTestReport,
  exportTestResults,
  exportTestResultsAsCSV,
  getBestConfiguration,
  getWorstConfiguration,
  TestReport,
} from '@/lib/connection-validator';

interface TestRunnerProps {
  carrierId: string;
  disabled?: boolean;
}

/**
 * Test Runner Component
 * 
 * Allows users to run comprehensive tests on all carrier configurations
 * and view detailed results with export options.
 */
export function TestRunner({ carrierId, disabled = false }: TestRunnerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [testReport, setTestReport] = useState<TestReport | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const carrier = getCarrierById(carrierId);

  async function handleRunTests() {
    if (!carrier) return;

    setIsRunning(true);
    try {
      const report = await testCarrierConfigurations(carrier);
      setTestReport(report);
      setShowDetails(true);
    } finally {
      setIsRunning(false);
    }
  }

  function handleExportJSON() {
    if (!testReport) return;
    const json = exportTestResults(testReport);
    downloadFile(json, `test-report-${carrierId}.json`, 'application/json');
  }

  function handleExportCSV() {
    if (!testReport) return;
    const csv = exportTestResultsAsCSV(testReport);
    downloadFile(csv, `test-report-${carrierId}.csv`, 'text/csv');
  }

  function downloadFile(content: string, filename: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const successRate = testReport
    ? ((testReport.successCount / testReport.totalTests) * 100).toFixed(1)
    : 0;

  const bestConfig = testReport ? getBestConfiguration(testReport) : null;
  const worstConfig = testReport ? getWorstConfiguration(testReport) : null;

  return (
    <div className="space-y-4 bg-slate-900/50 border border-slate-700/50 rounded-sm p-4">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-mono font-semibold text-slate-300 uppercase tracking-widest">
            Teste de Configurações
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {carrier?.name} - {carrier?.snis.length || 0} SNIs × {carrier?.servers.length || 0} Servidores
          </p>
        </div>
        <button
          onClick={handleRunTests}
          disabled={disabled || isRunning || !carrier}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-mono text-sm rounded-sm transition-all"
        >
          {isRunning ? (
            <>
              <Clock size={16} className="animate-spin" />
              Testando...
            </>
          ) : (
            <>
              <Play size={16} />
              Executar Testes
            </>
          )}
        </button>
      </div>

      {/* TEST RESULTS SUMMARY */}
      {testReport && (
        <>
          <div className="grid grid-cols-4 gap-2">
            <div className="p-3 bg-slate-800/60 border border-slate-700/50 rounded-sm">
              <p className="text-xs text-slate-400 font-mono uppercase">Total</p>
              <p className="text-2xl font-bold text-slate-100 mt-1">{testReport.totalTests}</p>
            </div>

            <div className="p-3 bg-green-900/30 border border-green-500/30 rounded-sm">
              <p className="text-xs text-green-400 font-mono uppercase">Sucesso</p>
              <p className="text-2xl font-bold text-green-400 mt-1">{testReport.successCount}</p>
            </div>

            <div className="p-3 bg-red-900/30 border border-red-500/30 rounded-sm">
              <p className="text-xs text-red-400 font-mono uppercase">Falha</p>
              <p className="text-2xl font-bold text-red-400 mt-1">{testReport.failureCount}</p>
            </div>

            <div className="p-3 bg-cyan-900/30 border border-cyan-500/30 rounded-sm">
              <p className="text-xs text-cyan-400 font-mono uppercase">Taxa</p>
              <p className="text-2xl font-bold text-cyan-400 mt-1">{successRate}%</p>
            </div>
          </div>

          {/* BEST AND WORST CONFIGURATIONS */}
          <div className="grid grid-cols-2 gap-3">
            {bestConfig && (
              <div className="p-3 bg-green-900/20 border border-green-500/40 rounded-sm">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 size={16} className="text-green-400" />
                  <p className="text-xs font-mono text-green-400 uppercase">Melhor Configuração</p>
                </div>
                <div className="space-y-1 text-xs font-mono text-slate-300">
                  <p>
                    <span className="text-green-400">SNI:</span> {bestConfig.sni}
                  </p>
                  <p>
                    <span className="text-green-400">Payload:</span> {bestConfig.payload}
                  </p>
                  <p>
                    <span className="text-green-400">Latência:</span> {bestConfig.latency}ms
                  </p>
                  <p>
                    <span className="text-green-400">Banda:</span> {bestConfig.bandwidth}Mbps
                  </p>
                </div>
              </div>
            )}

            {worstConfig && (
              <div className="p-3 bg-red-900/20 border border-red-500/40 rounded-sm">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle size={16} className="text-red-400" />
                  <p className="text-xs font-mono text-red-400 uppercase">Pior Configuração</p>
                </div>
                <div className="space-y-1 text-xs font-mono text-slate-300">
                  <p>
                    <span className="text-red-400">SNI:</span> {worstConfig.sni}
                  </p>
                  <p>
                    <span className="text-red-400">Payload:</span> {worstConfig.payload}
                  </p>
                  <p>
                    <span className="text-red-400">Erro:</span> {worstConfig.errorMessage}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* EXPORT BUTTONS */}
          <div className="flex gap-2">
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-2 flex-1 px-3 py-2 bg-slate-800/60 border border-slate-700/50 hover:border-cyan-400/40 text-slate-300 font-mono text-xs rounded-sm transition-all"
            >
              <Download size={14} />
              Exportar JSON
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 flex-1 px-3 py-2 bg-slate-800/60 border border-slate-700/50 hover:border-cyan-400/40 text-slate-300 font-mono text-xs rounded-sm transition-all"
            >
              <Download size={14} />
              Exportar CSV
            </button>
            <button
              onClick={() => {
                setTestReport(null);
                setShowDetails(false);
              }}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800/60 border border-slate-700/50 hover:border-cyan-400/40 text-slate-300 font-mono text-xs rounded-sm transition-all"
            >
              <RotateCcw size={14} />
            </button>
          </div>

          {/* DETAILED RESULTS */}
          {showDetails && (
            <div className="max-h-96 overflow-y-auto p-3 bg-slate-800/40 border border-slate-700/30 rounded-sm space-y-2">
              <p className="text-xs font-mono text-slate-400 uppercase tracking-widest sticky top-0 bg-slate-800/60 py-2">
                Resultados Detalhados
              </p>

              {testReport.results.map((result, index) => (
                <div
                  key={index}
                  className={`p-2 rounded-sm border text-xs font-mono ${
                    result.status === 'success'
                      ? 'bg-green-900/20 border-green-500/30'
                      : 'bg-red-900/20 border-red-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={result.status === 'success' ? 'text-green-400' : 'text-red-400'}>
                      {result.status === 'success' ? '✅' : '❌'} {result.server}
                    </span>
                    <span className="text-slate-400">{result.duration}ms</span>
                  </div>
                  <p className="text-slate-400">
                    SNI: {result.sni} | Payload: {result.payload}
                  </p>
                  {result.status === 'success' ? (
                    <p className="text-green-400 mt-1">
                      Latência: {result.latency}ms | Banda: {result.bandwidth}Mbps
                    </p>
                  ) : (
                    <p className="text-red-400 mt-1">{result.errorMessage}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {!testReport && (
        <div className="p-4 bg-slate-800/40 border border-slate-700/30 rounded-sm text-center">
          <p className="text-xs text-slate-400 font-mono">
            Clique em "Executar Testes" para validar todas as configurações
          </p>
        </div>
      )}
    </div>
  );
}
