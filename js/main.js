// Mobile menu
const header = document.querySelector('.header');
const menuBtn = document.querySelector('.header__menu-btn');
const navLinks = document.querySelectorAll('.header__links a, .header__phone');

function setMenuOpen(isOpen) {
  header.classList.toggle('header--open', isOpen);
  menuBtn.setAttribute('aria-expanded', String(isOpen));
  menuBtn.setAttribute('aria-label', isOpen ? 'Lukk meny' : 'Åpne meny');
  document.body.style.overflow = isOpen ? 'hidden' : '';
}

menuBtn.addEventListener('click', () => {
  setMenuOpen(!header.classList.contains('header--open'));
});

navLinks.forEach((link) => {
  link.addEventListener('click', () => setMenuOpen(false));
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') setMenuOpen(false);
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 900) setMenuOpen(false);
});

// Header solidifies slightly when scrolling
function updateHeaderScrollState() {
  header.classList.toggle('header--scrolled', window.scrollY > 40);
}

updateHeaderScrollState();
window.addEventListener('scroll', updateHeaderScrollState, { passive: true });

// Contact form (Formspree)
const form = document.getElementById('contact-form');

if (form) {
  const submitBtn = document.getElementById('contact-submit');
  const formStatus = document.getElementById('form-status');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sender...';
    formStatus.textContent = '';
    formStatus.classList.remove('form-note--success', 'form-note--error');

    const data = new FormData(form);
    // Flere avkryssede tjenester sendes som én lesbar linje i e-posten
    const services = data.getAll('tjenester');
    data.delete('tjenester');
    if (services.length) data.set('tjenester', services.join(', '));
    const trackProps = { side: data.get('side') || 'Forside', tjenester: services.join(', ') || 'ikke valgt' };

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' },
      });

      if (response.ok) {
        form.reset();
        formStatus.textContent = 'Takk for henvendelsen! Vi tar kontakt så snart vi kan.';
        formStatus.classList.add('form-note--success');
        window.nmTrack?.('Skjema sendt', trackProps);
      } else {
        throw new Error('Submit failed');
      }
    } catch {
      formStatus.textContent = 'Noe gikk galt. Prøv igjen, eller send e-post til vaktmester.service@outlook.com.';
      formStatus.classList.add('form-note--error');
      window.nmTrack?.('Skjema feilet', trackProps);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send forespørsel';
    }
  });
}

// Before/after compare sliders (mus, touch og tastatur)
document.querySelectorAll('.compare').forEach((compare) => {
  const compareAfter = compare.querySelector('.compare__after');
  const compareDivider = compare.querySelector('.compare__divider');
  if (!compareAfter || !compareDivider) return;

  let compareActive = false;
  let comparePercent = 50;
  const trackedTitles = new Set();

  function setComparePercent(percent) {
    comparePercent = Math.max(1, Math.min(99, percent));
    // Clip left side of after-image so left of handle = før, right = etter
    const clip = `inset(0 0 0 ${comparePercent.toFixed(1)}%)`;
    compareAfter.style.clipPath = clip;
    compareAfter.style.webkitClipPath = clip;
    compareDivider.style.left = `${comparePercent.toFixed(1)}%`;
    compare.setAttribute('aria-valuenow', String(Math.round(comparePercent)));
  }

  function setComparePosition(clientX) {
    const rect = compare.getBoundingClientRect();
    setComparePercent(((clientX - rect.left) / rect.width) * 100);
  }

  function startCompare() {
    compare.classList.remove('compare--hint');
    const title = compare.dataset.title || 'ukjent';
    if (trackedTitles.has(title)) return;
    trackedTitles.add(title);
    window.nmTrack?.('Før/etter brukt', { bilde: title });
  }

  // Brukes av galleriet når et nytt oppdrag vises
  compare.resetCompare = () => {
    setComparePercent(50);
    compare.classList.remove('compare--hint');
    void compare.offsetWidth;
    compare.classList.add('compare--hint');
  };

  setComparePercent(50);

  compare.addEventListener('pointerdown', (e) => {
    compareActive = true;
    startCompare();
    setComparePosition(e.clientX);
    compare.setPointerCapture(e.pointerId);
    if (e.pointerType === 'mouse') e.preventDefault();
  });

  compare.addEventListener('pointermove', (e) => {
    if (!compareActive) return;
    setComparePosition(e.clientX);
  });

  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((type) => {
    compare.addEventListener(type, () => {
      compareActive = false;
    });
  });

  compare.addEventListener('keydown', (e) => {
    const steps = { ArrowLeft: -5, ArrowDown: -5, ArrowRight: 5, ArrowUp: 5, PageDown: -20, PageUp: 20 };
    if (e.key in steps) {
      setComparePercent(comparePercent + steps[e.key]);
    } else if (e.key === 'Home') {
      setComparePercent(1);
    } else if (e.key === 'End') {
      setComparePercent(99);
    } else {
      return;
    }
    e.preventDefault();
    startCompare();
  });
});

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Scroll reveal
const revealItems = document.querySelectorAll(
  '.service-card, .showcase__stage, .showcase__side, .timeline__item, .area, .faq__item, .trust-strip__inner, .contact__info, .contact__form, .section__header'
);

if (!prefersReducedMotion && 'IntersectionObserver' in window) {
  revealItems.forEach((item, index) => {
    item.classList.add('reveal');
    item.style.transitionDelay = `${Math.min(index % 6, 5) * 0.06}s`;
  });

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.16, rootMargin: '0px 0px -40px 0px' });

  revealItems.forEach((item) => revealObserver.observe(item));
}

// Active nav link while scrolling sections
const sectionIds = ['tjenester', 'bilder', 'om-oss', 'omrade', 'kontakt'];
const sections = sectionIds
  .map((id) => document.getElementById(id))
  .filter(Boolean);
const menuSectionLinks = document.querySelectorAll('.header__links a:not(.btn)');

function setActiveNav() {
  const marker = window.scrollY + header.offsetHeight + 24;
  let currentId = null;
  const page = (window.location.pathname.split('/').pop() || 'index.html');

  sections.forEach((section) => {
    if (section.offsetTop <= marker) currentId = section.id;
  });

  menuSectionLinks.forEach((link) => {
    const href = link.getAttribute('href') || '';
    const id = href.startsWith('#') ? href.slice(1) : '';
    const isCurrentPage = href === page || href.endsWith('/' + page);
    link.classList.toggle('is-active', id === currentId || isCurrentPage);
  });
}

setActiveNav();
window.addEventListener('scroll', setActiveNav, { passive: true });

// Scroll progress bar
const progressBar = document.getElementById('scroll-progress-bar');

function updateScrollProgress() {
  if (!progressBar) return;
  const doc = document.documentElement;
  const max = doc.scrollHeight - doc.clientHeight;
  const value = max > 0 ? (window.scrollY / max) * 100 : 0;
  progressBar.style.width = `${value}%`;
}

updateScrollProgress();
window.addEventListener('scroll', updateScrollProgress, { passive: true });
window.addEventListener('resize', updateScrollProgress);

// Timeline reveal-on-scroll
const timeline = document.querySelector('.timeline');
const timelineItems = document.querySelectorAll('.timeline__item');

if (timeline && 'IntersectionObserver' in window) {
  const timelineObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      timeline.classList.add('is-drawn');
    });
  }, { threshold: 0.2 });

  timelineObserver.observe(timeline);

  const itemObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-active');
    });
  }, { threshold: 0.35, rootMargin: '0px 0px -10% 0px' });

  timelineItems.forEach((item) => itemObserver.observe(item));
}

if (prefersReducedMotion) {
  timeline?.classList.add('is-drawn');
  timelineItems.forEach((item) => item.classList.add('is-active'));
  if (progressBar) progressBar.style.transition = 'none';
}

// Mobil: fast knapperad (Ring / Be om tilbud) etter at hero er scrollet forbi,
// skjules igjen når kontaktskjemaet er synlig så den ikke dekker skjemaet.
const mobileCta = document.querySelector('.mobile-cta');

if (mobileCta && 'IntersectionObserver' in window) {
  const heroEl = document.querySelector('.hero, .page-hero');
  const contactEl = document.querySelector('.section--contact');
  let pastHero = !heroEl;
  let contactVisible = false;

  const updateMobileCta = () => {
    const show = pastHero && !contactVisible;
    mobileCta.classList.toggle('is-visible', show);
    mobileCta.setAttribute('aria-hidden', String(!show));
    mobileCta.querySelectorAll('a').forEach((a) => {
      a.tabIndex = show ? 0 : -1;
    });
  };

  const ctaObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.target === heroEl) pastHero = !entry.isIntersecting;
      if (entry.target === contactEl) contactVisible = entry.isIntersecting;
    });
    updateMobileCta();
  }, { threshold: 0, rootMargin: '0px 0px -25% 0px' });

  if (heroEl) ctaObserver.observe(heroEl);
  if (contactEl) ctaObserver.observe(contactEl);
  updateMobileCta();
}

// Ofte stilte spørsmål – hvilke spørsmål folk faktisk åpner
document.querySelectorAll('.faq__item').forEach((item) => {
  item.addEventListener('toggle', () => {
    if (!item.open) return;
    const question = item.querySelector('summary')?.textContent.trim();
    window.nmTrack?.('Spørsmål åpnet', { sporsmal: question || 'ukjent' });
  });
});

// Kart over området: velg kommune for å fremheve og zoome inn på omrisset
const areaMap = document.querySelector('.area-map');

if (areaMap) {
  const areaPicks = document.querySelectorAll('.area-pick');
  const areaCanvas = areaMap.querySelector('.area-map__canvas');
  const areaBadge = areaMap.querySelector('.area-map__badge');
  const areaRegions = areaMap.querySelectorAll('.area-map__region');
  const [, , MAP_W, MAP_H] = areaMap.querySelector('.area-map__svg').getAttribute('viewBox').split(' ').map(Number);

  function redrawOutline(region) {
    if (prefersReducedMotion) return;
    const line = region.querySelector('.area-map__line');
    line.style.transition = 'none';
    line.style.strokeDashoffset = '1';
    line.getBoundingClientRect();
    line.style.transition = '';
    line.style.strokeDashoffset = '';
  }

  function zoomToArea(area) {
    const region = areaMap.querySelector(`.area-map__region[data-area="${area}"]`);
    if (!region) {
      areaCanvas.style.transform = '';
      return;
    }
    // data-focus = landdelen av kommunen (x y bredde høyde), så sjøområdet ikke styrer zoomen
    const [x, y, width, height] = region.dataset.focus.split(' ').map(Number);
    const box = { x, y, width, height };
    const scale = Math.min(1.5, 0.9 / Math.max(box.width / MAP_W, box.height / MAP_H));
    if (scale <= 1.02) {
      areaCanvas.style.transform = '';
      return;
    }
    // Midtstill kommunen, men aldri vis kanten utenfor kartbildet
    const clamp = (v) => Math.min(0, Math.max(1 - scale, v));
    const tx = clamp(0.5 - ((box.x + box.width / 2) / MAP_W) * scale);
    const ty = clamp(0.5 - ((box.y + box.height / 2) / MAP_H) * scale);
    areaCanvas.style.transform = `translate(${(tx * 100).toFixed(2)}%, ${(ty * 100).toFixed(2)}%) scale(${scale.toFixed(3)})`;
  }

  function selectArea(area) {
    areaMap.dataset.active = area;
    areaPicks.forEach((btn) => {
      const isActive = btn.dataset.area === area;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });
    const activeRegion = areaMap.querySelector(`.area-map__region[data-area="${area}"]`);
    const name = activeRegion ? activeRegion.dataset.name : 'Hele området';
    areaBadge.textContent = name;
    areaRegions.forEach((region) => {
      const isActive = region === activeRegion;
      region.classList.toggle('is-active', isActive);
      region.classList.toggle('is-dimmed', Boolean(activeRegion) && !isActive);
      if (!activeRegion || isActive) redrawOutline(region);
    });
    zoomToArea(area);
    window.nmTrack?.('Område valgt', { omrade: name });
  }

  areaPicks.forEach((btn) => {
    btn.addEventListener('click', () => selectArea(btn.dataset.area));
  });

  // Trykk på en kommune i kartet; trykk igjen for å se hele området
  areaRegions.forEach((region) => {
    region.addEventListener('click', () => {
      selectArea(areaMap.dataset.active === region.dataset.area ? 'alle' : region.dataset.area);
    });
  });

  // Tegn omrisset første gang kartet kommer til syne
  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    areaMap.classList.add('is-waiting');
    const mapObserver = new IntersectionObserver((entries, observer) => {
      if (!entries[0].isIntersecting) return;
      areaMap.classList.remove('is-waiting');
      observer.disconnect();
    }, { threshold: 0.4 });
    mapObserver.observe(areaMap);
  }
}

// Galleri: bytt oppdrag i det store før/etter-bildet
const showcase = document.querySelector('.showcase');

if (showcase) {
  const stage = showcase.querySelector('.showcase__stage');
  const stageCompare = stage.querySelector('.compare');
  const stageBefore = stage.querySelector('.compare__before');
  const stageAfter = stage.querySelector('.compare__after');
  const stageCaption = stage.querySelector('.showcase__caption');
  const jobs = showcase.querySelectorAll('.job');
  const srcsetFor = (base) => `${base}-600.webp 600w, ${base}.webp 900w`;

  function loadInto(img, base) {
    img.loading = 'eager';
    img.srcset = srcsetFor(base);
    img.src = `${base}.jpg`;
    return img.decode ? img.decode().catch(() => {}) : Promise.resolve();
  }

  jobs.forEach((job) => {
    job.addEventListener('click', async () => {
      if (job.classList.contains('is-active')) return;
      const { title, before, after, alt } = job.dataset;

      jobs.forEach((other) => {
        const isActive = other === job;
        other.classList.toggle('is-active', isActive);
        other.setAttribute('aria-pressed', String(isActive));
      });

      stage.classList.add('is-switching');
      stageCaption.textContent = title;
      stageCompare.dataset.title = title;
      stageCompare.setAttribute('aria-label', `Før og etter: ${title}. Dra eller bruk piltastene for å se forskjellen.`);
      stageBefore.alt = alt;

      await Promise.all([loadInto(stageBefore, before), loadInto(stageAfter, after)]);
      stageCompare.resetCompare?.();
      stage.classList.remove('is-switching');

      // På mobil ligger valgene under bildet – sørg for at bildet synes
      const rect = stage.getBoundingClientRect();
      if (rect.top < header.offsetHeight || rect.bottom > window.innerHeight) {
        stage.scrollIntoView({ block: 'center', behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      }

      window.nmTrack?.('Oppdrag valgt', { oppdrag: title });
    });
  });

  // Last de andre før/etter-bildene i bakgrunnen når galleriet nærmer seg
  if ('IntersectionObserver' in window) {
    const preloadObserver = new IntersectionObserver((entries, observer) => {
      if (!entries[0].isIntersecting) return;
      observer.disconnect();
      jobs.forEach((job) => {
        [job.dataset.before, job.dataset.after].forEach((base) => {
          const img = new Image();
          img.sizes = stageBefore.sizes;
          img.srcset = srcsetFor(base);
        });
      });
    }, { rootMargin: '300px 0px' });
    preloadObserver.observe(stage);
  }
}
