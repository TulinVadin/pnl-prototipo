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
});
