/* Aranrural · animaciones */
(() => {
  'use strict';

  /* barra de progreso de lectura (funciona tambien con movimiento reducido) */
  const progress = document.createElement('div');
  progress.className = 'progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.append(progress);

  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  if (reduce.matches) return;

  /* division del titulo en letras animadas */
  document.querySelectorAll('.hero h1').forEach(h1 => {
    let i = 0;
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          for (const ch of n.textContent) {
            if (ch === ' ') { frag.append(' '); continue; }
            const s = document.createElement('span');
            s.className = 'ltr';
            s.style.setProperty('--i', i++);
            s.textContent = ch;
            frag.append(s);
          }
          n.replaceWith(frag);
        } else if (n.nodeType === Node.ELEMENT_NODE) {
          walk(n);
        }
      });
    };
    walk(h1);
  });

  /* entrada escalonada de los enlaces de la barra */
  document.querySelectorAll('.bar nav a').forEach((a, i) => a.style.setProperty('--i', i));

  /* revelado al hacer scroll */
  const groups = [
    ['.def > div', 120],
    ['.pair .frame', 140],
    ['.index', 0],
    ['.casa', 110],
    ['footer', 0],
  ];
  const targets = [];
  groups.forEach(([sel, step]) => {
    document.querySelectorAll(sel).forEach((el, i) => {
      el.classList.add('rv');
      el.style.setProperty('--i', step ? Math.min(i, 4) : 0);
      targets.push(el);
    });
  });
  document.querySelectorAll('.contact').forEach(c => {
    [...c.children].forEach((a, i) => a.style.setProperty('--i', i));
  });

  const io = new IntersectionObserver(ents => {
    ents.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });
  targets.forEach(el => io.observe(el));

  /* parallax de portada + parallax de las fotos + progreso */
  const heroes = [...document.querySelectorAll('.hero')];
  const pair = document.querySelector('.pair');
  let ticking = false;

  const update = () => {
    ticking = false;
    const y = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
    heroes.forEach(h => h.style.setProperty('--py', Math.min(y, h.offsetHeight).toFixed(1)));
    if (pair) {
      const r = pair.getBoundingClientRect();
      const p = (innerHeight - r.top) / (innerHeight + r.height) - 0.5;
      pair.style.setProperty('--py', (p * 80).toFixed(1));
    }
  };

  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }, { passive: true });
  update();

  /* inclinacion 3D de las fotos al mover el raton */
  if (pair && matchMedia('(hover:hover)').matches) {
    const frames = [...pair.querySelectorAll('.frame')];
    pair.addEventListener('pointermove', e => {
      const r = pair.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      frames.forEach((f, i) => f.style.setProperty('--rot', (x * (i ? -8 : 8)).toFixed(2)));
    });
    pair.addEventListener('pointerleave', () => {
      frames.forEach(f => f.style.setProperty('--rot', 0));
    });
  }

  /* indice lateral: resaltado segun la seccion visible */
  const links = [...document.querySelectorAll('.index a')];
  if (links.length) {
    const map = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
    const spy = new IntersectionObserver(ents => {
      ents.forEach(e => {
        if (!e.isIntersecting) return;
        links.forEach(a => a.classList.remove('active'));
        map.get(e.target.id)?.classList.add('active');
      });
    }, { rootMargin: ' -30% 0px -60% 0px' });
    map.forEach((_, id) => {
      const s = document.getElementById(id);
      if (s) spy.observe(s);
    });
  }

  /* desvanecimiento suave al navegar a otra pagina */
  addEventListener('click', e => {
    const a = e.target.closest('a');
    if (!a || a.target || a.hasAttribute('download') ||
        e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    let url;
    try { url = new URL(a.href, location.href); } catch { return; }
    if (url.origin !== location.origin || (url.pathname === location.pathname && url.hash)) return;
    e.preventDefault();
    document.body.classList.add('leaving');
    setTimeout(() => location.href = url.href, 280);
  });
})();
