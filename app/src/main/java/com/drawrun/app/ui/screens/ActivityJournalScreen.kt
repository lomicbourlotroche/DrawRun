package com.drawrun.app.ui.screens

import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.vector.ImageVector
import com.drawrun.app.ui.components.MiniChart
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.drawrun.app.AppState
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import kotlinx.coroutines.launch

@Composable
fun ActivityJournalScreen(state: AppState) {
    if (state.activities.isEmpty()) {
        Box(
            modifier = Modifier.fillMaxSize().padding(24.dp),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "AUCUNE ACTIVITÉ SYNCHRONISÉE",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f)
            )
        }
    } else {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(24.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            itemsIndexed(state.activities) { index, act ->
                AnimatedActivityRow(act, index) {
                    state.selectedActivity = act
                }
            }
        }
    }
}

@Composable
fun AnimatedActivityRow(act: com.drawrun.app.ActivityItem, index: Int, onClick: () -> Unit) {
    val alphaAnim = remember { androidx.compose.animation.core.Animatable(0f) }
    val yAnim = remember { androidx.compose.animation.core.Animatable(20f) }

    LaunchedEffect(act.id) {
        // Reduced delay and simpler animation for LazyColumn performance
        kotlinx.coroutines.delay((index % 10) * 30L) 
        launch {
            alphaAnim.animateTo(1f, androidx.compose.animation.core.tween(200))
        }
        launch {
            yAnim.animateTo(0f, androidx.compose.animation.core.tween(200))
        }
    }

    Box(
        modifier = Modifier
            .graphicsLayer {
                alpha = alphaAnim.value
                translationY = yAnim.value
            }
    ) {
        ActivityRow(act, onClick)
    }
}

@Composable
fun ActivityRow(act: com.drawrun.app.ActivityItem, onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(32.dp))
            .background(MaterialTheme.colorScheme.surface)
            .border(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f), RoundedCornerShape(32.dp))
            .clickable { onClick() }
            .padding(20.dp)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(act.color.copy(alpha = 0.05f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = act.icon,
                    contentDescription = null,
                    tint = act.color,
                    modifier = Modifier.size(24.dp)
                )
            }
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = act.date.uppercase(),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f),
                    letterSpacing = 1.sp
                )
                Text(
                    text = act.title.uppercase(),
                    style = MaterialTheme.typography.labelSmall,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Black,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = "${act.dist} • ${act.load}",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f),
                    fontWeight = FontWeight.Bold
                )
            }
            MiniChart(color = act.color)
        }
    }
}
