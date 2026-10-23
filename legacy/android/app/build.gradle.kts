plugins {
    id("com.android.application")
    kotlin("android")
    kotlin("kapt")
}

android {
    compileSdk = 34
    
    defaultConfig {
        applicationId = "com.nexustunnel"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"
        
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }
    
    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.getByName("debug")
        }
        debug {
            isMinifyEnabled = false
            isDebuggable = true
        }
    }
    
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
    
    kotlinOptions {
        jvmTarget = "11"
    }
    
    buildFeatures {
        viewBinding = true
        compose = false
    }
}

dependencies {
    // ============================================
    // ANDROID CORE
    // ============================================
    
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("androidx.activity:activity-ktx:1.8.0")
    implementation("androidx.fragment:fragment-ktx:1.6.1")
    
    // ============================================
    // UI
    // ============================================
    
    implementation("com.google.android.material:material:1.10.0")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")
    
    // ============================================
    // LIFECYCLE & COROUTINES
    // ============================================
    
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.6.2")
    implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:2.6.2")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
    
    // ============================================
    // SSH TUNNELING (JSch)
    // ============================================
    
    implementation("com.jcraft:jsch:0.1.55")
    
    // ============================================
    // NETWORKING
    // ============================================
    
    implementation("com.squareup.okhttp3:okhttp:4.11.0")
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")
    
    // ============================================
    // JSON
    // ============================================
    
    implementation("com.google.code.gson:gson:2.10.1")
    
    // ============================================
    // GOOGLE ADMOB
    // ============================================
    
    implementation("com.google.android.gms:play-services-ads:22.6.0")
    
    // ============================================
    // LOGGING
    // ============================================
    
    implementation("com.jakewharton.timber:timber:5.0.1")
    
    // ============================================
    // TESTING
    // ============================================
    
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.mockito:mockito-core:5.5.0")
    testImplementation("org.mockito.kotlin:mockito-kotlin:5.1.0")
    
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
}
