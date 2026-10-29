// The wall sizes, groups and filters its grid, names the work under the pointer, and opens one work large. Everything it shows is already in the HTML.
(() => {
  const list = document.querySelector('.wall');
  const screens = [...list.querySelectorAll('.screen')];
  const status = document.querySelector('.status');
  const viewer = document.querySelector('.viewer');
  const face = viewer.querySelector('.viewer-face');
  const text = viewer.querySelector('.viewer-text');

  // Size and grouping. Each viewer's choice is remembered in this browser only.
  const size = document.querySelector('.size');
  const group = document.querySelector('.group');
  const root = document.documentElement;
  const store = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
  const recall = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  function setSize(px) { root.style.setProperty('--cell', `${px}px`); size.value = px; }
  function setGroup(on) { list.classList.toggle('grouped', on); group.checked = on; }
  setSize(Number(recall('tg-wall-size')) || parseInt(getComputedStyle(root).getPropertyValue('--cell'), 10));
  setGroup(recall('tg-wall-group') === '1');

  // Leads (artists found through group shows) can be switched off as a whole.
  const leadsBox = document.querySelector('.show-leads');
  const shown = s => !s.closest('[hidden]') && !(list.classList.contains('no-leads') && s.classList.contains('lead'));
  function setLeads(on) { list.classList.toggle('no-leads', !on); if (leadsBox) leadsBox.checked = on; }
  setLeads(recall('tg-wall-leads') !== '0');
  size.addEventListener('input', () => { setSize(size.value); store('tg-wall-size', size.value); });
  group.addEventListener('change', () => { setGroup(group.checked); store('tg-wall-group', group.checked ? '1' : '0'); });

  // Artist checkboxes. Unchecked artists are hidden in this browser (the board reads the same list);
  // the page writes out a line for Lukas to send Claude, who sets them to out for everyone.
  const pick = document.querySelector('.pick');
  const boxes = [...pick.querySelectorAll('.pick-list input')];
  const sections = [...list.querySelectorAll('.artist')];
  const outBox = pick.querySelector('.pick-out');
  const outText = outBox.querySelector('textarea');
  let idle = status.dataset.idle;
  function setHidden(hide) {
    sections.forEach(sec => { sec.hidden = hide.includes(sec.dataset.artist); });
    boxes.forEach(b => { b.checked = !hide.includes(b.value); });
    pick.querySelector('.pick-n').textContent = `${boxes.length - hide.length}/${boxes.length}`;
    const names = boxes.filter(b => !b.checked).map(b => b.dataset.name);
    outBox.hidden = !names.length;
    outText.value = `Touch Grass: set these artists to out: ${names.join(', ')}.`;
    recount();
    store('tg-hidden', JSON.stringify(hide));
  }
  function recount() {
    const on = screens.filter(shown);
    idle = `${on.length} works. ${on.filter(s => s.dataset.img).length} images.`;
    show(null);
  }
  if (leadsBox) leadsBox.addEventListener('change', () => { setLeads(leadsBox.checked); store('tg-wall-leads', leadsBox.checked ? '1' : '0'); recount(); });
  const hidden = () => boxes.filter(b => !b.checked).map(b => b.value);
  pick.addEventListener('change', e => { if (e.target.matches('.pick-list input')) setHidden(hidden()); });
  pick.addEventListener('click', e => {
    const all = e.target.closest('[data-all]');
    if (all) setHidden(all.dataset.all === '1' ? [] : boxes.map(b => b.value));
    if (e.target.closest('.copy')) {
      outText.select();
      (navigator.clipboard ? navigator.clipboard.writeText(outText.value) : Promise.reject())
        .catch(() => document.execCommand('copy'))
        .then(() => { e.target.textContent = 'copied'; setTimeout(() => { e.target.textContent = 'copy'; }, 1500); });
    }
  });
  document.addEventListener('click', e => { if (pick.open && !pick.contains(e.target)) pick.open = false; });

  // Status bar: the caption of the screen under the pointer or focus.
  function show(s) { status.textContent = s ? s.querySelector('.cap').textContent : idle; }
  let saved = [];
  try { saved = JSON.parse(recall('tg-hidden') || '[]'); } catch (e) {}
  setHidden(saved.filter(v => boxes.some(b => b.value === v)));
  list.addEventListener('pointerover', e => show(e.target.closest('.screen')));
  list.addEventListener('pointerleave', () => show(null));
  list.addEventListener('focusin', e => show(e.target.closest('.screen')));
  list.addEventListener('focusout', () => show(null));

  // Viewer, driven by the URL hash so every work has its own link. Prev and next skip hidden artists.
  let current = -1;
  function step(by) {
    for (let n = 1; n <= screens.length; n++) {
      const i = (current + by * n + screens.length * n) % screens.length;
      if (shown(screens[i])) return open(i);
    }
  }
  function open(i) {
    const s = screens[i];
    if (!s) return;
    current = i;
    const cap = s.querySelector('figcaption');
    if (s.dataset.img) {
      const host = new URL(s.dataset.page).hostname.replace(/^www\./, '');
      face.innerHTML = `<a class="cell" href="${s.dataset.page}" target="_blank" rel="noopener"><img src="${s.dataset.img}" alt=""></a>`;
      face.querySelector('img').alt = cap.querySelector('.cap').textContent;
      text.innerHTML = cap.innerHTML + `<p>Image from <a href="${s.dataset.page}" target="_blank" rel="noopener">${host}</a>.</p>`;
    } else {
      face.innerHTML = '<span class="cell"></span>';
      text.innerHTML = cap.innerHTML + '<p>No image yet.</p>';
    }
    if (!viewer.open) viewer.showModal();
    history.replaceState(null, '', `#${s.id}`);
  }
  function fromHash() {
    const i = screens.findIndex(s => `#${s.id}` === location.hash);
    if (i >= 0) open(i); else if (viewer.open) viewer.close();
  }
  list.addEventListener('click', e => {
    const s = e.target.closest('.screen');
    if (!s || e.metaKey || e.ctrlKey) return;
    e.preventDefault();
    open(screens.indexOf(s));
  });
  // Clear the hash and hand focus back to the screen. Runs on the close event too (Esc), so it must be safe twice.
  function shut() {
    if (viewer.open) viewer.close();
    if (location.hash) history.replaceState(null, '', location.pathname);
    screens[current]?.querySelector('.cell').focus({ preventScroll: true });
  }
  viewer.addEventListener('click', e => {
    if (e.target === viewer || e.target.closest('[data-close]')) return shut();
    const go = e.target.closest('[data-go]');
    if (go) step(Number(go.dataset.go));
  });
  viewer.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') step(1);
    if (e.key === 'ArrowLeft') step(-1);
  });
  viewer.addEventListener('close', shut);
  window.addEventListener('hashchange', fromHash);
  fromHash();
})();
