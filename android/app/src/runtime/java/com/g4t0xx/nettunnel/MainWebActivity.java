package com.g4t0xx.nettunnel;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.net.VpnService;
import android.os.Bundle;
import android.webkit.*;
import android.widget.Toast;
import org.json.JSONObject;
import java.io.*;
import java.util.Map;

public final class MainWebActivity extends Activity {
    private WebView web;
    private ValueCallback<Uri[]> chooser;
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        web = new WebView(this); setContentView(web);
        web.setBackgroundColor(0xff0A0A0B);
        web.getSettings().setJavaScriptEnabled(true); web.getSettings().setDomStorageEnabled(true);
        web.getSettings().setAllowFileAccess(false); web.getSettings().setAllowContentAccess(false);
        web.getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        if (android.os.Build.VERSION.SDK_INT >= 33) requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"}, 52);
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);
        web.addJavascriptInterface(new Bridge(), "NetTunnel");
        web.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (!"appassets.androidplatform.net".equals(uri.getHost()) || !"https".equals(uri.getScheme())) return null;
                String path = uri.getPath().substring(1);
                if (path.isEmpty()) path = "index.html";
                if (!path.startsWith("public/")) path = "public/" + path;
                if (path.contains("..")) return new WebResourceResponse("text/plain", "UTF-8", 403, "Forbidden", java.util.Collections.emptyMap(), new ByteArrayInputStream(new byte[0]));
                try {
                    String mime = path.endsWith(".js") || path.endsWith(".mjs") ? "text/javascript" : path.endsWith(".css") ? "text/css" : path.endsWith(".html") ? "text/html" : MimeTypeMap.getSingleton().getMimeTypeFromExtension(MimeTypeMap.getFileExtensionFromUrl(path));
                    return new WebResourceResponse(mime == null ? "application/octet-stream" : mime, "UTF-8", 200, "OK", java.util.Collections.singletonMap("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self'; img-src 'self' data:; frame-src 'none'"), getAssets().open(path));
                } catch (IOException e) { return new WebResourceResponse("text/plain", "UTF-8", 404, "Not Found", java.util.Collections.emptyMap(), new ByteArrayInputStream(new byte[0])); }
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if ("appassets.androidplatform.net".equals(uri.getHost()) && "https".equals(uri.getScheme())) return false;
                if (java.util.Arrays.asList("http", "https").contains(uri.getScheme())) startActivity(new Intent(Intent.ACTION_VIEW, uri));
                return true;
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> result, FileChooserParams params) {
                if (chooser != null) chooser.onReceiveValue(null); chooser = result;
                Intent pick = new Intent(Intent.ACTION_GET_CONTENT).setType("application/json").addCategory(Intent.CATEGORY_OPENABLE);
                startActivityForResult(pick, 53); return true;
            }
            @Override public boolean onConsoleMessage(ConsoleMessage m) { android.util.Log.d("NetTunnelWeb", m.messageLevel()+": "+m.message()); return true; }
        });
        importIntent(getIntent());
        web.loadUrl("https://appassets.androidplatform.net/" + (BuildConfig.START_PAGE.equals("index.html") ? "" : BuildConfig.START_PAGE));
    }
    private void importIntent(Intent intent) {
        if (intent.getData() == null) return;
        try { if (VpnTunnelService.busy()) throw new Exception("Desconecte antes de importar outro servidor"); Profiles.save(this, intent.getData().toString()); Toast.makeText(this, "Servidor importado", Toast.LENGTH_SHORT).show(); }
        catch (Exception e) { Toast.makeText(this, e.getMessage(), Toast.LENGTH_LONG).show(); }
        intent.setData(null);
    }
    @Override protected void onNewIntent(Intent intent) { super.onNewIntent(intent); setIntent(intent); importIntent(intent); }
    private void startTunnel() { startForegroundService(new Intent(this, VpnTunnelService.class)); }
    @Override protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        if (request == 51) { if (result == RESULT_OK) startTunnel(); else VpnTunnelService.failure("Permissão VPN recusada"); }
        if (request == 53 && chooser != null) { chooser.onReceiveValue(result == RESULT_OK && data != null ? new Uri[]{data.getData()} : null); chooser = null; }
    }
    final class Bridge {
        @JavascriptInterface public String configure(String link) {
            try { if (VpnTunnelService.busy()) throw new Exception("Desconecte antes de mudar o servidor"); Profiles.save(MainWebActivity.this, link); return "{\"ok\":true}"; }
            catch (Exception e) { return error(e); }
        }
        @JavascriptInterface public String profile() {
            try { JSONObject p = Profiles.load(MainWebActivity.this); return new JSONObject().put("ok", true).put("name", p.getString("name")).put("host", p.getString("host")).put("protocol", p.getString("protocol")).toString(); }
            catch (Exception e) { return error(e); }
        }
        @JavascriptInterface public String status() { return VpnTunnelService.status(); }
        @JavascriptInterface public String connect() {
            try { Profiles.load(MainWebActivity.this); runOnUiThread(() -> { Intent permission = VpnService.prepare(MainWebActivity.this); if (permission != null) startActivityForResult(permission, 51); else startTunnel(); }); return "{\"ok\":true}"; }
            catch (Exception e) { return error(e); }
        }
        @JavascriptInterface public void disconnect() { startService(new Intent(MainWebActivity.this, VpnTunnelService.class).setAction("stop")); }
        private String error(Exception e) { try { return new JSONObject().put("ok", false).put("error", e.getMessage()).toString(); } catch (Exception ignored) { return "{}"; } }
    }
    @Override public void onBackPressed() { if (web.canGoBack()) web.goBack(); else super.onBackPressed(); }
    @Override protected void onDestroy() { web.removeJavascriptInterface("NetTunnel"); web.destroy(); super.onDestroy(); }
}
