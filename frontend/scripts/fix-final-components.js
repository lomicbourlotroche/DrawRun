const fs = require('fs');
const path = require('path');

// Liste des fichiers à corriger
const filesToFix = [
  '../components/features/explore/MapLayerSwitcher.tsx',
  '../components/features/explore/Map.tsx',
  '../components/features/coach/TaperingChart.tsx',
  '../components/features/coach/TrainingPlanCard.tsx',
  '../components/features/coach/TestScheduler.tsx',
  '../components/features/performance/PerformanceZones.tsx',
  '../components/features/performance/PowerAnalysis.tsx',
  '../components/features/performance/ProgressionChart.tsx',
];

// Tableau de remplacements : [regex, remplacement]
const replacements = [
  // Couleurs de fond
  [/bg-white\/90/g, 'bg-surface/90'],
  [/background: '#f0f0f0'/g, 'background: var(--border)'],

  // Couleurs de texte
  [/text-white/g, 'text-foreground'],

  // Hex colors pour les charts et données
  // Primary
  [/#007AFF/g, 'var(--primary)'],
  [/#3b82f6/g, 'var(--primary)'],
  [/#3B82F6/g, 'var(--primary)'],

  // Secondary
  [/#5856D6/g, 'var(--secondary)'],
  [/#8b5cf6/g, 'var(--secondary)'],
  [/#8B5CF6/g, 'var(--secondary)'],
  [/#64748B/g, 'var(--muted)'],

  // Success
  [/#00C853/g, 'var(--success)'],
  [/#22c55e/g, 'var(--success)'],
  [/#22C55E/g, 'var(--success)'],
  [/#34C759/g, 'var(--success)'],
  [/#10b981/g, 'var(--success)'],

  // Danger/Error
  [/#FF5252/g, 'var(--danger)'],
  [/#ef4444/g, 'var(--danger)'],
  [/#EF4444/g, 'var(--danger)'],
  [/#f43f5e/g, 'var(--danger)'],
  [/#FF3B30/g, 'var(--danger)'],

  // Peak/Orange
  [/#FC4C02/g, 'var(--peak)'],
  [/#FF9500/g, 'var(--peak)'],
  [/#f59e0b/g, 'var(--peak)'],
  [/#F59E0B/g, 'var(--peak)'],
  [/#eab308/g, 'var(--peak)'],
  [/#f97316/g, 'var(--peak)'],
  [/#F97316/g, 'var(--peak)'],
  [/#f46d43/g, 'var(--peak-500)'],

  // Recovery/Cyan
  [/#00BCD4/g, 'var(--recovery)'],
  [/#8b5cf6/g, 'var(--secondary)'],

  // Pink
  [/#ec4899/g, 'var(--danger)'],
  [/#EC4899/g, 'var(--danger)'],
  [/#a855f7/g, 'var(--secondary)'],

  // Border colors
  [/#e2e8f0/g, 'var(--border)'],
  [/#e5e7eb/g, 'var(--border)'],
  [/#94a3b8/g, 'var(--muted)'],

  // Neutrals
  [/#64748B/g, 'var(--muted)'],
];

// Fonction pour appliquer les remplacements à un fichier
function fixFile(filePath) {
  const fullPath = path.join(__dirname, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Fichier introuvable: ${fullPath}`);
    return false;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  for (const [regex, replacement] of replacements) {
    const newContent = content.replace(regex, replacement);
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
  }

  // Nettoyer les className vides
  const cleanedContent = content.replace(/className=""/g, '').replace(/className="([^"]*)"/g, (match, p1) => {
    const cleaned = p1.replace(/\s+/g, ' ').trim();
    return cleaned ? `className="${cleaned}"` : '';
  });

  if (cleanedContent !== content) {
    content = cleanedContent;
    modified = true;
  }

  // Écrire le fichier seulement s'il a été modifié
  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Fichier corrigé: ${filePath}`);
    return true;
  }

  console.log(`✅ Fichier déjà propre: ${filePath}`);
  return false;
}

// Corriger tous les fichiers
console.log('Début de la correction des derniers fichiers...\n');

let filesModified = 0;
for (const file of filesToFix) {
  if (fixFile(file)) {
    filesModified++;
  }
}

console.log(`\n✅ Correction terminée!`);
console.log(`Fichiers modifiés: ${filesModified}/${filesToFix.length}`);
