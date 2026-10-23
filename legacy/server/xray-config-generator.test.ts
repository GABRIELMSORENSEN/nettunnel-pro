import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateXrayConfig,
  generateFragmentationSettings,
  generateTLSSettings,
  generateMuxSettings,
  XrayConfigMode,
} from './xray-config-generator';

describe('Xray Config Generator', () => {
  describe('generateFragmentationSettings', () => {
    it('should generate Lite mode fragmentation (no overhead)', () => {
      const settings = generateFragmentationSettings('lite');
      expect(settings).toEqual({
        packets: '1-1',
        length: '0-0',
        interval: '0-0',
      });
    });

    it('should generate Standard mode fragmentation (balanced)', () => {
      const settings = generateFragmentationSettings('standard');
      expect(settings.packets).toMatch(/^\d+-\d+$/);
      expect(settings.length).toMatch(/^\d+-\d+$/);
      expect(settings.interval).toMatch(/^\d+-\d+$/);
    });

    it('should generate Pro mode fragmentation (maximum bypass)', () => {
      const settings = generateFragmentationSettings('pro');
      expect(settings.packets).toMatch(/^\d+-\d+$/);
      expect(settings.length).toMatch(/^\d+-\d+$/);
      expect(settings.interval).toMatch(/^\d+-\d+$/);
      // Pro mode should have more fragmentation than Standard
      const [proPackets] = settings.packets.split('-').map(Number);
      const [stdPackets] = generateFragmentationSettings('standard').packets.split('-').map(Number);
      expect(proPackets).toBeGreaterThanOrEqual(stdPackets);
    });

    it('should throw error for invalid mode', () => {
      expect(() => generateFragmentationSettings('invalid' as any)).toThrow();
    });
  });

  describe('generateTLSSettings', () => {
    it('should generate Chrome fingerprint', () => {
      const settings = generateTLSSettings('chrome');
      expect(settings.fingerprint).toBe('chrome');
      expect(settings.serverName).toBeDefined();
      expect(settings.allowInsecure).toBe(false);
    });

    it('should generate Firefox fingerprint', () => {
      const settings = generateTLSSettings('firefox');
      expect(settings.fingerprint).toBe('firefox');
    });

    it('should generate Safari fingerprint', () => {
      const settings = generateTLSSettings('safari');
      expect(settings.fingerprint).toBe('safari');
    });

    it('should generate Edge fingerprint', () => {
      const settings = generateTLSSettings('edge');
      expect(settings.fingerprint).toBe('edge');
    });

    it('should have ALPN protocol', () => {
      const settings = generateTLSSettings('chrome');
      expect(settings.alpn).toContain('h2');
      expect(settings.alpn).toContain('http/1.1');
    });
  });

  describe('generateMuxSettings', () => {
    it('should generate Lite mode mux (disabled)', () => {
      const settings = generateMuxSettings('lite');
      expect(settings.enabled).toBe(false);
    });

    it('should generate Standard mode mux (concurrency 4)', () => {
      const settings = generateMuxSettings('standard');
      expect(settings.enabled).toBe(true);
      expect(settings.concurrency).toBe(4);
    });

    it('should generate Pro mode mux (concurrency 8)', () => {
      const settings = generateMuxSettings('pro');
      expect(settings.enabled).toBe(true);
      expect(settings.concurrency).toBe(8);
    });

    it('should have keepaliveInterval', () => {
      const settings = generateMuxSettings('pro');
      expect(settings.keepaliveInterval).toBeGreaterThan(0);
    });
  });

  describe('generateXrayConfig', () => {
    it('should generate valid Xray config for VLESS', () => {
      const config = generateXrayConfig({
        protocol: 'vless',
        serverAddress: 'example.com',
        serverPort: 443,
        uuid: 'test-uuid',
        mode: 'standard',
        tlsFingerprint: 'chrome',
        sniValue: 'example.com',
      });

      expect(config.inbounds).toBeDefined();
      expect(config.outbounds).toBeDefined();
      expect(config.routing).toBeDefined();
      expect(config.dns).toBeDefined();
    });

    it('should include fragmentation in Pro mode', () => {
      const config = generateXrayConfig({
        protocol: 'vless',
        serverAddress: 'example.com',
        serverPort: 443,
        uuid: 'test-uuid',
        mode: 'pro',
        tlsFingerprint: 'chrome',
        sniValue: 'example.com',
      });

      const outbound = config.outbounds[0];
      expect(outbound.streamSettings?.sockopt?.tcpFastOpen).toBeDefined();
    });

    it('should include mux settings in Standard and Pro modes', () => {
      const standardConfig = generateXrayConfig({
        protocol: 'vless',
        serverAddress: 'example.com',
        serverPort: 443,
        uuid: 'test-uuid',
        mode: 'standard',
        tlsFingerprint: 'chrome',
        sniValue: 'example.com',
      });

      const proConfig = generateXrayConfig({
        protocol: 'vless',
        serverAddress: 'example.com',
        serverPort: 443,
        uuid: 'test-uuid',
        mode: 'pro',
        tlsFingerprint: 'chrome',
        sniValue: 'example.com',
      });

      expect(standardConfig.outbounds[0].mux).toBeDefined();
      expect(proConfig.outbounds[0].mux).toBeDefined();
      expect(proConfig.outbounds[0].mux?.concurrency).toBeGreaterThan(
        standardConfig.outbounds[0].mux?.concurrency || 0
      );
    });

    it('should have proper DNS configuration', () => {
      const config = generateXrayConfig({
        protocol: 'vless',
        serverAddress: 'example.com',
        serverPort: 443,
        uuid: 'test-uuid',
        mode: 'standard',
        tlsFingerprint: 'chrome',
        sniValue: 'example.com',
      });

      expect(config.dns.servers).toContain('8.8.8.8');
      expect(config.dns.servers).toContain('1.1.1.1');
    });

    it('should have proper routing configuration', () => {
      const config = generateXrayConfig({
        protocol: 'vless',
        serverAddress: 'example.com',
        serverPort: 443,
        uuid: 'test-uuid',
        mode: 'standard',
        tlsFingerprint: 'chrome',
        sniValue: 'example.com',
      });

      expect(config.routing.rules).toBeDefined();
      expect(config.routing.rules.length).toBeGreaterThan(0);
    });

    it('should support VMESS protocol', () => {
      const config = generateXrayConfig({
        protocol: 'vmess',
        serverAddress: 'example.com',
        serverPort: 443,
        uuid: 'test-uuid',
        mode: 'standard',
        tlsFingerprint: 'chrome',
        sniValue: 'example.com',
      });

      const outbound = config.outbounds[0];
      expect(outbound.protocol).toBe('vmess');
      expect(outbound.settings?.vnext).toBeDefined();
    });

    it('should support Trojan protocol', () => {
      const config = generateXrayConfig({
        protocol: 'trojan',
        serverAddress: 'example.com',
        serverPort: 443,
        uuid: 'test-uuid',
        mode: 'standard',
        tlsFingerprint: 'chrome',
        sniValue: 'example.com',
      });

      const outbound = config.outbounds[0];
      expect(outbound.protocol).toBe('trojan');
      expect(outbound.settings?.servers).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in SNI', () => {
      const config = generateXrayConfig({
        protocol: 'vless',
        serverAddress: 'example.com',
        serverPort: 443,
        uuid: 'test-uuid',
        mode: 'standard',
        tlsFingerprint: 'chrome',
        sniValue: 'portal-recarga.vivo.com.br',
      });

      expect(config).toBeDefined();
    });

    it('should handle IPv6 addresses', () => {
      const config = generateXrayConfig({
        protocol: 'vless',
        serverAddress: '2001:4860:4860::8888',
        serverPort: 443,
        uuid: 'test-uuid',
        mode: 'standard',
        tlsFingerprint: 'chrome',
        sniValue: 'example.com',
      });

      expect(config).toBeDefined();
    });

    it('should handle non-standard ports', () => {
      const config = generateXrayConfig({
        protocol: 'vless',
        serverAddress: 'example.com',
        serverPort: 8443,
        uuid: 'test-uuid',
        mode: 'standard',
        tlsFingerprint: 'chrome',
        sniValue: 'example.com',
      });

      expect(config.outbounds[0].settings?.vnext?.[0]?.port).toBe(8443);
    });
  });
});
