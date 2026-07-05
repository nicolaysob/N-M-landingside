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
