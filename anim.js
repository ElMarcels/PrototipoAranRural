/* Aranrural · animaciones */
(() => {
  'use strict';

  /* barra de progreso de lectura (funciona tambien con movimiento reducido) */
  const progress = document.createElement('div');
  progress.className = 'progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.append(progress);

  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  /* carrousel de fotos: dos capas que se funden, siempre una sola foto visible */
  const carousel = document.querySelector('.carousel');
  if (carousel) {
    const photos = [...carousel.querySelectorAll('.carousel-data img')].map(img => ({
      src: img.getAttribute('src'),
      alt: img.getAttribute('alt') || '',
      title: img.dataset.title || '',
      text: img.dataset.text || ''
    })).filter(p => p.src);
    const layers = [...carousel.querySelectorAll('.carousel-photo')];
    const cap = carousel.querySelector('.cap');
    const dotsWrap = carousel.querySelector('.dots');
    const prev = carousel.querySelector('.nav.prev');
    const next = carousel.querySelector('.nav.next');
    const every = 5000;
    let index = 0;
    let front = 0;
    let timer = null;

    if (photos.length && layers.length >= 2) {
      photos.forEach(p => { const pre = new Image(); pre.src = p.src; });

      /* los puntos se crean automaticamente segun el numero de fotos */
      if (dotsWrap) dotsWrap.replaceChildren();
      const dots = photos.map((_, i) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'dot';
        dot.setAttribute('aria-label', `Anar ara foto ${i + 1}`);
        dotsWrap?.append(dot);
        return dot;
      });

      const mark = () => {
        dots.forEach((d, i) => {
          const active = i === index;
          d.classList.toggle('is-active', active);
          if (active) d.setAttribute('aria-current', 'true');
          else d.removeAttribute('aria-current');
        });
      };

      let token = 0;
      const transitions = 'opacity .9s ease, transform .9s ease';
      const show = n => {
        const previous = index;
        index = ((n % photos.length) + photos.length) % photos.length;
        /* +1 = entra desde la derecha, -1 = entra desde la izquierda */
        const dir = index === previous ? 1 : (n >= previous ? 1 : -1);
        mark();
        const photo = photos[index];
        const my = ++token;
        const back = layers[1 - front];
        const old = layers[front];
        back.alt = '';
        back.setAttribute('aria-hidden', 'true');
        let revealed = false;
        const reveal = () => {
          if (revealed || my !== token) return;
          revealed = true;
          back.onload = null;

          /* coloca la foto entrante desplazada y algo ampliada, sin animar todavia */
          back.style.transition = 'none';
          back.style.transform = `translateX(${9 * dir}%) scale(1.05)`;
          back.style.zIndex = '2';
          old.style.zIndex = '1';
          void back.offsetWidth;

          /* ahora si: fundido + deslizamiento + zoom suave */
          back.style.transition = transitions;
          old.style.transition = transitions;
          requestAnimationFrame(() => {
            back.style.opacity = '1';
            back.style.transform = 'translateX(0) scale(1)';
            old.style.opacity = '0';
            old.style.transform = `translateX(${-5 * dir}%) scale(.99)`;
          });

          old.alt = '';
          old.setAttribute('aria-hidden', 'true');
          back.alt = photo.alt;
          back.removeAttribute('aria-hidden');
          front = 1 - front;
          if (cap) {
            const strong = cap.querySelector('strong');
            const em = cap.querySelector('em');
            if (strong) strong.textContent = photo.title;
            if (em) em.textContent = photo.text;
          }
        };
        back.onload = reveal;
        back.src = photo.src;
        if (back.complete) reveal();
      };

      const stop = () => {
        clearInterval(timer);
        timer = null;
      };

      const restart = () => {
        stop();
        if (photos.length > 1) timer = setInterval(() => show(index + 1), every);
      };

      if (photos.length < 2) {
        if (prev) prev.hidden = true;
        if (next) next.hidden = true;
        if (dotsWrap) dotsWrap.hidden = true;
      }

      prev?.addEventListener('click', () => { show(index - 1); restart(); });
      next?.addEventListener('click', () => { show(index + 1); restart(); });
      dots.forEach((d, i) => d.addEventListener('click', () => { show(i); restart(); }));

      carousel.addEventListener('keydown', e => {
        if (e.key === 'ArrowLeft') { show(index - 1); restart(); }
        else if (e.key === 'ArrowRight') { show(index + 1); restart(); }
      });

      /* deslizar con el dedo o el raton */
      let startX = null;
      carousel.addEventListener('pointerdown', e => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        startX = e.clientX;
      });
      carousel.addEventListener('pointerup', e => {
        if (startX === null) return;
        const dx = e.clientX - startX;
        startX = null;
        if (Math.abs(dx) < 45) return;
        show(index + (dx < 0 ? 1 : -1));
        restart();
      });
      carousel.addEventListener('pointercancel', () => { startX = null; });

      /* no avanzar si la pestaña no se ve */
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) stop(); else restart();
      });

      mark();
      restart();
    }
  }

  /* la tarjeta crece al pasar el cursor: guarda la proporcion real de cada foto */
  document.querySelectorAll('.casa .frame img').forEach(img => {
    const frame = img.closest('.frame');
    if (!frame) return;
    const setRatio = () => {
      if (!img.naturalWidth || !img.naturalHeight) return;
      frame.style.setProperty('--ar', `${img.naturalWidth} / ${img.naturalHeight}`);
    };
    if (img.complete) setRatio();
    else img.addEventListener('load', setRatio, { once: true });
  });

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

  /* revelado al hacer scroll (el carrusel se deja fuera: siempre visible) */
  const groups = [
    ['.def > div', 120],
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

  /* parallax de portada + progreso */
  const heroes = [...document.querySelectorAll('.hero')];
  let ticking = false;

  const update = () => {
    ticking = false;
    const y = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
    heroes.forEach(h => h.style.setProperty('--py', Math.min(y, h.offsetHeight).toFixed(1)));
  };

  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }, { passive: true });
  update();

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
