(() => {
  const footer = document.querySelector('.de-footer, footer.footer');
  if (!footer) return;
  const isInterior = document.body.classList.contains('de-legal-page') || document.body.classList.contains('de-contact-page');
  const links = isInterior
    ? '<a href="/de/agb">AGB</a><a href="/de/impressum">Impressum</a><a href="/de/datenschutz">Datenschutz</a><a href="/de/kontakt">Kontakt</a><a href="/de/nutzungsbedingungen">Nutzungsbedingungen</a><a href="/de/kuendigung">Kündigung</a>'
    : '<a href="/de/agb">AGB</a><a href="/de/impressum">Impressum</a><a href="/de/abo-verwaltung">Abo Verwaltung</a><a href="/de/datenschutz">Datenschutz</a><a href="/de/nutzungsbedingungen">Nutzungsbedingungen</a><a href="/de/widerrufsformular">Widerrufsformular</a><a href="/de/kontakt">Hilfe &amp; Kontakt</a>';
  footer.classList.add('de-footer', isInterior ? 'de-footer--legal' : 'de-footer--landing');
  footer.innerHTML = `<nav class="de-footer__links" aria-label="Rechtliche Informationen">${links}</nav><p class="de-footer__copy">©Yumetics Alle Rechte vorbehalten</p>`;
})();
