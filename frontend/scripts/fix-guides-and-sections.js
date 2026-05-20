const fs = require('fs');
const path = require('path');

// Liste des fichiers à corriger
const filesToFix = [
  '../app/guides/weather/page.tsx',
  '../app/_sections/WebAppSection.tsx',
];

// Tableau de remplacements : [regex, remplacement]
const replacements = [
  // Couleurs slate de fond
  [/bg-slate-950/g, 'bg-background'],
  [/bg-slate-900/g, 'bg-surface'],
  [/bg-slate-800/g, 'bg-surface'],
  [/bg-slate-700/g, 'bg-surface-hover'],
  [/bg-slate-600/g, 'bg-muted'],
  [/bg-slate-500/g, 'bg-muted'],
  [/bg-slate-400/g, 'bg-border'],
  [/bg-slate-300/g, 'bg-border'],
  [/bg-slate-200/g, 'bg-border'],
  [/bg-slate-100/g, 'bg-surface'],
  [/bg-slate-50/g, 'bg-background'],
  
  // Couleurs slate de texte
  [/text-slate-950/g, 'text-foreground'],
  [/text-slate-900/g, 'text-foreground'],
  [/text-slate-800/g, 'text-foreground'],
  [/text-slate-700/g, 'text-muted'],
  [/text-slate-600/g, 'text-muted'],
  [/text-slate-500/g, 'text-muted'],
  [/text-slate-400/g, 'text-muted'],
  [/text-slate-300/g, 'text-foreground'],
  [/text-slate-200/g, 'text-foreground'],
  [/text-slate-100/g, 'text-muted'],
  [/text-slate-50/g, 'text-background'],
  
  // Bordures slate
  [/border-slate-950/g, 'border-surface'],
  [/border-slate-900/g, 'border-surface'],
  [/border-slate-800/g, 'border-surface'],
  [/border-slate-700/g, 'border-surface'],
  [/border-slate-600/g, 'border'],
  [/border-slate-500/g, 'border'],
  [/border-slate-400/g, 'border'],
  [/border-slate-300/g, 'border'],
  [/border-slate-200/g, 'border'],
  [/border-slate-100/g, 'border-surface'],
  
  // Couleurs neutres
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
  
  // Couleurs de texte
  [/text-white\/80/g, 'text-foreground/80'],
  [/text-white/g, 'text-foreground'],
  [/bg-white/g, 'bg-surface'],
  
  // Couleurs bleues
  [/from-sky-500/g, 'from-primary'],
  [/to-blue-500/g, 'to-primary'],
  [/text-sky-600/g, 'text-primary'],
  [/bg-sky-500/g, 'bg-primary'],
  
  // Opacity
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
console.log('Début de la correction des guides et sections...\n');

let filesModified = 0;
for (const file of filesToFix) {
  if (fixFile(file)) {
    filesModified++;
  }
}

console.log(`\n✅ Correction terminée!`);
console.log(`Fichiers modifiés: ${filesModified}/${filesToFix.length}`);
