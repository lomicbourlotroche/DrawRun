package com.drawrun.app.logic

import android.content.ComponentName
import android.content.Context
import android.content.pm.PackageManager
import com.drawrun.app.ui.theme.AppTheme

object BrandingManager {
    
    fun updateLauncherIcon(context: Context, theme: AppTheme) {
        val pm = context.packageManager
        val packageName = context.packageName
        
        val aliases = mapOf(
            AppTheme.ONYX to ".MainActivityOnyx",
            AppTheme.EMERALD to ".MainActivityEmerald",
            AppTheme.RUBY to ".MainActivityRuby",
            AppTheme.LIGHT to ".MainActivityLight"
        )
        
        aliases.forEach { (t, aliasName) ->
            val state = if (t == theme) {
                PackageManager.COMPONENT_ENABLED_STATE_ENABLED
            } else {
                PackageManager.COMPONENT_ENABLED_STATE_DISABLED
            }
            
            try {
                pm.setComponentEnabledSetting(
                    ComponentName(packageName, "$packageName$aliasName"),
                    state,
                    PackageManager.DONT_KILL_APP
                )
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }
}
