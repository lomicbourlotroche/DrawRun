package com.drawrun.app.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Info

data class MetricInfo(
    val title: String,
    val description: String,
    val formula: String,
    val purpose: String
)

@Composable
fun MetricInfoButton(
    metricInfo: MetricInfo,
    onInfoClick: (MetricInfo) -> Unit
) {
    IconButton(
        onClick = { onInfoClick(metricInfo) },
        modifier = Modifier.size(24.dp)
    ) {
        Icon(
            imageVector = Icons.Default.Info,
            contentDescription = "Info ${metricInfo.title}",
            tint = MaterialTheme.colorScheme.primary,
            modifier = Modifier.size(16.dp)
        )
    }
}

@Composable
fun MetricInfoDialog(
    info: MetricInfo,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("ℹ️", fontSize = 20.sp)
                Text(info.title, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleLarge)
            }
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                InfoSection("Description", info.description)
                InfoSection("Formule", info.formula, isCode = true)
                InfoSection("Utilité", info.purpose)
            }
        },
        confirmButton = {
            Button(onClick = onDismiss) {
                Text("C'est compris")
            }
        }
    )
}

@Composable
private fun InfoSection(title: String, content: String, isCode: Boolean = false) {
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text(
            text = title,
            style = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary
        )
        if (isCode) {
            Surface(
                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                shape = MaterialTheme.shapes.small,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = content,
                    style = MaterialTheme.typography.bodyMedium,
                    fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace,
                    modifier = Modifier.padding(8.dp)
                )
            }
        } else {
            Text(
                text = content,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurface
            )
        }
    }
}

object MetricDefinitions {
    val VO2max = MetricInfo(
        title = "VO2max (VDOT)",
        description = "Le volume maximal d'oxygène que votre corps peut utiliser. C'est le moteur principal de votre performance aérobie. DrawRun utilise le système VDOT de Jack Daniels.",
        formula = "VDOT = f(Distance, Temps)",
        purpose = "Détermine votre potentiel, calcule vos zones d'entraînement précises et prédit vos performances sur d'autres distances."
    )

    val VMA = MetricInfo(
        title = "VMA (vVO2max)",
        description = "La Vitesse Maximale Aérobie est la vitesse à laquelle vous atteignez votre VO2max. C'est votre 'cylindrée'.",
        formula = "VMA ≈ VDOT / 3.5 (simplifié)",
        purpose = "Sert de référence pour les entraînements de fractionné (Intervals) afin d'améliorer votre vitesse et votre puissance."
    )

    val HRZones = MetricInfo(
        title = "Zones de Fréquence Cardiaque",
        description = "Plages d'intensité basées sur votre cœur pour cibler des filières énergétiques spécifiques.",
        formula = "Karvonen: (FCmax - FCrepos) * % + FCrepos\nZ1: 60-72% | Z2: 72-82% | Z3: 82-87%...",
        purpose = "Z1: Endurance fondamentale\nZ2: Seuil aérobie\nZ3: Seuil anaérobie\nZ4: VMA/VO2max\nZ5: Sprint/Neuromusculaire"
    )

    val PaceZones = MetricInfo(
        title = "Zones d'Allure (VDOT)",
        description = "Allures cibles calculées précisément à partir de votre niveau VDOT actuel pour optimiser chaque type d'entraînement.",
        formula = "E-Pace: 59-74% VDOT\nM-Pace: 75-84% VDOT\nT-Pace: 83-88% VDOT\nI-Pace: 95-100% VDOT\nR-Pace: >100% VDOT",
        purpose = "Easy (E): Endurance, Récupération\nMarathon (M): Allure course longue\nThreshold (T): Seuil lactique, Endurance dure\nInterval (I): Développement VO2max\nRepetition (R): Économie de course, Vitesse"
    )
    
    val TSS = MetricInfo(
        title = "TSS (Training Stress Score)",
        description = "Mesure la charge physiologique réelle d'une séance en prenant en compte la durée ET l'intensité.",
        formula = "(Durée_sec * NP * IF) / (FTP * 3600) * 100",
        purpose = "Permet d'équilibrer la charge d'entraînement, d'éviter le surentraînement et de planifier la progression (Progressive Overload)."
    )
}
