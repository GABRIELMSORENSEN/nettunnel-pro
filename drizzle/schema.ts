import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  json,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * User VPN Configurations
 * Stores saved VPN configurations per user
 */
export const vpnConfigurations = mysqlTable("vpn_configurations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  carrier: varchar("carrier", { length: 50 }).notNull(), // vivo, claro, oi, tim
  server: varchar("server", { length: 255 }).notNull(),
  sni: varchar("sni", { length: 255 }).notNull(),
  payloadMethod: varchar("payloadMethod", { length: 50 }).notNull(), // http, tls, websocket, fragment
  protocol: varchar("protocol", { length: 50 }).notNull(), // vless, vmess, trojan
  isDefault: int("isDefault").default(0).notNull(),
  metadata: json("metadata"), // Pro/Stealth mode settings: {mode, enableDPIBypass, tlsFingerprint, muxConcurrency}
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VpnConfiguration = typeof vpnConfigurations.$inferSelect;
export type InsertVpnConfiguration = typeof vpnConfigurations.$inferInsert;

/**
 * Connection Test Results
 * Stores test results for each configuration
 */
export const connectionTestResults = mysqlTable("connection_test_results", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  carrier: varchar("carrier", { length: 50 }).notNull(),
  server: varchar("server", { length: 255 }).notNull(),
  sni: varchar("sni", { length: 255 }).notNull(),
  payloadMethod: varchar("payloadMethod", { length: 50 }).notNull(),
  status: mysqlEnum("status", ["success", "failed", "timeout"]).notNull(),
  latency: int("latency"), // milliseconds
  bandwidth: decimal("bandwidth", { precision: 10, scale: 2 }), // Mbps
  errorMessage: text("errorMessage"),
  duration: int("duration").notNull(), // milliseconds
  testDate: timestamp("testDate").defaultNow().notNull(),
});

export type ConnectionTestResult = typeof connectionTestResults.$inferSelect;
export type InsertConnectionTestResult =
  typeof connectionTestResults.$inferInsert;

/**
 * Analytics Data
 * Aggregated metrics for dashboard
 */
export const analyticsMetrics = mysqlTable("analytics_metrics", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  carrier: varchar("carrier", { length: 50 }).notNull(),
  totalTests: int("totalTests").default(0).notNull(),
  successCount: int("successCount").default(0).notNull(),
  failureCount: int("failureCount").default(0).notNull(),
  averageLatency: decimal("averageLatency", { precision: 10, scale: 2 }),
  averageBandwidth: decimal("averageBandwidth", { precision: 10, scale: 2 }),
  successRate: decimal("successRate", { precision: 5, scale: 2 }), // percentage
  bestSNI: varchar("bestSNI", { length: 255 }),
  bestPayloadMethod: varchar("bestPayloadMethod", { length: 50 }),
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
});

export type AnalyticsMetric = typeof analyticsMetrics.$inferSelect;
export type InsertAnalyticsMetric = typeof analyticsMetrics.$inferInsert;

/**
 * Connection History
 * Tracks user's connection attempts
 */
export const connectionHistory = mysqlTable("connection_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  carrier: varchar("carrier", { length: 50 }).notNull(),
  server: varchar("server", { length: 255 }).notNull(),
  sni: varchar("sni", { length: 255 }).notNull(),
  payloadMethod: varchar("payloadMethod", { length: 50 }).notNull(),
  status: mysqlEnum("status", ["connected", "disconnected", "failed"]).notNull(),
  duration: int("duration"), // seconds
  ipAddress: varchar("ipAddress", { length: 45 }), // supports IPv4 and IPv6
  connectionDate: timestamp("connectionDate").defaultNow().notNull(),
  disconnectionDate: timestamp("disconnectionDate"),
});

export type ConnectionHistoryRecord = typeof connectionHistory.$inferSelect;
export type InsertConnectionHistoryRecord =
  typeof connectionHistory.$inferInsert;