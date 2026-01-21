package com.drawrun.app.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import com.drawrun.app.logic.MapUtils
import kotlin.math.max
import kotlin.math.min

@Composable
fun ActivityMap(
    polyline: String,
    modifier: Modifier = Modifier,
    lineColor: Color = Color(0xFFEF4444),
    strokeWidth: Float = 5f
) {
    val coordinates = remember(polyline) { MapUtils.decodePolyline(polyline) }

    if (coordinates.isEmpty()) return

    Canvas(modifier = modifier) {
        val path = Path()
        
        // 1. Calculate Bounds
        var minLat = Double.MAX_VALUE
        var maxLat = -Double.MAX_VALUE
        var minLng = Double.MAX_VALUE
        var maxLng = -Double.MAX_VALUE

        coordinates.forEach { (lat, lng) ->
            minLat = min(minLat, lat)
            maxLat = max(maxLat, lat)
            minLng = min(minLng, lng)
            maxLng = max(maxLng, lng)
        }

        // Add padding to bounds
        val latRange = max(maxLat - minLat, 0.0001)
        val lngRange = max(maxLng - minLng, 0.0001)
        
        // 2. Scale Logic
        // We want to fit the route in the box while preserving aspect ratio.
        // Aspect Ratio of the route vs the Canvas
        val canvasWidth = size.width
        val canvasHeight = size.height
        
        // Simple Mercator-ish projection for small areas (assuming flat earth is fine for activity view)
        // x = (lng - minLng) / lngRange * width
        // y = (maxLat - lat) / latRange * height (Latitude increases upwards, screen Y increases downwards)
        
        // To preserve aspect ratio:
        // Adjust bounds to match canvas aspect ratio
        val routeAspect = lngRange / latRange 
        val canvasAspect = canvasWidth / canvasHeight
        
        var renderMinLng = minLng
        var renderMaxLng = maxLng
        var renderMinLat = minLat
        var renderMaxLat = maxLat
        var renderLngRange = lngRange
        var renderLatRange = latRange

        if (routeAspect > canvasAspect) {
            // Route is wider than canvas. Vertical padding needed.
            val targetLatRange = lngRange / canvasAspect
            val latDiff = targetLatRange - latRange
            renderMinLat -= latDiff / 2
            renderMaxLat += latDiff / 2
            renderLatRange = targetLatRange
        } else {
            // Route is taller than canvas. Horizontal padding needed.
            val targetLngRange = latRange * canvasAspect
            val lngDiff = targetLngRange - lngRange
            renderMinLng -= lngDiff / 2
            renderMaxLng += lngDiff / 2
            renderLngRange = targetLngRange
        }

        // Add 10% padding
        renderMinLat -= renderLatRange * 0.05
        renderMaxLat += renderLatRange * 0.05
        renderMinLng -= renderLngRange * 0.05
        renderMaxLng += renderLngRange * 0.05
        renderLatRange *= 1.1
        renderLngRange *= 1.1

        // 3. Draw Path
        coordinates.forEachIndexed { index, (lat, lng) ->
            val x = ((lng - renderMinLng) / renderLngRange * canvasWidth).toFloat()
            val y = ((renderMaxLat - lat) / renderLatRange * canvasHeight).toFloat()
            
            if (index == 0) {
                path.moveTo(x, y)
            } else {
                path.lineTo(x, y)
            }
        }

        drawPath(
            path = path,
            color = lineColor,
            style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
        )
    }
}
