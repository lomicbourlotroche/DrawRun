package com.drawrun.app.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.zIndex
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector

data class MetricData(
    val id: String,
    val title: String,
    val value: String,
    val unit: String,
    val category: String,
    val color: Color,
    val icon: ImageVector,
    val percentage: Float = 0f,
    val trend: List<Float> = emptyList()
)

fun lerp(start: Float, stop: Float, fraction: Float): Float {
    return (1 - fraction) * start + fraction * stop
}

@Composable
fun <T> AppCarousel(
    items: List<T>,
    modifier: Modifier = Modifier,
    itemWidth: androidx.compose.ui.unit.Dp = 260.dp,
    itemHeight: androidx.compose.ui.unit.Dp = 400.dp,
    spacing: androidx.compose.ui.unit.Dp = (-40).dp,
    itemContent: @Composable (item: T, index: Int) -> Unit
) {
    if (items.isEmpty()) return
    
    val listState = rememberLazyListState(initialFirstVisibleItemIndex = Int.MAX_VALUE / 2)
    val screenWidth = LocalConfiguration.current.screenWidthDp.dp
    val contentPadding = (screenWidth - itemWidth) / 2

    Box(
        modifier = modifier.fillMaxWidth(),
        contentAlignment = Alignment.Center
    ) {
        LazyRow(
            state = listState,
            contentPadding = PaddingValues(horizontal = contentPadding),
            horizontalArrangement = Arrangement.spacedBy(spacing),
            modifier = Modifier.fillMaxWidth()
        ) {
            items(
                count = Int.MAX_VALUE,
                key = { it }
            ) { globalIndex ->
                val index = globalIndex % items.size
                val item = items[index]
                
                // Dynamic Animation Logic
                val layoutInfo = listState.layoutInfo
                val visibleItem = layoutInfo.visibleItemsInfo.find { it.index == globalIndex }
                
                var scale by remember { mutableFloatStateOf(0.7f) }
                var rotation by remember { mutableFloatStateOf(0f) }
                var alpha by remember { mutableFloatStateOf(0.5f) }
                var zIndex by remember { mutableFloatStateOf(0f) }

                if (visibleItem != null) {
                    val centerX = layoutInfo.viewportStartOffset + layoutInfo.viewportSize.width / 2
                    val itemCenterX = visibleItem.offset + visibleItem.size / 2
                    val distanceFromCenter = itemCenterX - centerX
                    val normalizedDistance = distanceFromCenter.toFloat() / (visibleItem.size + spacing.value)
                    
                    val absDistance = kotlin.math.abs(normalizedDistance)
                    
                    scale = lerp(1.1f, 0.7f, absDistance.coerceIn(0f, 1f))
                    alpha = lerp(1f, 0.4f, absDistance.coerceIn(0f, 1f))
                    rotation = -normalizedDistance * 20f
                    zIndex = 10f - absDistance * 10f
                }

                Box(
                    modifier = Modifier
                        .zIndex(zIndex)
                        .graphicsLayer {
                            scaleX = scale
                            scaleY = scale
                            rotationY = rotation
                            rotationZ = -rotation * 0.5f 
                            this.alpha = alpha
                            this.cameraDistance = 12f * density
                            
                            // Reduced shadow to blend in with background
                            shadowElevation = if (scale > 0.95f) 12.dp.toPx() else 0f
                            shape = RoundedCornerShape(40.dp)
                            clip = true
                        }
                        .size(width = itemWidth, height = itemHeight)
                ) {
                    itemContent(item, index)
                }
            }
        }
    }
}
