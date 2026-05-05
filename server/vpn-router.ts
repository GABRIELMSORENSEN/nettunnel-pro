import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import {
  vpnConfigurations,
  connectionTestResults,
  analyticsMetrics,
  connectionHistory,
} from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

/**
 * VPN Router
 * Handles all VPN-related operations: configurations, test results, analytics
 */
export const vpnRouter = router({
  // ============================================================================
  // VPN CONFIGURATIONS
  // ============================================================================

  /**
   * Save a VPN configuration for the user
   */
  saveConfiguration: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        carrier: z.string(),
        server: z.string(),
        sni: z.string(),
        payloadMethod: z.string(),
        protocol: z.string(),
        isDefault: z.boolean().optional(),
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
      });

      return { success: true, configId: result[0] };
    }),

  /**
   * Get all saved configurations for the user
   */
  getConfigurations: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const configs = await db
      .select()
      .from(vpnConfigurations)
      .where(eq(vpnConfigurations.userId, ctx.user.id));

    return configs;
  }),

  /**
   * Get default configuration
   */
  getDefaultConfiguration: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    const config = await db
      .select()
      .from(vpnConfigurations)
      .where(
        and(
          eq(vpnConfigurations.userId, ctx.user.id),
          eq(vpnConfigurations.isDefault, 1)
        )
      )
      .limit(1);

    return config.length > 0 ? config[0] : null;
  }),

  /**
   * Delete a configuration
   */
  deleteConfiguration: protectedProcedure
    .input(z.object({ configId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .delete(vpnConfigurations)
        .where(
          and(
            eq(vpnConfigurations.id, input.configId),
            eq(vpnConfigurations.userId, ctx.user.id)
          )
        );

      return { success: true };
    }),

  // ============================================================================
  // TEST RESULTS
  // ============================================================================

  /**
   * Save test result
   */
  saveTestResult: protectedProcedure
    .input(
      z.object({
        carrier: z.string(),
        server: z.string(),
        sni: z.string(),
        payloadMethod: z.string(),
        status: z.enum(["success", "failed", "timeout"]),
        latency: z.number().optional(),
        bandwidth: z.number().optional(),
        errorMessage: z.string().optional(),
        duration: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(connectionTestResults).values({
        userId: ctx.user.id,
        carrier: input.carrier,
        server: input.server,
        sni: input.sni,
        payloadMethod: input.payloadMethod,
        status: input.status,
        latency: input.latency || null,
        bandwidth: input.bandwidth ? input.bandwidth.toString() : null,
        errorMessage: input.errorMessage || null,
        duration: input.duration,
      });

      return { success: true };
    }),

  /**
   * Get test results for a carrier
   */
  getTestResults: protectedProcedure
    .input(z.object({ carrier: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      const results = await db
        .select()
        .from(connectionTestResults)
        .where(
          and(
            eq(connectionTestResults.userId, ctx.user.id),
            eq(connectionTestResults.carrier, input.carrier)
          )
        );

      return results;
    }),

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  /**
   * Get analytics for all carriers
   */
  getAnalytics: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const analytics = await db
      .select()
      .from(analyticsMetrics)
      .where(eq(analyticsMetrics.userId, ctx.user.id));

    return analytics;
  }),

  /**
   * Get analytics for specific carrier
   */
  getCarrierAnalytics: protectedProcedure
    .input(z.object({ carrier: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;

      const analytics = await db
        .select()
        .from(analyticsMetrics)
        .where(
          and(
            eq(analyticsMetrics.userId, ctx.user.id),
            eq(analyticsMetrics.carrier, input.carrier)
          )
        )
        .limit(1);

      return analytics.length > 0 ? analytics[0] : null;
    }),

  /**
   * Update analytics metrics (called after tests)
   */
  updateAnalytics: protectedProcedure
    .input(
      z.object({
        carrier: z.string(),
        totalTests: z.number(),
        successCount: z.number(),
        failureCount: z.number(),
        averageLatency: z.number().optional(),
        averageBandwidth: z.number().optional(),
        bestSNI: z.string().optional(),
        bestPayloadMethod: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const successRate =
        input.totalTests > 0
          ? ((input.successCount / input.totalTests) * 100).toFixed(2)
          : "0";

      // Check if analytics already exists
      const existing = await db
        .select()
        .from(analyticsMetrics)
        .where(
          and(
            eq(analyticsMetrics.userId, ctx.user.id),
            eq(analyticsMetrics.carrier, input.carrier)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        // Update existing
        await db
          .update(analyticsMetrics)
          .set({
            totalTests: input.totalTests,
            successCount: input.successCount,
            failureCount: input.failureCount,
            averageLatency: input.averageLatency
              ? input.averageLatency.toString()
              : null,
            averageBandwidth: input.averageBandwidth
              ? input.averageBandwidth.toString()
              : null,
            successRate: successRate,
            bestSNI: input.bestSNI || null,
            bestPayloadMethod: input.bestPayloadMethod || null,
          })
          .where(eq(analyticsMetrics.id, existing[0].id));
      } else {
        // Insert new
        await db.insert(analyticsMetrics).values({
          userId: ctx.user.id,
          carrier: input.carrier,
          totalTests: input.totalTests,
          successCount: input.successCount,
          failureCount: input.failureCount,
          averageLatency: input.averageLatency
            ? input.averageLatency.toString()
            : null,
          averageBandwidth: input.averageBandwidth
            ? input.averageBandwidth.toString()
            : null,
          successRate: successRate,
          bestSNI: input.bestSNI || null,
          bestPayloadMethod: input.bestPayloadMethod || null,
        });
      }

      return { success: true };
    }),

  // ============================================================================
  // CONNECTION HISTORY
  // ============================================================================

  /**
   * Log connection attempt
   */
  logConnection: protectedProcedure
    .input(
      z.object({
        carrier: z.string(),
        server: z.string(),
        sni: z.string(),
        payloadMethod: z.string(),
        status: z.enum(["connected", "disconnected", "failed"]),
        ipAddress: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(connectionHistory).values({
        userId: ctx.user.id,
        carrier: input.carrier,
        server: input.server,
        sni: input.sni,
        payloadMethod: input.payloadMethod,
        status: input.status,
        ipAddress: input.ipAddress || null,
        connectionDate: new Date(),
      });

      return { success: true, connectionId: result[0] };
    }),

  /**
   * Get connection history
   */
  getConnectionHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const history = await db
      .select()
      .from(connectionHistory)
      .where(eq(connectionHistory.userId, ctx.user.id));

    return history;
  }),
});
