package com.g4t0xx.nettunnel;

import android.app.Instrumentation;
import android.os.Bundle;
import com.wireguard.android.backend.GoBackend;
import com.wireguard.android.backend.Tunnel;
import com.wireguard.android.backend.Statistics;
import com.wireguard.config.Config;
import java.io.ByteArrayInputStream;
import java.util.Base64;

/** Debug-only, two-device integration probe. Never included in the application APK. */
public final class TunnelProbe extends Instrumentation {
    private Bundle arguments;
    @Override public void onCreate(Bundle args){arguments=args;start();}
    @Override public void onStart(){
        Bundle result=new Bundle();
        GoBackend backend=new GoBackend(getTargetContext());
        Tunnel tunnel=new Tunnel(){public String getName(){return "g4-lan-test";}public void onStateChange(State state){}};
        java.net.DatagramSocket relaySocket=null;
        java.net.Socket bridge=null;
        final java.util.concurrent.atomic.AtomicInteger outgoingCount=new java.util.concurrent.atomic.AtomicInteger();
        final java.util.concurrent.atomic.AtomicInteger incomingCount=new java.util.concurrent.atomic.AtomicInteger();
        org.json.JSONArray savedProfiles=null;
        final boolean service="true".equals(arguments.getString("service"));
        try{
            if(arguments.getBoolean("usb",false) || "true".equals(arguments.getString("usb"))){
                relaySocket=new java.net.DatagramSocket(new java.net.InetSocketAddress("127.0.0.1",51900));
                bridge=new java.net.Socket("127.0.0.1",Integer.parseInt(arguments.getString("relayPort","55100")));
                final java.net.DatagramSocket socket=relaySocket;
                final java.io.DataOutputStream output=new java.io.DataOutputStream(bridge.getOutputStream());
                final java.io.DataInputStream input=new java.io.DataInputStream(bridge.getInputStream());
                final int targetPort=Integer.parseInt(arguments.getString("listenPort"));
                Thread outgoing=new Thread(()->{try{while(!socket.isClosed()){byte[] data=new byte[65535];java.net.DatagramPacket packet=new java.net.DatagramPacket(data,data.length);socket.receive(packet);outgoingCount.incrementAndGet();output.writeInt(packet.getLength());output.write(data,0,packet.getLength());output.flush();}}catch(Exception ignored){}});
                Thread incoming=new Thread(()->{try{while(!socket.isClosed()){int length=input.readInt();if(length<1||length>65535)break;byte[] data=new byte[length];input.readFully(data);incomingCount.incrementAndGet();socket.send(new java.net.DatagramPacket(data,length,java.net.InetAddress.getByName("127.0.0.1"),targetPort));}}catch(Exception ignored){}});
                outgoing.setDaemon(true);incoming.setDaemon(true);outgoing.start();incoming.start();
            }
            Config config=Config.parse(new ByteArrayInputStream(Base64.getDecoder().decode(arguments.getString("config",""))));
            if(service){
                Profiles profiles=new Profiles(getTargetContext());savedProfiles=profiles.read();
                org.json.JSONArray next=new org.json.JSONArray(savedProfiles.toString());
                next.put(new org.json.JSONObject().put("id","g4-usb-verification").put("name","Verificação USB").put("config",new String(Base64.getDecoder().decode(arguments.getString("config","")),java.nio.charset.StandardCharsets.UTF_8)));
                profiles.write(next);
                getTargetContext().startForegroundService(new android.content.Intent(getTargetContext(),TunnelService.class).setAction("start").putExtra("profileId","g4-usb-verification"));
                long startDeadline=System.currentTimeMillis()+15000;
                while(!TunnelService.active&&System.currentTimeMillis()<startDeadline)Thread.sleep(100);
                if(!TunnelService.active)throw new Exception(TunnelService.error);
            }else backend.setState(tunnel,Tunnel.State.UP,config);
            String peer=arguments.getString("peer");
            long deadline=System.currentTimeMillis()+45000;
            boolean ping=false;
            long handshake=0,rx=0,tx=0;
            while(System.currentTimeMillis()<deadline){
                Process process=new ProcessBuilder("/system/bin/ping","-c","2","-W","2",peer).redirectErrorStream(true).start();
                try(java.io.InputStream stream=process.getInputStream()){byte[] buffer=new byte[4096];while(stream.read(buffer)!=-1){}}
                ping=process.waitFor()==0||ping;
                if(service){rx=TunnelService.received;tx=TunnelService.sent;handshake=TunnelService.handshake;}
                else{Statistics stats=backend.getStatistics(tunnel);rx=stats.totalRx();tx=stats.totalTx();for(com.wireguard.crypto.Key key:stats.peers()){Statistics.PeerStats value=stats.peer(key);if(value!=null)handshake=Math.max(handshake,value.latestHandshakeEpochMillis());}}
                if(ping&&handshake>0){Thread.sleep(10000);break;}
                Thread.sleep(1000);
            }
            result.putString("relayOutgoing",Integer.toString(outgoingCount.get()));
            result.putString("relayIncoming",Integer.toString(incomingCount.get()));
            result.putString("ok",Boolean.toString(ping&&handshake>0&&rx>0));
            result.putString("ping",Boolean.toString(ping));
            result.putString("handshake",Long.toString(handshake));
            result.putString("received",Long.toString(rx));result.putString("sent",Long.toString(tx));
        }catch(Exception error){result.putString("ok","false");result.putString("error",error.getClass().getSimpleName()+": "+error.getMessage());}
        finally{
            if(service){
                try{getTargetContext().startService(new android.content.Intent(getTargetContext(),TunnelService.class).setAction("stop"));long deadline=System.currentTimeMillis()+5000;while(TunnelService.active&&System.currentTimeMillis()<deadline)Thread.sleep(100);if(savedProfiles!=null)new Profiles(getTargetContext()).write(savedProfiles);}catch(Exception ignored){}
            }else try{backend.setState(tunnel,Tunnel.State.DOWN,null);}catch(Exception ignored){}
            if(relaySocket!=null)relaySocket.close();
            if(bridge!=null)try{bridge.close();}catch(Exception ignored){}
            finish(android.app.Activity.RESULT_OK,result);
        }
    }
}
