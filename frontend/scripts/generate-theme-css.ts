import { generateAllThemeCSS } from '../themes';

const css = generateAllThemeCSS();
process.stdout.write(css);
