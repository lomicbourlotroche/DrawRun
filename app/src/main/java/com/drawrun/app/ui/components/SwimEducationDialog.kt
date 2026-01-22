package com.drawrun.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.School
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog

data class SwimDrill(
    val name: String,
    val emoji: String,
    val description: String,
    val benefits: List<String>
)

@Composable
fun SwimEducationDialog(onDismiss: () -> Unit) {
    val drills = listOf(
        SwimDrill(
            name = "Rattrapé",
            emoji = "🏊",
            description = "Attendre que le bras avant touche la cuisse avant d'engager le prochain mouvement",
            benefits = listOf(
                "Améliore l'amplitude de nage",
                "Développe la glisse et l'équilibre",
                "Travaille la patience dans le mouvement",
                "Corrige le croisement des bras"
            )
        ),
        SwimDrill(
            name = "Point Mort",
            emoji = "⏸️",
            description = "Marquer un temps d'arrêt bras devant (6 coups de jambes) avant de tirer",
            benefits = listOf(
                "Renforce la position hydrodynamique",
                "Améliore la propulsion des jambes",
                "Développe l'équilibre latéral",
                "Réduit la résistance frontale"
            )
        ),
        SwimDrill(
            name = "Respiration Alternée",
            emoji = "💨",
            description = "Respirer tous les 3, 5 ou 7 temps pour alterner les côtés",
            benefits = listOf(
                "Équilibre la nage bilatéralement",
                "Améliore la symétrie du mouvement",
                "Développe la capacité pulmonaire",
                "Permet une meilleure adaptation tactique"
            )
        ),
        SwimDrill(
            name = "Poings Fermés",
            emoji = "✊",
            description = "Nager avec les poings fermés pour réduire la surface de traction",
            benefits = listOf(
                "Développe la proprioception",
                "Force l'utilisation des avant-bras",
                "Améliore le roulis et l'équilibre",
                "Augmente la conscience du mouvement"
            )
        ),
        SwimDrill(
            name = "Catch-Up",
            emoji = "👏",
            description = "Les mains se rejoignent devant à chaque mouvement",
            benefits = listOf(
                "Exagère l'extension",
                "Améliore le timing de nage",
                "Développe la coordination",
                "Corrige les défauts d'amplitude"
            )
        ),
        SwimDrill(
            name = "Un Bras",
            emoji = "☝️",
            description = "Nager avec un seul bras (l'autre le long du corps ou devant)",
            benefits = listOf(
                "Isole et corrige les défauts",
                "Renforce le roulis du corps",
                "Améliore la traction",
                "Développe la force spécifique"
            )
        ),
        SwimDrill(
            name = "Ondulations",
            emoji = "🌊",
            description = "Mouvements ondulatoires du corps en papillon subaquatique",
            benefits = listOf(
                "Renforce la sangle abdominale",
                "Améliore la souplesse du corps",
                "Développe la propulsion des jambes",
                "Optimise le positionnement hydrodynamique"
            )
        ),
        SwimDrill(
            name = "Sculling (Godille)",
            emoji = "🔄",
            description = "Petits mouvements de main en huit pour se déplacer",
            benefits = listOf(
                "Développe le toucher de l'eau",
                "Améliore la sensibilité de l'appui",
                "Renforce les avant-bras",
                "Améliore le contrôle de l'équilibre"
            )
        )
    )

    Dialog(onDismissRequest = onDismiss) {
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.9f),
            shape = RoundedCornerShape(24.dp),
            color = MaterialTheme.colorScheme.surface
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(24.dp)
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "📚 ÉDUCATIFS NATATION",
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Black
                    )
                    IconButton(onClick = onDismiss) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Fermer",
                            tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                        )
                    }
                }
                
                Spacer(modifier = Modifier.height(8.dp))
                
                Text(
                    text = "Les exercices techniques essentiels pour perfectionner votre nage",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Drills List
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    drills.forEach { drill ->
                        DrillCard(drill)
                    }
                }
            }
        }
    }
}

@Composable
private fun DrillCard(drill: SwimDrill) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = Color(0xFF0EA5E9).copy(alpha = 0.05f)
        ),
        border = androidx.compose.foundation.BorderStroke(
            1.dp,
            Color(0xFF0EA5E9).copy(alpha = 0.1f)
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Title
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = drill.emoji,
                    style = MaterialTheme.typography.headlineSmall
                )
                Text(
                    text = drill.name,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Black,
                    color = Color(0xFF0EA5E9)
                )
            }
            
            // Description
            Text(
                text = drill.description,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f)
            )
            
            // Benefits
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        MaterialTheme.colorScheme.surface,
                        RoundedCornerShape(12.dp)
                    )
                    .padding(12.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = "💪 BIENFAITS:",
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Black,
                    color = Color(0xFF22C55E),
                    fontSize = 10.sp,
                    letterSpacing = 1.sp
                )
                drill.benefits.forEach { benefit ->
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.Top
                    ) {
                        Text(
                            text = "✓",
                            color = Color(0xFF22C55E),
                            fontWeight = FontWeight.Black
                        )
                        Text(
                            text = benefit,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                        )
                    }
                }
            }
        }
    }
}
