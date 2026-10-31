package __PKG__;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.ServiceInfo;
import android.media.AudioManager;
import android.os.Build;
import android.os.IBinder;
import android.support.v4.media.session.MediaSessionCompat;
import androidx.core.app.NotificationCompat;

/** Foreground service ng music: notification + lock screen controls (MediaSession). */
public class MusicService extends Service {
    private MediaSessionCompat session;
    private MusicEngine eng;
    private boolean noisyOn = false;
    private final BroadcastReceiver noisy = new BroadcastReceiver() {
        @Override public void onReceive(Context c, Intent i) { eng.pause(); }
    };

    @Override public void onCreate() {
        super.onCreate();
        eng = MusicEngine.get(this);
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel ch = new NotificationChannel(MusicEngine.CH, "Music player", NotificationManager.IMPORTANCE_LOW);
            ch.setShowBadge(false); ch.setLockscreenVisibility(android.app.Notification.VISIBILITY_PUBLIC);
            ((NotificationManager) getSystemService(NOTIFICATION_SERVICE)).createNotificationChannel(ch);
        }
        session = new MediaSessionCompat(this, "TigoMusic");
        session.setCallback(new MediaSessionCompat.Callback() {
            @Override public void onPlay() { eng.resume(); }
            @Override public void onPause() { eng.pause(); }
            @Override public void onSkipToNext() { eng.next(); }
            @Override public void onSkipToPrevious() { eng.prev(); }
            @Override public void onSeekTo(long pos) { eng.seek((int) pos); }
            @Override public void onStop() { eng.pause(); }
        });
        session.setActive(true);
        eng.attach(this, session);
    }

    @Override public int onStartCommand(Intent intent, int flags, int startId) {
        String a = intent != null ? intent.getAction() : null;
        if (a != null && a.startsWith(MusicEngine.ACT)) {
            String x = a.substring(MusicEngine.ACT.length());
            if ("toggle".equals(x)) eng.toggle();
            else if ("next".equals(x)) eng.next();
            else if ("prev".equals(x)) eng.prev();
            else if ("stop".equals(x)) eng.pause();
        }
        refresh();
        return START_NOT_STICKY;
    }

    void refresh() {
        eng.updateSession(session);
        eng.updateWidgets();
        android.app.Notification n = eng.build(this, session);
        try {
            if (Build.VERSION.SDK_INT >= 29) startForeground(MusicEngine.NID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
            else startForeground(MusicEngine.NID, n);
        } catch (Exception e) { }
        if (!eng.hasTrack()) { stopForeground(true); stopSelf(); return; }
        if (eng.isPlaying()) {
            if (!noisyOn) { registerReceiver(noisy, new IntentFilter(AudioManager.ACTION_AUDIO_BECOMING_NOISY)); noisyOn = true; }
        } else {
            if (noisyOn) { try { unregisterReceiver(noisy); } catch (Exception e) { } noisyOn = false; }
            // naka-pause: puwedeng i-swipe ang notification, pero tuloy ang controls
            if (Build.VERSION.SDK_INT >= 24) stopForeground(STOP_FOREGROUND_DETACH); else stopForeground(false);
            ((NotificationManager) getSystemService(NOTIFICATION_SERVICE)).notify(MusicEngine.NID, n);
        }
    }

    @Override public void onDestroy() {
        if (noisyOn) { try { unregisterReceiver(noisy); } catch (Exception e) { } }
        eng.detach();
        if (session != null) { session.setActive(false); session.release(); }
        super.onDestroy();
    }
    @Override public IBinder onBind(Intent i) { return null; }
}
