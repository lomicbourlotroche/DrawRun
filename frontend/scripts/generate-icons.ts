import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve } from 'path';

const LUCIDE_DIR = resolve(__dirname, '../node_modules/lucide-react/dist/esm/icons');
const OUTPUT_DIR = resolve(__dirname, '../components/ui/icons');

interface IconNode {
  tag: string;
  attrs: Record<string, string>;
}

function resolveTargetFile(filePath: string): string {
  const content = readFileSync(filePath, 'utf-8');
  const aliasMatch = content.match(/export \{ default \} from '\.\/(.+)\.js';/);
  if (!aliasMatch) return filePath;
  const targetName = aliasMatch[1];
  const targetPath = resolve(LUCIDE_DIR, `${targetName}.js`);
  if (!existsSync(targetPath)) return filePath;
  const targetContent = readFileSync(targetPath, 'utf-8');
  if (targetContent.includes('export { default } from')) {
    return resolveTargetFile(targetPath);
  }
  return targetPath;
}

function toPascalCase(kebab: string): string {
  return kebab
    .replace(/\.js$/, '')
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
}

function extractIconData(filePath: string, wantedName?: string): { name: string; elements: IconNode[] } | null {
  const resolvedPath = resolveTargetFile(filePath);
  const content = readFileSync(resolvedPath, 'utf-8');

  // Try multi-line first: const Name = createLucideIcon("Name", [\n...\n]);
  let match = content.match(/const (\w+) = createLucideIcon\("(\w+)",\s*(\[[\s\S]*?\n\])\s*\);/);
  if (match) {
    const name = wantedName || match[2];
    const arrStr = match[3];
    const elements = parseElements(arrStr);
    return elements.length > 0 ? { name, elements } : null;
  }

  // Try single-line: [["tag", { ... }]]
  match = content.match(/const (\w+) = createLucideIcon\("(\w+)",\s*(\[\[[\s\S]*?\]\])\s*\);/);
  if (match) {
    const name = wantedName || match[2];
    const arrStr = match[3];
    const elements = parseElements(arrStr);
    return elements.length > 0 ? { name, elements } : null;
  }

  // Fallback: balanced bracket approach
  const fallbackMatch = content.match(/const (\w+) = createLucideIcon\("(\w+)",\s*(\[[\s\S]*)\n\);/);
  if (!fallbackMatch) return null;
  const name = wantedName || fallbackMatch[2];
  let arrStr = fallbackMatch[3];
  let depth = 0;
  let endIdx = -1;
  for (let i = 0; i < arrStr.length; i++) {
    if (arrStr[i] === '[') depth++;
    else if (arrStr[i] === ']') {
      depth--;
      if (depth === 0) {
        endIdx = i;
        break;
      }
    }
  }
  if (endIdx === -1) return null;
  arrStr = arrStr.substring(0, endIdx + 1);
  const elements = parseElements(arrStr);
  return elements.length > 0 ? { name, elements } : null;
}

function parseElements(arrStr: string): IconNode[] {
  const elements: IconNode[] = [];
  const elementRegex = /\[\s*"(\w+)"\s*,\s*\{([\s\S]*?)\}\s*\]/g;
  let match: RegExpExecArray | null;
  while ((match = elementRegex.exec(arrStr)) !== null) {
    const tag = match[1];
    const attrsStr = match[2];
    const attrs: Record<string, string> = {};
    const attrRegex = /(\w+)\s*:\s*"((?:[^"\\]|\\.)*)"/g;
    let am: RegExpExecArray | null;
    while ((am = attrRegex.exec(attrsStr)) !== null) {
      attrs[am[1]] = am[2];
    }
    elements.push({ tag, attrs });
  }
  return elements;
}

function toJSX(elements: IconNode[], indent: string): string {
  return elements
    .map((el) => {
      const attrs = Object.entries(el.attrs)
        .filter(([k]) => k !== 'key')
        .map(([k, v]) => `${k}="${v}"`)
        .join(' ');
      return `${indent}<${el.tag} ${attrs} />`;
    })
    .join('\n');
}

function generateComponent(name: string, elements: IconNode[]): string {
  const elementsJSX = toJSX(elements, '      ');
  return `import type { IconProps } from './types';

export function ${name}({ size = 24, className, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
${elementsJSX}
    </svg>
  );
}
`;
}

async function main() {
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const generated: string[] = [];
  const files = readFileSync(resolve(__dirname, '../scripts/icon-files.txt'), 'utf-8')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  for (const file of files) {
    const filePath = resolve(LUCIDE_DIR, file);
    if (!existsSync(filePath)) {
      console.warn(`\u26A0 File not found: ${file}`);
      continue;
    }
    const wantedName = toPascalCase(file);
    const data = extractIconData(filePath, wantedName);
    if (!data) {
      console.warn(`\u26A0 Could not parse: ${file}`);
      continue;
    }
    const componentContent = generateComponent(data.name, data.elements);
    const componentFile = resolve(OUTPUT_DIR, `${data.name}.tsx`);
    writeFileSync(componentFile, componentContent, 'utf-8');
    generated.push(data.name);
  }

  const indexLines = generated.sort().map((name) => `export { ${name} } from './${name}';`);
  const indexContent = `// Auto-generated icon components from lucide-react v0.372.0\n\nexport type { IconProps } from './types';\n\n${indexLines.join('\n')}\n`;
  writeFileSync(resolve(OUTPUT_DIR, 'index.ts'), indexContent, 'utf-8');

  const typesPath = resolve(OUTPUT_DIR, 'types.ts');
  const typesContent = `import type { SVGAttributes } from 'react';

export interface IconProps extends SVGAttributes<SVGSVGElement> {
  size?: number | string;
}
`;
  if (!existsSync(typesPath)) writeFileSync(typesPath, typesContent, 'utf-8');

  console.log(`Generated ${generated.length} icon components`);
}

main().catch(console.error);
