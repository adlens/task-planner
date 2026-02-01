package com.taskplanner.duration

import android.annotation.SuppressLint
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val webView = findViewById<WebView>(R.id.webView)
        webView.apply {
            webViewClient = WebViewClient()
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                cacheMode = WebSettings.LOAD_DEFAULT
            }

            val url = getLoadUrl(intent)
            loadUrl(url)
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        intent.data?.let { uri ->
            findViewById<WebView>(R.id.webView).loadUrl(getLoadUrl(intent))
        }
    }

    private fun getLoadUrl(intent: Intent?): String {
        val uri = intent?.data ?: return AppConfig.APP_URL + "?inapp=1"
        return when (uri.scheme) {
            "taskplanner" -> {
                // taskplanner://auth#access_token=... 转为 https URL 带 hash，让 WebView 内 Supabase 完成登录
                val fragment = uri.fragment ?: ""
                AppConfig.APP_URL + "?inapp=1" + (if (fragment.isNotEmpty()) "#$fragment" else "")
            }
            "https" -> uri.toString()
            else -> AppConfig.APP_URL + "?inapp=1"
        }
    }
}
