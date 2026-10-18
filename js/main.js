// Menú móvil
document.addEventListener('DOMContentLoaded', () => {
  const burger = document.querySelector('.nav__burger');
  const nav = document.querySelector('.nav__mobile');
  if (burger && nav) burger.addEventListener('click', () => nav.classList.toggle('open'));

  // Header scroll-aware: cambia a azul con halo ámbar al deslizar
  const header = document.querySelector('.header');
  if (header) {
    let ticking = false;
    const updateHeader = () => {
      if (window.scrollY > 24) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(updateHeader);
        ticking = true;
      }
    }, { passive: true });
    updateHeader();
  }

  // Marca enlace actual
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav__links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === path) a.setAttribute('aria-current', 'page');
  });

  // Auto-reveal: aplica .reveal a bloques clave
  const auto = document.querySelectorAll(
    '.section > .container > *, .hero__inner > *, .page-hero > .container > *, .card, .principio, .area, .region, .pub, .don, .step, .stats__item'
  );
  auto.forEach((el, i) => {
    el.classList.add('reveal');
    if (el.classList.contains('card') || el.classList.contains('principio') ||
        el.classList.contains('region') || el.classList.contains('pub') ||
        el.classList.contains('don') || el.classList.contains('step') ||
        el.classList.contains('stats__item')) {
      el.classList.add('delay-' + ((i % 4) + 1));
    }
  });

  // IntersectionObserver
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // ======= Zona Militantes en header (botón + panel) =======
  const navCta = document.querySelector('.nav__cta');
  if (navCta) {
    const militante = document.createElement('div');
    militante.className = 'nav__militante';
    militante.innerHTML = `
      <button class="nav__militante-btn" aria-label="Zona militantes" title="Zona militantes">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-1V6a5 5 0 00-10 0v2H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V10a2 2 0 00-2-2zM9 6a3 3 0 016 0v2H9V6zm3 11a2 2 0 110-4 2 2 0 010 4z"/></svg>
        <span>Zona militantes</span>
      </button>
      <div class="nav__militante-panel">
        <h4>Zona Militantes</h4>
        <p>Accede a contenido exclusivo con tu cuenta.</p>
        <a href="academia.html"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.9V17h2V9L12 3z"/></svg>Academia Nacional Libertaria</a>
        <a href="elecciones-internas.html"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-9 14l-5-5 1.4-1.4L10 14.2l7.6-7.6L19 8l-9 9z"/></svg>Elecciones internas</a>
        <hr>
        <a href="login.html"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M11 7L9.6 8.4l2.6 2.6H2v2h10.2l-2.6 2.6L11 17l5-5-5-5zm9 12h-8v2h8a2 2 0 002-2V5a2 2 0 00-2-2h-8v2h8v14z"/></svg>Iniciar sesión</a>
      </div>
    `;
    navCta.insertBefore(militante, navCta.firstChild);
    const mBtn = militante.querySelector('.nav__militante-btn');
    mBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      militante.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (!militante.contains(e.target)) militante.classList.remove('open');
    });
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

  // ======= Modal de bienvenida (Academia) - solo home, solo una vez por sesión =======
  const isHome = /\/(index\.html)?$/.test(location.pathname) || location.pathname.endsWith('/');
  let dismissed = false;
  try { dismissed = sessionStorage.getItem('pnl_academia_modal_seen') === '1'; } catch(e){}

  if (isHome && !dismissed) {
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
    // Mostrar con pequeña demora para que la página respire
    setTimeout(() => modal.classList.add('open'), 900);
  }
});
