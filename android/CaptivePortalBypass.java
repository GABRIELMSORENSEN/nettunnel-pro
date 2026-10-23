package com.nettunnel.vpn;

import android.content.Context;
import android.net.VpnService;
import java.io.*;
import java.net.*;

/**
 * CaptivePortalBypass
 * 
 * Implements fake responses to Android's captive portal detection tests.
 * Android checks connectivity by accessing connectivitycheck.gstatic.com.
 * This class intercepts and responds to these checks, making the system
 * believe internet is working and releasing the "Sign in to network" notification.
 * 
 * Features:
 * - Intercepts DNS queries for connectivitycheck.gstatic.com
 * - Responds with fake HTTP 204 responses
 * - Prevents "Sign in to network" notification
 * - Enables full internet access through VPN
 */
public class CaptivePortalBypass {
    private static final String TAG = "CaptivePortalBypass";
    private static final String CAPTIVE_PORTAL_HOST = "connectivitycheck.gstatic.com";
    private static final String CAPTIVE_PORTAL_PATH = "/generate_204";
    private static final int FAKE_SERVER_PORT = 8080;
    
    private Context context;
    private Thread fakeServerThread;
    private boolean isRunning = false;
    private ServerSocket serverSocket;
    
    public CaptivePortalBypass(Context context) {
        this.context = context;
    }
    
    /**
     * Start the fake captive portal server
     */
    public void start() {
        if (isRunning) {
            return;
        }
        
        isRunning = true;
        fakeServerThread = new Thread(() -> {
            try {
                serverSocket = new ServerSocket(FAKE_SERVER_PORT);
                Log.d(TAG, "Fake captive portal server started on port " + FAKE_SERVER_PORT);
                
                while (isRunning) {
                    try {
                        Socket clientSocket = serverSocket.accept();
                        new Thread(() -> handleClientRequest(clientSocket)).start();
                    } catch (SocketException e) {
                        if (isRunning) {
                            Log.e(TAG, "Socket error: " + e.getMessage());
                        }
                    }
                }
            } catch (IOException e) {
                Log.e(TAG, "Failed to start fake server: " + e.getMessage());
            }
        });
        
        fakeServerThread.setName("CaptivePortalBypass");
        fakeServerThread.start();
    }
    
    /**
     * Stop the fake captive portal server
     */
    public void stop() {
        isRunning = false;
        
        try {
            if (serverSocket != null && !serverSocket.isClosed()) {
                serverSocket.close();
            }
        } catch (IOException e) {
            Log.e(TAG, "Error closing server socket: " + e.getMessage());
        }
        
        if (fakeServerThread != null) {
            try {
                fakeServerThread.join(1000);
            } catch (InterruptedException e) {
                Log.e(TAG, "Error joining thread: " + e.getMessage());
            }
        }
    }
    
    /**
     * Handle incoming client request
     */
    private void handleClientRequest(Socket clientSocket) {
        try {
            BufferedReader reader = new BufferedReader(
                new InputStreamReader(clientSocket.getInputStream())
            );
            
            // Read HTTP request
            String requestLine = reader.readLine();
            if (requestLine == null) {
                clientSocket.close();
                return;
            }
            
            Log.d(TAG, "Received request: " + requestLine);
            
            // Check if this is a captive portal detection request
            if (requestLine.contains("GET") && requestLine.contains(CAPTIVE_PORTAL_PATH)) {
                // Send HTTP 204 No Content response
                sendCaptivePortalResponse(clientSocket);
            } else {
                // Send generic HTTP 200 OK response
                sendGenericResponse(clientSocket);
            }
            
            clientSocket.close();
        } catch (IOException e) {
            Log.e(TAG, "Error handling client request: " + e.getMessage());
            try {
                clientSocket.close();
            } catch (IOException ex) {
                Log.e(TAG, "Error closing socket: " + ex.getMessage());
            }
        }
    }
    
    /**
     * Send HTTP 204 No Content response (captive portal detection)
     */
    private void sendCaptivePortalResponse(Socket socket) throws IOException {
        PrintWriter writer = new PrintWriter(socket.getOutputStream(), true);
        
        // HTTP 204 No Content response
        writer.println("HTTP/1.1 204 No Content");
        writer.println("Connection: close");
        writer.println("Content-Length: 0");
        writer.println();
        writer.flush();
        
        Log.d(TAG, "Sent HTTP 204 response for captive portal detection");
    }
    
    /**
     * Send generic HTTP 200 OK response
     */
    private void sendGenericResponse(Socket socket) throws IOException {
        PrintWriter writer = new PrintWriter(socket.getOutputStream(), true);
        
        String responseBody = "<html><body>OK</body></html>";
        
        writer.println("HTTP/1.1 200 OK");
        writer.println("Content-Type: text/html; charset=UTF-8");
        writer.println("Content-Length: " + responseBody.length());
        writer.println("Connection: close");
        writer.println();
        writer.println(responseBody);
        writer.flush();
        
        Log.d(TAG, "Sent HTTP 200 response");
    }
    
    /**
     * Check if bypass server is running
     */
    public boolean isActive() {
        return isRunning;
    }
    
    /**
     * Get server port
     */
    public int getServerPort() {
        return FAKE_SERVER_PORT;
    }
    
    /**
     * Get captive portal host
     */
    public static String getCaptivePortalHost() {
        return CAPTIVE_PORTAL_HOST;
    }
    
    /**
     * Get captive portal path
     */
    public static String getCaptivePortalPath() {
        return CAPTIVE_PORTAL_PATH;
    }
}
