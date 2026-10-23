package com.g4t0xx.nettunnel;

import android.app.*;
import android.content.*;
import android.os.*;
import com.wireguard.android.backend.*;
import com.wireguard.config.Config;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

public class TunnelService extends Service {
    static volatile String status="Desconectado", error="", profileId="";
    static volatile long received=0, sent=0, handshake=0;
    static volatile boolean active=false,busy=false;
    private GoBackend backend;
    private final ScheduledExecutorService worker=Executors.newSingleThreadScheduledExecutor();
    private final Tunnel tunnel=new Tunnel(){public String getName(){return "g4t0xx";}public void onStateChange(State state){active=state==State.UP;if(!active){status="Desconectado";profileId="";}}};
    @Override public void onCreate(){super.onCreate();backend=new GoBackend(getApplicationContext());NotificationManager nm=getSystemService(NotificationManager.class);nm.createNotificationChannel(new NotificationChannel("vpn","Conexão VPN",NotificationManager.IMPORTANCE_LOW));worker.scheduleWithFixedDelay(this::update,2,2,TimeUnit.SECONDS);}
    private Notification notification(){Intent stop=new Intent(this,TunnelService.class).setAction("stop");PendingIntent disconnect=PendingIntent.getService(this,1,stop,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);PendingIntent open=PendingIntent.getActivity(this,2,new Intent(this,MainActivity.class),PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);return new Notification.Builder(this,"vpn").setSmallIcon(android.R.drawable.ic_lock_lock).setContentTitle("NetTunnel Pro · G4T0XX").setContentText(status).setContentIntent(open).setOngoing(true).addAction(new Notification.Action.Builder(null,"Desconectar",disconnect).build()).build();}
    @Override public int onStartCommand(Intent intent,int flags,int startId){if(intent==null){stopSelf();return START_NOT_STICKY;}if("stop".equals(intent.getAction())){worker.execute(this::disconnect);return START_NOT_STICKY;}if(busy||active)return START_NOT_STICKY;busy=true;error="";status="Iniciando túnel";startForeground(7,notification());String selected=intent.getStringExtra("profileId");worker.execute(()->{try{org.json.JSONArray profiles=new Profiles(this).read();String raw=null;for(int i=0;i<profiles.length();i++){org.json.JSONObject p=profiles.getJSONObject(i);if(p.getString("id").equals(selected)){raw=p.getString("config");break;}}if(raw==null)throw new IllegalArgumentException("Perfil não encontrado");Config config=Config.parse(new ByteArrayInputStream(raw.getBytes(StandardCharsets.UTF_8)));backend.setState(tunnel,Tunnel.State.UP,config);profileId=selected;status="Aguardando handshake do servidor";received=sent=handshake=0;}catch(Exception e){error="Não foi possível iniciar. Revise o perfil e a permissão VPN.";status="Falha na conexão";stopForeground(STOP_FOREGROUND_REMOVE);stopSelf();}finally{busy=false;}});return START_NOT_STICKY;}
    private void update(){if(!active)return;try{if(backend.getState(tunnel)!=Tunnel.State.UP){disconnect();return;}Statistics stats=backend.getStatistics(tunnel);received=stats.totalRx();sent=stats.totalTx();long latest=0;for(com.wireguard.crypto.Key peer:stats.peers()){Statistics.PeerStats value=stats.peer(peer);if(value!=null)latest=Math.max(latest,value.latestHandshakeEpochMillis());}handshake=latest;status=latest>0&&System.currentTimeMillis()-latest<180000?"Conectado · handshake confirmado":"Túnel ativo · aguardando servidor";getSystemService(NotificationManager.class).notify(7,notification());}catch(Exception e){error="Não foi possível ler o estado do túnel";}}
    private void disconnect(){try{backend.setState(tunnel,Tunnel.State.DOWN,null);}catch(Exception e){error="Falha ao encerrar túnel. Revogue a VPN nas configurações do Android.";}active=false;busy=false;profileId="";received=sent=handshake=0;status="Desconectado";stopForeground(STOP_FOREGROUND_REMOVE);stopSelf();}
    @Override public void onDestroy(){worker.execute(()->{try{backend.setState(tunnel,Tunnel.State.DOWN,null);}catch(Exception ignored){}finally{active=false;busy=false;profileId="";status="Desconectado";}});worker.shutdown();super.onDestroy();}
    @Override public IBinder onBind(Intent intent){return null;}
}
