package com.nettunnelpro.vpn;

import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.net.VpnService;
import android.os.Binder;
import android.os.IBinder;
import android.util.Log;

/**
 * MyVpnService - Android VPN Service Implementation
 * 
 * Extends VpnService to handle:
 * - TUN interface configuration
 * - Xray-core JNI integration
 * - Connection lifecycle management
 * - DNS and routing configuration
 * 
 * Follows nettunnel-pro-expert skill guidelines
 */
public class MyVpnService extends VpnService {

    private static final String TAG = "NetTunnelPro";
    private static final String CHANNEL_ID = "nettunnel_vpn";

    private VpnService.Builder vpnBuilder;
    private Thread xrayThread;
    private boolean isConnected = false;
    private String currentIp;
    private long latency;

    private final IBinder binder = new LocalBinder();

    public class LocalBinder extends Binder {
        MyVpnService getService() {
            return MyVpnService.this;
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String config = intent.getStringExtra("config");
        
        if (config != null) {
            startVpn(config);
        }

        return START_STICKY;
    }

    /**
     * Start VPN with Xray configuration
     * 
     * Steps:
     * 1. Build TUN interface with VpnService.Builder
     * 2. Load Xray native library via JNI
     * 3. Pass configuration to Xray
     * 4. Start Xray process
     * 5. Forward traffic through SOCKS proxy (localhost:10808)
     */
    private void startVpn(String config) {
        try {
            Log.d(TAG, "Starting VPN with config: " + config);

            // Configure TUN interface
            vpnBuilder = new VpnService.Builder();
            vpnBuilder.setSession("NetTunnel Pro")
                    .addAddress("10.0.0.2", 32)
                    .addRoute("0.0.0.0", 0)
                    .addDnsServer("8.8.8.8")
                    .addDnsServer("8.8.4.4")
                    .setMtu(1500)
                    .setBlocking(false);

            // Establish VPN connection
            ParcelFileDescriptor pfd = vpnBuilder.establish();
            if (pfd == null) {
                Log.e(TAG, "Failed to establish VPN");
                stopSelf();
                return;
            }

            Log.d(TAG, "VPN interface established, TUN fd: " + pfd.getFd());

            // Start Xray in separate thread
            xrayThread = new Thread(() -> {
                try {
                    // Load Xray native library
                    System.loadLibrary("Xray");
                    
                    // Start Xray with configuration
                    // This calls native function: int startXray(String config, int tunFd)
                    int result = startXray(config, pfd.getFd());
                    
                    if (result == 0) {
                        Log.d(TAG, "Xray started successfully");
                        isConnected = true;
                        currentIp = "203.0.113.42"; // Placeholder - get from actual connection
                        latency = 45; // Placeholder - measure actual latency
                    } else {
                        Log.e(TAG, "Xray start failed with status: " + result);
                        isConnected = false;
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Error starting Xray: " + e.getMessage());
                    isConnected = false;
                }
            });

            xrayThread.start();

        } catch (Exception e) {
            Log.e(TAG, "Error in startVpn: " + e.getMessage());
            stopSelf();
        }
    }

    /**
     * Stop VPN connection
     */
    public void stopVpn() {
        try {
            Log.d(TAG, "Stopping VPN");
            
            // Stop Xray process
            stopXray();
            
            // Wait for thread to finish
            if (xrayThread != null && xrayThread.isAlive()) {
                xrayThread.join(5000);
            }
            
            isConnected = false;
            currentIp = null;
            latency = 0;
            
            stopSelf();
        } catch (Exception e) {
            Log.e(TAG, "Error stopping VPN: " + e.getMessage());
        }
    }

    @Override
    public void onDestroy() {
        stopVpn();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return binder;
    }

    // Getters for status
    public boolean isConnected() {
        return isConnected;
    }

    public String getCurrentIp() {
        return currentIp;
    }

    public long getLatency() {
        return latency;
    }

    // JNI declarations
    // These native functions are implemented in libXray.so
    
    /**
     * Start Xray core with configuration
     * 
     * @param config JSON configuration string
     * @param tunFd File descriptor for TUN interface
     * @return 0 on success, non-zero on error
     */
    private native int startXray(String config, int tunFd);

    /**
     * Stop Xray core
     */
    private native void stopXray();

    /**
     * Get current connection statistics
     * 
     * @return JSON string with stats
     */
    private native String getStats();
}
