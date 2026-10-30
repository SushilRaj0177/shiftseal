package dev.sushilraj.shiftseal;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.activity.OnBackPressedCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

/**
 * Shiftseal on Android: the web app in a WebView, plus a bridge for what a
 * browser cannot prove (whether a location is mocked, and Play Integrity).
 * Only the Shiftseal origin is loaded inside the app; any other link opens in
 * the browser, so the bridge is never exposed to another site.
 */
public class MainActivity extends AppCompatActivity {
    private WebView web;
    private View offline;
    private Bridge bridge;
    private PermissionRequest pendingCamera;

    private final ActivityResultLauncher<String> cameraPermission =
            registerForActivityResult(new ActivityResultContracts.RequestPermission(), granted -> {
                if (pendingCamera == null) return;
                if (granted) pendingCamera.grant(new String[] {PermissionRequest.RESOURCE_VIDEO_CAPTURE});
                else pendingCamera.deny();
                pendingCamera = null;
            });

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        web = new WebView(this);
        offline = offlineView();
        offline.setVisibility(View.GONE);

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.addView(offline, new LinearLayout.LayoutParams(-1, -1));
        root.addView(web, new LinearLayout.LayoutParams(-1, -1));
        setContentView(root);
        // Android 15 draws apps edge to edge; keep the page clear of the status bar,
        // the navigation bar and the keyboard.
        ViewCompat.setOnApplyWindowInsetsListener(root, (v, insets) -> {
            Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars()
                    | WindowInsetsCompat.Type.displayCutout()
                    | WindowInsetsCompat.Type.ime());
            v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            return WindowInsetsCompat.CONSUMED;
        });

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setUserAgentString(s.getUserAgentString() + " ShiftsealAndroid/" + BuildConfig.VERSION_NAME);

        bridge = new Bridge(this, web);
        web.addJavascriptInterface(bridge, "ShiftsealAndroid");
        web.setWebViewClient(new Client());
        web.setWebChromeClient(new Chrome());

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (web.canGoBack()) web.goBack();
                else finish();
            }
        });

        if (savedInstanceState != null) web.restoreState(savedInstanceState);
        else web.loadUrl(startUrl(getIntent()));
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        String url = startUrl(intent);
        if (intent.getData() != null) web.loadUrl(url);
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    protected void onDestroy() {
        bridge.close();
        web.destroy();
        super.onDestroy();
    }

    /** A check-in link opened from the camera lands in the app; anything else starts at home. */
    private String startUrl(Intent intent) {
        Uri data = intent.getData();
        if (data != null && isOwnOrigin(data)) return data.toString();
        return BuildConfig.APP_URL;
    }

    static boolean isOwnOrigin(Uri uri) {
        Uri app = Uri.parse(BuildConfig.APP_URL);
        return "https".equals(uri.getScheme()) && app.getHost() != null && app.getHost().equals(uri.getHost());
    }

    private View offlineView() {
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setGravity(android.view.Gravity.CENTER);
        int pad = (int) (24 * getResources().getDisplayMetrics().density);
        box.setPadding(pad, pad, pad, pad);
        TextView text = new TextView(this);
        text.setText(R.string.offline);
        text.setTextSize(17);
        text.setGravity(android.view.Gravity.CENTER);
        Button retry = new Button(this);
        retry.setText(R.string.retry);
        retry.setOnClickListener(v -> {
            offline.setVisibility(View.GONE);
            web.setVisibility(View.VISIBLE);
            web.reload();
        });
        box.addView(text);
        box.addView(retry);
        return box;
    }

    private class Client extends WebViewClient {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            Uri uri = request.getUrl();
            if (isOwnOrigin(uri)) return false;
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, uri));
            } catch (Exception ignored) {
                // No app to open it with.
            }
            return true;
        }

        @Override
        public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
            if (request.isForMainFrame()) {
                web.setVisibility(View.GONE);
                offline.setVisibility(View.VISIBLE);
            }
        }
    }

    private class Chrome extends WebChromeClient {
        /** The page's QR scanner asks for the camera; the OS asks the person once. */
        @Override
        public void onPermissionRequest(PermissionRequest request) {
            if (!isOwnOrigin(request.getOrigin())) {
                request.deny();
                return;
            }
            for (String r : request.getResources()) {
                if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(r)) {
                    if (ContextCompat.checkSelfPermission(MainActivity.this, android.Manifest.permission.CAMERA)
                            == android.content.pm.PackageManager.PERMISSION_GRANTED) {
                        request.grant(new String[] {r});
                    } else {
                        pendingCamera = request;
                        cameraPermission.launch(android.Manifest.permission.CAMERA);
                    }
                    return;
                }
            }
            request.deny();
        }
    }
}
