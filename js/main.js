// Mobile menu
const header = document.querySelector('.header');
const menuBtn = document.querySelector('.header__menu-btn');
const navLinks = document.querySelectorAll('.header__links a, .header__phone');

menuBtn.addEventListener('click', () => {
  const isOpen = header.classList.toggle('header--open');
  menuBtn.setAttribute('aria-expanded', isOpen);
});

navLinks.forEach(link => {
  link.addEventListener('click', () => {
    header.classList.remove('header--open');
    menuBtn.setAttribute('aria-expanded', 'false');
  });
});

// Header solidifies slightly when scrolling
function updateHeaderScrollState() {
  header.classList.toggle('header--scrolled', window.scrollY > 12);
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

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });

      if (response.ok) {
        form.reset();
        formStatus.textContent = 'Takk for henvendelsen! Vi tar kontakt så snart vi kan.';
        formStatus.classList.add('form-note--success');
      } else {
        throw new Error('Submit failed');
      }
    } catch {
      formStatus.textContent = 'Noe gikk galt. Prøv igjen, eller send e-post til post@nmholdingas.com.';
      formStatus.classList.add('form-note--error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send forespørsel';
    }
  });
}

// Before/after compare slider
const compare = document.getElementById('compare');

if (compare) {
  const compareAfter = document.getElementById('compare-after');
  const compareDivider = document.getElementById('compare-divider');
  let compareActive = false;

  function setComparePosition(clientX) {
    const rect = compare.getBoundingClientRect();
    let percent = ((clientX - rect.left) / rect.width) * 100;
    percent = Math.max(1, Math.min(99, percent));
    const clip = `inset(0 ${(100 - percent).toFixed(1)}% 0 0)`;
    compareAfter.style.clipPath = clip;
    compareAfter.style.webkitClipPath = clip;
    compareDivider.style.left = `${percent.toFixed(1)}%`;
  }

  setComparePosition(compare.getBoundingClientRect().left + compare.getBoundingClientRect().width / 2);

  const stopHint = () => compare.classList.remove('compare--hint');

  compare.addEventListener('mousedown', (e) => {
    compareActive = true;
    stopHint();
    setComparePosition(e.clientX);
    e.preventDefault();
  });

  compare.addEventListener('touchstart', (e) => {
    compareActive = true;
    stopHint();
    setComparePosition(e.touches[0].clientX);
  }, { passive: true });

  window.addEventListener('mousemove', (e) => {
    if (!compareActive) return;
    setComparePosition(e.clientX);
  });

  window.addEventListener('touchmove', (e) => {
    if (!compareActive) return;
    setComparePosition(e.touches[0].clientX);
    e.preventDefault();
  }, { passive: false });

  window.addEventListener('mouseup', () => {
    compareActive = false;
  });

  window.addEventListener('touchend', () => {
    compareActive = false;
  });
}

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Scroll reveal
const revealItems = document.querySelectorAll(
  '.service-card, .work-card, .timeline__item, .area, .trust-strip__inner, .contact__info, .contact__form, .section__header'
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

// Count-up stats in hero
const statNodes = document.querySelectorAll('.hero-card__stat[data-count]');

function animateCount(el) {
  const target = Number(el.dataset.count);
  const suffix = el.dataset.suffix || '';
  const duration = 1100;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(target * eased);
    el.textContent = `${value}${suffix}`;
    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

if (statNodes.length && 'IntersectionObserver' in window) {
  const statsObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      if (prefersReducedMotion) {
        const el = entry.target;
        el.textContent = `${el.dataset.count}${el.dataset.suffix || ''}`;
      } else {
        animateCount(entry.target);
      }
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.5 });

  statNodes.forEach((node) => statsObserver.observe(node));
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

  sections.forEach((section) => {
    if (section.offsetTop <= marker) currentId = section.id;
  });

  menuSectionLinks.forEach((link) => {
    const href = link.getAttribute('href') || '';
    const id = href.startsWith('#') ? href.slice(1) : '';
    link.classList.toggle('is-active', id === currentId);
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
