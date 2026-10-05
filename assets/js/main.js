// Portafolio: menú móvil, estado del header, link activo, efectos de cursor y animaciones (GSAP).
const root = document.documentElement;
const header = document.querySelector('.site-header');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// ---------- Menú en celular ----------
const toggle = document.querySelector('.menu-toggle');
const links = document.querySelector('.nav-links');
if (toggle && links) {
  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  links.addEventListener('click', (e) => {
    if (e.target.closest('a')) {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
}

document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

// ---------- Header con sombra al bajar ----------
const onScroll = () => header?.classList.toggle('scrolled', window.scrollY > 8);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

// ---------- Link del menú según la sección visible ----------
const navLinks = [...document.querySelectorAll('.nav-links a[href^="#"]')];
const io = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === `#${entry.target.id}`));
  });
}, { rootMargin: '-45% 0px -50% 0px' });
navLinks.forEach((a) => {
  const section = document.querySelector(a.getAttribute('href'));
  if (section) io.observe(section);
});

// ---------- Luz que sigue al cursor en las tarjetas ----------
if (finePointer) {
  document.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });
}

// ---------- "Otros proyectos" en celular: carrusel deslizable con puntos ----------
const moreGrid = document.querySelector('.more-grid');
if (moreGrid) {
  const slides = [...moreGrid.children];
  const dots = document.createElement('div');
  dots.className = 'more-dots';
  dots.setAttribute('aria-hidden', 'true');
  slides.forEach(() => dots.appendChild(document.createElement('span')));
  moreGrid.after(dots);
  const markDot = () => {
    const center = moreGrid.scrollLeft + moreGrid.clientWidth / 2;
    let current = 0;
    let best = Infinity;
    slides.forEach((slide, i) => {
      const d = Math.abs(slide.offsetLeft + slide.offsetWidth / 2 - center);
      if (d < best) { best = d; current = i; }
    });
    [...dots.children].forEach((dot, i) => dot.classList.toggle('on', i === current));
  };
  moreGrid.addEventListener('scroll', markDot, { passive: true });
  window.addEventListener('resize', markDot);
  markDot();
}

// ---------- Animaciones ----------
if (window.gsap && window.ScrollTrigger && window.SplitText && !reduceMotion) {
  animate();
} else {
  root.classList.remove('js'); // sin GSAP o con "reducir movimiento": todo visible y estático
}

function animate() {
  gsap.registerPlugin(ScrollTrigger, SplitText);
  // En celular la barra del navegador aparece y desaparece al hacer scroll: no recalcular por eso
  ScrollTrigger.config({ ignoreMobileResize: true });
  root.classList.add('anim-ready');
  const ease = 'power3.out';
  const headerH = () => header?.offsetHeight ?? 68;
  const mm = gsap.matchMedia();

  // Entrada: header, fondo, hero y capturas en secuencia
  const title = SplitText.create('.hero h1', { type: 'lines', mask: 'lines' });
  gsap.timeline({ defaults: { ease, duration: 0.9 } })
    .fromTo(header, { autoAlpha: 0, yPercent: -100 }, { autoAlpha: 1, yPercent: 0, duration: 0.7, clearProps: 'transform' })
    .from('.hero-bg', { autoAlpha: 0, duration: 1.8, ease: 'power2.out' }, 0)
    .from('.hero-bg .grid', { scale: 1.08, duration: 1.8, ease: 'power2.out' }, 0)
    .fromTo('.hero .badge', { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0 }, 0.2)
    .set('.hero h1', { autoAlpha: 1 }, 0.3)
    .from(title.lines, { yPercent: 110, duration: 1.1, stagger: 0.1, ease: 'power4.out', onComplete: () => title.revert() }, 0.3)
    .fromTo('.hero .lead', { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0 }, 0.75)
    .fromTo('.hero .actions', { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0 }, 0.9)
    .fromTo('.hero .facts li', { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, stagger: 0.08, duration: 0.6 }, 1.05)
    .fromTo('.hero-visual .shot', { autoAlpha: 0, y: 140, rotation: (i) => [12, -14, 9][i] },
      { autoAlpha: 1, y: 0, rotation: (i) => [4, -5, 1.5][i], duration: 1.3, stagger: 0.14, ease: 'power4.out' }, 0.45);

  // ===== Proyectos: la sección queda fija y cada proyecto se TRANSFORMA en el siguiente =====
  // Se crea primero porque fija la sección. La captura viaja al otro lado girando en 3D mientras la nueva se
  // revela en un círculo que crece; el texto sale hacia arriba y el nuevo entra desde abajo; el brillo de fondo
  // cambia al color de cada proyecto. Todo va atado al scroll (se puede ir y volver).
  const pin = document.querySelector('.h-pin');
  const panels = gsap.utils.toArray('.h-panel');
  const count = document.querySelector('.h-count');
  const bar = document.querySelector('.h-bar i');
  const PROJECT_COLORS = ['#d4a72c', '#e5383b', '#3b82f6']; // Mi Capital Urbano, Alflex, app contable

  // Funciona en escritorio y en celular; solo se desactiva en pantallas muy bajas (celular acostado)
  if (pin && panels.length > 1) mm.add('(min-height: 560px)', () => {
    const section = document.querySelector('.projects');
    section.classList.add('h-enabled', 'm-enabled');
    const glow = document.createElement('div');
    glow.className = 'm-glow';
    glow.setAttribute('aria-hidden', 'true');
    pin.prepend(glow);
    gsap.set(section, { '--pc': PROJECT_COLORS[0] });
    const steps = panels.length - 1;
    const parts = panels.map((panel) => ({
      media: panel.querySelector('.project-media'),
      text: panel.querySelector('.h-text'),
      kids: [...panel.querySelector('.h-text').children],
    }));
    // Profundidad del giro 3D fija desde el inicio en todas las capturas. Si se pone dentro de la animación,
    // en la primera captura crece desde 0 y la deforma al comenzar la primera transición.
    gsap.set(parts.map((p) => p.media), { transformPerspective: 1400 });

    // Al soltar el scroll: si avanzaste más de un 15% hacia el siguiente proyecto, pasa a ese; si no, vuelve al actual
    const snapToPanel = (value) => {
      const pos = (morph.scrollTrigger?.progress ?? value) * steps;
      const base = Math.floor(pos);
      const frac = pos - base;
      const goingDown = (morph.scrollTrigger?.direction ?? 1) > 0;
      const target = goingDown ? (frac > 0.15 ? base + 1 : base) : (frac < 0.85 ? base : base + 1);
      return gsap.utils.clamp(0, steps, target) / steps;
    };

    const morph = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: pin, pin: true, scrub: 0.8, invalidateOnRefresh: true,
        start: () => `top ${headerH()}px`,
        end: () => `+=${window.innerHeight * steps}`,
        snap: { snapTo: snapToPanel, duration: { min: 0.3, max: 0.8 }, delay: 0.05, ease: 'power2.inOut' },
        onUpdate: (self) => {
          count.textContent = String(Math.round(self.progress * steps) + 1).padStart(2, '0');
          gsap.set(bar, { scaleX: self.progress });
        },
      },
    });

    for (let i = 0; i < steps; i++) {
      const a = parts[i];
      const b = parts[i + 1];
      // distancia entre la captura actual y la siguiente (en escritorio se alternan de lado; en celular es 0)
      const dx = () => b.media.offsetLeft - a.media.offsetLeft;
      // giro en 3D: hacia el lado al que viaja; en celular (sin viaje) alterna y es más suave
      const tilt = () => (dx() === 0 ? (i % 2 ? 8 : -8) : dx() > 0 ? -16 : 16);

      morph
        // la captura actual viaja hacia la posición de la siguiente, girando y achicándose
        .to(a.media, { x: dx, rotationY: tilt, scale: 0.9, duration: 1, ease: 'power2.inOut' }, i)
        .to(a.media, { autoAlpha: 0, duration: 0.25 }, i + 0.75)
        // la siguiente parte desde donde está la actual y se revela en un círculo que crece
        .fromTo(b.media,
          { x: () => -dx(), rotationY: () => -tilt(), scale: 0.9, clipPath: 'circle(0% at 50% 50%)' },
          { x: 0, rotationY: 0, scale: 1, clipPath: 'circle(75% at 50% 50%)', duration: 1, ease: 'power2.inOut', immediateRender: true }, i)
        // el texto actual sale hacia arriba y el nuevo entra desde abajo
        .to(a.kids, { y: -36, autoAlpha: 0, stagger: { amount: 0.15 }, duration: 0.3, ease: 'power2.in' }, i + 0.05)
        .fromTo(b.kids, { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: { amount: 0.15 }, duration: 0.35, ease: 'power2.out', immediateRender: true }, i + 0.5)
        // el brillo de fondo cambia al color del proyecto siguiente
        .to(section, { '--pc': PROJECT_COLORS[(i + 1) % PROJECT_COLORS.length], duration: 1 }, i);
    }

    morph.set({}, {}, steps); // la línea de tiempo dura exactamente "steps": cada proyecto queda en i / steps

    // El primero aparece al llegar a la sección (se anima el contenedor del texto, no sus hijos, para no
    // chocar con la transformación que maneja el scroll)
    const enter = { trigger: pin, start: 'top 75%', once: true };
    gsap.fromTo(parts[0].media, { clipPath: 'inset(0% 100% 0% 0% round 14px)' },
      { clipPath: 'inset(0% 0% 0% 0% round 14px)', duration: 1.3, ease: 'power4.inOut', scrollTrigger: enter, clearProps: 'clipPath' });
    gsap.from(parts[0].text, { autoAlpha: 0, y: 30, duration: 0.9, ease, scrollTrigger: { ...enter, start: 'top 65%' } });

    return () => {
      section.classList.remove('h-enabled', 'm-enabled');
      glow.remove();
    };
  });

  // En pantallas muy bajas los proyectos van uno debajo del otro, con la animación de cortina
  mm.add('(max-height: 559px)', () => {
    panels.forEach((panel) => {
      const media = panel.querySelector('.project-media');
      const trigger = { trigger: panel, start: 'top 80%', once: true };
      gsap.fromTo(media, { clipPath: 'inset(0% 100% 0% 0% round 14px)' },
        { clipPath: 'inset(0% 0% 0% 0% round 14px)', duration: 1.2, ease: 'power4.inOut', scrollTrigger: trigger, clearProps: 'clipPath' });
      gsap.from(panel.querySelector('.h-text').children, { autoAlpha: 0, y: 24, duration: 0.8, ease, stagger: 0.07, scrollTrigger: { ...trigger, start: 'top 70%' } });
    });
  });

  // Barra de progreso de lectura
  gsap.to('.scroll-progress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

  // Hero: fondo, texto y capturas se mueven a distinta velocidad al hacer scroll
  gsap.to('.hero-bg', { yPercent: 25, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero-copy', { y: -60, autoAlpha: 0.35, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'center top', end: 'bottom top', scrub: true } });
  gsap.utils.toArray('.hero-visual .shot').forEach((shot, i) => {
    gsap.to(shot, { yPercent: [-12, -26, -40][i], ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  });

  // Hero: manchas de color y capturas siguen levemente al cursor (cada capa a distinta profundidad)
  if (finePointer) {
    const layers = [
      { el: document.querySelector('.hero-bg .blobs'), depth: 50 },
      ...gsap.utils.toArray('.hero-visual .shot').map((el, i) => ({ el, depth: [12, 22, 34][i] })),
    ].map(({ el, depth }) => ({ depth, x: gsap.quickTo(el, 'x', { duration: 1.1, ease }), y: gsap.quickTo(el, 'y', { duration: 1.1, ease }) }));
    document.querySelector('.hero').addEventListener('pointermove', (e) => {
      const dx = e.clientX / window.innerWidth - 0.5;
      const dy = e.clientY / window.innerHeight - 0.5;
      layers.forEach((l) => { l.x(dx * l.depth); l.y(dy * l.depth * 0.7); });
    });
  }

  // Títulos y textos de cada sección: aparecen subiendo
  const texts = gsap.utils.toArray('section:not(.hero) :is(.eyebrow, h2, .section-intro, .more-title, .more-intro, .about-lead, .timeline-title, .contact-note), .services-head .btn');
  gsap.set(texts, { autoAlpha: 0, y: 28 });
  ScrollTrigger.batch(texts, {
    start: 'top 88%', once: true,
    onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.8, ease, stagger: 0.08, overwrite: true }),
  });

  // Tarjetas de "Otros proyectos": entran en cascada (se limpia el transform para que funcione el hover)
  const cards = gsap.utils.toArray('.grid-3 .card');
  gsap.set(cards, { autoAlpha: 0, y: 48, scale: 0.97 });
  ScrollTrigger.batch(cards, {
    start: 'top 90%', once: true,
    onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, scale: 1, duration: 0.9, ease, stagger: 0.12, overwrite: true, clearProps: 'transform' }),
  });

  // ===== Servicios: tarjetas que se apilan =====
  const stackCards = gsap.utils.toArray('.stack-card');
  stackCards.forEach((card) => gsap.from(card, {
    autoAlpha: 0, duration: 0.8, ease, scrollTrigger: { trigger: card, start: 'top 90%', once: true },
  }));
  // Cada tarjeta se achica y oscurece un poco cuando la siguiente pasa por encima (escritorio y celular)
  stackCards.slice(0, -1).forEach((card, i) => {
    const next = stackCards[i + 1];
    gsap.to(card, {
      scale: 0.94, '--dim': 0.28, ease: 'none',
      scrollTrigger: {
        trigger: next, start: 'top bottom', scrub: true, invalidateOnRefresh: true,
        end: () => `top ${parseFloat(getComputedStyle(next).top) || headerH() + 40}px`,
      },
    });
  });

  // ===== Tecnologías: cintas infinitas de logos =====
  // Avanzan solas, aceleran con la velocidad del scroll, cambian de sentido al subir y frenan con el cursor encima.
  const marquees = gsap.utils.toArray('.marquee');
  let loops = [];
  let scrollDir = 1;
  const SPEED = 60; // px por segundo

  const buildLoops = () => {
    loops.forEach((l) => l.kill());
    loops = marquees.map((el) => {
      const track = el.querySelector('.marquee-track');
      track.querySelectorAll('[data-clone]').forEach((n) => n.remove());
      const items = [...track.children];
      el.classList.add('is-running');
      // Copias del grupo hasta cubrir el ancho (ocultas para lectores de pantalla)
      const addGroup = () => items.forEach((item) => {
        const copy = item.cloneNode(true);
        copy.setAttribute('data-clone', '');
        copy.setAttribute('aria-hidden', 'true');
        track.appendChild(copy);
      });
      addGroup();
      const period = track.children[items.length].offsetLeft - items[0].offsetLeft;
      while (track.scrollWidth < el.clientWidth + period * 2) addGroup();
      const right = el.dataset.direction === 'right';
      const loop = gsap.fromTo(track, { x: right ? -period : 0 }, {
        x: right ? 0 : -period, duration: period / SPEED, ease: 'none', repeat: -1,
        onReverseComplete() { this.totalTime(this.rawTime() + this.duration() * 100); },
      });
      loop.timeScale(scrollDir);
      el.onpointerenter = () => gsap.to(loop, { timeScale: scrollDir * 0.15, duration: 0.6, overwrite: true });
      el.onpointerleave = () => gsap.to(loop, { timeScale: scrollDir, duration: 0.8, overwrite: true });
      return loop;
    });
  };
  if (marquees.length) {
    buildLoops();
    // Rehacer las cintas si cambia el ancho de la ventana
    let lastWidth = window.innerWidth;
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { if (window.innerWidth !== lastWidth) { lastWidth = window.innerWidth; buildLoops(); } }, 250);
    });
    ScrollTrigger.create({
      trigger: '.tech', start: 'top bottom', end: 'bottom top',
      onUpdate: (self) => {
        scrollDir = self.direction;
        const boost = Math.min(Math.abs(self.getVelocity()) / 300, 5);
        loops.forEach((loop) => gsap.to(loop, {
          timeScale: scrollDir * (1 + boost), duration: 0.2, overwrite: true,
          onComplete: () => gsap.to(loop, { timeScale: scrollDir, duration: 1.2, ease: 'power2.out' }),
        }));
      },
    });
    // Las dos cintas entran desde lados opuestos
    marquees.forEach((el) => gsap.from(el, {
      autoAlpha: 0, x: el.dataset.direction === 'right' ? -120 : 120, duration: 1.2, ease,
      scrollTrigger: { trigger: el, start: 'top 92%', once: true },
    }));
  }

  mm.add('(max-width: 760px)', () => {
    gsap.utils.toArray('.tech-group').forEach((group) => {
      gsap.fromTo(group.querySelectorAll('.tech-icons li'), { autoAlpha: 0, scale: 0.6, y: 24 }, {
        autoAlpha: 1, scale: 1, y: 0, ease: 'back.out(1.7)', stagger: 0.12,
        scrollTrigger: { trigger: group, start: 'top 85%', end: 'top 35%', scrub: 0.6 },
      });
    });
  });

  // Cómo trabajo: los pasos entran, la línea se completa con el scroll y cada paso se "enciende" al llegar
  gsap.from('.steps li', {
    autoAlpha: 0, y: 32, duration: 0.7, ease: 'back.out(1.6)', stagger: 0.15,
    scrollTrigger: { trigger: '.steps', start: 'top 82%', once: true },
  });
  const stepsList = document.querySelector('.steps');
  const stepItems = gsap.utils.toArray('.steps li');
  if (stepsList) {
    stepsList.classList.add('is-scrubbed');
    const lightSteps = (progress) => {
      const reached = progress * (stepItems.length - 1) + 0.02;
      stepItems.forEach((li, i) => li.classList.toggle('is-active', i <= reached));
    };
    lightSteps(0);
    gsap.fromTo(stepsList, { '--progress': 0 }, {
      '--progress': 1, ease: 'none',
      scrollTrigger: { trigger: stepsList, start: 'top 75%', end: 'bottom 45%', scrub: 0.6, onUpdate: (self) => lightSteps(self.progress) },
    });
  }

  // ===== Sobre mí =====
  // Tarjeta de perfil: entra subiendo, el avatar aparece girando y los datos en cascada
  const profile = document.querySelector('.profile-card');
  if (profile) {
    const enter = { trigger: profile, start: 'top 85%', once: true };
    gsap.from(profile, { autoAlpha: 0, y: 40, duration: 1, ease, clearProps: 'transform', scrollTrigger: enter });
    gsap.from('.avatar', { autoAlpha: 0, scale: 0.5, rotation: -25, duration: 1.1, ease: 'back.out(1.7)', delay: 0.15, scrollTrigger: enter });
    gsap.from('.profile-card :is(.profile-name, .profile-role, .badge, .profile-facts > div, .profile-links)', {
      autoAlpha: 0, y: 16, duration: 0.6, ease, stagger: 0.07, delay: 0.3, scrollTrigger: enter,
    });
  }

  // Números: cuentan desde cero cuando aparecen
  gsap.from('.stats li', { autoAlpha: 0, y: 30, duration: 0.8, ease, stagger: 0.12, scrollTrigger: { trigger: '.stats', start: 'top 88%', once: true } });
  gsap.utils.toArray('[data-count]').forEach((el) => {
    const target = Number(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const counter = { value: 0 };
    el.textContent = `0${suffix}`;
    gsap.to(counter, {
      value: target, duration: 1.6, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      onUpdate: () => { el.textContent = `${Math.round(counter.value)}${suffix}`; },
    });
  });

  // Línea de tiempo: se dibuja con el scroll y cada etapa se enciende al llegar
  const timeline = document.querySelector('.timeline');
  const timelineItems = gsap.utils.toArray('.timeline li');
  if (timeline) {
    timeline.classList.add('is-scrubbed');
    const lightTimeline = (progress) => {
      const reached = progress * (timelineItems.length - 1) + 0.02;
      timelineItems.forEach((li, i) => li.classList.toggle('is-active', i <= reached));
    };
    lightTimeline(0);
    gsap.fromTo(timeline, { '--tl': 0 }, {
      '--tl': 1, ease: 'none',
      scrollTrigger: { trigger: timeline, start: 'top 70%', end: 'bottom 55%', scrub: 0.6, onUpdate: (self) => lightTimeline(self.progress) },
    });
    timelineItems.forEach((li) => gsap.from(li, {
      // entran desde abajo: si entraran desde el costado, antes de aparecer se saldrían de la pantalla
      autoAlpha: 0, y: 24, duration: 0.8, ease, scrollTrigger: { trigger: li, start: 'top 88%', once: true },
    }));
  }

  // Contacto: la tarjeta crece suavemente
  gsap.from('.contact', {
    autoAlpha: 0, y: 48, scale: 0.96, duration: 1, ease,
    scrollTrigger: { trigger: '.contact', start: 'top 85%', once: true },
  });

  // Botón principal "magnético": se acerca un poco al cursor
  if (finePointer) {
    document.querySelectorAll('.btn-primary').forEach((btn) => {
      const xTo = gsap.quickTo(btn, 'x', { duration: 0.4, ease });
      const yTo = gsap.quickTo(btn, 'y', { duration: 0.4, ease });
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.25);
        yTo((e.clientY - r.top - r.height / 2) * 0.35);
      });
      btn.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }

  // Recalcular posiciones cuando terminen de cargar las imágenes
  window.addEventListener('load', () => ScrollTrigger.refresh());
}
