const fs = require('fs');
const path = require('path');

// Liste des fichiers à corriger
const filesToFix = [
  '../app/layout.tsx',
  '../app/vdot-calculator/page.tsx',
  '../app/guides/hr-zones/page.tsx',
  '../app/app/race-planning/RacePlanningContent.tsx',
  '../app/app/explore/page.tsx',
  '../app/app/activities/new/page.tsx',
];

// Tableau de remplacements : [regex, remplacement]
const replacements = [
  // Couleurs principales
  [/#3b82f6/g, 'var(--primary)'],
  [/#3B82F6/g, 'var(--primary)'],
  [/#F8FAFC/g, 'var(--bg)'],
  [/#0F172A/g, 'var(--background)'],
  [/#FFFFFF/g, 'var(--surface)'],
  [/#ffffff/g, 'var(--surface)'],
  [/#22c55e/g, 'var(--success)'],
  [/#22C55E/g, 'var(--success)'],
  [/#f59e0b/g, 'var(--peak)'],
  [/#F59E0B/g, 'var(--peak)'],
  [/#ef4444/g, 'var(--danger)'],
  [/#EF4444/g, 'var(--danger)'],
  [/#8b5cf6/g, 'var(--secondary)'],
  [/#8B5CF6/g, 'var(--secondary)'],
  [/#a855f7/g, 'var(--secondary)'],
  [/#A855F7/g, 'var(--secondary)'],
  [/#ec4899/g, 'var(--danger)'],
  [/#EC4899/g, 'var(--danger)'],
  [/#14b8a6/g, 'var(--recovery)'],
  [/#f97316/g, 'var(--peak)'],
  [/#64748b/g, 'var(--muted)'],
  [/#64748B/g, 'var(--muted)'],
  [/#94a3b8/g, 'var(--muted)'],
  [/#94A3B8/g, 'var(--muted)'],
  [/#818cf8/g, 'var(--primary)'],
  [/#818CF8/g, 'var(--primary)'],
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
  const cleanedContent = content
    .replace(/className=""/g, '')
    .replace(/className="([^"]*)"/g, (match, p1) => {
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
console.log('Début de la correction des fichiers app...\n');

let filesModified = 0;
for (const file of filesToFix) {
  if (fixFile(file)) {
    filesModified++;
  }
}

console.log(`\n✅ Correction terminée!`);
console.log(`Fichiers modifiés: ${filesModified}/${filesToFix.length}`);
