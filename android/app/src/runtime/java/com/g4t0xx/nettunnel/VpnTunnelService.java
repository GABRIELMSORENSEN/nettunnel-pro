package com.g4t0xx.nettunnel;

import android.app.*;
import android.content.*;
import android.net.VpnService;
import android.os.*;
import hev.htproxy.TProxyService;
import org.json.*;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.concurrent.*;

public final class VpnTunnelService extends VpnService {
    private static volatile String phase = "disconnected", error = "", exitIp = "";
    private static volatile long started;
    private volatile boolean stopping;
    private volatile long generation;
    private int socksPort, httpPort;
    private java.lang.Process core;
    private ParcelFileDescriptor tun, nativeTun;
    private ExecutorService executor = Executors.newSingleThreadExecutor();
    static boolean busy() { return phase.equals("connecting") || phase.equals("connected"); }
    static void failure(String message) { error = message; phase = "error"; }
    static String status() {
        try {
            JSONObject out = new JSONObject().put("phase", phase).put("error", error).put("ip", exitIp).put("seconds", started == 0 ? 0 : (SystemClock.elapsedRealtime() - started) / 1000);
            if (busy() && TProxyService.TProxyIsRunning()) { long[] s = TProxyService.TProxyGetStats(); out.put("tx", s[1]).put("rx", s[3]); }
            return out.toString();
        } catch (Exception e) { return "{\"phase\":\"error\",\"error\":\"Falha ao consultar túnel\"}"; }
    }
    @Override public int onStartCommand(Intent intent, int flags, int id) {
        if (intent != null && "stop".equals(intent.getAction())) { stopping = true; generation++; phase = "disconnecting"; executor.shutdownNow(); closeTunnel(); stopForeground(STOP_FOREGROUND_REMOVE); stopSelf(); return START_NOT_STICKY; }
        if (busy()) return START_NOT_STICKY;
        if (executor.isShutdown()) executor = Executors.newSingleThreadExecutor();
        stopping = false; phase = "connecting"; error = ""; exitIp = "";
        NotificationManager nm = getSystemService(NotificationManager.class);
        nm.createNotificationChannel(new NotificationChannel("vpn", "Conexão VPN", NotificationManager.IMPORTANCE_LOW));
        PendingIntent stop = PendingIntent.getService(this, 1, new Intent(this, getClass()).setAction("stop"), PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        Notification note = new Notification.Builder(this, "vpn").setSmallIcon(com.g4t0xx.nettunnel.R.drawable.ic_brand).setContentTitle(getString(R.string.app_name))
            .setContentText("Verificando conexão pelo servidor…").setOngoing(true).addAction(new Notification.Action.Builder(null, "Desconectar", stop).build()).build();
        startForeground(7, note);
        long run = ++generation; executor.submit(() -> runTunnel(run)); return START_NOT_STICKY;
    }
    private void runTunnel(long run) {
        File config = new File(getFilesDir(), "xray-runtime-" + run + ".json");
        try {
            JSONObject profile = Profiles.load(this);
            try (ServerSocket socket = new ServerSocket(0, 1, InetAddress.getByName("127.0.0.1"))) { socksPort = socket.getLocalPort(); }
            do { try (ServerSocket socket = new ServerSocket(0, 1, InetAddress.getByName("127.0.0.1"))) { httpPort = socket.getLocalPort(); } } while (httpPort == socksPort);
            Files.write(config.toPath(), Profiles.config(profile, socksPort, httpPort).toString().getBytes(StandardCharsets.UTF_8));
            synchronized (this) { if (stopping || run != generation) return; core = new ProcessBuilder(getApplicationInfo().nativeLibraryDir + "/libxray.so", "run", "-c", config.getAbsolutePath()).redirectErrorStream(true).start(); }
            Thread reader = new Thread(() -> { try (BufferedReader lines = new BufferedReader(new InputStreamReader(core.getInputStream()))) { String line; while ((line = lines.readLine()) != null) android.util.Log.d("NetTunnelCore", line.replace(profile.optString("id"), "[credential]")); } catch (IOException ignored) {} }, "xray-logs"); reader.setDaemon(true); reader.start();
            long deadline = SystemClock.elapsedRealtime() + 10000;
            boolean ready = false;
            while (!stopping && run == generation && SystemClock.elapsedRealtime() < deadline) {
                if (!core.isAlive()) throw new Exception("Xray encerrou ao validar a configuração");
                try (Socket socket = new Socket()) { socket.connect(new InetSocketAddress("127.0.0.1", socksPort), 300); ready = true; break; }
                catch (IOException ignored) { Thread.sleep(150); }
            }
            if (!ready || stopping) throw new Exception("Mecanismo VPN indisponível");
            synchronized (this) {
            if (stopping || run != generation) return;
            tun = new Builder().setSession("NetTunnel Pro").setMtu(1280).addAddress("198.18.0.1", 32)
                .addAddress("fd00:abcd::1", 128).addRoute("0.0.0.0", 0).addRoute("::", 0).addDnsServer("1.1.1.1")
                .addDisallowedApplication(getPackageName()).establish();
            if (tun == null) throw new Exception("VPN não autorizada");
            File hev = new File(getFilesDir(), "hev-runtime.yml");
            Files.write(hev.toPath(), ("tunnel:\n  mtu: 1280\n  ipv4: 198.18.0.1\n  ipv6: 'fd00:abcd::1'\nsocks5:\n  address: 127.0.0.1\n  port: " + socksPort + "\n  udp: udp\nmisc:\n  log-level: warn\n  connect-timeout: 10000\n").getBytes(StandardCharsets.UTF_8));
            nativeTun = ParcelFileDescriptor.dup(tun.getFileDescriptor());
            if (!TProxyService.TProxyStartService(hev.getAbsolutePath(), nativeTun.getFd())) throw new Exception("Falha ao iniciar encaminhamento");
            }
            String ip = probe();
            if (stopping || run != generation) return;
            exitIp = ip; started = SystemClock.elapsedRealtime(); phase = "connected";
            getSystemService(NotificationManager.class).notify(7, new Notification.Builder(this, "vpn").setSmallIcon(R.drawable.ic_brand).setContentTitle("NetTunnel Pro · conectado").setContentText("Saída verificada: " + ip).setOngoing(true).build());
            long health = SystemClock.elapsedRealtime();
            while (!stopping && run == generation) {
                if (!core.isAlive() || !TProxyService.TProxyIsRunning()) throw new Exception("Mecanismo VPN foi interrompido");
                if (SystemClock.elapsedRealtime() - health > 30000) { exitIp = probe(); health = SystemClock.elapsedRealtime(); }
                Thread.sleep(500);
            }
        } catch (Exception e) { if (!stopping && run == generation) failure(e.getMessage()); }
        finally { if (run == generation) { closeTunnel(); stopSelf(); } config.delete(); }
    }
    private static byte[] readSmall(InputStream stream) throws IOException { byte[] b = new byte[1024]; int n = stream.read(b); if (n < 0) throw new IOException("Resposta vazia"); return java.util.Arrays.copyOf(b, n); }
    private String probe() throws Exception {
        Exception last = null;
        for (int i = 0; i < 3 && !stopping; i++) {
            try {
                URLConnection connection = new URL("https://api.ipify.org?format=json").openConnection(new Proxy(Proxy.Type.HTTP, new InetSocketAddress("127.0.0.1", httpPort)));
                connection.setConnectTimeout(12000); connection.setReadTimeout(12000);
                try (InputStream stream = connection.getInputStream()) {
                    String ip = new JSONObject(new String(readSmall(stream), StandardCharsets.UTF_8)).getString("ip");
                    if (!ip.matches("[0-9a-fA-F:.]{3,45}")) throw new IOException("Resposta de rede inválida");
                    return ip;
                }
            } catch (Exception e) { last = e; if (!stopping) Thread.sleep(1000); }
        }
        throw new Exception("Servidor não encaminhou HTTPS: " + (last == null ? "interrompido" : last.getMessage()));
    }
    private synchronized void closeTunnel() {
        try { TProxyService.TProxyStopService(); } catch (Exception ignored) {}
        if (core != null) { core.destroy(); try { if (!core.waitFor(2, TimeUnit.SECONDS)) core.destroyForcibly(); } catch (InterruptedException ignored) {} core = null; }
        if (nativeTun != null) { try { nativeTun.close(); } catch (IOException ignored) {} nativeTun = null; }
        if (tun != null) { try { tun.close(); } catch (IOException ignored) {} tun = null; }
        new File(getFilesDir(), "xray-runtime.json").delete();
        started = 0; exitIp = ""; if (!phase.equals("error")) phase = "disconnected";
    }
    @Override public void onRevoke() { stopping = true; generation++; executor.shutdownNow(); closeTunnel(); stopForeground(STOP_FOREGROUND_REMOVE); stopSelf(); }
    @Override public void onDestroy() { stopping = true; generation++; executor.shutdownNow(); closeTunnel(); stopForeground(STOP_FOREGROUND_REMOVE); super.onDestroy(); }
}
