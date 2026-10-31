package __PKG__;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;

/** Home-screen widget ng music player (Prev / Play-Pause / Next). */
public class MusicWidget extends AppWidgetProvider {
    @Override public void onUpdate(Context c, AppWidgetManager m, int[] ids) {
        MusicEngine.get(c).updateWidgets();
    }
    @Override public void onEnabled(Context c) { MusicEngine.get(c).updateWidgets(); }
}
