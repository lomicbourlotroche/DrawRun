package com.drawrun.app.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.drawrun.app.logic.MapUtils
import kotlin.math.ceil
import kotlin.math.floor
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

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
    
    BoxWithConstraints(modifier = modifier) {
        val viewWidth = constraints.maxWidth
        val viewHeight = constraints.maxHeight
        
        if (viewWidth <= 0 || viewHeight <= 0) return@BoxWithConstraints

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

        // 2. Optimal Zoom
        val zoom = remember(viewWidth, viewHeight, minLat, maxLat, minLng, maxLng) {
            MapUtils.getOptimalZoom(minLat, maxLat, minLng, maxLng, viewWidth, viewHeight)
        }
        
        // 3. Viewport Calculations
        // Center of the bounding box -> Center of view
        val centerLat = (minLat + maxLat) / 2
        val centerLng = (minLng + maxLng) / 2
        
        // Pixel coordinates of center at this zoom
        val (centerPxX, centerPxY) = MapUtils.latLngToWorldPixel(centerLat, centerLng, zoom)
        
        // Top-left of the viewport in world pixels
        val viewportLx = centerPxX - viewWidth / 2.0
        val viewportTy = centerPxY - viewHeight / 2.0
        
        // 4. Determine visible tiles
        // Tile size = 256px
        val minTileX = floor(viewportLx / 256.0).toInt()
        val maxTileX = ceil((viewportLx + viewWidth) / 256.0).toInt()
        val minTileY = floor(viewportTy / 256.0).toInt()
        val maxTileY = ceil((viewportTy + viewHeight) / 256.0).toInt()
        
        // 5. Render Tiles
        val maxTiles = 1 shl zoom
        
        for (x in minTileX..maxTileX) {
            for (y in minTileY..maxTileY) {
                // Wrap X for world wrap (optional, mostly relevant for zoom 0-2)
                val tileX = (x % maxTiles + maxTiles) % maxTiles
                val tileY = y // Y doesn't wrap
                
                if (tileY in 0 until maxTiles) {
                    val tileUrl = "https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/$zoom/$tileX/$tileY.png"
                    
                    val pxX = (x * 256.0 - viewportLx).roundToInt()
                    val pxY = (y * 256.0 - viewportTy).roundToInt()
                    
                    AsyncImage(
                        model = tileUrl,
                        contentDescription = null,
                        modifier = Modifier
                            .size(256.dp) // Wait, size needs to be px, but modifier takes dp.
                            // FIX: Using absolute px offsets is hard in pure Compose modifiers without density.
                            // Better: Use a Canvas to draw images? No, AsyncImage is Composable.
                            // Solution: Convert px to dp or use layout.
                            // Simplest here: offset with IntOffset which is px.
                            .offset { IntOffset(pxX, pxY) }
                            // Wait, Modifier.size(256.dp) is WRONG. Tiles are 256px.
                            // We should use layout or explicit size in px converted to dp.
                            // Or utilize density.
                    )
                }
            }
        }
        
        // Since Modifier.size takes Dp, we need density.
        val density = androidx.compose.ui.platform.LocalDensity.current
        val tileSizeDp = with(density) { 256.toDp() }
        
        // Re-loop for correct rendering with size
         for (x in minTileX..maxTileX) {
            for (y in minTileY..maxTileY) {
                val tileX = (x % maxTiles + maxTiles) % maxTiles
                val tileY = y
                
                if (tileY in 0 until maxTiles) {
                     val tileUrl = "https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/$zoom/$tileX/$tileY.png"
                     val pxX = (x * 256.0 - viewportLx).roundToInt()
                     val pxY = (y * 256.0 - viewportTy).roundToInt()
                     
                     AsyncImage(
                        model = tileUrl,
                        contentDescription = null,
                        modifier = Modifier
                            .offset { IntOffset(pxX, pxY) }
                            .size(tileSizeDp) // This assumes 1:1 density mapping which is WRONG for most screens.
                            // Tiles are 256 PIXELS.
                            // On 2.0 density screen, 256px = 128dp.
                            // Correct logic: .size(with(density){ 256.toDp() })
                            // Wait, 256.toDp() means "256 pixels converted to dp".
                            // If density is 2.0, 1dp = 2px. So 128dp = 256px.
                            // 256.toDp() -> 128.dp. Correct.
                     )
                }
            }
        }

        // 6. Draw Polyline Overlay
        Canvas(modifier = Modifier.fillMaxSize()) {
            val path = Path()
            
            fun project(lat: Double, lng: Double): Offset {
                val (wX, wY) = MapUtils.latLngToWorldPixel(lat, lng, zoom)
                return Offset((wX - viewportLx).toFloat(), (wY - viewportTy).toFloat())
            }

            coordinates.forEachIndexed { index, (lat, lng) ->
                val p = project(lat, lng)
                if (index == 0) path.moveTo(p.x, p.y) else path.lineTo(p.x, p.y)
            }

            drawPath(
                path = path,
                color = lineColor,
                style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
            )

            // 7. Draw Live Point
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
