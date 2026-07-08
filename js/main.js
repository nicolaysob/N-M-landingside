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

  compare.addEventListener('mousedown', (e) => {
    compareActive = true;
    setComparePosition(e.clientX);
    e.preventDefault();
  });

  compare.addEventListener('touchstart', (e) => {
    compareActive = true;
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
