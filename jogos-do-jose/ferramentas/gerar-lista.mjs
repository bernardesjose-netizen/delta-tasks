// Gera ficheiros.js com a lista de tudo o que o service worker deve guardar para jogar offline.
// Uso (dentro da pasta jogos-do-jose): node ferramentas/gerar-lista.mjs
import { readdirSync, statSync, writeFileSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';

const raiz = new URL('..', import.meta.url).pathname;
const ignorar = new Set(['.git', '.netlify', 'ferramentas', 'node_modules', 'README.md', 'netlify.toml', '.gitignore', '_headers', 'sw.js', 'ficheiros.js']);
const lista = [];
function percorrer(dir) {
  for (const nome of readdirSync(dir).sort()) {
    if (ignorar.has(nome)) continue;
    const c = join(dir, nome);
    if (statSync(c).isDirectory()) percorrer(c);
    else lista.push(`./${relative(raiz, c).split('\\').join('/')}`);
  }
}
percorrer(raiz);
const hash = createHash('sha1');
for (const f of lista) hash.update(f).update(readFileSync(join(raiz, f)));
// Geração das fotografias: muda quando são todas refeitas (f2 = versão leve, 300 px). O service worker só
// reaproveita fotografias guardadas por versões da mesma geração; as outras são trocadas pelas novas.
const GERACAO_FOTOS = 'f2';
const versao = `jogos-do-jose-${GERACAO_FOTOS}-${hash.digest('hex').slice(0, 10)}`;
const ficheiros = ['./', ...lista];
writeFileSync(join(raiz, 'ficheiros.js'), `// Gerado por ferramentas/gerar-lista.mjs — não editar à mão.\nself.VERSAO = '${versao}';\nself.FICHEIROS = ${JSON.stringify(ficheiros, null, 1)};\n`);
console.log(`${ficheiros.length} ficheiros, versão ${versao}`);
