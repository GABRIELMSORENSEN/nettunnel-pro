package com.nexustunnel.service

import android.app.Service
import android.content.Intent
import android.os.IBinder
import android.util.Log
import com.jcraft.jsch.*
import kotlinx.coroutines.*
import java.io.InputStream
import java.io.OutputStream
import java.net.Socket

/**
 * SshTunnelService - Gerenciamento de SSH Tunneling
 * 
 * Responsabilidades:
 * - Estabelecer conexão SSH com servidor remoto
 * - Gerenciar port forwarding
 * - Implementar Custom Payloads (HTTP Injection)
 * - Suporte a SNI (Server Name Indication)
 */
class SshTunnelService : Service() {

    companion object {
        private const val TAG = "SshTunnelService"
        private const val SSH_PORT = 22
        private const val SOCKS5_LOCAL_PORT = 1080
        private const val CONNECTION_TIMEOUT = 30000 // 30 segundos
    }

    private var jsch: JSch? = null
    private var session: Session? = null
    private var serviceJob: Job? = null
    private var isConnected = false

    data class SshConfig(
        val host: String,
        val port: Int = SSH_PORT,
        val username: String,
        val password: String? = null,
        val privateKeyPath: String? = null,
        val customPayload: String? = null,
        val sni: String? = null
    )

    override fun onCreate() {
        super.onCreate()
        jsch = JSch()
        Log.d(TAG, "SshTunnelService criado")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d(TAG, "onStartCommand chamado")
        return START_STICKY
    }

    /**
     * Conectar ao servidor SSH
     */
    fun connectSsh(config: SshConfig) {
        serviceJob = CoroutineScope(Dispatchers.IO).launch {
            try {
                // Criar sessão SSH
                session = jsch!!.getSession(config.username, config.host, config.port)
                
                // Configurar autenticação
                if (config.password != null) {
                    session!!.setPassword(config.password)
                } else if (config.privateKeyPath != null) {
                    jsch!!.addIdentity(config.privateKeyPath)
                }
                
                // Configurar propriedades
                session!!.setConfig("StrictHostKeyChecking", "no")
                session!!.setConfig("PreferredAuthentications", "publickey,password")
                session!!.setServerAliveInterval(30000) // Keep-alive a cada 30s
                session!!.setServerAliveCountMax(3)
                
                // Adicionar suporte a SNI (Server Name Indication)
                if (config.sni != null) {
                    session!!.setConfig("sni", config.sni)
                }
                
                // Conectar
                session!!.connect(CONNECTION_TIMEOUT)
                isConnected = true
                Log.d(TAG, "Conectado ao servidor SSH: ${config.host}")
                
                // Configurar port forwarding para SOCKS5
                setupSocks5Forwarding()
                
                // Aplicar custom payload se fornecido
                if (config.customPayload != null) {
                    applyCustomPayload(config.customPayload)
                }
                
            } catch (e: Exception) {
                Log.e(TAG, "Erro ao conectar SSH: ${e.message}", e)
                isConnected = false
            }
        }
    }

    /**
     * Configurar port forwarding SOCKS5
     */
    private fun setupSocks5Forwarding() {
        try {
            // Configurar SOCKS5 local na porta 1080
            session!!.setPortForwardingL(SOCKS5_LOCAL_PORT, "127.0.0.1", SOCKS5_LOCAL_PORT)
            
            Log.d(TAG, "SOCKS5 forwarding configurado: localhost:$SOCKS5_LOCAL_PORT")
        } catch (e: JSchException) {
            Log.e(TAG, "Erro ao configurar SOCKS5: ${e.message}", e)
        }
    }

    /**
     * Aplicar Custom Payload (HTTP Injection)
     * 
     * Manipula cabeçalho HTTP para bypass de DPI
     */
    private fun applyCustomPayload(payload: String) {
        try {
            Log.d(TAG, "Aplicando custom payload: $payload")
            
            // Exemplo: CONNECT [host:port] [protocol] HTTP/1.1
            // GET / HTTP/1.1\r\nHost: example.com\r\n\r\n
            
            val parts = payload.split(" ")
            if (parts.size >= 3) {
                val host = parts[0]
                val port = parts[1].toIntOrNull() ?: 443
                val protocol = parts[2]
                
                // Criar socket com custom payload
                val socket = Socket("127.0.0.1", SOCKS5_LOCAL_PORT)
                val outputStream = socket.getOutputStream()
                
                // Enviar CONNECT com custom payload
                val connectRequest = buildCustomPayload(host, port, protocol)
                outputStream.write(connectRequest.toByteArray())
                outputStream.flush()
                
                Log.d(TAG, "Custom payload enviado para $host:$port")
                
                socket.close()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao aplicar custom payload: ${e.message}", e)
        }
    }

    /**
     * Construir custom payload HTTP
     */
    private fun buildCustomPayload(host: String, port: Int, protocol: String): String {
        return buildString {
            append("CONNECT $host:$port $protocol HTTP/1.1\r\n")
            append("Host: $host:$port\r\n")
            append("Connection: keep-alive\r\n")
            append("User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)\r\n")
            append("Accept: */*\r\n")
            append("Accept-Language: en-US,en;q=0.9\r\n")
            append("Accept-Encoding: gzip, deflate\r\n")
            append("\r\n")
        }
    }

    /**
     * Desconectar SSH
     */
    fun disconnectSsh() {
        isConnected = false
        serviceJob?.cancel()
        
        try {
            session?.disconnect()
            session = null
            Log.d(TAG, "SSH desconectado")
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao desconectar SSH: ${e.message}", e)
        }
    }

    /**
     * Verificar se está conectado
     */
    fun isConnectedToSsh(): Boolean = isConnected && session?.isConnected == true

    /**
     * Obter informações da conexão
     */
    fun getConnectionInfo(): Map<String, String> {
        return mapOf(
            "connected" to isConnectedToSsh().toString(),
            "host" to (session?.host ?: "N/A"),
            "port" to (session?.port?.toString() ?: "N/A"),
            "username" to (session?.userName ?: "N/A")
        )
    }

    override fun onDestroy() {
        super.onDestroy()
        disconnectSsh()
        Log.d(TAG, "SshTunnelService destruído")
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }
}
