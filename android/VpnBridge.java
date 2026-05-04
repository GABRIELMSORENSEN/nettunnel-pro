package com.nettunnelpro.vpn;

import android.content.Context;
import android.content.Intent;
import android.net.VpnService;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * VpnBridge - Capacitor Plugin for NetTunnel Pro VPN
 * 
 * Bridges React UI to Android VPN Service and Xray-core
 * Follows nettunnel-pro-expert skill guidelines
 * 
 * Architecture:
 * - UI (React) -> VpnBridge (Capacitor) -> MyVpnService (Android) -> Xray-core (JNI)
 */
@CapacitorPlugin(name = "VpnBridge")
public class VpnBridge extends Plugin {

    private MyVpnService vpnService;

    /**
     * Start VPN connection with Xray configuration
     * 
     * @param config JSON string containing Xray configuration
     * Example config:
     * {
     *   "inbounds": [{"protocol": "socks", "port": 10808}],
     *   "outbounds": [{"protocol": "vless", "settings": {...}}],
     *   "streamSettings": {
     *     "network": "ws",
     *     "security": "tls",
     *     "tlsSettings": {"serverName": "portalrecarga.vivo.com.br"},
     *     "sockopt": {"fragment": {"packets": "1-3", "length": "10-20"}}
     *   }
     * }
     */
    @Override
    public void startVpn(PluginCall call) {
        String config = call.getString("config");
        
        if (config == null || config.isEmpty()) {
            call.reject("Configuration is required");
            return;
        }

        try {
            // Check VPN permission
            Intent prepare = VpnService.prepare(getContext());
            if (prepare != null) {
                startActivityForResult(prepare, 0);
                call.reject("VPN permission required");
                return;
            }

            // Start VPN service with config
            Intent intent = new Intent(getContext(), MyVpnService.class);
            intent.putExtra("config", config);
            getContext().startService(intent);

            notifyListeners("vpnLog", new JSObject()
                .put("message", "VPN service started")
                .put("level", "info"));

            call.resolve();
        } catch (Exception e) {
            notifyListeners("vpnLog", new JSObject()
                .put("message", "Error starting VPN: " + e.getMessage())
                .put("level", "error"));
            call.reject(e.getMessage());
        }
    }

    /**
     * Stop VPN connection
     */
    @Override
    public void stopVpn(PluginCall call) {
        try {
            Intent intent = new Intent(getContext(), MyVpnService.class);
            getContext().stopService(intent);

            notifyListeners("vpnLog", new JSObject()
                .put("message", "VPN service stopped")
                .put("level", "info"));

            call.resolve();
        } catch (Exception e) {
            notifyListeners("vpnLog", new JSObject()
                .put("message", "Error stopping VPN: " + e.getMessage())
                .put("level", "error"));
            call.reject(e.getMessage());
        }
    }

    /**
     * Get current VPN status
     */
    @Override
    public void getStatus(PluginCall call) {
        JSObject result = new JSObject();
        result.put("isConnected", vpnService != null && vpnService.isConnected());
        result.put("currentIp", vpnService != null ? vpnService.getCurrentIp() : null);
        result.put("latency", vpnService != null ? vpnService.getLatency() : null);
        call.resolve(result);
    }
}
