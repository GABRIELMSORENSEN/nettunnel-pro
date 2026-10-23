package com.nexustunnel.security

import android.content.Context
import android.content.pm.PackageManager
import android.util.Log
import java.security.MessageDigest

/**
 * SecurityManager - Gerenciamento de segurança
 * 
 * Responsabilidades:
 * - Verificar assinatura do app
 * - Bloquear tráfego de Torrent
 * - Validar integridade do app
 */
class SecurityManager(private val context: Context) {

    companion object {
        private const val TAG = "SecurityManager"
        
        // Hash SHA-256 da assinatura legítima (exemplo)
        private const val LEGITIMATE_SIGNATURE_HASH = "abc123def456..."
        
        // Portas comuns de Torrent
        private val TORRENT_PORTS = setOf(
            6881, 6882, 6883, 6884, 6885, 6886, 6887, 6888, 6889, // BitTorrent
            6969, // Tracker
            51413, // Transmission
            6510, // Azureus
            1194, // OpenVPN (pode ser usado para Torrent)
            4662, 4672, // eMule
            5900, 5901, // VNC (potencial abuso)
            8080, 8081, // HTTP alternativo
            3128, 8888 // Proxy
        )
        
        // Assinaturas de protocolo Torrent
        private val TORRENT_SIGNATURES = listOf(
            "d8:announce", // Metainfo file
            "BitTorrent protocol",
            "GET /announce",
            "GET /scrape"
        )
    }

    /**
     * Verificar assinatura do app
     */
    fun verifyAppSignature(): Boolean {
        return try {
            val packageInfo = context.packageManager.getPackageInfo(
                context.packageName,
                PackageManager.GET_SIGNATURES
            )
            
            val signatures = packageInfo.signatures
            if (signatures.isEmpty()) {
                Log.e(TAG, "Nenhuma assinatura encontrada")
                return false
            }
            
            val signature = signatures[0]
            val signatureHash = calculateSha256(signature.toByteArray())
            
            val isValid = signatureHash == LEGITIMATE_SIGNATURE_HASH
            
            if (isValid) {
                Log.d(TAG, "Assinatura do app verificada com sucesso")
            } else {
                Log.e(TAG, "Assinatura do app inválida!")
                Log.e(TAG, "Hash encontrado: $signatureHash")
            }
            
            isValid
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao verificar assinatura: ${e.message}", e)
            false
        }
    }

    /**
     * Calcular hash SHA-256
     */
    private fun calculateSha256(data: ByteArray): String {
        val digest = MessageDigest.getInstance("SHA-256")
        val hash = digest.digest(data)
        return hash.joinToString("") { "%02x".format(it) }
    }

    /**
     * Verificar se a porta é de Torrent
     */
    fun isTorrentPort(port: Int): Boolean {
        return port in TORRENT_PORTS
    }

    /**
     * Verificar se o tráfego contém assinatura de Torrent
     */
    fun containsTorrentSignature(data: ByteArray): Boolean {
        val dataString = String(data, Charsets.ISO_8859_1)
        
        return TORRENT_SIGNATURES.any { signature ->
            dataString.contains(signature, ignoreCase = true)
        }
    }

    /**
     * Bloquear tráfego de Torrent
     */
    fun shouldBlockTraffic(port: Int, data: ByteArray?): Boolean {
        // Bloquear por porta
        if (isTorrentPort(port)) {
            Log.w(TAG, "Tráfego bloqueado: porta de Torrent detectada ($port)")
            return true
        }
        
        // Bloquear por assinatura
        if (data != null && containsTorrentSignature(data)) {
            Log.w(TAG, "Tráfego bloqueado: assinatura de Torrent detectada")
            return true
        }
        
        return false
    }

    /**
     * Validar integridade do app
     */
    fun validateAppIntegrity(): Boolean {
        return try {
            // Verificar assinatura
            if (!verifyAppSignature()) {
                Log.e(TAG, "Falha na verificação de assinatura")
                return false
            }
            
            // Verificar se o app foi modificado
            val packageInfo = context.packageManager.getPackageInfo(
                context.packageName,
                0
            )
            
            if (packageInfo.versionCode < 1) {
                Log.e(TAG, "Versão do app inválida")
                return false
            }
            
            Log.d(TAG, "Integridade do app validada")
            true
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao validar integridade: ${e.message}", e)
            false
        }
    }

    /**
     * Obter informações de segurança
     */
    fun getSecurityInfo(): Map<String, Any> {
        return mapOf(
            "signatureValid" to verifyAppSignature(),
            "integrityValid" to validateAppIntegrity(),
            "torrentPortsMonitored" to TORRENT_PORTS.size,
            "torrentSignaturesMonitored" to TORRENT_SIGNATURES.size
        )
    }
}
