// Builds touchgrass/index.html from the data files, so the whole board is in the HTML.
// Run after changing anything in data/:  node touchgrass/build.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const dir = __dirname;
const ctx = { window: {} };
ctx.window = ctx;
vm.createContext(ctx);
for (const f of ['brief.js', 'log.js', 'research.js']) {
  vm.runInContext(fs.readFileSync(path.join(dir, 'data', f), 'utf8'), ctx, { filename: f });
}
const log = ctx.TG.log;
const artists = ctx.TG.research.artists;
const brief = ctx.TG.brief;

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function host(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch (e) { return url; }
}

// Entries are numbered in order; date rows start a new day and take no number.
function renderLog() {
  let n = 0;
  return log.map(e => {
    if (e.date) return `<li class="date">${esc(e.date)}</li>`;
    const num = String(++n).padStart(3, '0');
    if (e.dir) return `<li class="entry dir"><span class="num">${num}</span><span class="who"></span><p>(${esc(e.dir)})</p></li>`;
    const list = e.brief
      ? `<details><summary>the list, ${brief.length} lines</summary><pre>${esc(brief.join('\n'))}</pre></details>` : '';
    return `<li class="entry${e.open ? ' open' : ''}"><span class="num">${num}</span><span class="who">${esc(e.who)}</span><div class="say"><p>${esc(e.say)}</p>${list}</div></li>`;
  }).join('\n');
}

function renderLonglist() {
  return artists.map(a => {
    const works = a.works.map(w => {
      const links = (w.sources || []).map(u =>
        `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(host(u))}</a>`).join('');
      const bits = [w.title + (w.year ? `, ${w.year}` : ''), w.where].filter(Boolean).map(esc).join('. ');
      return `<li id="${esc(w.id)}">${w.verified ? '' : '* '}${bits}.${w.named_in_brief ? ' [brief]' : ''}<span class="links">${links}</span></li>`;
    }).join('');
    return `<li class="artist" id="${esc(a.id)}">
  <p class="artist-head"><span>${esc(a.id)} ${esc(a.artist)}</span><span>${esc(a.status)}</span></p>
  ${works ? `<ul class="works">${works}</ul>` : '<p class="works none">no work found</p>'}
</li>`;
  }).join('\n');
}

const nWorks = artists.reduce((n, a) => n + a.works.length, 0);
const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Touch Grass Process Board</title>
<meta name="description" content="Process board for Touch Grass: Nature's Representation Online, an exhibition and archive of digital art about nature, co-curated by Lukas Amacher and Claude.">
<link rel="canonical" href="https://scriptedfantasy.net/touchgrass/">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,600;1,400&display=swap">
<link rel="stylesheet" href="/touchgrass/board.css">
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Touch Grass Process Board",
  "url": "https://scriptedfantasy.net/touchgrass/",
  "about": "Touch Grass: Nature's Representation Online, an exhibition and archive of digital art about nature",
  "author": [{ "@type": "Person", "name": "Lukas Amacher", "url": "https://scriptedfantasy.net" }, { "@type": "Thing", "name": "Claude" }],
  "isPartOf": { "@type": "WebSite", "url": "https://scriptedfantasy.net" }
}
</script>
</head>
<body>
<main id="board">
<header class="head">
  <h1>Touch Grass</h1>
  <p>Nature's Representation Online</p>
  <p>Process board. Curated by Lukas and Claude.</p>
</header>
<section aria-labelledby="h-log">
  <h2 id="h-log">Log</h2>
  <ol class="log">
${renderLog()}
  </ol>
</section>
<section aria-labelledby="h-long">
  <h2 id="h-long">Longlist</h2>
  <p>${artists.length} artists, ${nWorks} works. [brief] = named by Lukas. * = not verified. Links go to the sources.</p>
  <ol class="artists">
${renderLonglist()}
  </ol>
</section>
</main>
</body>
</html>
`;
fs.writeFileSync(path.join(dir, 'index.html'), html);
console.log(`touchgrass/index.html: ${log.length} log rows, ${artists.length} artists, ${nWorks} works`);
