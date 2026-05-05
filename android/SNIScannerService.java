package com.nettunnel.vpn;

import android.util.Log;
import java.util.*;
import java.util.concurrent.*;

/**
 * SNIScannerService
 * 
 * Implements dynamic SNI scanning with automatic fallback.
 * When a connection fails (handshake timeout, blocked SNI), this service
 * automatically tries the next SNI in the list until finding one that works.
 * 
 * Features:
 * - Automatic SNI fallback on connection failure
 * - Exponential backoff retry logic
 * - Success rate tracking
 * - Priority-based SNI selection
 * - Timeout handling
 */
public class SNIScannerService {
    private static final String TAG = "SNIScannerService";
    private static final int HANDSHAKE_TIMEOUT_MS = 10000;
    private static final int MAX_RETRIES = 3;
    private static final int INITIAL_BACKOFF_MS = 1000;
    private static final int MAX_BACKOFF_MS = 10000;
    
    public interface SNIScanCallback {
        void onSNIFound(String sni, int attempts);
        void onSNIFailed(String sni, String error);
        void onScanComplete(String bestSNI, List<String> workingSNIs);
        void onScanFailed(String error);
    }
    
    private List<SNIConfig> sniList;
    private SNIScanCallback callback;
    private ExecutorService executorService;
    private volatile boolean isScanning = false;
    private Map<String, Integer> sniSuccessRate;
    
    public static class SNIConfig {
        public String domain;
        public int priority;
        public int successRate;
        
        public SNIConfig(String domain, int priority, int successRate) {
            this.domain = domain;
            this.priority = priority;
            this.successRate = successRate;
        }
    }
    
    public SNIScannerService() {
        this.executorService = Executors.newFixedThreadPool(3);
        this.sniSuccessRate = new ConcurrentHashMap<>();
    }
    
    /**
     * Start SNI scanning with list of SNIs
     */
    public void startScanning(List<SNIConfig> snis, SNIScanCallback callback) {
        if (isScanning) {
            Log.w(TAG, "Scanning already in progress");
            return;
        }
        
        this.sniList = new ArrayList<>(snis);
        this.callback = callback;
        this.isScanning = true;
        
        // Sort by priority (higher priority first)
        this.sniList.sort((a, b) -> Integer.compare(b.priority, a.priority));
        
        Log.d(TAG, "Starting SNI scan with " + sniList.size() + " SNIs");
        
        // Scan SNIs in parallel
        for (SNIConfig sni : sniList) {
            executorService.submit(() -> testSNI(sni));
        }
    }
    
    /**
     * Test single SNI connection
     */
    private void testSNI(SNIConfig sni) {
        Log.d(TAG, "Testing SNI: " + sni.domain);
        
        int retries = 0;
        long backoffMs = INITIAL_BACKOFF_MS;
        
        while (retries < MAX_RETRIES && isScanning) {
            try {
                // Simulate connection test (in real implementation, this would test actual Xray connection)
                if (testSNIConnection(sni.domain)) {
                    Log.d(TAG, "SNI test successful: " + sni.domain);
                    sniSuccessRate.put(sni.domain, 100);
                    
                    if (callback != null) {
                        callback.onSNIFound(sni.domain, retries + 1);
                    }
                    return;
                }
            } catch (Exception e) {
                Log.e(TAG, "SNI test error: " + e.getMessage());
            }
            
            retries++;
            
            if (retries < MAX_RETRIES) {
                try {
                    Log.d(TAG, "Retrying SNI " + sni.domain + " after " + backoffMs + "ms");
                    Thread.sleep(backoffMs);
                    
                    // Exponential backoff
                    backoffMs = Math.min(backoffMs * 2, MAX_BACKOFF_MS);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }
        
        Log.w(TAG, "SNI test failed: " + sni.domain);
        sniSuccessRate.put(sni.domain, Math.max(0, sni.successRate - 10));
        
        if (callback != null) {
            callback.onSNIFailed(sni.domain, "Handshake timeout or blocked");
        }
    }
    
    /**
     * Test actual SNI connection (placeholder - would integrate with Xray)
     */
    private boolean testSNIConnection(String sni) throws Exception {
        // In real implementation, this would:
        // 1. Create a temporary Xray config with this SNI
        // 2. Start connection
        // 3. Test if handshake completes within HANDSHAKE_TIMEOUT_MS
        // 4. Return success/failure
        
        // For now, simulate based on success rate
        Random random = new Random();
        int randomValue = random.nextInt(100);
        
        // Simulate network latency
        Thread.sleep(random.nextInt(2000) + 1000);
        
        // 80% success rate for simulation
        return randomValue < 80;
    }
    
    /**
     * Get best SNI from scan results
     */
    public String getBestSNI() {
        if (sniList == null || sniList.isEmpty()) {
            return null;
        }
        
        return sniList.stream()
            .max(Comparator.comparingInt(sni -> 
                sniSuccessRate.getOrDefault(sni.domain, sni.successRate)
            ))
            .map(sni -> sni.domain)
            .orElse(null);
    }
    
    /**
     * Get all working SNIs
     */
    public List<String> getWorkingSNIs() {
        return sniSuccessRate.entrySet().stream()
            .filter(entry -> entry.getValue() >= 70)
            .sorted((a, b) -> Integer.compare(b.getValue(), a.getValue()))
            .map(Map.Entry::getKey)
            .toList();
    }
    
    /**
     * Get SNI success rate
     */
    public int getSNISuccessRate(String sni) {
        return sniSuccessRate.getOrDefault(sni, 0);
    }
    
    /**
     * Stop SNI scanning
     */
    public void stopScanning() {
        isScanning = false;
        
        List<String> workingSNIs = getWorkingSNIs();
        String bestSNI = getBestSNI();
        
        if (callback != null && bestSNI != null) {
            callback.onScanComplete(bestSNI, workingSNIs);
        } else if (callback != null) {
            callback.onScanFailed("No working SNI found");
        }
    }
    
    /**
     * Auto-fallback: Try next SNI on current failure
     */
    public String getNextSNI(String currentSNI) {
        if (sniList == null || sniList.isEmpty()) {
            return null;
        }
        
        int currentIndex = -1;
        for (int i = 0; i < sniList.size(); i++) {
            if (sniList.get(i).domain.equals(currentSNI)) {
                currentIndex = i;
                break;
            }
        }
        
        if (currentIndex >= 0 && currentIndex < sniList.size() - 1) {
            return sniList.get(currentIndex + 1).domain;
        }
        
        return null;
    }
    
    /**
     * Check if scanning is active
     */
    public boolean isScanning() {
        return isScanning;
    }
    
    /**
     * Shutdown service
     */
    public void shutdown() {
        isScanning = false;
        executorService.shutdown();
        try {
            if (!executorService.awaitTermination(5, TimeUnit.SECONDS)) {
                executorService.shutdownNow();
            }
        } catch (InterruptedException e) {
            executorService.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }
    
    /**
     * Get statistics
     */
    public Map<String, Integer> getStatistics() {
        return new HashMap<>(sniSuccessRate);
    }
}
