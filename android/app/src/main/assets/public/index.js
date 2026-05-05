// server/_core/index.ts
import "dotenv/config";
import express2 from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/db.ts
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";

// drizzle/schema.ts
import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  json
} from "drizzle-orm/mysql-core";
var users = mysqlTable("users", {
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
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
});
var vpnConfigurations = mysqlTable("vpn_configurations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  carrier: varchar("carrier", { length: 50 }).notNull(),
  // vivo, claro, oi, tim
  server: varchar("server", { length: 255 }).notNull(),
  sni: varchar("sni", { length: 255 }).notNull(),
  payloadMethod: varchar("payloadMethod", { length: 50 }).notNull(),
  // http, tls, websocket, fragment
  protocol: varchar("protocol", { length: 50 }).notNull(),
  // vless, vmess, trojan
  isDefault: int("isDefault").default(0).notNull(),
  metadata: json("metadata"),
  // Pro/Stealth mode settings: {mode, enableDPIBypass, tlsFingerprint, muxConcurrency}
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var connectionTestResults = mysqlTable("connection_test_results", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  carrier: varchar("carrier", { length: 50 }).notNull(),
  server: varchar("server", { length: 255 }).notNull(),
  sni: varchar("sni", { length: 255 }).notNull(),
  payloadMethod: varchar("payloadMethod", { length: 50 }).notNull(),
  status: mysqlEnum("status", ["success", "failed", "timeout"]).notNull(),
  latency: int("latency"),
  // milliseconds
  bandwidth: decimal("bandwidth", { precision: 10, scale: 2 }),
  // Mbps
  errorMessage: text("errorMessage"),
  duration: int("duration").notNull(),
  // milliseconds
  testDate: timestamp("testDate").defaultNow().notNull()
});
var analyticsMetrics = mysqlTable("analytics_metrics", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  carrier: varchar("carrier", { length: 50 }).notNull(),
  totalTests: int("totalTests").default(0).notNull(),
  successCount: int("successCount").default(0).notNull(),
  failureCount: int("failureCount").default(0).notNull(),
  averageLatency: decimal("averageLatency", { precision: 10, scale: 2 }),
  averageBandwidth: decimal("averageBandwidth", { precision: 10, scale: 2 }),
  successRate: decimal("successRate", { precision: 5, scale: 2 }),
  // percentage
  bestSNI: varchar("bestSNI", { length: 255 }),
  bestPayloadMethod: varchar("bestPayloadMethod", { length: 50 }),
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull()
});
var connectionHistory = mysqlTable("connection_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  carrier: varchar("carrier", { length: 50 }).notNull(),
  server: varchar("server", { length: 255 }).notNull(),
  sni: varchar("sni", { length: 255 }).notNull(),
  payloadMethod: varchar("payloadMethod", { length: 50 }).notNull(),
  status: mysqlEnum("status", ["connected", "disconnected", "failed"]).notNull(),
  duration: int("duration"),
  // seconds
  ipAddress: varchar("ipAddress", { length: 45 }),
  // supports IPv4 and IPv6
  connectionDate: timestamp("connectionDate").defaultNow().notNull(),
  disconnectionDate: timestamp("disconnectionDate")
});

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/db.ts
var _db = null;
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = {
      openId: user.openId
    };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/storageProxy.ts
function registerStorageProxy(app) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = req.params[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }
    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }
    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/"
      );
      forgeUrl.searchParams.set("path", key);
      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` }
      });
      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }
      const { url } = await forgeResp.json();
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }
      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/vpn-router.ts
import { eq as eq2, and } from "drizzle-orm";
import { z as z2 } from "zod";
var vpnRouter = router({
  // ============================================================================
  // VPN CONFIGURATIONS
  // ============================================================================
  /**
   * Save a VPN configuration for the user
   */
  saveConfiguration: protectedProcedure.input(
    z2.object({
      name: z2.string().min(1),
      carrier: z2.string(),
      server: z2.string(),
      sni: z2.string(),
      payloadMethod: z2.string(),
      protocol: z2.string(),
      isDefault: z2.boolean().optional()
    })
  ).mutation(async ({ ctx, input }) => {
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
      isDefault: input.isDefault ? 1 : 0
    });
    return { success: true, configId: result[0] };
  }),
  /**
   * Get all saved configurations for the user
   */
  getConfigurations: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const configs = await db.select().from(vpnConfigurations).where(eq2(vpnConfigurations.userId, ctx.user.id));
    return configs;
  }),
  /**
   * Get default configuration
   */
  getDefaultConfiguration: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const config = await db.select().from(vpnConfigurations).where(
      and(
        eq2(vpnConfigurations.userId, ctx.user.id),
        eq2(vpnConfigurations.isDefault, 1)
      )
    ).limit(1);
    return config.length > 0 ? config[0] : null;
  }),
  /**
   * Delete a configuration
   */
  deleteConfiguration: protectedProcedure.input(z2.object({ configId: z2.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.delete(vpnConfigurations).where(
      and(
        eq2(vpnConfigurations.id, input.configId),
        eq2(vpnConfigurations.userId, ctx.user.id)
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
  saveTestResult: protectedProcedure.input(
    z2.object({
      carrier: z2.string(),
      server: z2.string(),
      sni: z2.string(),
      payloadMethod: z2.string(),
      status: z2.enum(["success", "failed", "timeout"]),
      latency: z2.number().optional(),
      bandwidth: z2.number().optional(),
      errorMessage: z2.string().optional(),
      duration: z2.number()
    })
  ).mutation(async ({ ctx, input }) => {
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
      duration: input.duration
    });
    return { success: true };
  }),
  /**
   * Get test results for a carrier
   */
  getTestResults: protectedProcedure.input(z2.object({ carrier: z2.string() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    const results = await db.select().from(connectionTestResults).where(
      and(
        eq2(connectionTestResults.userId, ctx.user.id),
        eq2(connectionTestResults.carrier, input.carrier)
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
    const analytics = await db.select().from(analyticsMetrics).where(eq2(analyticsMetrics.userId, ctx.user.id));
    return analytics;
  }),
  /**
   * Get analytics for specific carrier
   */
  getCarrierAnalytics: protectedProcedure.input(z2.object({ carrier: z2.string() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return null;
    const analytics = await db.select().from(analyticsMetrics).where(
      and(
        eq2(analyticsMetrics.userId, ctx.user.id),
        eq2(analyticsMetrics.carrier, input.carrier)
      )
    ).limit(1);
    return analytics.length > 0 ? analytics[0] : null;
  }),
  /**
   * Update analytics metrics (called after tests)
   */
  updateAnalytics: protectedProcedure.input(
    z2.object({
      carrier: z2.string(),
      totalTests: z2.number(),
      successCount: z2.number(),
      failureCount: z2.number(),
      averageLatency: z2.number().optional(),
      averageBandwidth: z2.number().optional(),
      bestSNI: z2.string().optional(),
      bestPayloadMethod: z2.string().optional()
    })
  ).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const successRate = input.totalTests > 0 ? (input.successCount / input.totalTests * 100).toFixed(2) : "0";
    const existing = await db.select().from(analyticsMetrics).where(
      and(
        eq2(analyticsMetrics.userId, ctx.user.id),
        eq2(analyticsMetrics.carrier, input.carrier)
      )
    ).limit(1);
    if (existing.length > 0) {
      await db.update(analyticsMetrics).set({
        totalTests: input.totalTests,
        successCount: input.successCount,
        failureCount: input.failureCount,
        averageLatency: input.averageLatency ? input.averageLatency.toString() : null,
        averageBandwidth: input.averageBandwidth ? input.averageBandwidth.toString() : null,
        successRate,
        bestSNI: input.bestSNI || null,
        bestPayloadMethod: input.bestPayloadMethod || null
      }).where(eq2(analyticsMetrics.id, existing[0].id));
    } else {
      await db.insert(analyticsMetrics).values({
        userId: ctx.user.id,
        carrier: input.carrier,
        totalTests: input.totalTests,
        successCount: input.successCount,
        failureCount: input.failureCount,
        averageLatency: input.averageLatency ? input.averageLatency.toString() : null,
        averageBandwidth: input.averageBandwidth ? input.averageBandwidth.toString() : null,
        successRate,
        bestSNI: input.bestSNI || null,
        bestPayloadMethod: input.bestPayloadMethod || null
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
  logConnection: protectedProcedure.input(
    z2.object({
      carrier: z2.string(),
      server: z2.string(),
      sni: z2.string(),
      payloadMethod: z2.string(),
      status: z2.enum(["connected", "disconnected", "failed"]),
      ipAddress: z2.string().optional()
    })
  ).mutation(async ({ ctx, input }) => {
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
      connectionDate: /* @__PURE__ */ new Date()
    });
    return { success: true, connectionId: result[0] };
  }),
  /**
   * Get connection history
   */
  getConnectionHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const history = await db.select().from(connectionHistory).where(eq2(connectionHistory.userId, ctx.user.id));
    return history;
  })
});

// server/vpn-router-extended.ts
import { eq as eq3, and as and2 } from "drizzle-orm";
import { z as z3 } from "zod";

// server/xray-config-generator.ts
function generateXrayConfig(params) {
  const config = {
    log: {
      loglevel: params.logLevel || "warning"
    },
    inbounds: [
      {
        port: 10808,
        protocol: "socks",
        settings: {
          auth: "noauth",
          network: "tcp,udp"
        },
        sniffing: {
          enabled: true,
          destOverride: ["http", "tls"],
          metadataOnly: false,
          routeOnly: false
        }
      },
      {
        port: 10809,
        protocol: "http",
        settings: {
          auth: "noauth"
        },
        sniffing: {
          enabled: true,
          destOverride: ["http", "tls"],
          metadataOnly: false,
          routeOnly: false
        }
      }
    ],
    outbounds: [
      {
        protocol: params.protocol,
        settings: {
          vnext: params.protocol !== "trojan" ? [
            {
              address: params.serverAddress,
              port: params.serverPort,
              users: [
                {
                  id: params.uuid || "",
                  encryption: params.encryption || "none",
                  flow: params.flow
                }
              ]
            }
          ] : void 0,
          servers: params.protocol === "trojan" ? [
            {
              address: params.serverAddress,
              port: params.serverPort,
              password: params.password || ""
            }
          ] : void 0
        },
        streamSettings: {
          network: params.network,
          security: params.enableTLS ? "tls" : "none",
          tlsSettings: params.enableTLS ? {
            serverName: params.sni,
            fingerprint: params.tlsFingerprint || "chrome",
            allowInsecure: false,
            allowInsecureHostnames: false
          } : void 0,
          wsSettings: params.network === "ws" ? {
            path: params.wsPath || "/",
            headers: {
              Host: params.wsHost || params.sni
            }
          } : void 0
        },
        mux: params.enableMux ? {
          enabled: true,
          concurrency: params.muxConcurrency || 8
        } : void 0,
        sockopt: {
          mark: 255,
          tcpFastOpen: true,
          tcpKeepAliveInterval: 60,
          tcpKeepAliveIdle: 300,
          ...params.enableDPIBypass && {
            fragment: {
              packets: params.fragmentPackets || "1-3",
              length: params.fragmentLength || "100-200",
              interval: params.fragmentInterval || "5-10"
            }
          }
        }
      },
      {
        protocol: "freedom",
        tag: "direct",
        settings: {}
      }
    ],
    routing: {
      domainStrategy: "IPIfNonMatch",
      rules: [
        {
          type: "field",
          domain: ["geosite:private"],
          outboundTag: "direct"
        },
        {
          type: "field",
          ip: ["geoip:private"],
          outboundTag: "direct"
        }
      ]
    },
    dns: {
      servers: (params.dnsServers || ["8.8.8.8", "1.1.1.1"]).map((addr) => ({
        address: addr,
        port: 53
      })),
      clientIp: void 0,
      queryStrategy: "UseIP",
      disableCache: false,
      disableFallback: false
    }
  };
  return config;
}
function generateProStealthConfig(params) {
  return generateXrayConfig({
    protocol: "vless",
    serverAddress: params.serverAddress,
    serverPort: params.serverPort,
    uuid: params.uuid,
    encryption: "none",
    flow: "xtls-rprx-vision",
    sni: params.sni,
    network: "ws",
    wsPath: "/",
    wsHost: params.sni,
    // Maximum DPI bypass
    enableDPIBypass: true,
    fragmentPackets: "1-3",
    fragmentLength: "100-200",
    fragmentInterval: "5-10",
    // Chrome fingerprint for stealth
    enableTLS: true,
    tlsFingerprint: "chrome",
    // Maximum performance
    enableMux: true,
    muxConcurrency: 8,
    // DNS protection
    dnsServers: ["8.8.8.8", "1.1.1.1"],
    logLevel: "warning"
  });
}
function generateStandardConfig(params) {
  return generateXrayConfig({
    protocol: "vless",
    serverAddress: params.serverAddress,
    serverPort: params.serverPort,
    uuid: params.uuid,
    encryption: "none",
    sni: params.sni,
    network: "ws",
    wsPath: "/",
    wsHost: params.sni,
    // Standard DPI bypass
    enableDPIBypass: true,
    fragmentPackets: "1-2",
    fragmentLength: "150-200",
    fragmentInterval: "10-15",
    // Standard TLS
    enableTLS: true,
    tlsFingerprint: "chrome",
    // Standard performance
    enableMux: true,
    muxConcurrency: 4,
    dnsServers: ["8.8.8.8", "1.1.1.1"],
    logLevel: "warning"
  });
}
function generateLiteConfig(params) {
  return generateXrayConfig({
    protocol: "vless",
    serverAddress: params.serverAddress,
    serverPort: params.serverPort,
    uuid: params.uuid,
    encryption: "none",
    sni: params.sni,
    network: "tcp",
    // Minimal DPI bypass
    enableDPIBypass: false,
    // TLS enabled
    enableTLS: true,
    tlsFingerprint: "chrome",
    // Minimal performance overhead
    enableMux: false,
    dnsServers: ["8.8.8.8"],
    logLevel: "warning"
  });
}

// server/vpn-router-extended.ts
var vpnRouterExtended = router({
  /**
   * Save configuration with Pro/Stealth mode support
   */
  saveConfigurationWithMode: protectedProcedure.input(
    z3.object({
      name: z3.string().min(1),
      carrier: z3.string(),
      server: z3.string(),
      sni: z3.string(),
      payloadMethod: z3.string(),
      protocol: z3.string(),
      mode: z3.enum(["lite", "standard", "pro"]).default("standard"),
      isDefault: z3.boolean().optional(),
      // Advanced options
      enableDPIBypass: z3.boolean().optional(),
      tlsFingerprint: z3.enum(["chrome", "firefox", "safari", "edge"]).optional(),
      muxConcurrency: z3.number().min(1).max(1024).optional()
    })
  ).mutation(async ({ ctx, input }) => {
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
        enableDPIBypass: input.enableDPIBypass !== void 0 ? input.enableDPIBypass : input.mode === "pro",
        tlsFingerprint: input.tlsFingerprint || "chrome",
        muxConcurrency: input.muxConcurrency || (input.mode === "pro" ? 8 : 4)
      })
    });
    return { success: true, configId: result[0] };
  }),
  /**
   * Generate Xray configuration for a saved configuration
   */
  generateXrayConfigForConnection: protectedProcedure.input(
    z3.object({
      configId: z3.number(),
      serverAddress: z3.string(),
      serverPort: z3.number(),
      uuid: z3.string()
    })
  ).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const config = await db.select().from(vpnConfigurations).where(
      and2(
        eq3(vpnConfigurations.id, input.configId),
        eq3(vpnConfigurations.userId, ctx.user.id)
      )
    ).limit(1);
    if (config.length === 0) {
      throw new Error("Configuration not found");
    }
    const vpnConfig = config[0];
    const metadata = vpnConfig.metadata ? typeof vpnConfig.metadata === "string" ? JSON.parse(vpnConfig.metadata) : vpnConfig.metadata : { mode: "standard" };
    let xrayConfig;
    switch (metadata.mode) {
      case "pro":
        xrayConfig = generateProStealthConfig({
          serverAddress: input.serverAddress,
          serverPort: input.serverPort,
          uuid: input.uuid,
          sni: vpnConfig.sni
        });
        break;
      case "lite":
        xrayConfig = generateLiteConfig({
          serverAddress: input.serverAddress,
          serverPort: input.serverPort,
          uuid: input.uuid,
          sni: vpnConfig.sni
        });
        break;
      case "standard":
      default:
        xrayConfig = generateStandardConfig({
          serverAddress: input.serverAddress,
          serverPort: input.serverPort,
          uuid: input.uuid,
          sni: vpnConfig.sni
        });
    }
    return {
      success: true,
      config: xrayConfig,
      metadata
    };
  }),
  /**
   * Generate Xray config with custom parameters
   */
  generateCustomXrayConfig: protectedProcedure.input(
    z3.object({
      protocol: z3.enum(["vless", "vmess", "trojan"]),
      serverAddress: z3.string(),
      serverPort: z3.number(),
      uuid: z3.string().optional(),
      password: z3.string().optional(),
      sni: z3.string(),
      network: z3.enum(["tcp", "ws", "h2", "quic"]),
      wsPath: z3.string().optional(),
      wsHost: z3.string().optional(),
      enableDPIBypass: z3.boolean().optional(),
      fragmentPackets: z3.string().optional(),
      fragmentLength: z3.string().optional(),
      fragmentInterval: z3.string().optional(),
      enableTLS: z3.boolean().optional(),
      tlsFingerprint: z3.enum(["chrome", "firefox", "safari", "edge"]).optional(),
      enableMux: z3.boolean().optional(),
      muxConcurrency: z3.number().optional(),
      dnsServers: z3.array(z3.string()).optional()
    })
  ).query(({ input }) => {
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
      dnsServers: input.dnsServers || ["8.8.8.8", "1.1.1.1"]
    });
    return {
      success: true,
      config: xrayConfig
    };
  }),
  /**
   * Get recommended configuration for a carrier
   */
  getRecommendedConfig: protectedProcedure.input(
    z3.object({
      carrier: z3.string(),
      mode: z3.enum(["lite", "standard", "pro"]).optional()
    })
  ).query(({ input }) => {
    const carrierConfigs = {
      vivo: {
        lite: {
          sni: "meuvivo.vivo.com.br",
          payloadMethod: "http"
        },
        standard: {
          sni: "portalrecarga.vivo.com.br",
          payloadMethod: "http"
        },
        pro: {
          sni: "portalrecarga.vivo.com.br",
          payloadMethod: "http"
        }
      },
      claro: {
        lite: {
          sni: "meuclaro.claro.com.br",
          payloadMethod: "http"
        },
        standard: {
          sni: "www.claro.com.br",
          payloadMethod: "tls"
        },
        pro: {
          sni: "www.claro.com.br",
          payloadMethod: "tls"
        }
      },
      oi: {
        lite: {
          sni: "www.oi.com.br",
          payloadMethod: "http"
        },
        standard: {
          sni: "www.oi.com.br",
          payloadMethod: "tls"
        },
        pro: {
          sni: "www.oi.com.br",
          payloadMethod: "tls"
        }
      },
      tim: {
        lite: {
          sni: "www.tim.com.br",
          payloadMethod: "http"
        },
        standard: {
          sni: "www.tim.com.br",
          payloadMethod: "tls"
        },
        pro: {
          sni: "www.tim.com.br",
          payloadMethod: "tls"
        }
      }
    };
    const config = carrierConfigs[input.carrier];
    if (!config) {
      return {
        success: false,
        error: "Carrier not found"
      };
    }
    const mode = input.mode || "standard";
    return {
      success: true,
      recommendation: config[mode],
      mode
    };
  }),
  /**
   * Get DPI bypass settings for a mode
   */
  getDPIBypassSettings: protectedProcedure.input(z3.object({ mode: z3.enum(["lite", "standard", "pro"]) })).query(({ input }) => {
    const settings = {
      lite: {
        enabled: false,
        description: "Sem fragmenta\xE7\xE3o (menor overhead)",
        fragmentPackets: null,
        fragmentLength: null,
        fragmentInterval: null
      },
      standard: {
        enabled: true,
        description: "Fragmenta\xE7\xE3o moderada (balanceado)",
        fragmentPackets: "1-2",
        fragmentLength: "150-200",
        fragmentInterval: "10-15"
      },
      pro: {
        enabled: true,
        description: "Fragmenta\xE7\xE3o m\xE1xima (m\xE1xima evas\xE3o)",
        fragmentPackets: "1-3",
        fragmentLength: "100-200",
        fragmentInterval: "5-10"
      }
    };
    return settings[input.mode];
  }),
  /**
   * Get multiplexing settings for a mode
   */
  getMuxSettings: protectedProcedure.input(z3.object({ mode: z3.enum(["lite", "standard", "pro"]) })).query(({ input }) => {
    const settings = {
      lite: {
        enabled: false,
        concurrency: 1,
        description: "Sem multiplexing (menor overhead)"
      },
      standard: {
        enabled: true,
        concurrency: 4,
        description: "Multiplexing moderado (balanceado)"
      },
      pro: {
        enabled: true,
        concurrency: 8,
        description: "Multiplexing m\xE1ximo (m\xE1xima velocidade)"
      }
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
          description: "Simula navegador Chrome - melhor compatibilidade"
        },
        {
          value: "firefox",
          label: "Firefox",
          description: "Simula navegador Firefox"
        },
        {
          value: "safari",
          label: "Safari",
          description: "Simula navegador Safari"
        },
        {
          value: "edge",
          label: "Edge",
          description: "Simula navegador Edge"
        }
      ],
      recommended: "chrome"
    };
  })
});

// server/routers.ts
var appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true
      };
    })
  }),
  vpn: vpnRouter,
  vpnExtended: vpnRouterExtended
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/vite.ts
import express from "express";
import fs2 from "fs";
import { nanoid } from "nanoid";
import path2 from "path";
import { createServer as createViteServer } from "vite";

// vite.config.ts
import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
var PROJECT_ROOT = import.meta.dirname;
var LOG_DIR = path.join(PROJECT_ROOT, ".manus-logs");
var MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024;
var TRIM_TARGET_BYTES = Math.floor(MAX_LOG_SIZE_BYTES * 0.6);
function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}
function trimLogFile(logPath, maxSize) {
  try {
    if (!fs.existsSync(logPath) || fs.statSync(logPath).size <= maxSize) {
      return;
    }
    const lines = fs.readFileSync(logPath, "utf-8").split("\n");
    const keptLines = [];
    let keptBytes = 0;
    const targetSize = TRIM_TARGET_BYTES;
    for (let i = lines.length - 1; i >= 0; i--) {
      const lineBytes = Buffer.byteLength(`${lines[i]}
`, "utf-8");
      if (keptBytes + lineBytes > targetSize) break;
      keptLines.unshift(lines[i]);
      keptBytes += lineBytes;
    }
    fs.writeFileSync(logPath, keptLines.join("\n"), "utf-8");
  } catch {
  }
}
function writeToLogFile(source, entries) {
  if (entries.length === 0) return;
  ensureLogDir();
  const logPath = path.join(LOG_DIR, `${source}.log`);
  const lines = entries.map((entry) => {
    const ts = (/* @__PURE__ */ new Date()).toISOString();
    return `[${ts}] ${JSON.stringify(entry)}`;
  });
  fs.appendFileSync(logPath, `${lines.join("\n")}
`, "utf-8");
  trimLogFile(logPath, MAX_LOG_SIZE_BYTES);
}
function vitePluginManusDebugCollector() {
  return {
    name: "manus-debug-collector",
    transformIndexHtml(html) {
      if (process.env.NODE_ENV === "production") {
        return html;
      }
      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: {
              src: "/__manus__/debug-collector.js",
              defer: true
            },
            injectTo: "head"
          }
        ]
      };
    },
    configureServer(server) {
      server.middlewares.use("/__manus__/logs", (req, res, next) => {
        if (req.method !== "POST") {
          return next();
        }
        const handlePayload = (payload) => {
          if (payload.consoleLogs?.length > 0) {
            writeToLogFile("browserConsole", payload.consoleLogs);
          }
          if (payload.networkRequests?.length > 0) {
            writeToLogFile("networkRequests", payload.networkRequests);
          }
          if (payload.sessionEvents?.length > 0) {
            writeToLogFile("sessionReplay", payload.sessionEvents);
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        };
        const reqBody = req.body;
        if (reqBody && typeof reqBody === "object") {
          try {
            handlePayload(reqBody);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
          return;
        }
        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });
        req.on("end", () => {
          try {
            const payload = JSON.parse(body);
            handlePayload(payload);
          } catch (e) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: String(e) }));
          }
        });
      });
    }
  };
}
var plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime(), vitePluginManusDebugCollector()];
var vite_config_default = defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1"
    ],
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/_core/vite.ts
async function setupVite(app, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = process.env.NODE_ENV === "development" ? path2.resolve(import.meta.dirname, "../..", "dist", "public") : path2.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/_core/index.ts
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
async function startServer() {
  const app = express2();
  const server = createServer(app);
  app.use(express2.json({ limit: "50mb" }));
  app.use(express2.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
startServer().catch(console.error);
