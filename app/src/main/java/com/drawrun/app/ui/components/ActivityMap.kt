package com.drawrun.app.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.dp
import com.drawrun.app.logic.MapUtils
import kotlin.math.max
import kotlin.math.min

@Composable
fun ActivityMap(
    polyline: String,
    modifier: Modifier = Modifier,
    lineColor: Color = Color(0xFFEF4444),
    strokeWidth: Float = 5f,
    currentProgress: Float? = null // 0.0 to 1.0 representing progress along the path
) {
    val coordinates = remember(polyline) { MapUtils.decodePolyline(polyline) }

    if (coordinates.isEmpty()) return
    
    // In a real app with API Key, we would use AsyncImage here with a static map URL
    // For now, we simulate a map background style
    Box(modifier = modifier) {
         // Placeholder Map Background (Grid style)
        Canvas(modifier = Modifier.fillMaxSize()) {
             drawRect(color = Color(0xFFE5E7EB)) // Generic land color
             // Optional: Draw simple grid lines to simulate a map
             val step = 50.dp.toPx()
             for (x in 0..size.width.toInt() step step.toInt()) {
                 drawLine(Color.White.copy(alpha=0.5f), Offset(x.toFloat(), 0f), Offset(x.toFloat(), size.height))
             }
             for (y in 0..size.height.toInt() step step.toInt()) {
                 drawLine(Color.White.copy(alpha=0.5f), Offset(0f, y.toFloat()), Offset(size.width, y.toFloat()))
             }
        }

        Canvas(modifier = Modifier.fillMaxSize()) {
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

            // Add padding (Aspect Fit Logic)
            val canvasWidth = size.width
            val canvasHeight = size.height
            val latRange = max(maxLat - minLat, 0.0001)
            val lngRange = max(maxLng - minLng, 0.0001)
            
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
            renderMinLat -= renderLatRange * 0.1
            renderMaxLat += renderLatRange * 0.1
            renderMinLng -= renderLngRange * 0.1
            renderMaxLng += renderLngRange * 0.1
            renderLatRange *= 1.2
            renderLngRange *= 1.2

            // Helper to project
            fun project(lat: Double, lng: Double): Offset {
                val x = ((lng - renderMinLng) / renderLngRange * canvasWidth).toFloat()
                val y = ((renderMaxLat - lat) / renderLatRange * canvasHeight).toFloat()
                return Offset(x, y)
            }

            // 2. Draw Path
            coordinates.forEachIndexed { index, (lat, lng) ->
                val p = project(lat, lng)
                if (index == 0) path.moveTo(p.x, p.y) else path.lineTo(p.x, p.y)
            }

            drawPath(
                path = path,
                color = lineColor,
                style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
            )

            // 3. Draw Live Point
            if (currentProgress != null && coordinates.isNotEmpty()) {
                val targetIndex = (currentProgress * (coordinates.size - 1)).toInt().coerceIn(0, coordinates.size - 1)
                val (lat, lng) = coordinates[targetIndex]
                val point = project(lat, lng)
                
                drawCircle(Color.White, radius = 8.dp.toPx(), center = point)
                drawCircle(lineColor, radius = 6.dp.toPx(), center = point)
            }
        }
    }
}
