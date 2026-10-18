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
  // Marca enlace actual
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav__links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === path) a.setAttribute('aria-current', 'page');
  });

  // Reemplaza el logo con 3 variantes: navy (default white bg), white (scrolled dark bg), iso (mobile)
  document.querySelectorAll('.nav__brand').forEach(brand => {
    const existing = brand.querySelector('img');
    if (existing && !brand.querySelector('.brand-navy')) {
      existing.remove();
      brand.innerHTML = `
        <img class="brand-navy" src="assets/logos/pnl-logo-navy.png" alt="Partido Nacional Libertario">
        <img class="brand-white" src="assets/logos/pnl-logo-white.png" alt="Partido Nacional Libertario">
        <img class="brand-i" src="assets/logos/pnl-isotipo.png" alt="PNL">
      `;
    }
  });

  // ======= Mobile menu overlay =======
  buildMobileMenu();

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

// ---- Mobile menu overlay (construido desde .nav__links) ----
function buildMobileMenu(){
  const sourceLinks = document.querySelector('.nav__links');
  const burger = document.querySelector('.nav__burger');
  if (!sourceLinks || !burger) return;

  if (document.querySelector('.mobile-menu')) return;

  const currentPage = location.pathname.split('/').pop() || 'index.html';

  let menuHtml = '<ul>';
  sourceLinks.querySelectorAll(':scope > li').forEach(li => {
    const link = li.querySelector(':scope > a');
    const sub = li.querySelector(':scope > ul.nav__sub');
    const label = link ? link.textContent.trim() : '';
    const href = link ? link.getAttribute('href') : '#';
    const isToggleOnly = (!href || href === '#');
    const activeCls = (href === currentPage) ? ' active' : '';

    if (sub) {
      let subItems = '<ul>';
      sub.querySelectorAll(':scope > li > a').forEach(sa => {
        subItems += `<li><a href="${sa.getAttribute('href')}">${sa.textContent.trim()}</a></li>`;
      });
      subItems += '</ul>';
      if (isToggleOnly) {
        menuHtml += `<li class="has-sub-m toggle-only"><button type="button">${label}<span class="caret"></span></button>${subItems}</li>`;
      } else {
        menuHtml += `<li class="has-sub-m"><div class="nav-split"><a href="${href}" class="${activeCls.trim()}">${label}</a><button type="button" aria-label="Abrir submenu"><span class="caret"></span></button></div>${subItems}</li>`;
      }
    } else {
      menuHtml += `<li><a href="${href}" class="${activeCls.trim()}">${label}</a></li>`;
    }
  });
  menuHtml += '</ul>';

  // CTAs según sesión
  let ctasBlock = '';
  if (PNL.isLoggedIn()) {
    ctasBlock = `
      <div class="mobile-menu__ctas">
        <a href="academia.html" class="btn btn-primary">Entrar a la Academia</a>
        <a href="elecciones-internas.html" class="btn btn-outline">Elecciones internas</a>
      </div>
      <button class="mobile-menu__logout" type="button">Cerrar sesión</button>`;
  } else {
    ctasBlock = `
      <div class="mobile-menu__ctas">
        <a href="hazte-militante.html" class="btn btn-primary">Hazte militante</a>
        <a href="donaciones.html" class="btn btn-outline">Donar</a>
        <a href="login.html" class="btn-militante" style="justify-content:center;text-decoration:none;padding:12px;border-radius:999px;font-weight:700">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-1V6a5 5 0 00-10 0v2H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V10a2 2 0 00-2-2zM9 6a3 3 0 016 0v2H9V6z"/></svg>
          Zona militantes
        </a>
      </div>`;
  }

  const socialBlock = `
    <div class="mobile-menu__social">
      <a href="https://www.facebook.com/p/Partido-Nacional-Libertario-61560587226566/" target="_blank" rel="noopener" aria-label="Facebook"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 10-11.6 9.9v-7h-2v-3h2V9.5c0-2 1.2-3 3-3 .9 0 1.8.2 1.8.2v2h-1c-1 0-1.3.6-1.3 1.2V12h2.2l-.4 3h-1.8v7A10 10 0 0022 12z"/></svg></a>
      <a href="https://x.com/Partido_NL" target="_blank" rel="noopener" aria-label="X"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 3H22l-7.2 8.2L23 21h-6.6l-5.1-6.6L5.5 21H2.4l7.7-8.8L2 3h6.8l4.6 6.1L18.9 3z"/></svg></a>
      <a href="https://www.instagram.com/partido_nacional_libertario/" target="_blank" rel="noopener" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.2c3.2 0 3.6 0 4.8.1 1.2.1 2 .3 2.6.5.7.3 1.2.6 1.7 1.2.5.5.9 1 1.2 1.7.2.6.4 1.4.5 2.6 0 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.2-.3 2-.5 2.6-.3.7-.6 1.2-1.2 1.7-.5.5-1 .9-1.7 1.2-.6.2-1.4.4-2.6.5-1.3 0-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2-.1-2-.3-2.6-.5-.7-.3-1.2-.6-1.7-1.2-.5-.5-.9-1-1.2-1.7-.2-.6-.4-1.4-.5-2.6 0-1.3-.1-1.6-.1-4.8s0-3.6.1-4.8c.1-1.2.3-2 .5-2.6.3-.7.6-1.2 1.2-1.7.5-.5 1-.9 1.7-1.2.6-.2 1.4-.4 2.6-.5 1.3 0 1.6-.1 4.8-.1zm0 3.5A4.2 4.2 0 1112 16a4.2 4.2 0 010-8.2zm0 7a2.8 2.8 0 100-5.6 2.8 2.8 0 000 5.6z"/></svg></a>
      <a href="https://www.tiktok.com/@partido_nl" target="_blank" rel="noopener" aria-label="TikTok"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.6 7.2a6 6 0 01-3.5-1.1v8a5.3 5.3 0 11-5.3-5.3v2.6a2.7 2.7 0 102.7 2.7V2h2.6a3.4 3.4 0 003.5 3.4v1.8z"/></svg></a>
      <a href="https://www.youtube.com/@Partido_NL" target="_blank" rel="noopener" aria-label="YouTube"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M23 7.5s-.2-1.6-.9-2.3c-.8-.9-1.8-.9-2.2-1C16.6 4 12 4 12 4s-4.6 0-7.9.3c-.4 0-1.4.1-2.2 1-.7.7-.9 2.3-.9 2.3S.8 9.3.8 11.2v1.6c0 1.9.2 3.7.2 3.7s.2 1.6.9 2.3c.8.9 1.9.9 2.4 1 1.8.2 7.7.2 7.7.2s4.6 0 7.9-.3c.4 0 1.4-.1 2.2-1 .7-.7.9-2.3.9-2.3s.2-1.8.2-3.7v-1.6c0-1.9-.2-3.7-.2-3.7zM9.7 15V8.5l6.2 3.2L9.7 15z"/></svg></a>
    </div>
    <div class="mobile-menu__foot">© 2026 Partido Nacional Libertario</div>`;

  const overlay = document.createElement('div');
  overlay.className = 'mobile-menu';
  overlay.innerHTML = `<div class="mobile-menu__inner">${menuHtml}${ctasBlock}${socialBlock}</div>`;
  document.body.appendChild(overlay);

  burger.addEventListener('click', () => {
    const open = overlay.classList.toggle('open');
    burger.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open);
  });

  // Toggle submenu — tanto en .toggle-only > button como en .nav-split > button
  overlay.querySelectorAll('.has-sub-m .nav-split > button, .has-sub-m.toggle-only > button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      const li = btn.closest('.has-sub-m');
      li.classList.toggle('open');
    });
  });

  const logoutBtn = overlay.querySelector('.mobile-menu__logout');
  if (logoutBtn) logoutBtn.addEventListener('click', () => { PNL.logout(); location.reload(); });

  overlay.querySelectorAll('a[href]').forEach(a => {
    a.addEventListener('click', () => {
      overlay.classList.remove('open');
      burger.classList.remove('open');
      document.body.classList.remove('menu-open');
    });
  });
}

// ---- Carousels INFINITOS (loop con clones) ----
function initCarousels(){
  const isMobile = window.matchMedia('(max-width: 760px)').matches;
  const selector = isMobile ? '.grid-carousel, .carousel-always' : '.carousel-always';
  document.querySelectorAll(selector).forEach(carousel => {
    if (carousel.dataset.carouselInit) return;
    carousel.dataset.carouselInit = '1';

    const originalItems = Array.from(carousel.children);
    if (originalItems.length < 2) return;

    // Clonar los últimos N al inicio y los primeros N al final para loop sin corte
    const cloneCount = Math.min(3, originalItems.length);
    originalItems.slice(0, cloneCount).forEach(it => {
      const c = it.cloneNode(true);
      c.setAttribute('aria-hidden','true');
      c.dataset.clone = 'end';
      carousel.appendChild(c);
    });
    originalItems.slice(-cloneCount).reverse().forEach(it => {
      const c = it.cloneNode(true);
      c.setAttribute('aria-hidden','true');
      c.dataset.clone = 'start';
      carousel.insertBefore(c, carousel.firstChild);
    });

    const allItems = Array.from(carousel.children);
    const realStart = cloneCount;
    const realEnd = cloneCount + originalItems.length - 1;

    const getLeftFor = (idx) => {
      const target = allItems[idx];
      const rCar = carousel.getBoundingClientRect();
      const rIt = target.getBoundingClientRect();
      return rIt.left - rCar.left + carousel.scrollLeft - (carousel.clientWidth - target.clientWidth) / 2;
    };
    const scrollToIndex = (idx, smooth = true) => {
      const left = getLeftFor(idx);
      carousel.scrollTo({ left, behavior: smooth ? 'smooth' : 'auto' });
    };
    const currentIndex = () => {
      const center = carousel.scrollLeft + carousel.clientWidth / 2;
      let best = 0, bestDist = Infinity;
      allItems.forEach((it, i) => {
        const itCenter = it.offsetLeft - carousel.offsetLeft + it.offsetWidth / 2;
        const d = Math.abs(itCenter - center);
        if (d < bestDist) { bestDist = d; best = i; }
      });
      return best;
    };

    // Posición inicial sobre el primer item real (después de las clones de inicio)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => scrollToIndex(realStart, false));
    });

    // Envolver con wrap
    let wrap = carousel.parentElement;
    if (!wrap.classList.contains('carousel-wrap')) {
      wrap = document.createElement('div');
      wrap.className = 'carousel-wrap';
      carousel.parentNode.insertBefore(wrap, carousel);
      wrap.appendChild(carousel);
    }

    // Flechas
    const prev = document.createElement('button');
    prev.className = 'carousel-arrow carousel-arrow--prev';
    prev.setAttribute('aria-label','Anterior');
    prev.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>';
    const next = document.createElement('button');
    next.className = 'carousel-arrow carousel-arrow--next';
    next.setAttribute('aria-label','Siguiente');
    next.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>';
    wrap.appendChild(prev);
    wrap.appendChild(next);

    prev.addEventListener('click', () => scrollToIndex(currentIndex() - 1));
    next.addEventListener('click', () => scrollToIndex(currentIndex() + 1));

    // Reposiciona invisiblemente cuando el usuario (scroll o swipe) entra en zona de clones
    let snapTimer;
    const total = originalItems.length;
    carousel.addEventListener('scroll', () => {
      clearTimeout(snapTimer);
      snapTimer = setTimeout(() => {
        const idx = currentIndex();
        if (idx < realStart) {
          // En clone al inicio → saltar al equivalente real al final
          const eq = realEnd - (realStart - 1 - idx);
          scrollToIndex(eq, false);
        } else if (idx > realEnd) {
          const eq = realStart + (idx - realEnd - 1);
          scrollToIndex(eq, false);
        }
      }, 140);
    }, { passive: true });

    // Re-centra en resize
    window.addEventListener('resize', () => {
      const idx = currentIndex();
      scrollToIndex(idx, false);
    });
  });
}
document.addEventListener('DOMContentLoaded', initCarousels);
