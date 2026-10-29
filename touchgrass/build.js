// Builds touchgrass/index.html from the data files, so the whole board is in the HTML.
// Run after changing anything in data/:  node touchgrass/build.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const dir = __dirname;
const ctx = { window: {} };
ctx.window = ctx;
vm.createContext(ctx);
for (const f of ['brief.js', 'log.js', 'research.js', 'leads.js']) {
  vm.runInContext(fs.readFileSync(path.join(dir, 'data', f), 'utf8'), ctx, { filename: f });
}
const log = ctx.TG.log;
// Artists Lukas set to out leave the board's longlist and the wall; they stay in the data.
// Leads (found through group shows) sit apart from the longlist on the board and are marked on the wall.
const artists = ctx.TG.research.artists.filter(a => a.status !== 'out' && a.status !== 'lead');
const leadArtists = ctx.TG.research.artists.filter(a => a.status === 'lead');
const outArtists = ctx.TG.research.artists.filter(a => a.status === 'out');
const brief = ctx.TG.brief;
const leads = ctx.TG.leads || { shows: [] };

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
// A stable key per artist (IDs are positional), used by the wall's artist checkboxes.
function slug(name) {
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
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
    return `<li class="artist" id="${esc(a.id)}" data-artist="${slug(a.artist)}">
  <p class="artist-head"><span>${esc(a.artist)}</span><span>${esc(a.status)}</span></p>
  ${works ? `<ul class="works">${works}</ul>` : '<p class="works none">no work found</p>'}
</li>`;
  }).join('\n');
}

// Leads: artists found through group shows, for Lukas to tick and send back. They are on the wall, marked.
function renderLeads() {
  return leadArtists.map(a => {
    const works = a.works.map(w => {
      const links = (w.sources || []).map(u =>
        `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(host(u))}</a>`).join('');
      const bits = [w.title + (w.year ? `, ${w.year}` : ''), w.why].filter(Boolean).map(esc).join('. ');
      const img = w.image
        ? `<a class="img" href="${esc(w.image.page)}" target="_blank" rel="noopener"><img src="/touchgrass/${esc(w.image.file)}" alt="${esc(w.title)}, ${esc(a.artist)}" loading="lazy"></a>` : '';
      return `<li id="${esc(w.id)}">${bits}.<span class="links">${links}</span>${img}</li>`;
    }).join('');
    const via = (a.via_shows || []).length
      ? `<p class="via">${a.shown_with.length ? `With ${a.shown_with.map(esc).join(', ')} in` : 'In'} ${a.via_shows.map(esc).join('; ')}.</p>` : '';
    return `<li class="artist lead" data-artist="${slug(a.artist)}">
  <p class="artist-head"><label><input type="checkbox" value="${esc(a.artist)}"> ${esc(a.artist)}</label></p>
  ${via}<ul class="works">${works}</ul>
</li>`;
  }).join('\n');
}
function renderShows() {
  return leads.shows.map(s => {
    const bits = [s.title + (s.year ? `, ${s.year}` : ''), s.venue].filter(Boolean).map(esc).join('. ');
    const ours = s.our_artists.length ? ` With ${s.our_artists.map(esc).join(', ')}.` : '';
    const link = s.url ? `<span class="links"><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(host(s.url))}</a></span>` : '';
    return `<li>${bits}.${ours}${link}</li>`;
  }).join('');
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
  <p class="hidden-note" hidden></p>
  <ol class="artists">
${renderLonglist()}
  </ol>
${outArtists.length ? `  <details class="out"><summary>out, ${outArtists.length} artist${outArtists.length > 1 ? 's' : ''}</summary><p>${outArtists.map(a => esc(a.artist)).join(', ')}.</p></details>` : ''}
</section>
${leadArtists.length ? `<section aria-labelledby="h-leads">
  <h2 id="h-leads">Leads</h2>
  <p>${leadArtists.length} artists not on the list, found through ${leads.shows.length} group shows our artists were in. Each has at least one work about nature, with sources. They are on the <a href="/touchgrass/wall/">wall</a>, marked "lead". Tick the ones to add and send Claude the line that appears.</p>
  <ol class="artists leads">
${renderLeads()}
  </ol>
  <div class="lead-out" hidden>
    <textarea readonly rows="3"></textarea>
    <p><button type="button" class="copy">copy</button></p>
  </div>
  <details class="shows"><summary>the ${leads.shows.length} group shows</summary><ul class="works">${renderShows()}</ul></details>
</section>` : ''}
</main>
<script>
// Artists unchecked on the wall are hidden here too, in this browser only, until Lukas sets them to out.
(() => {
  let hide = [];
  try { hide = JSON.parse(localStorage.getItem('tg-hidden') || '[]'); } catch (e) {}
  const items = [...document.querySelectorAll('.artists:not(.leads) > [data-artist]')].filter(li => hide.includes(li.dataset.artist));
  if (!items.length) return;
  items.forEach(li => { li.hidden = true; });
  const note = document.querySelector('.hidden-note');
  note.hidden = false;
  note.innerHTML = items.length + ' unchecked on the <a href="/touchgrass/wall/">wall</a>, hidden in this browser.';
})();
</script>
<script>
// Leads: ticked artists become one line for Lukas to send Claude, who adds them to the list.
(() => {
  const list = document.querySelector('.leads');
  if (!list) return;
  const out = document.querySelector('.lead-out');
  const text = out.querySelector('textarea');
  list.addEventListener('change', () => {
    const names = [...list.querySelectorAll('input:checked')].map(b => b.value);
    out.hidden = !names.length;
    text.value = 'Touch Grass: add these leads: ' + names.join(', ') + '.';
  });
  out.querySelector('.copy').addEventListener('click', e => {
    text.select();
    (navigator.clipboard ? navigator.clipboard.writeText(text.value) : Promise.reject())
      .catch(() => document.execCommand('copy'))
      .then(() => { e.target.textContent = 'copied'; setTimeout(() => { e.target.textContent = 'copy'; }, 1500); });
  });
})();
</script>
</body>
</html>
`;
const wallArtists = [...artists, ...leadArtists].filter(a => a.works.length);
const wallWorks = wallArtists.reduce((n, a) => n + a.works.length, 0);
const wallImages = wallArtists.reduce((n, a) => n + a.works.filter(w => w.image).length, 0);
// The wall: every work in one grid, in artist order. Works without an image show an empty cell.
// Each artist is a section, so the page can show one flat grid or group it by artist.
function renderWall() {
  return wallArtists.map(a => {
    const lead = a.status === 'lead';
    const cells = a.works.map(w => {
      const line = [w.title + (w.year ? `, ${w.year}` : ''), w.where].filter(Boolean).map(esc).join('. ');
      const links = (w.sources || []).map(u =>
        `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(host(u))}</a>`).join(' ');
      const face = w.image
        ? `<img src="/touchgrass/${esc(w.image.file)}" alt="" loading="lazy" decoding="async">`
        : '';
      return `<li class="screen ${w.image ? 'on' : 'off'}${lead ? ' lead' : ''}" id="${esc(w.id)}"${w.image ? ` data-img="/touchgrass/${esc(w.image.file)}" data-page="${esc(w.image.page)}"` : ''}>
  <figure><a class="cell" href="#${esc(w.id)}" aria-label="${esc(w.id)} ${esc(a.artist)}, ${esc(w.title)}">${face}</a>
  <figcaption><span class="cap"><b>${esc(w.id)}</b> ${lead ? '[lead] ' : ''}${esc(a.artist)}. ${line}.</span> <span class="links">${links}</span></figcaption></figure>
</li>`;
    }).join('\n');
    return `<section class="artist${lead ? ' lead' : ''}" aria-label="${esc(a.artist)}" data-artist="${slug(a.artist)}">
<h2><span>${esc(a.artist)}</span><span>${lead ? 'lead · ' : ''}${a.works.length}</span></h2>
<ol class="cells">
${cells}
</ol>
</section>`;
  }).join('\n');
}

const wallHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Touch Grass Wall</title>
<meta name="description" content="Touch Grass: Nature's Representation Online. Every work on the longlist in one grid: ${nWorks} works, ${nImages} with images.">
<link rel="canonical" href="https://scriptedfantasy.net/touchgrass/wall/">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,600;1,400&display=swap">
<link rel="stylesheet" href="/touchgrass/wall.css">
</head>
<body>
<header class="bar">
  <h1><a href="/touchgrass/">Touch Grass</a> / Wall</h1>
  <div class="controls">
    <label>size <input type="range" class="size" min="40" max="480" step="4" value="120"></label>
    <label><input type="checkbox" class="group"> by artist</label>
    ${leadArtists.length ? '<label><input type="checkbox" class="show-leads" checked> leads</label>' : ''}
    <details class="pick">
      <summary>artists <span class="pick-n">${wallArtists.length}/${wallArtists.length}</span></summary>
      <div class="pick-panel">
        <p class="pick-all"><button type="button" data-all="1">all</button><button type="button" data-all="0">none</button></p>
        <ul class="pick-list">
${wallArtists.map(a => `          <li><label><input type="checkbox" value="${slug(a.artist)}" data-name="${esc(a.artist)}" checked> ${esc(a.artist)}${a.status === 'lead' ? ' <i>lead</i>' : ''}</label></li>`).join('\n')}
        </ul>
        <div class="pick-out" hidden>
          <p>Unchecked artists are hidden in this browser only. To remove them for everyone, send Claude this:</p>
          <textarea readonly rows="3"></textarea>
          <p><button type="button" class="copy">copy</button></p>
        </div>
      </div>
    </details>
  </div>
  <p class="status" aria-live="polite" data-idle="${wallWorks} works. ${wallImages} images.">${wallWorks} works. ${wallImages} images.</p>
</header>
<main class="room">
<div class="wall">
${renderWall()}
</div>
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
console.log(`touchgrass/index.html: ${log.length} log rows, ${artists.length} artists, ${nWorks} works, ${nImages} images, ${leadArtists.length} leads. wall/index.html: ${wallWorks} cells`);
