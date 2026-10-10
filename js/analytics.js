/* =============================================
   Besøksstatistikk og hendelser
   =============================================

   Siden er klargjort for besøksstatistikk, men INGENTING sendes før
   `provider` er satt under. Når siden kjøres lokalt (localhost) logges
   hendelsene bare i nettleserkonsollen, slik at sporingen kan testes
   uten å sende data noe sted.

   Aktivere Plausible (anbefalt – uten cookies, data lagres i EU):
     1. Opprett konto på plausible.io og legg til domenet nmvaktmester.no
     2. Sett provider: 'plausible' under (og eventuelt scriptSrc fra
        Plausible-dashbordet hvis de gir deg en egen script-adresse)
     3. Legg til hendelsene under som «Custom event goals» i Plausible

   Aktivere Umami (alternativ, også uten cookies):
     1. Opprett nettsted i Umami og kopier «Website ID»
     2. Sett provider: 'umami' og umamiWebsiteId under

   Hendelser som sendes:
     Ring-klikk           – klikk på telefonnummer (med plassering)
     E-post-klikk         – klikk på e-postadresse (med plassering)
     Be om tilbud-klikk   – klikk på knapper som leder til skjemaet
     Skjema sendt         – vellykket innsending (side + valgte tjenester)
     Skjema feilet        – innsending som feilet
     Før/etter brukt      – noen har dratt i før/etter-slideren (per oppdrag)
     Oppdrag valgt        – hvilket oppdrag som ble valgt i galleriet
     Spørsmål åpnet       – hvilket spørsmål i «Ofte stilte spørsmål»
     Område valgt         – hvilken kommune som ble valgt på kartet
     404                  – noen havnet på en side som ikke finnes (med adresse)
*/

(() => {
  const ANALYSE = {
    provider: null, // 'plausible' | 'umami' | null (av)
    domain: 'nmvaktmester.no',
    scriptSrc: '', // tom = standardadresse for valgt leverandør
    umamiWebsiteId: '',
  };

  const isLocal = ['localhost', '127.0.0.1', '[::1]', ''].includes(window.location.hostname);
  const isProduction = [ANALYSE.domain, `www.${ANALYSE.domain}`].includes(window.location.hostname);

  function loadProvider() {
    if (!ANALYSE.provider || !isProduction) return;

    const script = document.createElement('script');
    script.defer = true;

    if (ANALYSE.provider === 'plausible') {
      window.plausible = window.plausible || function () {
        (window.plausible.q = window.plausible.q || []).push(arguments);
      };
      script.src = ANALYSE.scriptSrc || 'https://plausible.io/js/script.js';
      script.dataset.domain = ANALYSE.domain;
    } else if (ANALYSE.provider === 'umami') {
      if (!ANALYSE.umamiWebsiteId) return;
      script.src = ANALYSE.scriptSrc || 'https://cloud.umami.is/script.js';
      script.dataset.websiteId = ANALYSE.umamiWebsiteId;
    } else {
      return;
    }

    document.head.appendChild(script);
  }

  function track(name, props = {}) {
    if (isLocal) console.info('[analyse]', name, props);
    if (!isProduction) return;

    if (ANALYSE.provider === 'plausible' && window.plausible) {
      window.plausible(name, { props });
    } else if (ANALYSE.provider === 'umami' && window.umami) {
      window.umami.track(name, props);
    }
  }

  // Hvor på siden et klikk skjedde (hero, meny, kontakt, mobilknapp ...)
  function placement(el) {
    const area = el.closest('[data-track-area]');
    if (area) return area.dataset.trackArea;
    if (el.closest('.header')) return 'meny';
    if (el.closest('.footer')) return 'bunn';
    const section = el.closest('section[id]');
    return section ? section.id : 'annet';
  }

  function page() {
    return window.location.pathname.split('/').pop().replace('.html', '') || 'forside';
  }

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href') || '';
    const props = { plassering: placement(link), side: page() };

    if (href.startsWith('tel:')) {
      track('Ring-klikk', props);
    } else if (href.startsWith('mailto:')) {
      track('E-post-klikk', props);
    } else if (/#kontakt(-avtale)?$/.test(href)) {
      track('Be om tilbud-klikk', props);
    }
  });

  loadProvider();
  window.nmTrack = track;

  // Døde lenker: hvilke adresser folk prøver som ikke finnes
  if (document.body.dataset.side === '404') {
    track('404', { sti: window.location.pathname });
  }
})();
