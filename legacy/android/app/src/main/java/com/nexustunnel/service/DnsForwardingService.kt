package com.nexustunnel.service

import android.app.Service
import android.content.Intent
import android.os.IBinder
import android.util.Log
import kotlinx.coroutines.*
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress

/**
 * DnsForwardingService - Gerenciamento de DNS Forwarding
 * 
 * Responsabilidades:
 * - Encaminhar requisições DNS para servidores configurados
 * - Evitar DNS leaks
 * - Suportar múltiplos servidores DNS
 */
class DnsForwardingService : Service() {

    companion object {
        private const val TAG = "DnsForwardingService"
        private const val DNS_PORT = 53
        private const val BUFFER_SIZE = 512
        private const val TIMEOUT = 5000
    }

    private var dnsSocket: DatagramSocket? = null
    private var serviceJob: Job? = null
    private var isRunning = false

    data class DnsConfig(
        val primaryDns: String = "1.1.1.1",
        val secondaryDns: String = "8.8.8.8",
        val localPort: Int = DNS_PORT
    )

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "DnsForwardingService criado")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d(TAG, "onStartCommand chamado")
        return START_STICKY
    }

    /**
     * Iniciar DNS forwarding
     */
    fun startDnsForwarding(config: DnsConfig = DnsConfig()) {
        if (isRunning) {
            Log.w(TAG, "DNS forwarding já está rodando")
            return
        }

        serviceJob = CoroutineScope(Dispatchers.IO).launch {
            try {
                // Criar socket UDP para DNS
                dnsSocket = DatagramSocket(config.localPort)
                dnsSocket!!.soTimeout = TIMEOUT
                isRunning = true
                
                Log.d(TAG, "DNS forwarding iniciado na porta ${config.localPort}")
                Log.d(TAG, "DNS primário: ${config.primaryDns}")
                Log.d(TAG, "DNS secundário: ${config.secondaryDns}")
                
                // Processar requisições DNS
                processDnsRequests(config)
                
            } catch (e: Exception) {
                Log.e(TAG, "Erro ao iniciar DNS forwarding: ${e.message}", e)
                isRunning = false
            }
        }
    }

    /**
     * Processar requisições DNS
     */
    private suspend fun processDnsRequests(config: DnsConfig) {
        val buffer = ByteArray(BUFFER_SIZE)
        
        while (isRunning) {
            try {
                val packet = DatagramPacket(buffer, buffer.size)
                dnsSocket!!.receive(packet)
                
                // Encaminhar requisição DNS
                forwardDnsRequest(
                    packet,
                    config.primaryDns,
                    config.secondaryDns
                )
                
            } catch (e: Exception) {
                if (isRunning) {
                    Log.e(TAG, "Erro ao processar DNS: ${e.message}")
                }
            }
        }
    }

    /**
     * Encaminhar requisição DNS para servidor remoto
     */
    private fun forwardDnsRequest(
        packet: DatagramPacket,
        primaryDns: String,
        secondaryDns: String
    ) {
        try {
            // Tentar com DNS primário
            val response = queryDnsServer(
                packet.data,
                packet.length,
                primaryDns
            )
            
            if (response != null) {
                // Enviar resposta de volta
                val responsePacket = DatagramPacket(
                    response,
                    response.size,
                    packet.address,
                    packet.port
                )
                dnsSocket!!.send(responsePacket)
                Log.d(TAG, "Resposta DNS enviada via $primaryDns")
            } else {
                // Tentar com DNS secundário
                val fallbackResponse = queryDnsServer(
                    packet.data,
                    packet.length,
                    secondaryDns
                )
                
                if (fallbackResponse != null) {
                    val responsePacket = DatagramPacket(
                        fallbackResponse,
                        fallbackResponse.size,
                        packet.address,
                        packet.port
                    )
                    dnsSocket!!.send(responsePacket)
                    Log.d(TAG, "Resposta DNS enviada via $secondaryDns (fallback)")
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao encaminhar DNS: ${e.message}")
        }
    }

    /**
     * Consultar servidor DNS
     */
    private fun queryDnsServer(
        query: ByteArray,
        queryLength: Int,
        dnsServer: String
    ): ByteArray? {
        return try {
            val socket = DatagramSocket()
            socket.soTimeout = TIMEOUT
            
            val dnsAddress = InetAddress.getByName(dnsServer)
            val queryPacket = DatagramPacket(
                query,
                queryLength,
                dnsAddress,
                DNS_PORT
            )
            
            socket.send(queryPacket)
            
            // Receber resposta
            val responseBuffer = ByteArray(BUFFER_SIZE)
            val responsePacket = DatagramPacket(responseBuffer, responseBuffer.size)
            socket.receive(responsePacket)
            
            socket.close()
            
            responseBuffer.copyOf(responsePacket.length)
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao consultar $dnsServer: ${e.message}")
            null
        }
    }

    /**
     * Parar DNS forwarding
     */
    fun stopDnsForwarding() {
        isRunning = false
        serviceJob?.cancel()
        
        try {
            dnsSocket?.close()
            dnsSocket = null
            Log.d(TAG, "DNS forwarding parado")
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao parar DNS forwarding: ${e.message}", e)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        stopDnsForwarding()
        Log.d(TAG, "DnsForwardingService destruído")
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }
}
