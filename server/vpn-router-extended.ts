/**
 * Extended VPN Router - DPI Bypass & Pro/Stealth Mode
 * 
 * Adds support for:
 * - Pro/Stealth mode with packet fragmentation
 * - TLS fingerprint configuration
 * - Multiplexing optimization
 * - Xray configuration generation
 */

import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { vpnConfigurations } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import {
  generateXrayConfig,
  generateProStealthConfig,
  generateStandardConfig,
  generateLiteConfig,
  type XrayConfig,
} from "./xray-config-generator";

export const vpnRouterExtended = router({
  /**
   * Save configuration with Pro/Stealth mode support
   */
  saveConfigurationWithMode: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        carrier: z.string(),
        server: z.string(),
        sni: z.string(),
        payloadMethod: z.string(),
        protocol: z.string(),
        mode: z.enum(["lite", "standard", "pro"]).default("standard"),
        isDefault: z.boolean().optional(),
        // Advanced options
        enableDPIBypass: z.boolean().optional(),
        tlsFingerprint: z
          .enum(["chrome", "firefox", "safari", "edge"])
          .optional(),
        muxConcurrency: z.number().min(1).max(1024).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(vpnConfigurations).values({
        userId: ctx.user.id,
        name: input.name,
        carrier: input.carrier,
        server: input.server,
        sni: input.sni,
        payloadMethod: input.payloadMethod,
        protocol: input.protocol,
        isDefault: input.isDefault ? 1 : 0,
        // Store mode and advanced settings as JSON
        metadata: JSON.stringify({
          mode: input.mode,
          enableDPIBypass:
            input.enableDPIBypass !== undefined
              ? input.enableDPIBypass
              : input.mode === "pro",
          tlsFingerprint: input.tlsFingerprint || "chrome",
          muxConcurrency:
            input.muxConcurrency || (input.mode === "pro" ? 8 : 4),
        }),
      });

      return { success: true, configId: result[0] };
    }),

  /**
   * Generate Xray configuration for a saved configuration
   */
  generateXrayConfigForConnection: protectedProcedure
    .input(
      z.object({
        configId: z.number(),
        serverAddress: z.string(),
        serverPort: z.number(),
        uuid: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Fetch configuration
      const config = await db
        .select()
        .from(vpnConfigurations)
        .where(
          and(
            eq(vpnConfigurations.id, input.configId),
            eq(vpnConfigurations.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (config.length === 0) {
        throw new Error("Configuration not found");
      }

      const vpnConfig = config[0];
      const metadata = vpnConfig.metadata
        ? typeof vpnConfig.metadata === "string"
          ? JSON.parse(vpnConfig.metadata)
          : vpnConfig.metadata
        : { mode: "standard" };

      let xrayConfig: XrayConfig;

      switch (metadata.mode) {
        case "pro":
          xrayConfig = generateProStealthConfig({
            serverAddress: input.serverAddress,
            serverPort: input.serverPort,
            uuid: input.uuid,
            sni: vpnConfig.sni,
          });
          break;
        case "lite":
          xrayConfig = generateLiteConfig({
            serverAddress: input.serverAddress,
            serverPort: input.serverPort,
            uuid: input.uuid,
            sni: vpnConfig.sni,
          });
          break;
        case "standard":
        default:
          xrayConfig = generateStandardConfig({
            serverAddress: input.serverAddress,
            serverPort: input.serverPort,
            uuid: input.uuid,
            sni: vpnConfig.sni,
          });
      }

      return {
        success: true,
        config: xrayConfig,
        metadata,
      };
    }),

  /**
   * Generate Xray config with custom parameters
   */
  generateCustomXrayConfig: protectedProcedure
    .input(
      z.object({
        protocol: z.enum(["vless", "vmess", "trojan"]),
        serverAddress: z.string(),
        serverPort: z.number(),
        uuid: z.string().optional(),
        password: z.string().optional(),
        sni: z.string(),
        network: z.enum(["tcp", "ws", "h2", "quic"]),
        wsPath: z.string().optional(),
        wsHost: z.string().optional(),
        enableDPIBypass: z.boolean().optional(),
        fragmentPackets: z.string().optional(),
        fragmentLength: z.string().optional(),
        fragmentInterval: z.string().optional(),
        enableTLS: z.boolean().optional(),
        tlsFingerprint: z
          .enum(["chrome", "firefox", "safari", "edge"])
          .optional(),
        enableMux: z.boolean().optional(),
        muxConcurrency: z.number().optional(),
        dnsServers: z.array(z.string()).optional(),
      })
    )
    .query(({ input }) => {
      const xrayConfig = generateXrayConfig({
        protocol: input.protocol,
        serverAddress: input.serverAddress,
        serverPort: input.serverPort,
        uuid: input.uuid,
        password: input.password,
        sni: input.sni,
        network: input.network,
        wsPath: input.wsPath,
        wsHost: input.wsHost,
        enableDPIBypass: input.enableDPIBypass ?? true,
        fragmentPackets: input.fragmentPackets,
        fragmentLength: input.fragmentLength,
        fragmentInterval: input.fragmentInterval,
        enableTLS: input.enableTLS ?? true,
        tlsFingerprint: input.tlsFingerprint || "chrome",
        enableMux: input.enableMux ?? true,
        muxConcurrency: input.muxConcurrency || 8,
        dnsServers: input.dnsServers || ["8.8.8.8", "1.1.1.1"],
      });

      return {
        success: true,
        config: xrayConfig,
      };
    }),

  /**
   * Get recommended configuration for a carrier
   */
  getRecommendedConfig: protectedProcedure
    .input(
      z.object({
        carrier: z.string(),
        mode: z.enum(["lite", "standard", "pro"]).optional(),
      })
    )
    .query(({ input }) => {
      // Recommended configurations per carrier
      const carrierConfigs: Record<
        string,
        {
          lite: { sni: string; payloadMethod: string };
          standard: { sni: string; payloadMethod: string };
          pro: { sni: string; payloadMethod: string };
        }
      > = {
        vivo: {
          lite: {
            sni: "meuvivo.vivo.com.br",
            payloadMethod: "http",
          },
          standard: {
            sni: "portalrecarga.vivo.com.br",
            payloadMethod: "http",
          },
          pro: {
            sni: "portalrecarga.vivo.com.br",
            payloadMethod: "http",
          },
        },
        claro: {
          lite: {
            sni: "meuclaro.claro.com.br",
            payloadMethod: "http",
          },
          standard: {
            sni: "www.claro.com.br",
            payloadMethod: "tls",
          },
          pro: {
            sni: "www.claro.com.br",
            payloadMethod: "tls",
          },
        },
        oi: {
          lite: {
            sni: "www.oi.com.br",
            payloadMethod: "http",
          },
          standard: {
            sni: "www.oi.com.br",
            payloadMethod: "tls",
          },
          pro: {
            sni: "www.oi.com.br",
            payloadMethod: "tls",
          },
        },
        tim: {
          lite: {
            sni: "www.tim.com.br",
            payloadMethod: "http",
          },
          standard: {
            sni: "www.tim.com.br",
            payloadMethod: "tls",
          },
          pro: {
            sni: "www.tim.com.br",
            payloadMethod: "tls",
          },
        },
      };

      const config = carrierConfigs[input.carrier];
      if (!config) {
        return {
          success: false,
          error: "Carrier not found",
        };
      }

      const mode = input.mode || "standard";
      return {
        success: true,
        recommendation: config[mode],
        mode,
      };
    }),

  /**
   * Get DPI bypass settings for a mode
   */
  getDPIBypassSettings: protectedProcedure
    .input(z.object({ mode: z.enum(["lite", "standard", "pro"]) }))
    .query(({ input }) => {
      const settings = {
        lite: {
          enabled: false,
          description: "Sem fragmentação (menor overhead)",
          fragmentPackets: null,
          fragmentLength: null,
          fragmentInterval: null,
        },
        standard: {
          enabled: true,
          description: "Fragmentação moderada (balanceado)",
          fragmentPackets: "1-2",
          fragmentLength: "150-200",
          fragmentInterval: "10-15",
        },
        pro: {
          enabled: true,
          description: "Fragmentação máxima (máxima evasão)",
          fragmentPackets: "1-3",
          fragmentLength: "100-200",
          fragmentInterval: "5-10",
        },
      };

      return settings[input.mode];
    }),

  /**
   * Get multiplexing settings for a mode
   */
  getMuxSettings: protectedProcedure
    .input(z.object({ mode: z.enum(["lite", "standard", "pro"]) }))
    .query(({ input }) => {
      const settings = {
        lite: {
          enabled: false,
          concurrency: 1,
          description: "Sem multiplexing (menor overhead)",
        },
        standard: {
          enabled: true,
          concurrency: 4,
          description: "Multiplexing moderado (balanceado)",
        },
        pro: {
          enabled: true,
          concurrency: 8,
          description: "Multiplexing máximo (máxima velocidade)",
        },
      };

      return settings[input.mode];
    }),

  /**
   * Get TLS fingerprint options
   */
  getTLSFingerprintOptions: protectedProcedure.query(() => {
    return {
      options: [
        {
          value: "chrome",
          label: "Chrome (Recomendado)",
          description: "Simula navegador Chrome - melhor compatibilidade",
        },
        {
          value: "firefox",
          label: "Firefox",
          description: "Simula navegador Firefox",
        },
        {
          value: "safari",
          label: "Safari",
          description: "Simula navegador Safari",
        },
        {
          value: "edge",
          label: "Edge",
          description: "Simula navegador Edge",
        },
      ],
      recommended: "chrome",
    };
  }),
});
