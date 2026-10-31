package __PKG__;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.IBinder;
import androidx.core.app.NotificationCompat;

/** Pinapanatiling buhay ang app habang may naka-pilang posts na ina-upload (tuloy kahit naka-minimize o naka-lock ang phone). */
public class UploadKeepService extends Service {
    @Override public int onStartCommand(Intent intent, int flags, int startId) {
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel ch = new NotificationChannel("tmn_upload", "Uploading posts", NotificationManager.IMPORTANCE_LOW);
            ch.setShowBadge(false);
            ((NotificationManager) getSystemService(NOTIFICATION_SERVICE)).createNotificationChannel(ch);
        }
        Intent li = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent pi = PendingIntent.getActivity(this, 0, li != null ? li : new Intent(), PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        Notification n = new NotificationCompat.Builder(this, "tmn_upload")
            .setSmallIcon(getResources().getIdentifier("tmn_ic_music", "drawable", getPackageName()))
            .setContentTitle("Uploading your posts").setContentText("Waiting for internet or your schedule…")
            .setContentIntent(pi).setOngoing(true).setShowWhen(false).build();
        try {
            if (Build.VERSION.SDK_INT >= 29) startForeground(4712, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC);
            else startForeground(4712, n);
        } catch (Exception e) { stopSelf(); }
        return START_NOT_STICKY;
    }
    @Override public IBinder onBind(Intent i) { return null; }
}
