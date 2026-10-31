package dev.sushilraj.shiftseal;

import android.Manifest;
import android.annotation.SuppressLint;
import android.content.pm.PackageManager;
import android.location.Location;
import android.net.Uri;
import android.os.Build;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;

import com.google.android.gms.location.CurrentLocationRequest;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.Priority;
import com.google.android.gms.tasks.CancellationTokenSource;
import com.google.android.play.core.integrity.IntegrityManager;
import com.google.android.play.core.integrity.IntegrityManagerFactory;
import com.google.android.play.core.integrity.IntegrityTokenRequest;

import android.os.CancellationSignal;

import androidx.credentials.Credential;
import androidx.credentials.CredentialManager;
import androidx.credentials.CredentialManagerCallback;
import androidx.credentials.CustomCredential;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.exceptions.GetCredentialCancellationException;
import androidx.credentials.exceptions.GetCredentialException;
import androidx.credentials.exceptions.NoCredentialException;

import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption;
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential;

import org.json.JSONException;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.ArrayDeque;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;

/**
 * What the page can ask the phone for. Every call answers through
 * window.__shiftsealNative.resolve(id, json); see src/client/lib/native.ts.
 *
 * getFix          one precise GPS reading, with whether a mock-location app made it
 * integrityToken  a Play Integrity token bound to the check's nonce
 * googleSignIn    a Google ID token (Google blocks its sign-in page inside web views)
 */
public class Bridge {
    private final AppCompatActivity activity;
    private final WebView web;
    private final FusedLocationProviderClient location;
    private final IntegrityManager integrity;
    private final ActivityResultLauncher<String[]> locationPermission;
    /** Location requests waiting for the person to answer the permission prompt. */
    private final ArrayDeque<String[]> waiting = new ArrayDeque<>();
    private CancellationTokenSource cancel = new CancellationTokenSource();

    Bridge(AppCompatActivity activity, WebView web) {
        this.activity = activity;
        this.web = web;
        this.location = LocationServices.getFusedLocationProviderClient(activity);
        this.integrity = IntegrityManagerFactory.create(activity.getApplicationContext());
        this.locationPermission = activity.registerForActivityResult(
                new ActivityResultContracts.RequestMultiplePermissions(), result -> {
                    boolean granted = hasLocation();
                    while (!waiting.isEmpty()) {
                        String[] w = waiting.poll();
                        if (granted) fix(w[0], Long.parseLong(w[1]));
                        else fail(w[0], "denied");
                    }
                });
    }

    void close() {
        cancel.cancel();
    }

    @JavascriptInterface
    public void request(String id, String method, String argsJson) {
        activity.runOnUiThread(() -> {
            // Only the Shiftseal page may use the phone.
            String url = web.getUrl();
            if (url == null || !MainActivity.isOwnOrigin(Uri.parse(url))) {
                resolve(id, "null");
                return;
            }
            JSONObject args;
            try {
                args = new JSONObject(argsJson == null ? "{}" : argsJson);
            } catch (JSONException e) {
                args = new JSONObject();
            }
            switch (method) {
                case "getFix":
                    getFix(id, args.optLong("timeoutMs", 15_000));
                    break;
                case "integrityToken":
                    integrityToken(id, args.optString("nonce", ""));
                    break;
                case "googleSignIn":
                    googleSignIn(id);
                    break;
                default:
                    resolve(id, "null");
            }
        });
    }

    private boolean hasLocation() {
        return ContextCompat.checkSelfPermission(activity, Manifest.permission.ACCESS_FINE_LOCATION)
                == PackageManager.PERMISSION_GRANTED;
    }

    private void getFix(String id, long timeoutMs) {
        if (hasLocation()) {
            fix(id, timeoutMs);
            return;
        }
        waiting.add(new String[] {id, Long.toString(timeoutMs)});
        if (waiting.size() == 1) {
            locationPermission.launch(new String[] {
                Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION
            });
        }
    }

    @SuppressLint("MissingPermission")
    private void fix(String id, long timeoutMs) {
        CurrentLocationRequest req = new CurrentLocationRequest.Builder()
                .setPriority(Priority.PRIORITY_HIGH_ACCURACY)
                .setMaxUpdateAgeMillis(0)
                .setDurationMillis(Math.max(1_000, timeoutMs))
                .build();
        location.getCurrentLocation(req, cancel.getToken())
                .addOnSuccessListener(loc -> {
                    if (loc == null) fail(id, "timeout");
                    else answerFix(id, loc);
                })
                .addOnFailureListener(e -> fail(id, "unavailable"));
    }

    private void answerFix(String id, Location loc) {
        try {
            JSONObject o = new JSONObject();
            o.put("ok", true);
            o.put("lat", loc.getLatitude());
            o.put("lng", loc.getLongitude());
            o.put("accuracyM", loc.hasAccuracy() ? loc.getAccuracy() : 0);
            o.put("at", iso(loc.getTime()));
            o.put("mocked", isMock(loc));
            resolve(id, o.toString());
        } catch (JSONException e) {
            fail(id, "unavailable");
        }
    }

    @SuppressWarnings("deprecation")
    private static boolean isMock(Location loc) {
        return Build.VERSION.SDK_INT >= 31 ? loc.isMock() : loc.isFromMockProvider();
    }

    private void integrityToken(String id, String nonce) {
        if (nonce.isEmpty()) {
            resolve(id, "null");
            return;
        }
        integrity
                .requestIntegrityToken(IntegrityTokenRequest.builder()
                        .setNonce(nonce)
                        .setCloudProjectNumber(BuildConfig.CLOUD_PROJECT_NUMBER)
                        .build())
                .addOnSuccessListener(r -> {
                    try {
                        resolve(id, new JSONObject().put("token", r.token()).toString());
                    } catch (JSONException e) {
                        resolve(id, "null");
                    }
                })
                // Not installed from Play, no Play services, or offline: the check goes ahead without it.
                .addOnFailureListener(e -> resolve(id, "null"));
    }

    private void googleSignIn(String id) {
        if (BuildConfig.GOOGLE_WEB_CLIENT_ID.isEmpty()) {
            resolve(id, "{\"error\":\"unavailable\"}");
            return;
        }
        GetCredentialRequest request = new GetCredentialRequest.Builder()
                .addCredentialOption(new GetSignInWithGoogleOption.Builder(BuildConfig.GOOGLE_WEB_CLIENT_ID).build())
                .build();
        CredentialManager.create(activity).getCredentialAsync(activity, request, new CancellationSignal(),
                ContextCompat.getMainExecutor(activity),
                new CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
                    @Override
                    public void onResult(GetCredentialResponse result) {
                        Credential c = result.getCredential();
                        if (c instanceof CustomCredential
                                && GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL.equals(c.getType())) {
                            String token = GoogleIdTokenCredential.createFrom(c.getData()).getIdToken();
                            resolve(id, "{\"idToken\":" + JSONObject.quote(token) + "}");
                        } else {
                            resolve(id, "{\"error\":\"unavailable\"}");
                        }
                    }

                    @Override
                    public void onError(GetCredentialException e) {
                        // NoCredentialException: no Google account on this phone.
                        String error = e instanceof GetCredentialCancellationException ? "cancelled"
                                : e instanceof NoCredentialException ? "no_account" : "unavailable";
                        resolve(id, "{\"error\":\"" + error + "\"}");
                    }
                });
    }

    private void fail(String id, String reason) {
        resolve(id, "{\"ok\":false,\"reason\":\"" + reason + "\"}");
    }

    private void resolve(String id, String json) {
        String safeId = JSONObject.quote(id);
        String safeJson = JSONObject.quote(json);
        web.post(() -> web.evaluateJavascript(
                "window.__shiftsealNative&&window.__shiftsealNative.resolve(" + safeId + "," + safeJson + ")",
                null));
    }

    private static String iso(long millis) {
        SimpleDateFormat f = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
        f.setTimeZone(TimeZone.getTimeZone("UTC"));
        return f.format(new Date(millis));
    }
}
