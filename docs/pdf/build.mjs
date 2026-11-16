// Builds docs/pdf/informe.html from informe.md (GFM tables, mermaid diagrams) with a light APA 7
// style; the PDF is printed from that page by a headless browser. Run: node docs/pdf/build.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { marked } from 'marked';

const source = readFileSync('informe.md', 'utf8');
marked.use({
  gfm: true,
  renderer: {
    code({ text, lang }) {
      if (lang === 'mermaid') return `<pre class="mermaid">${text}</pre>`;
      return `<pre><code>${text.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</code></pre>`;
    }
  }
});
const body = marked.parse(source);
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><base href="../../"><title>Informe nutriFlow</title>
<style>
@page { size: letter; margin: 2.54cm; }
body { font-family: "Times New Roman", Times, "Yu Mincho", serif; font-size: 12pt; line-height: 1.15; color: #000; text-align: left; }
/* APA 7 headings: level 1 centered bold, level 2 flush left bold. */
h1 { font-size: 12pt; text-align: center; margin: 0 0 12pt; }
h2 { font-size: 12pt; text-align: center; margin: 18pt 0 8pt; page-break-after: avoid; }
h3 { font-size: 12pt; text-align: left; margin: 12pt 0 4pt; page-break-after: avoid; }
p { margin: 0 0 6pt; text-indent: 1.27cm; }
li p, td p, .portada p, p.cap, p.sin-sangria { text-indent: 0; }
ul, ol { margin: 0 0 6pt; } li { margin: 1pt 0; }
/* APA 7 tables: number in bold, title in italics above; horizontal rules only. */
table { border-collapse: collapse; width: 100%; margin: 2pt 0 10pt; font-size: 10pt; line-height: 1.1; page-break-inside: auto;
  border-top: 1px solid #000; border-bottom: 1px solid #000; }
th, td { border: 0; padding: 2pt 4pt; vertical-align: top; text-align: left; }
th { border-bottom: 1px solid #000; font-weight: bold; } tr { page-break-inside: avoid; }
p.cap { margin: 10pt 0 2pt; page-break-after: avoid; line-height: 1.3; }
p.cap i { display: block; }
code { font-family: Consolas, monospace; font-size: 9pt; }
img { max-width: 100%; } td img { max-height: 9cm; }
table.figura, table.figura th { border: 0; }
hr { display: none; }
pre.mermaid { text-align: center; page-break-inside: avoid; margin: 2pt 0 10pt; } pre.mermaid svg { max-height: 8.5cm; max-width: 100%; } pre.mermaid svg[aria-roledescription=sequence] { max-height: 15cm; }
ul.referencias { list-style: none; padding-left: 1.27cm; } ul.referencias li { text-indent: -1.27cm; margin: 0 0 4pt; }
.anexos { page-break-before: always; }
.portada { height: 22.5cm; display: flex; flex-direction: column; align-items: center; text-align: center; page-break-after: always; }
.portada img { height: 5cm; width: auto; margin-bottom: 2.5cm; }
.portada p { margin: 0 0 1.15em; line-height: 2; }
.portada .titulo { font-weight: bold; margin-bottom: 2em; }
</style></head><body>${body}
<script type="module">
// Numbers tables and figures APA style: "Tabla N" / "Figura N" in bold, title in italics above.
// The title is the short bold paragraph right before it, or else the nearest heading.
const titleFor = (el) => {
  const prev = el.previousElementSibling;
  if (prev && prev.tagName === 'P' && prev.children.length === 1 && prev.firstElementChild.tagName === 'STRONG' && prev.textContent.trim().length < 70) {
    const text = prev.textContent.trim().replace(/[.:]$/, '');
    prev.remove();
    return text;
  }
  for (let node = el.previousElementSibling; node; node = node.previousElementSibling) {
    if (/^H[23]$/.test(node.tagName)) return node.textContent.replace(/^([0-9]+\\.([0-9]+)?|[A-E]\\.[0-9]+|Anexo [A-E]\\.)\\s*/, '');
  }
  return '';
};
let tables = 0;
let figures = 0;
for (const el of document.querySelectorAll('body > table, body > pre.mermaid, body > p > img')) {
  const target = el.tagName === 'IMG' ? el.parentElement : el;
  if (target.closest('.portada')) continue;
  const isFigure = el.tagName !== 'TABLE' || el.querySelector('img');
  if (el.tagName === 'TABLE' && el.querySelector('img')) el.classList.add('figura');
  const cap = document.createElement('p');
  cap.className = 'cap';
  cap.innerHTML = '<b>' + (isFigure ? 'Figura ' + ++figures : 'Tabla ' + ++tables) + '</b><i>' + titleFor(target) + '</i>';
  target.before(cap);
}
for (const h of document.querySelectorAll('h3')) {
  if (/^E\\.[12] /.test(h.textContent)) for (let n = h.nextElementSibling; n && n.tagName !== 'H3'; n = n.nextElementSibling) if (n.tagName === 'UL') n.classList.add('referencias');
}
for (const p of document.querySelectorAll('p')) if (p.firstElementChild && p.firstElementChild.tagName === 'STRONG' && p.textContent.startsWith(p.firstElementChild.textContent)) p.classList.add('sin-sangria');
import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.esm.min.mjs';
mermaid.initialize({ startOnLoad: false, theme: 'neutral', fontFamily: 'Times New Roman', sequence: { mirrorActors: false, actorMargin: 24, messageMargin: 28, boxMargin: 6, actorFontSize: 17, messageFontSize: 17, noteFontSize: 16, wrap: true, width: 130 } });
await mermaid.run();
document.body.dataset.ready = '1';
</script>
</body></html>`;
writeFileSync('docs/pdf/informe.html', html);
console.log('docs/pdf/informe.html');
