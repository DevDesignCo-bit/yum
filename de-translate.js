(() => {
  const translations = new Map([
    ['Home', 'Startseite'], ['Stats', 'Statistik'], ['Cooking Planner', 'Essensplan'], ['My Profile', 'Mein Profil'], ['Today', 'Heute'],
    ['Start Fasting', 'Fasten starten'], ['Consumed', 'Verzehrt'], ['Carbs', 'Kohlenhydrate'], ['Fats', 'Fette'], ['Proteins', 'Proteine'],
    ['Recent Meals', 'Aktuelle Mahlzeiten'], ['Water', 'Wasser'], ['Activate Fasting', 'Fasten aktivieren'], ['Your fasting is off', 'Dein Fasten ist aus'],
    ['Activate', 'Aktivieren'], ['Weight', 'Gewicht'], ['FAQ', 'FAQ'], ['Contact Us', 'Hilfe & Kontakt'], ['TC', 'Nutzungsbedingungen'],
    ['Select character', 'Begleiter auswählen'], ['Homemade meals', 'Hausgemachte Mahlzeiten'], ['Veggie Daily', 'Gemüse täglich'], ['Tropical Boost', 'Tropischer Boost'],
    ['Select', 'Auswählen'], ['Backgrounds Colors', 'Hintergrundfarben'], ['Previous character', 'Vorheriger Begleiter'], ['Next character', 'Nächster Begleiter'],
    ['Close', 'Schließen'], ['Food added', 'Mahlzeit hinzugefügt'], ['Fasting Ended', 'Fasten beendet'],
    ['AI Powered', 'KI-gestützt'], ['Analyzing…', 'Wird analysiert…'], ['Detecting nutrients…', 'Nährwerte werden erkannt…'],
    ['Servings', 'Portionen'], ['More plates? Add more servings', 'Mehr Teller? Weitere Portionen hinzufügen'], ['Detected Ingredients', 'Erkannte Zutaten'], ['Confirm', 'Bestätigen'],
    ['Weekly Stats', 'Wöchentliche Statistik'], ['Calories', 'Kalorien'], ['Macro Balance', 'Makronährstoffverteilung'], ['Summary', 'Übersicht'],
    ['Party Planner', 'Party-Planer'], ['Snap & Cook', 'Snap & Cook'], ['Saved Recipes', 'Gespeicherte Rezepte'], ['Recipes', 'Rezepte'],
    ['Generate recipes', 'Rezepte erstellen'], ['Create a meal plan', 'Essensplan erstellen'], ['Your plan', 'Dein Plan'], ['Goals', 'Ziele'],
    ['Edit profile', 'Profil bearbeiten'], ['Diet', 'Ernährungsform'], ['Restrictions', 'Unverträglichkeiten'], ['Goal', 'Ziel'],
    ['Back', 'Zurück'], ['Save', 'Speichern'], ['Continue', 'Weiter'], ['Cancel', 'Abbrechen'], ['Done', 'Fertig'],
    ['Yumetics all the rights reserved', 'Yumetics. Alle Rechte vorbehalten.'], ['Store', 'Shop']
  ]);
  const translate = () => {
    const titles = { '/de/home': 'Startseite', '/de/stats': 'Statistik', '/de/cooking-planner': 'Essensplan', '/de/profile': 'Mein Profil', '/de/party-planner': 'Party-Planer', '/de/snap-and-cook': 'Snap & Cook' };
    document.title = `${titles[location.pathname] || 'Yumetics'} — Yumetics`;
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
    document.querySelectorAll('a[href^="/"]').forEach((link) => {
      const href = link.getAttribute('href');
      if (href === '/') link.href = '/de/home';
      else if (href && !href.startsWith('/de/') && !href.startsWith('/api/') && !href.startsWith('/assets/')) link.href = `/de${href}`;
    });
    document.querySelectorAll('form[action^="/"]').forEach((form) => {
      const action = form.getAttribute('action');
      if (action && !action.startsWith('/de/') && !action.startsWith('/api/')) form.action = `/de${action}`;
    });
    document.querySelectorAll('[data-next-url^="/"]').forEach((element) => {
      const next = element.dataset.nextUrl;
      if (next && !next.startsWith('/de/') && !next.startsWith('/api/')) element.dataset.nextUrl = `/de${next}`;
    });
    modal?.querySelector('form')?.setAttribute('action', '/de/home');
  };
  setTimeout(translate, 0);
})();
