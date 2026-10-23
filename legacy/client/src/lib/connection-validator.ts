/**
 * Connection Validator
 * 
 * System for validating and testing VPN configurations
 * including carrier SNI, payload methods, and connection protocols.
 */

import { CarrierConfig, ServerConfig, SNIConfig, PayloadConfig } from './carriers-database';

export type ValidationStatus = 'pending' | 'testing' | 'success' | 'failed' | 'timeout';

export interface ValidationResult {
  status: ValidationStatus;
  carrier: string;
  server: string;
  sni: string;
  payload: string;
  latency?: number;
  bandwidth?: number;
  errorMessage?: string;
  timestamp: Date;
  duration: number; // milliseconds
}

export interface TestReport {
  carrierId: string;
  totalTests: number;
  successCount: number;
  failureCount: number;
  averageLatency: number;
  results: ValidationResult[];
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate SNI configuration syntax
 */
export function validateSNIConfig(sni: SNIConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!sni.domain || sni.domain.trim().length === 0) {
    errors.push('SNI domain is required');
  }

  if (sni.priority < 1 || sni.priority > 10) {
    errors.push('Priority must be between 1 and 10');
  }

  if (!sni.payloads || sni.payloads.length === 0) {
    errors.push('At least one payload method is required');
  }

  sni.payloads.forEach((payload, index) => {
    const payloadErrors = validatePayloadConfig(payload);
    if (payloadErrors.length > 0) {
      errors.push(`Payload ${index}: ${payloadErrors.join(', ')}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate payload configuration
 */
export function validatePayloadConfig(payload: PayloadConfig): string[] {
  const errors: string[] = [];

  if (!payload.method) {
    errors.push('Payload method is required');
  }

  if (payload.fragment) {
    if (!payload.fragment.packets) {
      errors.push('Fragment packets is required');
    }
    if (!payload.fragment.length) {
      errors.push('Fragment length is required');
    }
  }

  return errors;
}

/**
 * Validate server configuration
 */
export function validateServerConfig(server: ServerConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!server.name || server.name.trim().length === 0) {
    errors.push('Server name is required');
  }

  if (!server.address || server.address.trim().length === 0) {
    errors.push('Server address is required');
  }

  if (server.port < 1 || server.port > 65535) {
    errors.push('Port must be between 1 and 65535');
  }

  if (!server.protocol) {
    errors.push('Protocol is required');
  }

  if (server.protocol === 'vless' && !server.uuid) {
    errors.push('UUID is required for VLESS protocol');
  }

  if (server.protocol === 'trojan' && !server.password) {
    errors.push('Password is required for Trojan protocol');
  }

  if (server.uptime < 0 || server.uptime > 100) {
    errors.push('Uptime must be between 0 and 100');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate carrier configuration
 */
export function validateCarrierConfig(carrier: CarrierConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!carrier.id || carrier.id.trim().length === 0) {
    errors.push('Carrier ID is required');
  }

  if (!carrier.name || carrier.name.trim().length === 0) {
    errors.push('Carrier name is required');
  }

  if (!carrier.snis || carrier.snis.length === 0) {
    errors.push('At least one SNI is required');
  }

  if (!carrier.servers || carrier.servers.length === 0) {
    errors.push('At least one server is required');
  }

  carrier.snis.forEach((sni, index) => {
    const sniValidation = validateSNIConfig(sni);
    if (!sniValidation.valid) {
      errors.push(`SNI ${index}: ${sniValidation.errors.join(', ')}`);
    }
  });

  carrier.servers.forEach((server, index) => {
    const serverValidation = validateServerConfig(server);
    if (!serverValidation.valid) {
      errors.push(`Server ${index}: ${serverValidation.errors.join(', ')}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// Connection Testing
// ============================================================================

/**
 * Simulate connection test to a specific configuration
 * In production, this would make actual network requests
 */
export async function testConnection(
  carrier: string,
  server: ServerConfig,
  sni: SNIConfig,
  payload: PayloadConfig,
  timeout: number = 10000
): Promise<ValidationResult> {
  const startTime = Date.now();

  try {
    // Simulate network latency
    const simulatedLatency = Math.random() * 100 + 5; // 5-105ms
    await new Promise((resolve) => setTimeout(resolve, Math.min(simulatedLatency, timeout / 2)));

    // Simulate success/failure based on configuration quality
    const successRate = (sni.successRate || 80) / 100;
    const isSuccess = Math.random() < successRate;

    if (!isSuccess) {
      throw new Error('Connection test failed: DPI detection or timeout');
    }

    const duration = Date.now() - startTime;

    return {
      status: 'success',
      carrier,
      server: server.name,
      sni: sni.domain,
      payload: payload.method,
      latency: Math.round(simulatedLatency),
      bandwidth: Math.round(Math.random() * 50 + 10), // 10-60 Mbps
      timestamp: new Date(),
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    return {
      status: 'failed',
      carrier,
      server: server.name,
      sni: sni.domain,
      payload: payload.method,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date(),
      duration,
    };
  }
}

/**
 * Test all configurations for a carrier
 */
export async function testCarrierConfigurations(
  carrier: CarrierConfig,
  maxTests: number = 20
): Promise<TestReport> {
  const results: ValidationResult[] = [];
  let successCount = 0;
  let failureCount = 0;
  let totalLatency = 0;

  // Create test combinations
  const testCombinations = [];
  for (const server of carrier.servers.slice(0, 2)) {
    // Test first 2 servers
    for (const sni of carrier.snis.slice(0, 2)) {
      // Test first 2 SNIs
      for (const payload of sni.payloads.slice(0, 2)) {
        // Test first 2 payloads
        testCombinations.push({ server, sni, payload });
        if (testCombinations.length >= maxTests) break;
      }
      if (testCombinations.length >= maxTests) break;
    }
    if (testCombinations.length >= maxTests) break;
  }

  // Run tests
  for (const { server, sni, payload } of testCombinations) {
    const result = await testConnection(carrier.id, server, sni, payload);
    results.push(result);

    if (result.status === 'success') {
      successCount++;
      totalLatency += result.latency || 0;
    } else {
      failureCount++;
    }
  }

  return {
    carrierId: carrier.id,
    totalTests: results.length,
    successCount,
    failureCount,
    averageLatency: successCount > 0 ? Math.round(totalLatency / successCount) : 0,
    results,
  };
}

// ============================================================================
// Report Generation
// ============================================================================

/**
 * Generate human-readable test report
 */
export function generateTestReport(report: TestReport): string {
  const successRate = ((report.successCount / report.totalTests) * 100).toFixed(1);

  let output = `
╔════════════════════════════════════════════════════════════╗
║           VPN CONNECTION TEST REPORT                       ║
╚════════════════════════════════════════════════════════════╝

Carrier: ${report.carrierId.toUpperCase()}
Total Tests: ${report.totalTests}
Success Rate: ${successRate}%

Results:
├─ ✅ Successful: ${report.successCount}
├─ ❌ Failed: ${report.failureCount}
└─ ⏱️  Average Latency: ${report.averageLatency}ms

Detailed Results:
`;

  report.results.forEach((result, index) => {
    const icon = result.status === 'success' ? '✅' : '❌';
    const details =
      result.status === 'success'
        ? `${result.latency}ms, ${result.bandwidth}Mbps`
        : result.errorMessage;

    output += `
${index + 1}. ${icon} ${result.carrier.toUpperCase()} - ${result.server}
   SNI: ${result.sni}
   Payload: ${result.payload}
   Details: ${details}
   Duration: ${result.duration}ms
`;
  });

  return output;
}

/**
 * Get best performing configuration
 */
export function getBestConfiguration(report: TestReport): ValidationResult | null {
  const successful = report.results.filter((r) => r.status === 'success');
  if (successful.length === 0) return null;

  return successful.reduce((best, current) => {
    const bestLatency = best.latency || 999;
    const currentLatency = current.latency || 999;
    return currentLatency < bestLatency ? current : best;
  });
}

/**
 * Get worst performing configuration
 */
export function getWorstConfiguration(report: TestReport): ValidationResult | null {
  const failed = report.results.filter((r) => r.status === 'failed');
  if (failed.length === 0) return null;
  return failed[0];
}

/**
 * Export test results as JSON
 */
export function exportTestResults(report: TestReport): string {
  return JSON.stringify(report, null, 2);
}

/**
 * Export test results as CSV
 */
export function exportTestResultsAsCSV(report: TestReport): string {
  const headers = ['Carrier', 'Server', 'SNI', 'Payload', 'Status', 'Latency (ms)', 'Bandwidth (Mbps)', 'Error'];
  const rows = report.results.map((r) => [
    r.carrier,
    r.server,
    r.sni,
    r.payload,
    r.status,
    r.latency || 'N/A',
    r.bandwidth || 'N/A',
    r.errorMessage || 'N/A',
  ]);

  const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');

  return csvContent;
}
