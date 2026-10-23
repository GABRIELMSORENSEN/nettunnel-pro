package com.nexustunnel

import android.app.ActivityManager
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.net.VpnService
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.google.android.gms.ads.MobileAds
import com.nexustunnel.service.DnsForwardingService
import com.nexustunnel.service.KeepAliveService
import com.nexustunnel.service.NexusVpnService
import com.nexustunnel.service.SshTunnelService
import kotlinx.coroutines.launch
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

/**
 * MainActivity - Interface principal do aplicativo
 * 
 * Responsabilidades:
 * - Gerenciar estado da conexão VPN
 * - Controlar serviços (VPN, SSH, DNS, Keep-Alive)
 * - Exibir logs em tempo real
 * - Gerenciar monetização (AdMob)
 */
class MainActivity : AppCompatActivity() {

    companion object {
        private const val TAG = "MainActivity"
        private const val PREFS_NAME = "nexus_tunnel_prefs"
        private const val KEY_REMAINING_TIME = "remaining_time"
        private const val KEY_LAST_IP = "last_ip"
    }

    private lateinit var connectButton: Button
    private lateinit var statusTextView: TextView
    private lateinit var logsTextView: TextView
    private lateinit var sharedPreferences: SharedPreferences
    
    private var isConnected = false
    private var remainingTime: Long = 0
    private var connectionStartTime: Long = 0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        // Inicializar SharedPreferences
        sharedPreferences = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        
        // Inicializar Google AdMob
        MobileAds.initialize(this)
        
        // Inicializar UI
        initializeUI()
        
        // Carregar tempo restante
        loadRemainingTime()
        
        // Verificar permissões
        checkVpnPermissions()
        
        Log.d(TAG, "MainActivity criada")
    }

    /**
     * Inicializar componentes UI
     */
    private fun initializeUI() {
        connectButton = findViewById(R.id.btn_connect)
        statusTextView = findViewById(R.id.tv_status)
        logsTextView = findViewById(R.id.tv_logs)
        
        connectButton.setOnClickListener {
            if (isConnected) {
                disconnectVpn()
            } else {
                connectVpn()
            }
        }
        
        updateStatusUI()
    }

    /**
     * Carregar tempo restante do SharedPreferences
     */
    private fun loadRemainingTime() {
        remainingTime = sharedPreferences.getLong(KEY_REMAINING_TIME, 3600000) // 1 hora padrão
        Log.d(TAG, "Tempo restante: ${remainingTime / 1000} segundos")
    }

    /**
     * Verificar permissões de VPN
     */
    private fun checkVpnPermissions() {
        val intent = VpnService.prepare(this)
        if (intent != null) {
            startActivityForResult(intent, 0)
        }
    }

    /**
     * Conectar VPN
     */
    private fun connectVpn() {
        // Verificar se há tempo restante
        if (remainingTime <= 0) {
            Toast.makeText(
                this,
                "Tempo de conexão expirado. Assista a um anúncio para ganhar mais tempo.",
                Toast.LENGTH_LONG
            ).show()
            showRewardedAd()
            return
        }
        
        try {
            addLog("Iniciando conexão VPN...")
            
            // Iniciar VPN Service
            val vpnIntent = Intent(this, NexusVpnService::class.java).apply {
                action = "ACTION_CONNECT"
            }
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(vpnIntent)
            } else {
                startService(vpnIntent)
            }
            
            // Iniciar SSH Tunneling
            val sshIntent = Intent(this, SshTunnelService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(sshIntent)
            } else {
                startService(sshIntent)
            }
            
            // Iniciar DNS Forwarding
            val dnsIntent = Intent(this, DnsForwardingService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(dnsIntent)
            } else {
                startService(dnsIntent)
            }
            
            // Iniciar Keep-Alive
            val keepAliveIntent = Intent(this, KeepAliveService::class.java)
            startService(keepAliveIntent)
            
            isConnected = true
            connectionStartTime = System.currentTimeMillis()
            
            addLog("VPN conectada com sucesso!")
            updateStatusUI()
            
            // Verificar IP público
            checkPublicIp()
            
            // Iniciar contador de tempo
            startTimeCounter()
            
        } catch (e: Exception) {
            addLog("Erro ao conectar: ${e.message}")
            Log.e(TAG, "Erro ao conectar VPN", e)
        }
    }

    /**
     * Desconectar VPN
     */
    private fun disconnectVpn() {
        try {
            addLog("Desconectando VPN...")
            
            // Parar VPN Service
            val vpnIntent = Intent(this, NexusVpnService::class.java).apply {
                action = "ACTION_DISCONNECT"
            }
            startService(vpnIntent)
            
            // Parar outros serviços
            stopService(Intent(this, SshTunnelService::class.java))
            stopService(Intent(this, DnsForwardingService::class.java))
            stopService(Intent(this, KeepAliveService::class.java))
            
            isConnected = false
            addLog("VPN desconectada")
            updateStatusUI()
            
        } catch (e: Exception) {
            addLog("Erro ao desconectar: ${e.message}")
            Log.e(TAG, "Erro ao desconectar VPN", e)
        }
    }

    /**
     * Verificar IP público
     */
    private fun checkPublicIp() {
        lifecycleScope.launch {
            try {
                addLog("Verificando IP público...")
                
                // Fazer requisição para API de IP
                val url = "https://api.ipify.org?format=json"
                val response = java.net.URL(url).readText()
                
                // Extrair IP da resposta JSON
                val ip = response.substringAfter("\"ip\":\"").substringBefore("\"")
                
                addLog("IP público: $ip")
                
                // Salvar IP no SharedPreferences
                sharedPreferences.edit().putString(KEY_LAST_IP, ip).apply()
                
            } catch (e: Exception) {
                addLog("Erro ao verificar IP: ${e.message}")
            }
        }
    }

    /**
     * Iniciar contador de tempo
     */
    private fun startTimeCounter() {
        lifecycleScope.launch {
            while (isConnected && remainingTime > 0) {
                remainingTime -= 1000
                sharedPreferences.edit().putLong(KEY_REMAINING_TIME, remainingTime).apply()
                
                val minutes = remainingTime / 60000
                val seconds = (remainingTime % 60000) / 1000
                
                updateStatusUI()
                
                kotlinx.coroutines.delay(1000)
            }
            
            if (isConnected && remainingTime <= 0) {
                addLog("Tempo expirado. Desconectando...")
                disconnectVpn()
            }
        }
    }

    /**
     * Mostrar anúncio recompensado
     */
    private fun showRewardedAd() {
        addLog("Carregando anúncio recompensado...")
        
        // Aqui você integraria com Google AdMob
        // Por enquanto, apenas adicionamos 1 hora de tempo
        remainingTime = 3600000
        sharedPreferences.edit().putLong(KEY_REMAINING_TIME, remainingTime).apply()
        
        addLog("Você ganhou 1 hora de conexão!")
        updateStatusUI()
    }

    /**
     * Adicionar log
     */
    private fun addLog(message: String) {
        val timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss"))
        val logMessage = "[$timestamp] $message\n"
        
        runOnUiThread {
            logsTextView.append(logMessage)
            logsTextView.post {
                val scrollAmount = logsTextView.layout.getLineTop(logsTextView.lineCount) -
                        logsTextView.height
                logsTextView.scrollTo(0, scrollAmount)
            }
        }
    }

    /**
     * Atualizar UI de status
     */
    private fun updateStatusUI() {
        runOnUiThread {
            if (isConnected) {
                connectButton.text = "Desconectar"
                connectButton.setBackgroundColor(getColor(android.R.color.holo_red_light))
                
                val minutes = remainingTime / 60000
                val seconds = (remainingTime % 60000) / 1000
                statusTextView.text = "Conectado - Tempo: ${minutes}m ${seconds}s"
            } else {
                connectButton.text = "Conectar"
                connectButton.setBackgroundColor(getColor(android.R.color.holo_green_light))
                statusTextView.text = "Desconectado"
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        
        // Desconectar se estiver conectado
        if (isConnected) {
            disconnectVpn()
        }
        
        Log.d(TAG, "MainActivity destruída")
    }
}
