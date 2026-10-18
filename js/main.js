// ===============================
// PNL Prototipo — main.js
// ===============================

// --- Sesión demo (localStorage) ---
const PNL = {
  key: 'pnl_user',
  getUser(){ try { return JSON.parse(localStorage.getItem(this.key) || 'null'); } catch(e){ return null; } },
  isLoggedIn(){ return !!this.getUser(); },
  login(name, email){
    const user = { name: (name||'').trim() || 'Militante PNL', email: (email||'').trim() || '', when: Date.now() };
    try { localStorage.setItem(this.key, JSON.stringify(user)); } catch(e){}
    return user;
  },
  logout(){ try { localStorage.removeItem(this.key); } catch(e){} },
  initials(name){
    const parts = (name||'').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'PNL';
    if (parts.length === 1) return parts[0].slice(0,2).toUpperCase();
    return (parts[0][0] + parts[parts.length-1][0]).toUpperCase();
  }
};
window.PNL = PNL;

document.addEventListener('DOMContentLoaded', () => {
  const burger = document.querySelector('.nav__burger');
  const nav = document.querySelector('.nav__mobile');
  if (burger && nav) burger.addEventListener('click', () => nav.classList.toggle('open'));

  // Marca enlace actual
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav__links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === path) a.setAttribute('aria-current', 'page');
  });

  // Header scroll-aware
  const header = document.querySelector('.header');
  if (header) {
    let ticking = false;
    const updateHeader = () => {
      header.classList.toggle('scrolled', window.scrollY > 24);
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { window.requestAnimationFrame(updateHeader); ticking = true; }
    }, { passive: true });
    updateHeader();
  }

  // Auto-reveal (sin delays en mobile para que cards aparezcan rápido)
  const isMobile = window.matchMedia('(max-width: 760px)').matches;
  document.querySelectorAll(
    '.section > .container > *, .hero__inner > *, .page-hero > .container > *, .card, .principio, .area, .region, .pub, .don, .step, .stats__item, .news-card'
  ).forEach((el, i) => {
    el.classList.add('reveal');
    if (!isMobile && ['card','principio','region','pub','don','step','stats__item','news-card'].some(c => el.classList.contains(c))) {
      el.classList.add('delay-' + ((i % 4) + 1));
    }
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: isMobile ? 0.05 : 0.12, rootMargin: isMobile ? '0px 0px 100px 0px' : '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // ======= Header: Zona militantes O chip de usuario =======
  renderUserAreaInNav();

  // ======= Gate: bloquear academia + elecciones si no hay sesión =======
  const guardedPages = ['academia.html', 'elecciones-internas.html'];
  if (guardedPages.includes(path) && !PNL.isLoggedIn()) {
    renderGateWall(path);
  }

  // ======= Modal de bienvenida (home, 1x por sesión, solo si no está logueado) =======
  const isHome = /\/(index\.html)?$/.test(location.pathname) || location.pathname.endsWith('/') || path === 'index.html';
  let dismissed = false;
  try { dismissed = sessionStorage.getItem('pnl_academia_modal_seen') === '1'; } catch(e){}

  if (isHome && !dismissed && !PNL.isLoggedIn()) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal__card" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
        <button class="modal__close" aria-label="Cerrar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
        <div class="modal__hd">
          <span class="modal__badge">Novedad 2026</span>
          <h2 id="modalTitle">Academia Nacional Libertaria</h2>
        </div>
        <div class="modal__bd">
          <p>Formación política y doctrinal exclusiva para militantes del PNL. Clases semanales en vivo con contenido reservado.</p>
          <ul>
            <li>Acceso a clases en vivo y repositorio histórico</li>
            <li>Material de estudio descargable</li>
            <li>Participación en foros y debates internos</li>
          </ul>
          <div class="modal__actions">
            <a href="login.html" class="btn btn-primary">Iniciar sesión</a>
            <a href="hazte-militante.html" class="btn btn-outline">Hazte militante</a>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    const closeFn = () => {
      modal.classList.remove('open');
      try { sessionStorage.setItem('pnl_academia_modal_seen', '1'); } catch(e){}
      setTimeout(() => modal.remove(), 400);
    };
    modal.querySelector('.modal__close').addEventListener('click', closeFn);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeFn(); });
    document.addEventListener('keydown', function esc(e){ if (e.key === 'Escape') { closeFn(); document.removeEventListener('keydown', esc); } });
    setTimeout(() => modal.classList.add('open'), 900);
  }

  // ======= Toast lateral para militantes logueados =======
  if (PNL.isLoggedIn()) {
    let toastSeen = false;
    try { toastSeen = sessionStorage.getItem('pnl_toast_seen') === '1'; } catch(e){}
    const onGuarded = ['academia.html','elecciones-internas.html','login.html'].includes(path);
    if (!toastSeen && !onGuarded) {
      const u = PNL.getUser();
      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.innerHTML = `
        <div class="toast__hd">
          <h4>Hola, ${escapeHtml(u.name.split(' ')[0])}</h4>
          <span>Accede a tu contenido exclusivo</span>
          <button class="toast__close" aria-label="Cerrar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
        </div>
        <div class="toast__bd">
          <a class="toast__btn" href="academia.html">
            <div class="toast__btn__ico"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.9V17h2V9L12 3z"/></svg></div>
            <div class="toast__btn__txt"><strong>Academia</strong><span>Clases en vivo y repositorio</span></div>
          </a>
          <a class="toast__btn" href="elecciones-internas.html">
            <div class="toast__btn__ico"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-9 14l-5-5 1.4-1.4L10 14.2l7.6-7.6L19 8l-9 9z"/></svg></div>
            <div class="toast__btn__txt"><strong>Elecciones internas</strong><span>Proceso 2026 — 21 de noviembre</span></div>
          </a>
        </div>
      `;
      document.body.appendChild(toast);
      setTimeout(() => toast.classList.add('show'), 1200);
      toast.querySelector('.toast__close').addEventListener('click', () => {
        toast.classList.remove('show');
        try { sessionStorage.setItem('pnl_toast_seen', '1'); } catch(e){}
        setTimeout(() => toast.remove(), 450);
      });
    }
  }

  // ======= Modal de video (reutilizable) =======
  document.querySelectorAll('[data-video]').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const src = trigger.getAttribute('data-video');
      const vm = document.createElement('div');
      vm.className = 'vmodal';
      vm.innerHTML = `
        <div class="vmodal__wrap" role="dialog" aria-modal="true">
          <button class="vmodal__close" aria-label="Cerrar video">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
          <video src="${src}" controls autoplay playsinline></video>
        </div>
      `;
      document.body.appendChild(vm);
      requestAnimationFrame(() => vm.classList.add('open'));
      const closeFn = () => {
        vm.classList.remove('open');
        setTimeout(() => vm.remove(), 300);
        document.removeEventListener('keydown', escClose);
      };
      const escClose = (ev) => { if (ev.key === 'Escape') closeFn(); };
      vm.querySelector('.vmodal__close').addEventListener('click', closeFn);
      vm.addEventListener('click', (ev) => { if (ev.target === vm) closeFn(); });
      document.addEventListener('keydown', escClose);
    });
  });
});

// ---- Render del header: botón Zona Militantes o chip usuario ----
function renderUserAreaInNav(){
  const navCta = document.querySelector('.nav__cta');
  if (!navCta) return;
  // Limpia posible render anterior
  navCta.querySelectorAll('.nav__militante, .user-chip').forEach(n => n.remove());

  if (PNL.isLoggedIn()) {
    const u = PNL.getUser();
    const chip = document.createElement('div');
    chip.className = 'user-chip';
    chip.innerHTML = `
      <div class="user-chip__av">${PNL.initials(u.name)}</div>
      <span class="user-chip__name">${escapeHtml(u.name.split(' ')[0])}</span>
      <div class="user-panel">
        <h4>${escapeHtml(u.name)}</h4>
        ${u.email ? `<span class="mail">${escapeHtml(u.email)}</span>` : ''}
        <a href="academia.html"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.9V17h2V9L12 3z"/></svg>Academia Nacional Libertaria</a>
        <a href="elecciones-internas.html"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-9 14l-5-5 1.4-1.4L10 14.2l7.6-7.6L19 8l-9 9z"/></svg>Elecciones internas</a>
        <hr>
        <button class="logout" type="button"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 7l-1.4 1.4L18.2 11H8v2h10.2l-2.6 2.6L17 17l5-5-5-5zM4 5h8V3H4a2 2 0 00-2 2v14a2 2 0 002 2h8v-2H4V5z"/></svg>Cerrar sesión</button>
      </div>
    `;
    navCta.insertBefore(chip, navCta.firstChild);
    chip.addEventListener('click', (e) => {
      if (e.target.closest('.logout')) {
        PNL.logout();
        location.reload();
        return;
      }
      e.stopPropagation();
      chip.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (!chip.contains(e.target)) chip.classList.remove('open');
    });
  } else {
    const militante = document.createElement('div');
    militante.className = 'nav__militante';
    militante.innerHTML = `
      <button class="nav__militante-btn" aria-label="Zona militantes" title="Zona militantes">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-1V6a5 5 0 00-10 0v2H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V10a2 2 0 00-2-2zM9 6a3 3 0 016 0v2H9V6zm3 11a2 2 0 110-4 2 2 0 010 4z"/></svg>
        <span>Zona militantes</span>
      </button>
      <div class="nav__militante-panel">
        <h4>Zona Militantes</h4>
        <p>Inicia sesión para acceder al contenido exclusivo.</p>
        <a href="login.html"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M11 7L9.6 8.4l2.6 2.6H2v2h10.2l-2.6 2.6L11 17l5-5-5-5zm9 12h-8v2h8a2 2 0 002-2V5a2 2 0 00-2-2h-8v2h8v14z"/></svg>Iniciar sesión</a>
        <a href="hazte-militante.html"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a5 5 0 015 5 5 5 0 01-10 0 5 5 0 015-5zm0 12c3.3 0 10 1.7 10 5v3H2v-3c0-3.3 6.7-5 10-5z"/></svg>Hazte militante</a>
      </div>
    `;
    navCta.insertBefore(militante, navCta.firstChild);
    const mBtn = militante.querySelector('.nav__militante-btn');
    mBtn.addEventListener('click', (e) => { e.stopPropagation(); militante.classList.toggle('open'); });
    document.addEventListener('click', (e) => { if (!militante.contains(e.target)) militante.classList.remove('open'); });
  }
}

// ---- Gate wall para páginas restringidas ----
function renderGateWall(page){
  // Oculta todo lo demás excepto header y footer
  Array.from(document.body.children).forEach(child => {
    if (child.tagName === 'HEADER' || child.tagName === 'FOOTER' || child.tagName === 'SCRIPT') return;
    child.style.display = 'none';
  });
  const titles = {
    'academia.html': { h:'Academia Nacional Libertaria', p:'Contenido exclusivo para militantes del PNL. Inicia sesión para acceder a las clases, material y foros.' },
    'elecciones-internas.html': { h:'Elecciones Internas 2026', p:'La información detallada del proceso electoral interno está reservada a militantes inscritos.' }
  };
  const info = titles[page] || { h:'Zona Militantes', p:'Inicia sesión para acceder.' };
  const wall = document.createElement('section');
  wall.className = 'gate-wall';
  wall.innerHTML = `
    <div class="gate-wall__inner">
      <div class="gate-wall__ico"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-1V6a5 5 0 00-10 0v2H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V10a2 2 0 00-2-2zM9 6a3 3 0 016 0v2H9V6zm3 11a2 2 0 110-4 2 2 0 010 4z"/></svg></div>
      <h1>${info.h}</h1>
      <p>${info.p}</p>
      <div class="gate-wall__actions">
        <a href="login.html?next=${encodeURIComponent(page)}" class="btn btn-primary">Iniciar sesión</a>
        <a href="hazte-militante.html" class="btn btn-ghost">Hazte militante</a>
      </div>
    </div>
  `;
  const footer = document.querySelector('footer');
  if (footer) footer.parentNode.insertBefore(wall, footer); else document.body.appendChild(wall);
}

function escapeHtml(s){ return (s||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
