const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../components/features/activities/MobileActivityRecorder.tsx');

// Lire le fichier
let content = fs.readFileSync(filePath, 'utf8');

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
  
  // Autres couleurs de fond
  [/bg-black\/70/g, 'bg-foreground/70'],
  [/bg-black\/60/g, 'bg-foreground/60'],
  [/bg-black\/50/g, 'bg-foreground/50'],
  [/bg-black\/40/g, 'bg-foreground/40'],
  [/bg-black\/30/g, 'bg-foreground/30'],
  [/bg-black\/20/g, 'bg-foreground/20'],
  [/bg-black\/10/g, 'bg-foreground/10'],
  [/bg-black/g, 'bg-background'],
  [/bg-white\/90/g, 'bg-surface/90'],
  [/bg-white\/80/g, 'bg-surface/80'],
  [/bg-white\/70/g, 'bg-surface/70'],
  [/bg-white\/60/g, 'bg-surface/60'],
  [/bg-white\/50/g, 'bg-surface/50'],
  [/bg-white\/40/g, 'bg-surface/40'],
  [/bg-white\/30/g, 'bg-surface/30'],
  [/bg-white\/20/g, 'bg-surface/20'],
  [/bg-white\/10/g, 'bg-surface/10'],
  [/bg-white/g, 'bg-surface'],
  
  // Couleurs de texte
  [/text-white\/90/g, 'text-foreground/90'],
  [/text-white\/80/g, 'text-foreground/80'],
  [/text-white\/70/g, 'text-foreground/70'],
  [/text-white\/60/g, 'text-foreground/60'],
  [/text-white\/50/g, 'text-muted'],
  [/text-white\/40/g, 'text-muted'],
  [/text-white/g, 'text-foreground'],
  [/text-black/g, 'text-foreground'],
  
  // Couleurs de bordure
  [/border-white\/30/g, 'border-surface'],
  [/border-white\/20/g, 'border-surface'],
  [/border-white\/10/g, 'border-surface'],
  [/border-white/g, 'border-surface'],
  [/border-black\/30/g, 'border-surface'],
  [/border-black\/20/g, 'border-surface'],
  [/border-black\/10/g, 'border-surface'],
  [/border-black/g, 'border-surface'],
  
  // Couleurs d'accentuation
  [/text-orange-500/g, 'text-peak'],
  [/text-orange-400/g, 'text-peak'],
  [/text-orange-300/g, 'text-peak'],
  [/bg-orange-500/g, 'bg-peak'],
  [/bg-orange-400/g, 'bg-peak'],
  [/bg-orange-300/g, 'bg-peak'],
  [/border-orange-500/g, 'border-peak'],
  [/border-orange-400/g, 'border-peak'],
  
  // Couleurs de succès
  [/text-green-500/g, 'text-success'],
  [/text-green-400/g, 'text-success'],
  [/bg-green-500/g, 'bg-success'],
  [/bg-green-400/g, 'bg-success'],
  [/border-green-500/g, 'border-success'],
  
  // Couleurs de danger
  [/text-red-500/g, 'text-danger'],
  [/text-red-400/g, 'text-danger'],
  [/bg-red-500/g, 'bg-danger'],
  [/bg-red-400/g, 'bg-danger'],
  [/border-red-500/g, 'border-danger'],
  
  // Couleurs bleues
  [/text-blue-500/g, 'text-primary'],
  [/text-blue-400/g, 'text-primary'],
  [/bg-blue-500/g, 'bg-primary'],
  [/bg-blue-400/g, 'bg-primary'],
  [/border-blue-500/g, 'border-primary'],
  
  // Couleurs violettes
  [/text-purple-500/g, 'text-secondary'],
  [/text-purple-400/g, 'text-secondary'],
  [/bg-purple-500/g, 'bg-secondary'],
  [/bg-purple-400/g, 'bg-secondary'],
  
  // Couleurs de recovery
  [/text-cyan-500/g, 'text-recovery'],
  [/bg-cyan-500/g, 'bg-recovery'],
  [/border-cyan-500/g, 'border-recovery'],
  
  // Remove empty className attributes that might result
  [/className=""/g, ''],
  
  // Clean up multiple spaces in className
  [/className="([^"]*)"/g, (match, p1) => {
    const cleaned = p1.replace(/\s+/g, ' ').trim();
    return cleaned ? `className="${cleaned}"` : '';
  }],
  
  // Couleurs neutres
  [/bg-neutral-950/g, 'bg-background'],
  [/bg-neutral-900/g, 'bg-surface'],
  [/bg-neutral-800/g, 'bg-surface'],
  [/bg-neutral-700/g, 'bg-muted'],
  [/bg-neutral-600/g, 'bg-muted'],
  [/bg-neutral-500/g, 'bg-border'],
  [/bg-neutral-400/g, 'bg-border'],
  [/bg-neutral-300/g, 'bg-surface'],
  [/bg-neutral-200/g, 'bg-surface'],
  [/bg-neutral-100/g, 'bg-background'],
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
  
  // Hex colors
  [/#000000/g, 'var(--background)'],
  [/#000/g, 'var(--background)'],
  [/#ffffff/g, 'var(--foreground)'],
  [/#fff/g, 'var(--foreground)'],
  [/#FC4C02/g, 'var(--peak)'],
  [/#0066FF/g, 'var(--primary)'],
  [/#5856D6/g, 'var(--secondary)'],
  [/#00C853/g, 'var(--success)'],
  [/#FF5252/g, 'var(--danger)'],
  [/#00BCD4/g, 'var(--recovery)'],
];

// Appliquer tous les remplacements
const originalContent = content;
for (const [regex, replacement] of replacements) {
  const newContent = content.replace(regex, replacement);
  if (newContent !== content) {
    console.log(`Remplacement appliqué: ${regex} -> ${replacement}`);
    content = newContent;
  }
}

// Nettoyer les className vides
content = content.replace(/className=""/g, '');

// Nettoyer les espaces multiples dans les className
content = content.replace(/className="([^"]*)"/g, (match, p1) => {
  const cleaned = p1.replace(/\s+/g, ' ').trim();
  return cleaned ? `className="${cleaned}"` : '';
});

// Écrire le fichier corrigé
fs.writeFileSync(filePath, content, 'utf8');

console.log('Fichier corrigé avec succès!');
console.log(`Lignes originales: ${originalContent.split('\n').length}`);
console.log(`Lignes après correction: ${content.split('\n').length}`);
