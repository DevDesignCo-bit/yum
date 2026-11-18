(() => {
  const translations = new Map([
    ['Home', 'Startseite'], ['Stats', 'Statistik'], ['Cooking Planner', 'Essensplan'], ['My Profile', 'Mein Profil'], ['Today', 'Heute'],
    ['Start Fasting', 'Fasten starten'], ['Consumed', 'Verzehrt'], ['Carbs', 'Kohlenhydrate'], ['Fats', 'Fette'], ['Proteins', 'Proteine'],
    ['Recent Meals', 'Aktuelle Mahlzeiten'], ['Water', 'Wasser'], ['Activate Fasting', 'Fasten aktivieren'], ['Your fasting is off', 'Dein Fasten ist aus'],
    ['Activate', 'Aktivieren'], ['Weight', 'Gewicht'], ['FAQ', 'FAQ'], ['Contact Us', 'Hilfe & Kontakt'], ['TC', 'Nutzungsbedingungen'],
    ['Select character', 'Begleiter auswählen'], ['Homemade meals', 'Hausgemachte Mahlzeiten'], ['Veggie Daily', 'Gemüse täglich'], ['Tropical Boost', 'Tropischer Boost'],
    ['Select', 'Auswählen'], ['Backgrounds Colors', 'Hintergrundfarben'], ['Previous character', 'Vorheriger Begleiter'], ['Next character', 'Nächster Begleiter'],
    ['Close', 'Schließen'], ['Food added', 'Mahlzeit hinzugefügt'], ['Fasting Ended', 'Fasten beendet']
  ]);
  const translate = () => {
    document.title = 'Startseite — Yumetics';
    document.querySelectorAll('.app-navbar-mascot').forEach((image) => { image.src = '/assets/de/yumetics-pot.gif'; image.alt = ''; });
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => { const value = node.nodeValue.trim(); if (translations.has(value)) node.nodeValue = node.nodeValue.replace(value, translations.get(value)); });
    document.querySelectorAll('[aria-label]').forEach((element) => { const label = element.getAttribute('aria-label'); if (translations.has(label)) element.setAttribute('aria-label', translations.get(label)); });
    const modal = document.querySelector('#store-modal');
    modal?.querySelectorAll('[data-store-desc]').forEach((item) => {
      if (item.dataset.petId === 'pot') item.textContent = 'Dieser Begleiter motiviert dich zu mehr selbstgekochten Mahlzeiten. Einfach, lecker und gut für dich.';
      if (item.dataset.petId === 'carrot') item.textContent = 'Dieser Begleiter motiviert dich, mehr Gemüse zu essen. Knackig, bunt und gut für dich.';
      if (item.dataset.petId === 'banana') item.textContent = 'Dieser Begleiter motiviert dich, mehr Obst zu essen. Schnell, süß und voller Energie.';
    });
    const footer = document.querySelector('.footer-links');
    if (footer) footer.innerHTML = '<li><a href="/de/abo-verwaltung">Abo Verwaltung</a></li><li><a href="/de/nutzungsbedingungen">Nutzungsbedingungen</a></li><li><a href="/de/widerrufsbelehrung">Widerrufsbelehrung</a></li><li><a href="/de/widerrufsformular">Widerrufsformular</a></li><li><a href="/de/kontakt">Hilfe &amp; Kontakt</a></li><li><a href="/de/impressum">Impressum</a></li>';
    document.querySelectorAll('a[href="/"]').forEach((link) => { link.href = '/de/home'; });
    modal?.querySelector('form')?.setAttribute('action', '/de/home');
  };
  setTimeout(translate, 0);
})();
