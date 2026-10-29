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
      const img = w.image
        ? `<a class="img" href="${esc(w.image.page)}" target="_blank" rel="noopener"><img src="/touchgrass/${esc(w.image.file)}" alt="${esc(w.title)}, ${esc(a.artist)}" loading="lazy"></a>` : '';
      return `<li id="${esc(w.id)}">${w.verified ? '' : '* '}${bits}.${w.named_in_brief ? ' [brief]' : ''}<span class="links">${links}</span>${img}</li>`;
    }).join('');
    return `<li class="artist" id="${esc(a.id)}">
  <p class="artist-head"><span>${esc(a.id)} ${esc(a.artist)}</span><span>${esc(a.status)}</span></p>
  ${works ? `<ul class="works">${works}</ul>` : '<p class="works none">no work found</p>'}
</li>`;
  }).join('\n');
}

const nWorks = artists.reduce((n, a) => n + a.works.length, 0);
const nImages = artists.reduce((n, a) => n + a.works.filter(w => w.image).length, 0);
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
  <p><a href="/touchgrass/wall/">Wall</a>: every work on a screen.</p>
</header>
<section aria-labelledby="h-log">
  <h2 id="h-log">Log</h2>
  <ol class="log">
${renderLog()}
  </ol>
</section>
<section aria-labelledby="h-long">
  <h2 id="h-long">Longlist</h2>
  <p>${artists.length} artists, ${nWorks} works, ${nImages} images. [brief] = named by Lukas. * = not verified. Links go to the sources. Each image links to the page it came from.</p>
  <ol class="artists">
${renderLonglist()}
  </ol>
</section>
</main>
</body>
</html>
`;
// The wall: every work on a screen, in a grid. Works without an image show a dead screen.
function renderWall() {
  return artists.flatMap(a => a.works.map(w => {
    const line = [w.title + (w.year ? `, ${w.year}` : ''), w.where].filter(Boolean).map(esc).join('. ');
    const links = (w.sources || []).map(u =>
      `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(host(u))}</a>`).join(' ');
    const face = w.image
      ? `<img src="/touchgrass/${esc(w.image.file)}" alt="" loading="lazy" decoding="async">`
      : `<span class="static" aria-hidden="true"></span>`;
    return `<li class="screen ${w.image ? 'on' : 'off'}" id="${esc(w.id)}"${w.image ? ` data-img="/touchgrass/${esc(w.image.file)}" data-page="${esc(w.image.page)}"` : ''}>
  <figure><a class="tube" href="#${esc(w.id)}" aria-label="${esc(w.id)} ${esc(a.artist)}, ${esc(w.title)}">${face}</a>
  <figcaption><span class="cap"><b>${esc(w.id)}</b> ${esc(a.artist)}. ${line}.</span> <span class="links">${links}</span></figcaption></figure>
</li>`;
  })).join('\n');
}

const wallHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Touch Grass Wall</title>
<meta name="description" content="Touch Grass: Nature's Representation Online. Every work on the longlist as a screen in a wall: ${nWorks} screens, ${nImages} on.">
<link rel="canonical" href="https://scriptedfantasy.net/touchgrass/wall/">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,600;1,400&display=swap">
<link rel="stylesheet" href="/touchgrass/wall.css">
</head>
<body>
<header class="bar">
  <h1><a href="/touchgrass/">Touch Grass</a> / Wall</h1>
  <p class="status" aria-live="polite" data-idle="${nWorks} screens. ${nImages} on.">${nWorks} screens. ${nImages} on.</p>
</header>
<main class="room">
  <ol class="screens">
${renderWall()}
  </ol>
</main>
<dialog class="viewer" aria-label="Work">
  <div class="viewer-face"></div>
  <div class="viewer-text"></div>
  <nav class="viewer-nav"><button type="button" data-go="-1">&lt; prev</button><button type="button" data-go="1">next &gt;</button><button type="button" data-close>close</button></nav>
</dialog>
<script src="/touchgrass/wall.js" defer></script>
</body>
</html>
`;

fs.writeFileSync(path.join(dir, 'index.html'), html);
fs.mkdirSync(path.join(dir, 'wall'), { recursive: true });
fs.writeFileSync(path.join(dir, 'wall', 'index.html'), wallHtml);
console.log(`touchgrass/index.html: ${log.length} log rows, ${artists.length} artists, ${nWorks} works, ${nImages} images. wall/index.html: ${nWorks} screens`);
