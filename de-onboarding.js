(() => {
  const terms = new Map([
    ['Meal prep & tracking, made fun', 'Mahlzeiten planen und verfolgen, mit Spaß'], ['Start a brief test about your nutritional habits', 'Starte einen kurzen Test zu deinen Ernährungsgewohnheiten'], ['Start', 'Starten'], ['Next', 'Weiter'], ['Got It', 'Verstanden'],
    ["What's your activity level?", 'Wie aktiv bist du?'], ['How old are you?', 'Wie alt bist du?'], ["What's your height?", 'Wie groß bist du?'], ["What's your weight?", 'Wie viel wiegst du?'], ["What's your target weight?", 'Was ist dein Zielgewicht?'],
    ['Select your gender', 'Wähle dein Geschlecht'], ['What type of diet do you prefer?', 'Welche Ernährungsform bevorzugst du?'], ['Do you have any restrictions or allergies?', 'Hast du Unverträglichkeiten oder Allergien?'], ['What would you like to change in your eating habits?', 'Was möchtest du an deinen Essgewohnheiten ändern?'],
    ['Do you think you drink enough water?', 'Trinkst du genug Wasser?'], ['Do you know about intermittent fasting?', 'Kennst du intermittierendes Fasten?'], ['Select your fasting goal', 'Wähle dein Fastenziel'], ['Fasting Benefits', 'Vorteile des Fastens'], ['Long term results', 'Langfristige Ergebnisse'],
    ['Water boost fat burn, energy, and focus', 'Wasser unterstützt Energie, Fokus und Stoffwechsel'], ['Personalizing plan', 'Dein Plan wird erstellt'], ['Select Your Virtual Pet!', 'Wähle deinen virtuellen Begleiter!'], ['Say hi to your virtual PET!', 'Sag Hallo zu deinem virtuellen Begleiter!'],
    ['Track calories', 'Kalorien erfassen'], ['Just take a photo and let the AI do the rest', 'Mach einfach ein Foto und die KI erledigt den Rest'], ['Stay hydrated', 'Ausreichend trinken'], ['Easily track your water and hit your goals', 'Erfasse dein Wasser und erreiche dein Ziel'], ['Enjoy Fasting', 'Fasten nutzen'], ['Snap & Cook', 'Snap & Cook'], ['Party Planner', 'Party Planer'],
    ['Female', 'Weiblich'], ['Male', 'Männlich'], ['Non-binary', 'Nicht-binär'], ['Balanced', 'Ausgewogen'], ['Ketogenic', 'Ketogen'], ['Vegetarian', 'Vegetarisch'], ['High protein', 'Proteinreich'], ['Vegan', 'Vegan'], ['Low carb', 'Kohlenhydratarm'], ['Paleo', 'Paleo'],
    ['Meat', 'Fleisch'], ['Eggs', 'Eier'], ['Animal products', 'Tierische Produkte'], ['Nuts', 'Nüsse'], ['Dairy', 'Milchprodukte'], ['Seafood', 'Meeresfrüchte'], ['FAQ', 'FAQ'], ['Contact Us', 'Hilfe & Kontakt'], ['TC', 'Nutzungsbedingungen']
  ]);
  const translate = () => {
    document.documentElement.lang = 'de';
    document.title = document.title.replace('Yumetics — ', 'Yumetics — ');
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => { const text = node.nodeValue.trim(); if (terms.has(text)) node.nodeValue = node.nodeValue.replace(text, terms.get(text)); });
    document.querySelectorAll('a[href^="/onboarding"], form[action^="/onboarding/"]').forEach((element) => { const attribute = element.tagName === 'FORM' ? 'action' : 'href'; element.setAttribute(attribute, element.getAttribute(attribute).replace('/onboarding', '/de/onboarding')); });
    document.querySelectorAll('[data-next-url^="/onboarding"]').forEach((element) => { element.dataset.nextUrl = element.dataset.nextUrl.replace('/onboarding', '/de/onboarding'); });
    document.querySelectorAll('a[href="/"]').forEach((link) => { link.href = '/de/home'; });
    const footer = document.querySelector('.footer-links');
    if (footer) footer.innerHTML = '<li><a href="/de/abo-verwaltung">Abo Verwaltung</a></li><li><a href="/de/nutzungsbedingungen">Nutzungsbedingungen</a></li><li><a href="/de/widerrufsbelehrung">Widerrufsbelehrung</a></li><li><a href="/de/widerrufsformular">Widerrufsformular</a></li><li><a href="/de/kontakt">Hilfe &amp; Kontakt</a></li><li><a href="/de/impressum">Impressum</a></li>';
  };
  translate();
})();
