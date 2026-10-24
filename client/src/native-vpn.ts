export type TunnelState = { phase: string; error?: string; ip?: string; seconds?: number; tx?: number; rx?: number };
export type NativeProfile = { ok: boolean; name?: string; host?: string; protocol?: string; error?: string };
declare global { interface Window { NetTunnel?: { status(): string; profile(): string; configure(link: string): string; connect(): string; disconnect(): void; } } }
export const nativeVpn = () => window.NetTunnel;
