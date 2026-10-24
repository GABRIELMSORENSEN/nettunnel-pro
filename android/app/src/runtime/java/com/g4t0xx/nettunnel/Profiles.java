package com.g4t0xx.nettunnel;

import android.content.Context;
import android.net.Uri;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import org.json.*;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.util.UUID;
import javax.crypto.*;
import javax.crypto.spec.GCMParameterSpec;

final class Profiles {
    private static final String KEY = "nettunnel-xray-profile-v1";
    private static javax.crypto.SecretKey key() throws Exception {
        KeyStore ks = KeyStore.getInstance("AndroidKeyStore"); ks.load(null);
        if (!ks.containsAlias(KEY)) {
            KeyGenerator generator = KeyGenerator.getInstance("AES", "AndroidKeyStore");
            generator.init(new KeyGenParameterSpec.Builder(KEY, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).build());
            generator.generateKey();
        }
        return (javax.crypto.SecretKey)ks.getKey(KEY, null);
    }
    static void save(Context context, String link) throws Exception {
        parse(link);
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding"); cipher.init(Cipher.ENCRYPT_MODE, key());
        String value = Base64.encodeToString(cipher.getIV(), Base64.NO_WRAP) + "." + Base64.encodeToString(cipher.doFinal(link.getBytes(StandardCharsets.UTF_8)), Base64.NO_WRAP);
        if (!context.getSharedPreferences(KEY, 0).edit().putString("profile", value).commit()) throw new Exception("Falha ao salvar perfil");
    }
    static JSONObject load(Context context) throws Exception {
        String value = context.getSharedPreferences(KEY, 0).getString("profile", null);
        if (value == null) throw new Exception("Importe um servidor VLESS, VMess ou Trojan válido. Os nomes de exemplo não contêm credenciais.");
        String[] parts = value.split("\\.", 2);
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.DECRYPT_MODE, key(), new GCMParameterSpec(128, Base64.decode(parts[0], Base64.NO_WRAP)));
        return parse(new String(cipher.doFinal(Base64.decode(parts[1], Base64.NO_WRAP)), StandardCharsets.UTF_8));
    }
    private static String query(Uri uri, String name, String fallback) { String v = uri.getQueryParameter(name); return v == null ? fallback : v; }
    static JSONObject parse(String link) throws Exception {
        if (link == null || link.length() > 32768) throw new Exception("Perfil inválido");
        Uri uri = Uri.parse(link.trim()); String protocol = uri.getScheme();
        JSONObject p = new JSONObject();
        if ("vmess".equals(protocol)) {
            JSONObject v = new JSONObject(new String(Base64.decode(link.trim().substring(8), Base64.DEFAULT), StandardCharsets.UTF_8));
            p.put("protocol", "vmess").put("host", v.getString("add")).put("port", Integer.parseInt(v.getString("port")))
                .put("id", v.getString("id")).put("name", v.optString("ps", "VMess"))
                .put("network", v.optString("net", "tcp")).put("path", v.optString("path", "/"))
                .put("tls", "tls".equals(v.optString("tls")) ? "tls" : "none").put("sni", v.optString("sni", v.optString("host", v.getString("add"))))
                .put("wsHost", v.optString("host", v.getString("add")));
        } else if ("vless".equals(protocol) || "trojan".equals(protocol)) {
            if (uri.getHost() == null || uri.getUserInfo() == null) throw new Exception("Endereço e credencial obrigatórios");
            p.put("protocol", protocol).put("host", uri.getHost()).put("port", uri.getPort() < 0 ? 443 : uri.getPort())
                .put("id", Uri.decode(uri.getUserInfo())).put("name", uri.getFragment() == null ? uri.getHost() : uri.getFragment())
                .put("network", query(uri, "type", "tcp")).put("path", query(uri, "path", "/"))
                .put("tls", query(uri, "security", "trojan".equals(protocol) ? "tls" : "none"))
                .put("sni", query(uri, "sni", uri.getHost())).put("wsHost", query(uri, "host", uri.getHost()))
                .put("flow", query(uri, "flow", "")).put("publicKey", query(uri, "pbk", ""))
                .put("shortId", query(uri, "sid", "")).put("fingerprint", query(uri, "fp", "chrome"));
        } else throw new Exception("Use link vless://, vmess:// ou trojan://");
        if (!p.getString("host").matches("[a-zA-Z0-9.:%_-]{1,253}") || p.getInt("port") < 1 || p.getInt("port") > 65535) throw new Exception("Servidor inválido");
        if (!"trojan".equals(protocol)) UUID.fromString(p.getString("id"));
        if (!java.util.Arrays.asList("tcp", "ws", "grpc").contains(p.getString("network"))) throw new Exception("Transporte não suportado: " + p.getString("network"));
        if (!java.util.Arrays.asList("none", "tls", "reality").contains(p.getString("tls"))) throw new Exception("Segurança não suportada");
        return p;
    }
    static JSONObject config(JSONObject p, int socksPort, int httpPort) throws Exception {
        String protocol = p.getString("protocol");
        JSONObject user = new JSONObject().put("id", p.getString("id")).put("encryption", "none");
        if (protocol.equals("vmess")) user.put("security", "auto").put("alterId", 0);
        if (!p.optString("flow").isEmpty()) user.put("flow", p.getString("flow"));
        JSONObject endpoint = new JSONObject().put("address", p.getString("host")).put("port", p.getInt("port"));
        JSONObject settings;
        if (protocol.equals("trojan")) settings = new JSONObject().put("servers", new JSONArray().put(endpoint.put("password", p.getString("id"))));
        else settings = new JSONObject().put("vnext", new JSONArray().put(endpoint.put("users", new JSONArray().put(user))));
        JSONObject stream = new JSONObject().put("network", p.getString("network")).put("security", p.getString("tls"));
        if (p.getString("tls").equals("tls")) stream.put("tlsSettings", new JSONObject().put("serverName", p.getString("sni")).put("allowInsecure", false));
        if (p.getString("tls").equals("reality")) stream.put("realitySettings", new JSONObject().put("serverName", p.getString("sni")).put("publicKey", p.getString("publicKey")).put("shortId", p.getString("shortId")).put("fingerprint", p.getString("fingerprint")));
        if (p.getString("network").equals("ws")) stream.put("wsSettings", new JSONObject().put("path", p.getString("path")).put("headers", new JSONObject().put("Host", p.getString("wsHost"))));
        if (p.getString("network").equals("grpc")) stream.put("grpcSettings", new JSONObject().put("serviceName", p.getString("path").replaceFirst("^/", "")));
        JSONObject outbound = new JSONObject().put("tag", "proxy").put("protocol", protocol).put("settings", settings).put("streamSettings", stream);
        return new JSONObject().put("log", new JSONObject().put("loglevel", "warning"))
            .put("inbounds", new JSONArray()
                .put(new JSONObject().put("listen", "127.0.0.1").put("port", socksPort).put("protocol", "socks").put("settings", new JSONObject().put("auth", "noauth").put("udp", true)))
                .put(new JSONObject().put("listen", "127.0.0.1").put("port", httpPort).put("protocol", "http")))
            .put("outbounds", new JSONArray().put(outbound).put(new JSONObject().put("tag", "block").put("protocol", "blackhole")))
            .put("routing", new JSONObject().put("rules", new JSONArray().put(new JSONObject().put("type", "field").put("network", "udp").put("port", "443").put("outboundTag", "block"))));
    }
}
