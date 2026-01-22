package com.drawrun.app.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.gestures.detectTransformGestures
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
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
    currentProgress: Float? = null, // 0.0 to 1.0 representing progress along the path
    pointColors: List<Color>? = null // Optional list of colors for heatmap
) {
    val coordinates = remember(polyline) { MapUtils.decodePolyline(polyline) }

    if (coordinates.isEmpty()) return
    
    // Zoom and Pan State
    var scale by remember { mutableStateOf(1f) }
    var offset by remember { mutableStateOf(Offset.Zero) }
    
    // Reset when polyline changes
    LaunchedEffect(polyline) {
        scale = 1f
        offset = Offset.Zero
    }

    BoxWithConstraints(
        modifier = modifier
            .pointerInput(Unit) {
                detectTransformGestures { _, pan, zoom, _ ->
                    scale = (scale * zoom).coerceIn(1f, 5f)
                    // Simplified pan: allow panning but clamp roughly to bounds if needed
                    // For now, free pan is better than stuck pan
                    val maxOffset = 1000f * scale // Arbitrary bounds
                    offset = Offset(
                        (offset.x + pan.x * scale), // Scale pan speed
                        (offset.y + pan.y * scale)
                    )
                }
            }
    ) {
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

        // 2. Base Optimal Zoom (fit to screen)
        val baseZoom = remember(viewWidth, viewHeight, minLat, maxLat, minLng, maxLng) {
            MapUtils.getOptimalZoom(minLat, maxLat, minLng, maxLng, viewWidth, viewHeight)
        }
        
        // Effective Zoom Level (integer)
        // Ensure strictly positive and clamped reasonably (e.g., 0 to 19)
        val zoomLevel = (baseZoom + (kotlin.math.log2(scale)).toInt()).coerceIn(0, 19)
        
        // 3. Viewport Calculations
        // Center of the bounding box -> Center of view
        val centerLat = (minLat + maxLat) / 2
        val centerLng = (minLng + maxLng) / 2
        
        // Pixel coordinates of center at this zoom
        val (centerPxX, centerPxY) = MapUtils.latLngToWorldPixel(centerLat, centerLng, zoomLevel)
        
        // Adjust viewport top-left based on center AND user pan offset
        // offset is in screen pixels, so we subtract it from the center-based viewport
        val viewportLx = centerPxX - (viewWidth / 2.0) - offset.x
        val viewportTy = centerPxY - (viewHeight / 2.0) - offset.y
        
        // 4. Determine visible tiles
        val minTileX = floor(viewportLx / 256.0).toInt()
        val maxTileX = ceil((viewportLx + viewWidth) / 256.0).toInt()
        val minTileY = floor(viewportTy / 256.0).toInt()
        val maxTileY = ceil((viewportTy + viewHeight) / 256.0).toInt()
        
        // 5. Render Tiles
        val maxTiles = 1 shl zoomLevel
        
        // Since Modifier.size takes Dp, we need density.
        val density = androidx.compose.ui.platform.LocalDensity.current
        val tileSizeDp = with(density) { 256.toDp() }
        
        // Apply transformations using graphicsLayer for performance
        Box(
            modifier = Modifier
                .fillMaxSize()
                .graphicsLayer {
                    // Placeholder for future optimizations
                } 
        ) {
            for (x in minTileX..maxTileX) {
                for (y in minTileY..maxTileY) {
                    val tileX = (x % maxTiles + maxTiles) % maxTiles
                    val tileY = y

                    if (tileY in 0 until maxTiles) {
                         val tileUrl = "https://cartodb-basemaps-a.global.ssl.fastly.net/light_all/$zoomLevel/$tileX/$tileY.png"
                         val pxX = (x * 256.0 - viewportLx).roundToInt()
                         val pxY = (y * 256.0 - viewportTy).roundToInt()

                         AsyncImage(
                            model = tileUrl,
                            contentDescription = null,
                            modifier = Modifier
                                .offset { IntOffset(pxX, pxY) }
                                .size(tileSizeDp)
                         )
                    }
                }
            }
        }

            // 6. Draw Polyline Overlay (Heatmap if pointColors provided)
            Canvas(modifier = Modifier.fillMaxSize()) {
                val path = Path()
                
                fun project(lat: Double, lng: Double): Offset {
                    val (wX, wY) = MapUtils.latLngToWorldPixel(lat, lng, zoomLevel)
                    return Offset((wX - viewportLx).toFloat(), (wY - viewportTy).toFloat())
                }

                if (coordinates.isNotEmpty()) {
                    val projectedPoints = coordinates.map { project(it.first, it.second) }
                    
                    if (pointColors != null && pointColors.size == coordinates.size) {
                         // Draw colored segments
                         for (i in 0 until projectedPoints.size - 1) {
                             drawLine(
                                 color = pointColors[i],
                                 start = projectedPoints[i],
                                 end = projectedPoints[i+1],
                                 strokeWidth = strokeWidth,
                                 cap = StrokeCap.Round
                             )
                         }
                    } else {
                        // Standard single color path
                        path.moveTo(projectedPoints[0].x, projectedPoints[0].y)
                        for (i in 1 until projectedPoints.size) {
                            path.lineTo(projectedPoints[i].x, projectedPoints[i].y)
                        }
                        drawPath(
                            path = path,
                            color = lineColor,
                            style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
                        )
                    }
                    
                    // Start/End Markers
                    val start = projectedPoints.first()
                    val end = projectedPoints.last()
                    
                    drawCircle(Color(0xFF22C55E), radius = 6.dp.toPx(), center = start)
                    drawCircle(Color.White, radius = 3.dp.toPx(), center = start) // Inner dot
                    
                    drawCircle(Color(0xFFEF4444), radius = 6.dp.toPx(), center = end) 
                    drawCircle(Color.White, radius = 3.dp.toPx(), center = end)

                    // 7. Draw Live Point
                    if (currentProgress != null) {
                        val targetIndex = (currentProgress * (coordinates.size - 1)).toInt().coerceIn(0, coordinates.size - 1)
                        val point = projectedPoints[targetIndex]
                        
                        drawCircle(Color.White, radius = 10.dp.toPx(), center = point)
                        drawCircle(lineColor, radius = 8.dp.toPx(), center = point)
                    }
                }
            }
        
        // Debug/Zoom controls (optional visual feedback)
        /*
        Text(
            text = "Zoom: $zoomLevel (x${"%.1f".format(scale)})",
            color = Color.Black,
            modifier = Modifier.align(Alignment.TopStart).padding(8.dp).background(Color.White.copy(0.7f))
        )
        */
    }
}
