package com.g4t0xx.nettunnel;

import android.content.Context;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.File;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

final class Profiles {
    private static final String ALIAS="G4T0XX.NetTunnel.Profiles";
    private final File file;
    Profiles(Context context){file=new File(context.getFilesDir(),"profiles.enc");}
    private SecretKey key() throws Exception {KeyStore store=KeyStore.getInstance("AndroidKeyStore");store.load(null);if(!store.containsAlias(ALIAS)){KeyGenerator gen=KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES,"AndroidKeyStore");gen.init(new KeyGenParameterSpec.Builder(ALIAS,KeyProperties.PURPOSE_ENCRYPT|KeyProperties.PURPOSE_DECRYPT).setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE).build());gen.generateKey();}return (SecretKey)store.getKey(ALIAS,null);}
    JSONArray read() throws Exception {if(!file.exists())return new JSONArray();JSONObject envelope=new JSONObject(new String(java.nio.file.Files.readAllBytes(file.toPath()),StandardCharsets.UTF_8));Cipher cipher=Cipher.getInstance("AES/GCM/NoPadding");cipher.init(Cipher.DECRYPT_MODE,key(),new GCMParameterSpec(128,Base64.getDecoder().decode(envelope.getString("iv"))));return new JSONArray(new String(cipher.doFinal(Base64.getDecoder().decode(envelope.getString("data"))),StandardCharsets.UTF_8));}
    void write(JSONArray profiles) throws Exception {Cipher cipher=Cipher.getInstance("AES/GCM/NoPadding");cipher.init(Cipher.ENCRYPT_MODE,key());JSONObject envelope=new JSONObject().put("iv",Base64.getEncoder().encodeToString(cipher.getIV())).put("data",Base64.getEncoder().encodeToString(cipher.doFinal(profiles.toString().getBytes(StandardCharsets.UTF_8))));File tmp=new File(file.getParentFile(),"profiles.tmp");try(java.io.FileOutputStream out=new java.io.FileOutputStream(tmp)){out.write(envelope.toString().getBytes(StandardCharsets.UTF_8));out.getFD().sync();}java.nio.file.Files.move(tmp.toPath(),file.toPath(),java.nio.file.StandardCopyOption.REPLACE_EXISTING);}
}
