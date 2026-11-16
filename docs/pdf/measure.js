// Playwright snippet: prints total pages, body pages (before the annexes) and pages per section.
async (page) => {
  const ctx = await page.context().browser().newContext();
  const p = await ctx.newPage();
  const count = (buf) => (buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
  await p.goto('file:///D:/Projects/nutriFlow/docs/pdf/informe.html');
  await p.waitForFunction(() => document.body.dataset.ready === '1', null, { timeout: 30000 }).catch(() => {});
  const opts = { format: 'Letter', margin: { top: '2.54cm', bottom: '2.54cm', left: '2.54cm', right: '2.54cm' } };
  const all = count(await p.pdf({ ...opts, path: 'D:/Projects/nutriFlow/docs/pdf/informe.pdf', displayHeaderFooter: true, headerTemplate: '<div style="width:100%;font-family:Times New Roman,serif;font-size:12pt;text-align:right;padding:0 2.54cm;margin-top:1.27cm"><span class=pageNumber></span></div>', footerTemplate: '<span></span>' }));
  const full = await p.evaluate(() => document.body.innerHTML);
  const per = [];
  const n = await p.evaluate(() => [...document.querySelectorAll('h2')].findIndex((h) => h.textContent.startsWith('Anexo A')));
  for (let i = 0; i < n; i++) {
    const t = await p.evaluate((i) => {
      const h = [...document.querySelectorAll('h2')];
      const s = h[i];
      const nodes = [];
      for (let el = s; el && !(el !== s && (el.tagName === 'H2' || el.tagName === 'H1' || el.classList.contains('anexos'))); el = el.nextElementSibling) nodes.push(el.outerHTML);
      document.body.innerHTML = nodes.join('');
      return s.textContent;
    }, i);
    per.push(count(await p.pdf(opts)) + ' ' + t);
    await p.evaluate((h) => { document.body.innerHTML = h; }, full);
  }
  await p.evaluate(() => { let el = document.querySelector('.anexos'); while (el) { const nx = el.nextElementSibling; el.remove(); el = nx; } });
  const body = count(await p.pdf(opts));
  await ctx.close();
  return `total ${all}, cuerpo ${body}\n` + per.join('\n');
}
