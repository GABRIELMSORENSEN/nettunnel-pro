package com.nexustunnel.service

import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.net.VpnService
import android.os.Build
import android.os.IBinder
import android.os.ParcelFileDescriptor
import android.util.Log
import kotlinx.coroutines.*
import java.io.FileInputStream
import java.io.FileOutputStream
import java.nio.ByteBuffer

/**
 * NexusVpnService - Serviço VPN nativo usando VpnService API
 * 
 * Responsabilidades:
 * - Criar e gerenciar interface TUN
 * - Capturar tráfego IPv4 (0.0.0.0/0)
 * - Encaminhar tráfego para proxy SOCKS5 local
 * - Gerenciar DNS forwarding
 * - Manter conexão ativa
 */
class NexusVpnService : VpnService() {

    companion object {
        private const val TAG = "NexusVpnService"
        private const val MTU = 1400
        private const val BUFFER_SIZE = 32 * 1024
        private const val SOCKS5_PORT = 1080
        private const val DNS_PRIMARY = "1.1.1.1"
        private const val DNS_SECONDARY = "8.8.8.8"
    }

    private var vpnInterface: ParcelFileDescriptor? = null
    private var serviceJob: Job? = null
    private var isRunning = false

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "NexusVpnService criado")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d(TAG, "onStartCommand chamado")
        
        when (intent?.action) {
            "ACTION_CONNECT" -> startVpn()
            "ACTION_DISCONNECT" -> stopVpn()
        }
        
        return START_STICKY
    }

    /**
     * Iniciar serviço VPN
     */
    private fun startVpn() {
        if (isRunning) {
            Log.w(TAG, "VPN já está rodando")
            return
        }

        try {
            // Criar builder da VPN
            val builder = Builder()
            
            // Configurar nome da aplicação
            builder.setSession("NetTunnel Pro")
            
            // Configurar interface TUN
            builder.addAddress("10.8.0.1", 24)
            builder.addRoute("0.0.0.0", 0) // Rotear todo o tráfego IPv4
            
            // Configurar DNS para evitar leaks
            builder.addDnsServer(DNS_PRIMARY)
            builder.addDnsServer(DNS_SECONDARY)
            
            // Configurar MTU otimizado para 4G/5G
            builder.setMtu(MTU)
            
            // Configurar aplicações permitidas (opcional)
            // builder.addAllowedApplication("com.example.app")
            
            // Configurar intent de desconexão
            val disconnectIntent = Intent(this, NexusVpnService::class.java).apply {
                action = "ACTION_DISCONNECT"
            }
            val pendingIntent = PendingIntent.getService(
                this,
                0,
                disconnectIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            builder.setConfigureIntent(pendingIntent)
            
            // Estabelecer interface TUN
            vpnInterface = builder.establish()
            
            if (vpnInterface == null) {
                Log.e(TAG, "Falha ao estabelecer interface TUN")
                return
            }
            
            isRunning = true
            Log.d(TAG, "Interface TUN estabelecida com sucesso")
            
            // Iniciar processamento de pacotes
            startPacketProcessing()
            
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao iniciar VPN: ${e.message}", e)
            isRunning = false
        }
    }

    /**
     * Parar serviço VPN
     */
    private fun stopVpn() {
        isRunning = false
        serviceJob?.cancel()
        
        try {
            vpnInterface?.close()
            vpnInterface = null
            Log.d(TAG, "VPN parada com sucesso")
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao parar VPN: ${e.message}", e)
        }
    }

    /**
     * Processar pacotes da interface TUN
     */
    private fun startPacketProcessing() {
        serviceJob = CoroutineScope(Dispatchers.IO).launch {
            try {
                val inputStream = FileInputStream(vpnInterface!!.fileDescriptor)
                val outputStream = FileOutputStream(vpnInterface!!.fileDescriptor)
                val buffer = ByteArray(BUFFER_SIZE)
                
                while (isRunning && isActive) {
                    // Ler pacote da interface TUN
                    val bytesRead = inputStream.read(buffer)
                    
                    if (bytesRead > 0) {
                        // Processar pacote
                        processPacket(buffer, bytesRead, outputStream)
                    }
                }
            } catch (e: Exception) {
                if (isRunning) {
                    Log.e(TAG, "Erro ao processar pacotes: ${e.message}", e)
                }
            }
        }
    }

    /**
     * Processar pacote individual
     * 
     * @param buffer Buffer contendo dados do pacote
     * @param length Tamanho do pacote
     * @param outputStream Stream para enviar resposta
     */
    private fun processPacket(buffer: ByteArray, length: Int, outputStream: FileOutputStream) {
        try {
            val packet = ByteBuffer.wrap(buffer, 0, length)
            
            // Ler versão IP (4 bits)
            val version = (packet.get(0).toInt() shr 4) and 0x0F
            
            if (version == 4) {
                // Processar IPv4
                processIPv4Packet(packet, length, outputStream)
            } else if (version == 6) {
                // IPv6 não suportado neste exemplo
                Log.d(TAG, "IPv6 recebido (não suportado)")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao processar pacote: ${e.message}")
        }
    }

    /**
     * Processar pacote IPv4
     */
    private fun processIPv4Packet(
        packet: ByteBuffer,
        length: Int,
        outputStream: FileOutputStream
    ) {
        try {
            // Extrair protocolo (byte 9)
            val protocol = packet.get(9).toInt() and 0xFF
            
            when (protocol) {
                6 -> {
                    // TCP - Encaminhar para SOCKS5
                    Log.d(TAG, "Pacote TCP recebido")
                    forwardToSocks5(packet, length, outputStream)
                }
                17 -> {
                    // UDP - Encaminhar para SOCKS5 ou processar localmente
                    Log.d(TAG, "Pacote UDP recebido")
                    forwardToSocks5(packet, length, outputStream)
                }
                else -> {
                    Log.d(TAG, "Protocolo desconhecido: $protocol")
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao processar IPv4: ${e.message}")
        }
    }

    /**
     * Encaminhar pacote para proxy SOCKS5 local
     * 
     * Este método implementa a integração com tun2socks ou hev-socks5
     */
    private fun forwardToSocks5(
        packet: ByteBuffer,
        length: Int,
        outputStream: FileOutputStream
    ) {
        try {
            // Extrair IP de destino (bytes 16-19)
            val destIp = ByteArray(4)
            packet.position(16)
            packet.get(destIp)
            
            val destIpString = "${destIp[0].toInt() and 0xFF}.${destIp[1].toInt() and 0xFF}." +
                    "${destIp[2].toInt() and 0xFF}.${destIp[3].toInt() and 0xFF}"
            
            Log.d(TAG, "Encaminhando para SOCKS5: $destIpString:$SOCKS5_PORT")
            
            // Aqui você integraria com tun2socks ou hev-socks5
            // Por enquanto, apenas logamos
            
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao encaminhar para SOCKS5: ${e.message}")
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        stopVpn()
        Log.d(TAG, "NexusVpnService destruído")
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }
}
