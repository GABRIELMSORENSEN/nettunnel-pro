package com.g4t0xx.mobileverify;

import android.app.Instrumentation;
import android.graphics.Rect;
import android.net.*;
import android.os.Bundle;
import android.view.accessibility.AccessibilityNodeInfo;
import org.json.*;
import java.net.URL;
import java.net.HttpURLConnection;
import java.io.*;
import java.nio.charset.StandardCharsets;

/** Separate test UID: network checks are not exempted by either VPN application. */
public final class MobileVerify extends Instrumentation {
    private Bundle args;
    @Override public void onCreate(Bundle arguments) { args = arguments; start(); }
    private void collect(AccessibilityNodeInfo node, JSONArray nodes, String target, boolean[] clicked) throws Exception {
        if (node == null || nodes.length() > 350) return;
        String text = node.getText() == null ? "" : node.getText().toString();
        String description = node.getContentDescription() == null ? "" : node.getContentDescription().toString();
        String pkg = node.getPackageName() == null ? "" : node.getPackageName().toString();
        Rect bounds = new Rect(); node.getBoundsInScreen(bounds);
        nodes.put(new JSONObject().put("text", text).put("description", description).put("package", pkg)
            .put("id", node.getViewIdResourceName()).put("clickable", node.isClickable()).put("enabled", node.isEnabled())
            .put("bounds", new JSONArray().put(bounds.left).put(bounds.top).put(bounds.right).put(bounds.bottom)));
        boolean ours = pkg.equals("com.nettunnel.pro") || pkg.equals("com.g4t0xx.homelink") || pkg.equals("com.android.vpndialogs");
        if (!clicked[0] && target != null && ours && node.isEnabled() && (target.equals(text) || target.equals(description) || target.equals(node.getViewIdResourceName()))) {
            AccessibilityNodeInfo control = node;
            for (int i = 0; i < 4 && control != null && !control.isClickable(); i++) control = control.getParent();
            if (control != null && control.isClickable()) clicked[0] = control.performAction(AccessibilityNodeInfo.ACTION_CLICK);
        }
        for (int i = 0; i < node.getChildCount(); i++) collect(node.getChild(i), nodes, target, clicked);
    }
    @Override public void onStart() {
        JSONObject result = new JSONObject();
        try {
            String mode = args.getString("mode", "dump");
            if (mode.equals("speed")) {
                long bytes = 0;
                long start = System.nanoTime();
                HttpURLConnection connection = (HttpURLConnection)new URL("https://speed.cloudflare.com/__down?bytes=2000000&g4=" + start).openConnection();
                connection.setConnectTimeout(20000); connection.setReadTimeout(30000); connection.setUseCaches(false);
                long firstByte;
                try (InputStream input = connection.getInputStream()) {
                    firstByte = System.nanoTime(); byte[] buffer = new byte[32768]; int count;
                    while ((count = input.read(buffer)) != -1 && bytes < 2100000) bytes += count;
                    result.put("http", connection.getResponseCode());
                } finally { connection.disconnect(); }
                long end = System.nanoTime();
                result.put("bytes", bytes).put("total_ms", (end - start) / 1000000.0)
                    .put("ttfb_ms", (firstByte - start) / 1000000.0)
                    .put("mbps_including_setup", bytes * 8.0 / ((end - start) / 1000000000.0) / 1000000.0);
                ConnectivityManager cm = getTargetContext().getSystemService(ConnectivityManager.class);
                NetworkCapabilities nc = cm.getNetworkCapabilities(cm.getActiveNetwork());
                result.put("vpn", nc != null && nc.hasTransport(NetworkCapabilities.TRANSPORT_VPN))
                    .put("cellular", nc != null && nc.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR))
                    .put("wifi", nc != null && nc.hasTransport(NetworkCapabilities.TRANSPORT_WIFI));
            } else if (mode.equals("network")) {
                String hostname = args.getString("host", "api.ipify.org");
                if (!hostname.equals("api.ipify.org") && !hostname.equals("api6.ipify.org")) throw new Exception("Probe host not allowed");
                HttpURLConnection connection = (HttpURLConnection)new URL("https://" + hostname + "?format=json&g4=" + System.nanoTime()).openConnection();
                connection.setConnectTimeout(20000); connection.setReadTimeout(20000); connection.setUseCaches(false);
                try (InputStream input = connection.getInputStream()) {
                    ByteArrayOutputStream body = new ByteArrayOutputStream(); byte[] buffer = new byte[256]; int read;
                    while ((read = input.read(buffer)) != -1 && body.size() < 1024) body.write(buffer, 0, read);
                    JSONObject data = new JSONObject(body.toString(StandardCharsets.UTF_8.name()));
                    result.put("ip", data.getString("ip")).put("http", connection.getResponseCode());
                } finally { connection.disconnect(); }
                ConnectivityManager cm = getTargetContext().getSystemService(ConnectivityManager.class);
                NetworkCapabilities nc = cm.getNetworkCapabilities(cm.getActiveNetwork());
                result.put("vpn", nc != null && nc.hasTransport(NetworkCapabilities.TRANSPORT_VPN));
                result.put("cellular", nc != null && nc.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR));
                result.put("wifi", nc != null && nc.hasTransport(NetworkCapabilities.TRANSPORT_WIFI));
            } else {
                JSONArray nodes = new JSONArray(); boolean[] clicked = {false};
                collect(getUiAutomation(1).getRootInActiveWindow(), nodes, args.getString("click"), clicked);
                result.put("nodes", nodes).put("clicked", clicked[0]);
            }
            result.put("ok", true);
        } catch (Exception e) { try { result.put("ok", false).put("error", e.toString()); } catch (JSONException ignored) {} }
        Bundle out = new Bundle(); out.putString("stream", "G4_RESULT=" + result.toString() + "\n"); finish(0, out);
    }
}
