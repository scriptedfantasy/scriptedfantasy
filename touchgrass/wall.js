// The wall bends into a shallow cylinder on wide screens, names the screen under the pointer,
// and opens one work large. Everything it shows is already in the HTML.
(() => {
  const list = document.querySelector('.screens');
  const room = document.querySelector('.room');
  const screens = [...list.children];
  const status = document.querySelector('.status');
  const viewer = document.querySelector('.viewer');
  const face = viewer.querySelector('.viewer-face');
  const text = viewer.querySelector('.viewer-text');

  // Each screen sits on a cylinder: x along the arc, pulled forward and turned to face the middle.
  function curve() {
    const w = list.clientWidth;
    if (window.innerWidth < 760) {
      room.style.perspective = '';
      screens.forEach(s => { s.style.transform = ''; });
      return;
    }
    const r = w * 0.9;
    room.style.perspective = `${Math.round(r * 2)}px`;
    screens.forEach(s => {
      const x = s.offsetLeft + s.offsetWidth / 2 - w / 2;
      const a = x / r;
      const dx = r * Math.sin(a) - x;
      const dz = r * (1 - Math.cos(a));
      s.style.transform = `translate3d(${dx.toFixed(1)}px,0,${dz.toFixed(1)}px) rotateY(${(-a).toFixed(4)}rad)`;
    });
  }
  let frame;
  window.addEventListener('resize', () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(curve); });
  curve();

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
      face.innerHTML = `<a class="tube" href="${s.dataset.page}" target="_blank" rel="noopener"><img src="${s.dataset.img}" alt=""></a>`;
      face.querySelector('img').alt = cap.querySelector('.cap').textContent;
      text.innerHTML = cap.innerHTML + `<p>Image from <a href="${s.dataset.page}" target="_blank" rel="noopener">${host}</a>.</p>`;
    } else {
      face.innerHTML = '<span class="tube"><span class="static"></span></span>';
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
    screens[current]?.querySelector('.tube').focus({ preventScroll: true });
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
