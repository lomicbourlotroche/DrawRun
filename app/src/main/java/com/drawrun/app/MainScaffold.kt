package com.drawrun.app

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.composed
import androidx.compose.foundation.clickable
import androidx.compose.runtime.remember
import com.drawrun.app.ui.screens.*
import com.drawrun.app.ui.components.ExplanationDialog

import com.drawrun.app.logic.DataSyncManager

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScaffold(state: AppState, syncManager: DataSyncManager) {
    Scaffold(
        topBar = {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp, vertical = 32.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Bottom
            ) {
                Column {
                    Text(
                        text = state.activeTab.uppercase(),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f),
                        letterSpacing = 4.sp
                    )
                    Text(
                        text = when(state.activeTab) {
                            "home" -> "TABLEAU"
                            "activities" -> "JOURNAL"
                            "performance" -> "CAPACITÉ"
                            "planning" -> "PLANNING"
                            else -> "PROFIL"
                        },
                        style = MaterialTheme.typography.displayMedium,
                        color = MaterialTheme.colorScheme.onBackground
                    )
                }
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Column(horizontalAlignment = Alignment.End) {
                        Text(
                            text = "DRAW",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onBackground,
                            fontWeight = FontWeight.Black,
                            letterSpacing = 2.sp,
                            fontSize = 14.sp
                        )
                        Text(
                            text = "RUN",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.primary,
                            fontWeight = FontWeight.Black,
                            letterSpacing = 2.sp,
                            fontSize = 14.sp
                        )
                    }
                    
                    // Themed Premium Logo Icon
                    Surface(
                        modifier = Modifier.size(42.dp),
                        shape = androidx.compose.foundation.shape.RoundedCornerShape(14.dp),
                        color = MaterialTheme.colorScheme.surface,
                        shadowElevation = 4.dp,
                        border = androidx.compose.foundation.BorderStroke(
                            width = 1.dp,
                            brush = androidx.compose.ui.graphics.Brush.linearGradient(
                                listOf(
                                    MaterialTheme.colorScheme.primary.copy(alpha = 0.5f),
                                    Color.Transparent
                                )
                            )
                        )
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .background(
                                    brush = androidx.compose.ui.graphics.Brush.radialGradient(
                                        colors = listOf(
                                            MaterialTheme.colorScheme.primary.copy(alpha = 0.15f),
                                            Color.Transparent
                                        ),
                                        radius = 100f
                                    )
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = when(state.appTheme) {
                                    com.drawrun.app.ui.theme.AppTheme.ONYX -> Icons.Default.Bolt
                                    com.drawrun.app.ui.theme.AppTheme.EMERALD -> Icons.Default.Eco
                                    com.drawrun.app.ui.theme.AppTheme.RUBY -> Icons.Default.Whatshot
                                    com.drawrun.app.ui.theme.AppTheme.LIGHT -> Icons.Default.AutoAwesome
                                },
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.size(24.dp)
                            )
                        }
                    }
                }
            }
        },
        bottomBar = {
            BottomNavBar(state)
        },
        containerColor = MaterialTheme.colorScheme.background
    ) { padding ->
        Box(modifier = Modifier.padding(padding)) {
            Crossfade(targetState = state.activeTab, label = "TabTransition") { tab ->
                when (tab) {
                    "home" -> HomeScreen(state)
                    "activities" -> ActivityJournalScreen(state)
                    "performance" -> PerformanceScreen(state)
                    "planning" -> PlanningScreen(state)
                    "profile" -> ProfileScreen(state, syncManager)
                }
            }
        }
    }

    // Activity Detail Synchronization
    androidx.compose.runtime.LaunchedEffect(state.selectedActivity) {
        state.selectedActivity?.let { act ->
            syncManager.syncActivityDetail(act.id, act.type)
        } ?: run {
            state.selectedActivityStreams = null
            state.selectedActivityAnalysis = null
        }
    }

    // Activity Detail Overlay
    AnimatedVisibility(
        visible = state.selectedActivity != null,
        enter = slideInHorizontally(initialOffsetX = { it }) + fadeIn(),
        exit = slideOutHorizontally(targetOffsetX = { it }) + fadeOut()
    ) {
        ActivityDetailScreen(state)
    }

    // Metric Explanation Overlay
    if (state.showExplanation) {
        ExplanationDialog(
            title = state.explanationTitle,
            content = state.explanationContent,
            onDismiss = { state.showExplanation = false }
        )
    }
}

@Composable
fun BottomNavBar(state: AppState) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .height(100.dp),
        color = MaterialTheme.colorScheme.surfaceVariant, // Using surfaceVariant as a proxy for bgNav
        border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.05f))
    ) {
        Row(
            modifier = Modifier.fillMaxSize().padding(bottom = 20.dp),
            horizontalArrangement = Arrangement.SpaceAround,
            verticalAlignment = Alignment.CenterVertically
        ) {
            val items = listOf(
                NavItem("home", Icons.Default.Home, "Dash"),
                NavItem("activities", Icons.Default.History, "Journal"),
                NavItem("performance", Icons.Default.TrendingUp, "Capacité"),
                NavItem("planning", Icons.Default.ListAlt, "Coach"),
                NavItem("profile", Icons.Default.Person, "Profil")
            )

            items.forEach { item ->
                val selected = state.activeTab == item.id
                Column(
                    modifier = Modifier
                        .noIndicationClickable { state.activeTab = item.id }
                        .padding(8.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(
                        imageVector = item.icon,
                        contentDescription = item.label,
                        tint = if (selected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f),
                        modifier = Modifier.size(24.dp)
                    )
                    Text(
                        text = item.label.uppercase(),
                        style = MaterialTheme.typography.labelSmall,
                        color = if (selected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f),
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Black
                    )
                }
            }
        }
    }
}

data class NavItem(val id: String, val icon: ImageVector, val label: String)

// Simple clickable modifier for non-Material components
fun Modifier.noIndicationClickable(onClick: () -> Unit): Modifier = this.composed {
    this.clickable(
        interactionSource = remember { androidx.compose.foundation.interaction.MutableInteractionSource() },
        indication = null,
        onClick = onClick
    )
}
