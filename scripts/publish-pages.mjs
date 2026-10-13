import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Publish only Vite's compiled files. An isolated index preserves the working
// checkout, its branch and any staged source changes. No worktree or force push.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const git = (args, options = {}) => execFileSync('git', args, { cwd: root, encoding: 'utf8', ...options }).trim();
const html = existsSync(join(dist, 'index.html')) ? readFileSync(join(dist, 'index.html'), 'utf8') : '';
if (!html.includes('/GAMEZOMBIS/assets/') || !html.includes('/GAMEZOMBIS/favicon.svg')) {
  throw new Error('Primero ejecuta npm run build:pages para generar las rutas de GitHub Pages.');
}
const origin = git(['remote', 'get-url', 'origin']);
if (!/^(?:https:\/\/github\.com\/|git@github\.com:)BAZTP\/GAMEZOMBIS(?:\.git)?\/?$/i.test(origin)) {
  throw new Error('El destino origin debe ser BAZTP/GAMEZOMBIS en github.com.');
}
const source = git(['rev-parse', '--verify', 'HEAD^{commit}']);
const remote = git(['ls-remote', 'origin', 'refs/heads/gh-pages']);
let parent;
if (remote) {
  parent = remote.split(/\s/)[0];
  git(['fetch', '--no-tags', 'origin', 'refs/heads/gh-pages']);
}
const temporary = mkdtempSync(join(tmpdir(), 'zombis-pages-'));
const env = { ...process.env, GIT_INDEX_FILE: join(temporary, 'index') };
try {
  git(['read-tree', '--empty'], { env });
  const files = [];
  const walk = dir => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isSymbolicLink()) throw new Error('No se permiten enlaces simbólicos en dist.');
      if (entry.isDirectory()) walk(path);
      else if (entry.isFile()) files.push(path);
    }
  };
  walk(dist);
  for (const path of files) {
    const hash = git(['hash-object', '-w', '--', path]);
    git(['update-index', '--add', '--cacheinfo', `100644,${hash},${relative(dist, path).split('\\').join('/')}`], { env });
  }
  const empty = git(['hash-object', '-w', '--stdin'], { input: '' });
  git(['update-index', '--add', '--cacheinfo', `100644,${empty},.nojekyll`], { env });
  const tree = git(['write-tree'], { env });
  const args = ['commit-tree', tree];
  if (parent) args.push('-p', parent);
  args.push('-m', `Publish Zombis 3D from ${source.slice(0, 12)}`);
  const commit = git(args);
  git(['push', 'origin', `${commit}:refs/heads/gh-pages`], { stdio: ['ignore', 'pipe', 'inherit'] });
  const published = git(['ls-remote', '--exit-code', 'origin', 'refs/heads/gh-pages']).split(/\s/)[0];
  if (published !== commit) throw new Error('No se pudo confirmar el commit publicado.');
  console.log(`Archivos de la web subidos a gh-pages: ${commit}`);
  console.log('GitHub → Settings → Pages → Deploy from a branch → gh-pages → / (root).');
  console.log('Dirección prevista, pendiente de que GitHub complete Pages: https://baztp.github.io/GAMEZOMBIS/');
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
