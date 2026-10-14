// Compartilhado pelas ferramentas: raiz do repositório e navegador sem interface.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Edge ou Chrome instalado. BROWSER_PATH tem prioridade.
export function findBrowser() {
  const candidates = [
    process.env.BROWSER_PATH,
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ].filter(Boolean);
  const browser = candidates.find((p) => fs.existsSync(p));
  if (!browser) {
    console.error('Não achei Edge nem Chrome. Defina BROWSER_PATH com o caminho do navegador.');
    process.exit(1);
  }
  return browser;
}
