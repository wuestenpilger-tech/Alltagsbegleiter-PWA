package de.wuestenpilger.alltagsbegleiter;

import android.app.Activity;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.OpenableColumns;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.widget.Toast;

import com.getcapacitor.BridgeActivity;
import androidx.core.view.WindowCompat;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

public class MainActivity extends BridgeActivity {

    public static final String PREFS = "alltagsbegleiter_alarms";
    public static final String CHANNEL_ID = "alltagsbegleiter_alarm_channel";

    private static final int OPEN_TEXT_FILE = 2301;
    private static final int SAVE_TEXT_FILE = 2302;

    private WebView webView;
    private String pendingFilename;
    private String pendingContent;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
        getWindow().setStatusBarColor(Color.rgb(247, 242, 232));
        getWindow().setNavigationBarColor(Color.rgb(247, 242, 232));
        createNotificationChannel(this);
        webView = getBridge().getWebView();
        webView.addJavascriptInterface(new AndroidFileBridge(), "AndroidApp");
    }

    public static void createNotificationChannel(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager == null) return;
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Alltagsbegleiter Erinnerungen",
                    NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Erinnerungen für Medikamente, Aufgaben und Wecker");
            manager.createNotificationChannel(channel);
        }
    }

    public class AndroidFileBridge {
        @JavascriptInterface
        public String getDeviceType() {
            int smallestWidth = getResources().getConfiguration().smallestScreenWidthDp;
            return smallestWidth >= 600 ? "tablet" : "handy";
        }

        @JavascriptInterface
        public void openTextFile() {
            runOnUiThread(() -> {
                Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                // Bewusst kein MIME-Filter: Android-Dateimanager melden CSV-Dateien je nach
                // Hersteller unterschiedlich (z. B. text/csv, text/comma-separated-values,
                // application/csv oder application/vnd.ms-excel). Mit */* bleiben deshalb
                // CSV-, JSON-, TXT-, ABG- und DKBACKUP-Dateien sicher auswählbar.
                intent.setType("*/*");
                intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, false);
                startActivityForResult(intent, OPEN_TEXT_FILE);
            });
        }

        @JavascriptInterface
        public void saveTextFile(String filename, String content) {
            pendingFilename = filename;
            pendingContent = content;
            runOnUiThread(() -> {
                Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType(mimeForFilename(filename));
                intent.putExtra(Intent.EXTRA_TITLE, filename);
                startActivityForResult(intent, SAVE_TEXT_FILE);
            });
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (resultCode != Activity.RESULT_OK || data == null || data.getData() == null) return;
        Uri uri = data.getData();
        if (requestCode == OPEN_TEXT_FILE) readSelectedFile(uri);
        else if (requestCode == SAVE_TEXT_FILE) writeSelectedFile(uri);
    }

    private void readSelectedFile(Uri uri) {
        try (InputStream input = getContentResolver().openInputStream(uri);
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            if (input == null) throw new IllegalStateException("Datei konnte nicht geöffnet werden.");
            byte[] buffer = new byte[8192];
            int count;
            while ((count = input.read(buffer)) != -1) output.write(buffer, 0, count);
            String name = getDisplayName(uri);
            String encodedName = Base64.getEncoder().encodeToString(name.getBytes(StandardCharsets.UTF_8));
            String encodedContent = Base64.getEncoder().encodeToString(output.toByteArray());
            String js = "window.__alltagsbegleiterReceiveFile && window.__alltagsbegleiterReceiveFile('" + encodedName + "','" + encodedContent + "');";
            webView.post(() -> webView.evaluateJavascript(js, null));
        } catch (Exception e) {
            showError("Import fehlgeschlagen: " + e.getMessage());
        }
    }

    private void writeSelectedFile(Uri uri) {
        try (OutputStream output = getContentResolver().openOutputStream(uri, "wt")) {
            if (output == null) throw new IllegalStateException("Datei konnte nicht gespeichert werden.");
            output.write((pendingContent == null ? "" : pendingContent).getBytes(StandardCharsets.UTF_8));
            output.flush();
            webView.post(() -> webView.evaluateJavascript(
                    "window.__alltagsbegleiterFileSaved && window.__alltagsbegleiterFileSaved();", null));
        } catch (Exception e) {
            showError("Export fehlgeschlagen: " + e.getMessage());
        } finally {
            pendingFilename = null;
            pendingContent = null;
        }
    }

    private String mimeForFilename(String filename) {
        String lower = filename == null ? "" : filename.toLowerCase();
        if (lower.endsWith(".csv")) return "text/csv";
        if (lower.endsWith(".txt")) return "text/plain";
        if (lower.endsWith(".json") || lower.endsWith(".abg") || lower.endsWith(".dkbackup")) return "application/json";
        return "application/octet-stream";
    }

    private String getDisplayName(Uri uri) {
        String name = "Alltagsbegleiter-Import.txt";
        try (Cursor cursor = getContentResolver().query(uri, null, null, null, null)) {
            if (cursor != null && cursor.moveToFirst()) {
                int index = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                if (index >= 0) name = cursor.getString(index);
            }
        }
        return name;
    }

    private void showError(String message) {
        runOnUiThread(() -> Toast.makeText(this, message, Toast.LENGTH_LONG).show());
    }
}
