package __PKG__;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;

/** Home-screen widget ng music player (Prev / Play-Pause / Next). Puwedeng paliitin: 2×1 hanggang 5×3 (layout tmn_widget_music_s kapag maliit). */
public class MusicWidget extends AppWidgetProvider {
    @Override public void onUpdate(Context c, AppWidgetManager m, int[] ids) {
        MusicEngine.get(c).updateWidgets();
    }
    @Override public void onEnabled(Context c) { MusicEngine.get(c).updateWidgets(); }
    // pinalaki o pinaliit sa home screen → ibang ayos (maliit = isang hilera)
    @Override public void onAppWidgetOptionsChanged(Context c, AppWidgetManager m, int id, android.os.Bundle o) { MusicEngine.get(c).updateWidgets(); }

    /** Laki ng widget (dp) → "s" (maliit: isang hilera) o "l" (buo). */
    static String size(AppWidgetManager m, int id) {
        try {
            android.os.Bundle o = m.getAppWidgetOptions(id);
            int w = o.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 300), h = o.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT, 150);
            return w < 230 || h < 112 ? "s" : "l";
        } catch (Exception e) { return "l"; }
    }
}
