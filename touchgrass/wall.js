// The wall sizes and groups its grid, names the work under the pointer, and opens one work large. Everything it shows is already in the HTML.
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
  size.addEventListener('input', () => { setSize(size.value); store('tg-wall-size', size.value); });
  group.addEventListener('change', () => { setGroup(group.checked); store('tg-wall-group', group.checked ? '1' : '0'); });

  // Status bar: the caption of the screen under the pointer or focus.
  const idle = status.dataset.idle;
  const show = s => { status.textContent = s ? s.querySelector('.cap').textContent : idle; };
  list.addEventListener('pointerover', e => show(e.target.closest('.screen')));
  list.addEventListener('pointerleave', () => show(null));
  list.addEventListener('focusin', e => show(e.target.closest('.screen')));
  list.addEventListener('focusout', () => show(null));

  // Viewer, driven by the URL hash so every work has its own link.
  let current = -1;
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
    if (go) open((current + Number(go.dataset.go) + screens.length) % screens.length);
  });
  viewer.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') open((current + 1) % screens.length);
    if (e.key === 'ArrowLeft') open((current - 1 + screens.length) % screens.length);
  });
  viewer.addEventListener('close', shut);
  window.addEventListener('hashchange', fromHash);
  fromHash();
})();
