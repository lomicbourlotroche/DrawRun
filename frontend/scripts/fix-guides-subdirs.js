const fs = require('fs');
const path = require('path');

// Liste de tous les fichiers de guides dans les sous-dossiers
const filesToFix = [
  '../app/guides/coaching-adaptatif/page.tsx',
  '../app/guides/hr-zones/page.tsx',
  '../app/guides/pmc/page.tsx',
  '../app/guides/race-planning/page.tsx',
  '../app/guides/science-engine/page.tsx',
  '../app/guides/social/page.tsx',
  '../app/guides/weather/page.tsx',
];

// Tableau de remplacements : [regex, remplacement]
const replacements = [
  // Couleurs neutres de fond
  [/bg-neutral-950/g, 'bg-background'],
  [/bg-neutral-900/g, 'bg-background'],
  [/bg-neutral-800/g, 'bg-surface'],
  [/bg-neutral-700/g, 'bg-muted'],
  [/bg-neutral-600/g, 'bg-muted'],
  [/bg-neutral-500/g, 'bg-border'],
  [/bg-neutral-400/g, 'bg-border'],
  [/bg-neutral-300/g, 'bg-surface'],
  [/bg-neutral-200/g, 'bg-border'],
  [/bg-neutral-100/g, 'bg-surface'],
  [/bg-neutral-50/g, 'bg-background'],
  
  // Couleurs neutres de texte
  [/text-neutral-950/g, 'text-foreground'],
  [/text-neutral-900/g, 'text-foreground'],
  [/text-neutral-800/g, 'text-foreground'],
  [/text-neutral-700/g, 'text-muted'],
  [/text-neutral-600/g, 'text-muted'],
  [/text-neutral-500/g, 'text-muted'],
  [/text-neutral-400/g, 'text-muted'],
  [/text-neutral-300/g, 'text-foreground'],
  [/text-neutral-200/g, 'text-foreground'],
  [/text-neutral-100/g, 'text-muted'],
  [/text-neutral-50/g, 'text-background'],
  
  // Bordures neutres
  [/border-neutral-950/g, 'border-surface'],
  [/border-neutral-900/g, 'border-surface'],
  [/border-neutral-800/g, 'border-surface'],
  [/border-neutral-700/g, 'border'],
  [/border-neutral-600/g, 'border'],
  [/border-neutral-500/g, 'border'],
  [/border-neutral-400/g, 'border'],
  [/border-neutral-300/g, 'border-surface'],
  [/border-neutral-200/g, 'border-surface'],
  [/border-neutral-100/g, 'border-surface'],
  
  // Autres couleurs
  [/bg-white\/80/g, 'bg-surface/80'],
  [/bg-white/g, 'bg-surface'],
  [/text-purple-600/g, 'text-secondary'],
  [/hover:bg-neutral-100/g, 'hover:bg-surface-hover'],
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
console.log(`Début de la correction des guides...\n`);

let filesModified = 0;
for (const file of filesToFix) {
  if (fixFile(file)) {
    filesModified++;
  }
}

console.log(`\n✅ Correction terminée!`);
console.log(`Fichiers modifiés: ${filesModified}/${filesToFix.length}`);
