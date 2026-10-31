package dev.sushilraj.shiftseal;

import android.Manifest;
import android.annotation.SuppressLint;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.webkit.ValueCallback;
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
import androidx.core.content.FileProvider;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

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
    /** A page request for the camera or microphone, waiting on the system prompt. */
    private PermissionRequest pendingMedia;
    /** The page's file input, waiting for a photo. */
    private ValueCallback<Uri[]> pendingFiles;
    private Uri pendingPhoto;

    private final ActivityResultLauncher<String[]> mediaPermissions =
            registerForActivityResult(new ActivityResultContracts.RequestMultiplePermissions(), result -> {
                if (pendingMedia == null) return;
                grantAllowed(pendingMedia);
                pendingMedia = null;
            });

    private final ActivityResultLauncher<String> photoCameraPermission =
            registerForActivityResult(new ActivityResultContracts.RequestPermission(), granted -> {
                if (granted) launchCamera();
                else deliverFiles(null);
            });

    private final ActivityResultLauncher<Uri> takePicture =
            registerForActivityResult(new ActivityResultContracts.TakePicture(), saved ->
                    deliverFiles(Boolean.TRUE.equals(saved) && pendingPhoto != null ? new Uri[] {pendingPhoto} : null));

    private final ActivityResultLauncher<Intent> pickFile =
            registerForActivityResult(new ActivityResultContracts.StartActivityForResult(), result ->
                    deliverFiles(WebChromeClient.FileChooserParams.parseResult(result.getResultCode(), result.getData())));

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

        clearOldPhotos();
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

    private static String androidPermissionFor(String resource) {
        if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(resource)) return Manifest.permission.CAMERA;
        if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resource)) return Manifest.permission.RECORD_AUDIO;
        return null;
    }

    private boolean has(String permission) {
        return ContextCompat.checkSelfPermission(this, permission) == PackageManager.PERMISSION_GRANTED;
    }

    /** Grants the camera and microphone the person allowed; refuses anything else. */
    private void grantAllowed(PermissionRequest request) {
        List<String> ok = new ArrayList<>();
        for (String r : request.getResources()) {
            String p = androidPermissionFor(r);
            if (p != null && has(p)) ok.add(r);
        }
        if (ok.isEmpty()) request.deny();
        else request.grant(ok.toArray(new String[0]));
    }

    /** Takes a full-size photo into the app's cache, shared with the camera app through a FileProvider. */
    private void launchCamera() {
        try {
            File dir = new File(getCacheDir(), "photos");
            if (!dir.isDirectory() && !dir.mkdirs()) throw new IllegalStateException("no photo dir");
            File file = File.createTempFile("hazard-", ".jpg", dir);
            pendingPhoto = FileProvider.getUriForFile(this, getPackageName() + ".files", file);
            takePicture.launch(pendingPhoto);
        } catch (Exception e) {
            deliverFiles(null);
        }
    }

    private void deliverFiles(Uri[] uris) {
        if (pendingFiles != null) pendingFiles.onReceiveValue(uris);
        pendingFiles = null;
        pendingPhoto = null;
    }

    /** Photos are read by the page straight away; nothing needs to stay in the cache. */
    private void clearOldPhotos() {
        File[] old = new File(getCacheDir(), "photos").listFiles();
        if (old == null) return;
        for (File f : old) {
            //noinspection ResultOfMethodCallIgnored
            f.delete();
        }
    }

    private class Chrome extends WebChromeClient {
        /**
         * The page asks for the camera (gate QR scanner) or the microphone (hold to talk).
         * Only Shiftseal's own pages may ask; the OS asks the person once.
         */
        @Override
        public void onPermissionRequest(PermissionRequest request) {
            if (!isOwnOrigin(request.getOrigin())) {
                request.deny();
                return;
            }
            List<String> needed = new ArrayList<>();
            for (String r : request.getResources()) {
                String p = androidPermissionFor(r);
                if (p != null && !has(p)) needed.add(p);
            }
            if (needed.isEmpty()) {
                grantAllowed(request);
                return;
            }
            if (pendingMedia != null) pendingMedia.deny();
            pendingMedia = request;
            mediaPermissions.launch(needed.toArray(new String[0]));
        }

        /** "Take a photo" on a hazard report opens the camera; other file inputs open the picker. */
        @Override
        public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
            if (pendingFiles != null) pendingFiles.onReceiveValue(null);
            pendingFiles = callback;
            if (params.isCaptureEnabled()) {
                if (has(Manifest.permission.CAMERA)) launchCamera();
                else photoCameraPermission.launch(Manifest.permission.CAMERA);
            } else {
                try {
                    pickFile.launch(params.createIntent());
                } catch (ActivityNotFoundException e) {
                    deliverFiles(null);
                }
            }
            return true;
        }
    }
}
