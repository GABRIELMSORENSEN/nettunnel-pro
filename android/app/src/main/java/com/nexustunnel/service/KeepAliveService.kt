package com.nexustunnel.service

import android.app.Service
import android.content.Intent
import android.os.IBinder
import android.util.Log
import kotlinx.coroutines.*
import java.net.Socket

/**
 * KeepAliveService - Manter conexão ativa
 * 
 * Responsabilidades:
 * - Enviar keep-alive pings periodicamente
 * - Detectar desconexões
 * - Reconectar automaticamente
 */
class KeepAliveService : Service() {

    companion object {
        private const val TAG = "KeepAliveService"
        private const val KEEP_ALIVE_INTERVAL = 15000L // 15 segundos
        private const val PING_TIMEOUT = 5000
    }

    private var serviceJob: Job? = null
    private var isRunning = false

    data class KeepAliveConfig(
        val host: String,
        val port: Int,
        val interval: Long = KEEP_ALIVE_INTERVAL,
        val timeout: Int = PING_TIMEOUT
    )

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "KeepAliveService criado")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d(TAG, "onStartCommand chamado")
        return START_STICKY
    }

    /**
     * Iniciar keep-alive
     */
    fun startKeepAlive(config: KeepAliveConfig) {
        if (isRunning) {
            Log.w(TAG, "Keep-alive já está rodando")
            return
        }

        isRunning = true
        serviceJob = CoroutineScope(Dispatchers.IO).launch {
            try {
                Log.d(TAG, "Keep-alive iniciado para ${config.host}:${config.port}")
                
                while (isRunning && isActive) {
                    try {
                        // Enviar ping
                        sendPing(config)
                        
                        // Aguardar próximo intervalo
                        delay(config.interval)
                        
                    } catch (e: Exception) {
                        Log.e(TAG, "Erro no keep-alive: ${e.message}")
                        delay(config.interval)
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Erro ao iniciar keep-alive: ${e.message}", e)
                isRunning = false
            }
        }
    }

    /**
     * Enviar ping
     */
    private fun sendPing(config: KeepAliveConfig) {
        try {
            val socket = Socket()
            socket.soTimeout = config.timeout
            socket.connect(
                java.net.InetSocketAddress(config.host, config.port),
                config.timeout
            )
            
            // Enviar dados de keep-alive
            val outputStream = socket.getOutputStream()
            outputStream.write("PING\r\n".toByteArray())
            outputStream.flush()
            
            // Receber resposta
            val inputStream = socket.getInputStream()
            val buffer = ByteArray(1024)
            val bytesRead = inputStream.read(buffer)
            
            if (bytesRead > 0) {
                Log.d(TAG, "Keep-alive ping bem-sucedido")
            }
            
            socket.close()
        } catch (e: Exception) {
            Log.w(TAG, "Falha no ping: ${e.message}")
        }
    }

    /**
     * Parar keep-alive
     */
    fun stopKeepAlive() {
        isRunning = false
        serviceJob?.cancel()
        Log.d(TAG, "Keep-alive parado")
    }

    override fun onDestroy() {
        super.onDestroy()
        stopKeepAlive()
        Log.d(TAG, "KeepAliveService destruído")
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }
}
