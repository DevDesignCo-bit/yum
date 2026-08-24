(() => {
  'use strict';

  const ONBOARDING_KEY = 'yumetics-onboarding-v1';
  const PLANNER_KEY = 'yumetics-local-planner-v1';
  const PARTY_KEY = 'yumetics-party-planner-v1';
  const FASTING_KEY = 'yumetics-fasting-v1';
  const read = (key) => { try { return JSON.parse(localStorage.getItem(key) || sessionStorage.getItem(key) || '{}'); } catch (_) { return {}; } };
  const save = (key, value) => {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      sessionStorage.setItem(key, serialized);
    } catch (_) { /* The UI remains usable when storage is unavailable. */ }
  };
  const onboarding = read(ONBOARDING_KEY);
  const titleCase = (value) => String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  const recipeImages = [
    '/assets/recipes/tomato-bruschetta.png',
    '/assets/recipes/chickpea-curry-rice.png',
    '/assets/recipes/berry-yogurt-parfait.png',
    '/assets/recipes/lemon-chicken-traybake.png',
    '/assets/recipes/avocado-cucumber-bites.png',
    '/assets/recipes/quinoa-bowl.png',
    '/assets/recipes/chickpea-skillet.png',
    '/assets/recipes/vegetable-curry.png'
  ];
  const petColors = { pot: '#ff4c2c', carrot: '#ffb15f', banana: '#97d7ff' };
  const homeColors = { blue: '#97D5FF', red: '#FF8B8E', green: '#CEE8BB', orange: '#FFC891', purple: '#B176FF' };

  const savePet = (pet, petName, homeColor) => {
    const next = { ...read(ONBOARDING_KEY), pet };
    if (petName != null) next.pet_name = petName;
    if (homeColor && homeColors[homeColor]) next.home_color = homeColor;
    next.plan = { ...(next.plan || {}), pet, petName: petName || next.plan?.petName || next.pet_name || 'Pepi' };
    save(ONBOARDING_KEY, next);
    Object.assign(onboarding, next);
  };

  const applySelectedPet = () => {
    if (!document.body.classList.contains('app-page') && !document.title.includes('Your plan')) return;
    const pet = onboarding.pet || onboarding.plan?.pet || 'pot';
    if (!['pot', 'carrot', 'banana'].includes(pet)) return;
    const nameInput = document.querySelector('#profile-pet-name');
    if (nameInput && onboarding.pet_name) nameInput.value = onboarding.pet_name;
    const homeColor = homeColors[onboarding.home_color] || petColors[pet];
    document.querySelectorAll('.home-hero').forEach((hero) => hero.style.setProperty('--home-hill-color', homeColor));
    const profileImage = document.querySelector('.app-page-illustration');
    if (profileImage) profileImage.alt = `${onboarding.pet_name || titleCase(pet)} the ${titleCase(pet)}`;
    const petImages = '.app-navbar-mascot, .home-hero-pet img, .home-fasting-off-pet, .app-page-illustration, .recipes-list-mascot img, .ai-meal-analyzing-mascot img, .pet-notification-pet';
    document.querySelectorAll(petImages).forEach((image) => {
      const originalSrc = image.currentSrc || image.src;
      if (!originalSrc.includes('/images/pets/pot/')) return;
      const selectedSrc = originalSrc.replace('/images/pets/pot/', `/images/pets/${pet}/`);
      if (selectedSrc === originalSrc) return;
      image.addEventListener('error', () => { image.src = originalSrc; }, { once: true });
      image.src = selectedSrc;
    });
  };

  const initPetSaving = () => {
    const storeForm = document.querySelector('[data-store-form]');
    if (storeForm) {
      const colorOptions = [...storeForm.querySelectorAll('input[name="color"]')];
      const updateStoreSelection = () => {
        const selectedColor = colorOptions.find((option) => option.checked)?.value;
        storeForm.querySelectorAll('[data-store-slide]').forEach((slide) => {
          const option = slide.querySelector('input[name="pet"]');
          const selected = Boolean(option?.checked);
          slide.classList.toggle('is-selected', selected);
          if (selected) slide.style.setProperty('--selected-pet-color', homeColors[selectedColor] || homeColors[onboarding.home_color] || petColors[option.value] || petColors.pot);
        });
      };
      const updateColorSelection = (preview = false) => {
        colorOptions.forEach((option) => {
          option.closest('[data-store-swatch]')?.classList.toggle('is-selected', option.checked);
          if (preview && option.checked) document.querySelectorAll('.home-hero').forEach((hero) => hero.style.setProperty('--home-hill-color', homeColors[option.value] || homeColors.blue));
        });
      };
      const currentPet = onboarding.pet || onboarding.plan?.pet;
      if (currentPet) {
        const option = [...storeForm.querySelectorAll('input[name="pet"]')].find((input) => input.value === currentPet);
        if (option) {
          option.checked = true;
          queueMicrotask(() => option.closest('label')?.click());
        }
      }
      const savedColor = onboarding.home_color;
      const savedColorOption = colorOptions.find((option) => option.value === savedColor);
      if (savedColorOption) savedColorOption.checked = true;
      updateStoreSelection();
      updateColorSelection();
      storeForm.addEventListener('change', updateStoreSelection);
      storeForm.addEventListener('change', () => updateColorSelection(true));
      storeForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const pet = storeForm.querySelector('input[name="pet"]:checked')?.value;
        const color = storeForm.querySelector('input[name="color"]:checked')?.value;
        if (!pet) return;
        savePet(pet, undefined, color);
        updateStoreSelection();
        updateColorSelection();
        applySelectedPet();
        const modal = storeForm.closest('.modal');
        if (window.bootstrap?.Modal && modal) window.bootstrap.Modal.getOrCreateInstance(modal).hide();
        else if (modal) { modal.classList.remove('show'); modal.style.display = 'none'; }
      });
    }

    const nameInput = document.querySelector('#profile-pet-name');
    const nameForm = nameInput?.closest('form');
    if (nameInput && nameForm) {
      nameForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const petName = nameInput.value.trim();
        if (!petName) return nameInput.focus();
        savePet(onboarding.pet || onboarding.plan?.pet || 'pot', petName);
        applySelectedPet();
      });
    }
  };

  const updateProfileFromPlan = () => {
    if (!onboarding.plan || !document.title.includes('My Profile')) return;
    const values = document.querySelectorAll('.profile-plan-card-row .value');
    if (values[0]) values[0].textContent = `${onboarding.plan.calories.toLocaleString('en-US')} kcal`;
    if (values[1]) values[1].textContent = `${onboarding.plan.carbs}g / ${onboarding.plan.fats}g / ${onboarding.plan.proteins}g`;
    if (values[2]) values[2].textContent = `${onboarding.plan.fasting}:${24 - onboarding.plan.fasting}`;
    if (values[3]) values[3].textContent = `${onboarding.plan.water} ml`;
    if (values[4]) values[4].textContent = `${onboarding.plan.weight} kg`;
    if (values[5] && onboarding.diet?.length) values[5].textContent = onboarding.diet.map(titleCase).join(', ');
    if (values[6]) values[6].textContent = onboarding.allergies?.length ? onboarding.allergies.map(titleCase).join(', ') : 'None';
  };

  const readPhoto = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('We could not read this photo.'));
    reader.readAsDataURL(file);
  });

  const analyzePantryPhoto = async (file) => {
    const image = await readPhoto(file);
    const response = await fetch('/api/food-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image, mode: 'pantry' })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'We could not analyze this photo.');
    return result;
  };

  const recipeImageIndex = (name) => {
    const value = String(name || '').toLowerCase();
    if (/bruschetta|crostini|tomato/.test(value)) return 0;
    if (/curry|chickpea/.test(value)) return 1;
    if (/parfait|berry|yogurt|mousse|crumble/.test(value)) return 2;
    if (/chicken|tray bake|roasted protein/.test(value)) return 3;
    if (/avocado|cucumber/.test(value)) return 4;
    if (/quinoa|grain|harvest bowl/.test(value)) return 5;
    if (/skillet|broccoli/.test(value)) return 6;
    return 7;
  };
  const recipe = (name, tag, calories, prep, cook, ingredients, description, imageIndex = null) => ({
    name, tag, calories, prep_min: prep, cook_min: cook, ingredients,
    description: `${description} Approx. ${Math.round(calories * .11)}g protein · ${Math.round(calories * .12)}g carbs · ${Math.round(calories * .045)}g fat per serving.`,
    instructions: [
      { title: 'Prep', description: `Wash and prepare ${ingredients.slice(0, 2).join(' and ')}.` },
      { title: 'Cook', description: 'Cook in a pan or oven until tender and hot throughout.' },
      { title: 'Serve', description: 'Plate, season to taste, and enjoy while warm.' }
    ],
    image_url: recipeImages[(imageIndex == null ? recipeImageIndex(name) : imageIndex) % recipeImages.length]
  });

  const buildRecipes = (profile, preferences) => {
    const diet = preferences.diet || '';
    const vegan = diet === 'vegan' || preferences.allergies?.includes('animal_products');
    const vegetarian = vegan || diet === 'vegetarian' || preferences.allergies?.includes('meat');
    const lowCarb = diet === 'low_carb' || diet === 'ketogenic';
    const highProtein = diet === 'high_protein';
    const tags = vegan ? 'Vegan' : vegetarian ? 'Vegetarian' : lowCarb ? 'Low Carb' : highProtein ? 'High Protein' : 'Balanced';
    const sets = {
      green: [
        recipe('Broccoli & chickpea skillet', tags, 365, 12, 18, ['broccoli', 'chickpeas', 'lemon'], 'A quick green-pan meal from the fresh produce in your photo.', 0),
        recipe('Green vegetable grain bowl', tags, 420, 15, 20, ['leafy vegetables', 'quinoa', 'herbs'], 'A filling bowl built around the greens detected.', 2),
        recipe('Roasted green tray bake', tags, 390, 10, 30, ['zucchini', 'broccoli', 'olive oil'], 'Simple roasted vegetables with a satisfying crunch.', 1)
      ],
      red: [
        recipe('Tomato & lentil pasta', tags, 470, 12, 20, ['tomatoes', 'lentils', 'pasta'], 'A pantry-friendly tomato dish inspired by the colours detected.'),
        recipe('Pepper rice skillet', tags, 440, 10, 22, ['peppers', 'rice', 'tomatoes'], 'A one-pan recipe for the red produce in your photo.'),
        recipe('Roasted tomato bowl', tags, 385, 12, 28, ['tomatoes', 'vegetables', 'grain base'], 'Warm roasted vegetables with a simple base.')
      ],
      golden: [
        recipe('Carrot & quinoa bowl', tags, 430, 15, 25, ['carrots', 'quinoa', 'chickpeas'], 'A colourful bowl based on the golden ingredients detected.'),
        recipe('Golden vegetable curry', tags, 455, 12, 25, ['seasonal vegetables', 'coconut milk', 'rice'], 'A cosy one-pot meal for your pantry selection.'),
        recipe('Roasted vegetable wraps', tags, 410, 15, 20, ['roasted vegetables', 'wraps', 'fresh herbs'], 'Quick wraps using the brightest vegetables in your photo.')
      ],
      brown: [
        recipe('Roasted protein & vegetables', tags, 485, 15, 25, ['protein portion', 'mushrooms', 'vegetables'], 'A balanced tray bake based on the darker ingredients detected.'),
        recipe('Mushroom grain skillet', tags, 430, 10, 18, ['mushrooms', 'grains', 'vegetables'], 'A savoury skillet dinner from your pantry.'),
        recipe('Warm harvest bowl', tags, 445, 15, 22, ['roasted vegetables', 'grain base', 'seeds'], 'A warm and flexible bowl for the ingredients on hand.')
      ],
      light: [
        recipe('Fresh pantry omelette', tags, 390, 10, 12, ['eggs or tofu', 'vegetables', 'toast'], 'A light, quick meal for the ingredients detected.'),
        recipe('Creamy vegetable bowl', tags, 410, 12, 18, ['vegetables', 'beans', 'yogurt or plant yogurt'], 'A simple bowl built from pale and fresh ingredients.'),
        recipe('Everyday grain salad', tags, 380, 15, 15, ['grain base', 'vegetables', 'dressing'], 'A flexible salad that uses up what is in the fridge.')
      ]
    };
    const result = sets[profile.type] || sets.light;
    return result.map((item) => {
      if (lowCarb) { item.ingredients = item.ingredients.map((ingredient) => ingredient.includes('rice') || ingredient.includes('pasta') || ingredient.includes('grain') ? 'cauliflower rice' : ingredient); item.calories = Math.max(290, item.calories - 65); }
      if (highProtein) { item.ingredients.push(vegan ? 'tofu' : 'lean protein'); item.calories += 80; }
      if (vegan) item.ingredients = item.ingredients.map((ingredient) => ingredient === 'eggs or tofu' ? 'tofu' : ingredient.replace('yogurt', 'plant yogurt'));
      return item;
    });
  };

  const pantryProfile = (profile) => {
    const detected = (profile.detectedItems || []).join(' ').toLowerCase();
    if (/broccoli|spinach|kale|green|salad/.test(detected)) return { type: 'green' };
    if (/tomato|pepper|red/.test(detected)) return { type: 'red' };
    if (/carrot|corn|pumpkin|golden|yellow/.test(detected)) return { type: 'golden' };
    if (/mushroom|bean|potato|brown/.test(detected)) return { type: 'brown' };
    return { type: 'light' };
  };

  const buildPartyRecipes = ({ diet = 'none', guests = '5', event = 'family_gathering', difficulty = 'easy', allergies = [] }) => {
    const vegan = diet === 'vegan' || allergies.includes('animal_products');
    const vegetarian = vegan || diet === 'vegetarian' || allergies.includes('meat');
    const lowCarb = diet === 'low_carb' || diet === 'ketogenic';
    const highProtein = diet === 'high_protein' || diet === 'paleo';
    const tag = vegan ? 'Vegan' : vegetarian ? 'Vegetarian' : lowCarb ? 'Low Carb' : highProtein ? 'High Protein' : 'Balanced';
    const occasion = {
      christmas: 'festive', picnic: 'picnic', family_gathering: 'family-style',
      friends_gathering: 'friends-and-sharing', birthday_kids: 'kid-friendly birthday',
      birthday_adults: 'birthday celebration', game_night: 'game-night',
      movie_night: 'movie-night', summer_party: 'summer party', halloween: 'Halloween'
    }[event] || 'shared';
    const time = difficulty === 'hard' ? 15 : difficulty === 'medium' ? 8 : 0;
    const menu = vegan
      ? [['Crispy vegetable crostini', 210, 12, 8, ['wholegrain bread', 'tomatoes', 'herbs']], ['Creamy chickpea curry', 460, 15, 28, ['chickpeas', 'vegetables', 'coconut milk']], ['Berry coconut pots', 260, 10, 0, ['berries', 'coconut yogurt', 'oats']]]
      : vegetarian
        ? [['Herb tomato bruschetta', 220, 12, 8, ['bread', 'tomatoes', 'fresh herbs']], ['Roasted vegetable gratin', 510, 18, 35, ['seasonal vegetables', 'cheese', 'potatoes']], ['Warm fruit crumble', 320, 15, 25, ['seasonal fruit', 'oats', 'cinnamon']]]
        : lowCarb
          ? [['Avocado cucumber bites', 190, 12, 0, ['avocado', 'cucumber', 'lemon']], ['Lemon chicken tray bake', 520, 15, 32, ['chicken', 'vegetables', 'lemon']], ['Greek yogurt berry cups', 240, 8, 0, ['greek yogurt', 'berries', 'seeds']]]
          : highProtein
            ? [['Protein hummus board', 260, 12, 0, ['hummus', 'vegetables', 'seeds']], ['Herb chicken & quinoa', 560, 18, 30, ['chicken', 'quinoa', 'vegetables']], ['Cocoa protein mousse', 280, 10, 0, ['yogurt', 'cocoa', 'berries']]]
            : [['Seasonal sharing platter', 260, 15, 0, ['vegetables', 'bread', 'dip']], ['Roasted vegetable & chicken bake', 540, 18, 35, ['chicken', 'vegetables', 'herbs']], ['Fruit yogurt parfaits', 300, 10, 0, ['fruit', 'yogurt', 'granola']]];
    return menu.map(([name, calories, prep, cook, ingredients], index) => recipe(name, tag, calories, prep + time, cook + time, ingredients, `A ${occasion} recipe scaled for ${guests} guests.`, index));
  };

  const initSnapAndCook = () => {
    const input = document.querySelector('input[name="snap_photo"]');
    const button = document.querySelector('#snap-analyze');
    if (!input || !button) return;
    const intro = document.querySelector('.drop-zone')?.closest('.cooking-planner-panel')?.querySelector('.icon-pot + p');
    if (intro) intro.textContent = 'Snap a photo of your pantry or fridge and Yumetics will identify the ingredients and suggest dishes.';
    const preview = document.querySelector('.drop-zone-preview');
    const previewBlock = document.querySelector('.preview-block');
    const instructions = document.querySelector('.drop-instructions-block');
    let selectedFile = null;
    input.addEventListener('change', () => {
      selectedFile = input.files?.[0] || null;
      if (!selectedFile) return;
      if (!selectedFile.type.startsWith('image/') || selectedFile.size > 8 * 1024 * 1024) { window.alert('Choose a JPG, PNG, or WebP image smaller than 8 MB.'); selectedFile = null; return; }
      const reader = new FileReader();
      reader.onload = () => { if (preview) preview.src = String(reader.result); };
      reader.readAsDataURL(selectedFile);
      previewBlock?.classList.remove('d-none'); instructions?.classList.add('d-none');
      button.classList.remove('disabled'); button.removeAttribute('aria-disabled'); button.removeAttribute('tabindex'); button.textContent = 'Analyze photo';
    });
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      if (!selectedFile) return;
      button.classList.add('disabled'); button.textContent = 'Analyzing…';
      try {
        const profile = await analyzePantryPhoto(selectedFile);
        if (profile.preparedDish) {
          button.classList.remove('disabled'); button.textContent = 'Analyze photo';
          window.alert(`This looks like ${profile.dishName || 'a prepared dish'}, not a pantry photo. Add it from Home to estimate its calories.`);
          return;
        }
        const keepPreferences = Boolean(document.querySelector('#keep-diet-prefs')?.checked);
        const preferences = keepPreferences ? { diet: onboarding.diet?.[0] || '', allergies: onboarding.allergies || [] } : {};
        const recipes = (profile.recipes?.length ? profile.recipes : buildRecipes(pantryProfile(profile), preferences)).map((item, index) => ({ ...item, image_url: item.image_url || recipeImages[index % recipeImages.length] }));
        sessionStorage.setItem(PLANNER_KEY, JSON.stringify({ profile, preferences, recipes, rotation: 0 }));
        window.location.assign('/snap-and-cook-result');
      } catch (error) {
        button.classList.remove('disabled'); button.textContent = 'Analyze photo'; window.alert(error.message);
      }
    });
  };

  const fillRecipeModal = (item) => {
    const set = (selector, value) => { const element = document.querySelector(selector); if (element) element.textContent = value; };
    set('[data-view-recipe-tag]', item.tag); set('[data-view-recipe-title]', item.name); set('[data-view-recipe-description]', item.description);
    set('[data-view-recipe-prep]', item.prep_min); set('[data-view-recipe-cook]', item.cook_min); set('[data-view-recipe-calories]', item.calories);
    const image = document.querySelector('[data-view-recipe-image]'); if (image) { image.src = item.image_url; image.alt = item.name; }
    const ingredients = document.querySelector('[data-view-recipe-ingredients]');
    if (ingredients) ingredients.replaceChildren(...item.ingredients.map((value) => { const li = document.createElement('li'); li.textContent = value; return li; }));
    const steps = document.querySelector('[data-view-recipe-instructions]');
    if (steps) steps.replaceChildren(...item.instructions.map((step, index) => { const article = document.createElement('article'); article.className = 'view-recipe-step position-relative rounded-3 pe-3 py-3'; const heading = document.createElement('h3'); heading.className = 'view-recipe-step-title fw-bold mb-2'; heading.textContent = `${String(index + 1).padStart(2, '0')} ${step.title}`; const text = document.createElement('p'); text.className = 'mb-0 fs-8'; text.textContent = step.description; article.append(heading, text); return article; }));
    const modal = document.querySelector('#view-recipe-modal');
    if (window.bootstrap?.Modal && modal) window.bootstrap.Modal.getOrCreateInstance(modal).show();
    else if (modal) { modal.classList.add('show'); modal.style.display = 'block'; }
  };

  const renderPlannerResults = () => {
    if (!document.body.classList.contains('cooking-planner-peach')) return;
    const state = read(PLANNER_KEY);
    if (!state.recipes?.length) return;
    const recipes = [...state.recipes];
    const detected = state.profile?.detectedItems?.length ? state.profile.detectedItems.join(' | ') : 'No ingredients identified';
    const detectedLine = document.querySelector('.cooking-planner-panel > .fs-8.text-body-muted');
    if (detectedLine) { detectedLine.replaceChildren(); const label = document.createElement('span'); label.className = 'fw-semibold'; label.textContent = 'Detected from photo: '; detectedLine.append(label, document.createTextNode(detected)); }
    const basedOn = document.querySelector('.party-planner-result-based');
    if (basedOn) basedOn.textContent = state.preferences?.diet ? `Menu based on your ${titleCase(state.preferences.diet)} preference` : 'Menu based on your photo';
    const cards = [...document.querySelectorAll('.recipes-list-card')];
    cards.forEach((card, index) => {
      const wrapper = card.closest('.col-12'); const item = recipes[index];
      if (!item) { if (wrapper) wrapper.hidden = true; return; }
      if (wrapper) wrapper.hidden = false;
      card.querySelector('.recipes-list-card-title').textContent = item.name;
      card.querySelector('.recipe-tag').textContent = item.tag;
      const cardImage = card.querySelector('.recipes-list-card-image');
      if (cardImage) { cardImage.src = item.image_url || recipeImages[index % recipeImages.length]; cardImage.alt = item.name; }
      const meta = card.querySelector('.recipes-list-card-meta');
      if (meta) meta.replaceChildren(...[`⏱ Prep: ${item.prep_min} min`, `🍳 Cook: ${item.cook_min} min`, `🔥 ${item.calories} kcal`].map((text) => { const li = document.createElement('li'); li.textContent = text; return li; }));
      const trigger = card.querySelector('[data-recipe-index]'); if (trigger) trigger.dataset.recipeIndex = index;
    });
    const data = document.querySelector('#view-recipe-data'); if (data) data.textContent = JSON.stringify(recipes);
    document.addEventListener('click', (event) => {
      const trigger = event.target.closest('[data-recipe-index]');
      if (!trigger) return;
      event.preventDefault(); event.stopImmediatePropagation(); fillRecipeModal(recipes[Number(trigger.dataset.recipeIndex) || 0]);
    }, true);
    document.querySelector('.party-planner-regenerate')?.addEventListener('click', (event) => {
      event.preventDefault();
      recipes.push(recipes.shift()); state.recipes = recipes; sessionStorage.setItem(PLANNER_KEY, JSON.stringify(state)); window.location.reload();
    });
  };

  const initPartyPlanner = () => {
    const form = document.querySelector('.party-planner-inner form');
    if (!form) return;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const values = new FormData(form);
      const settings = {
        difficulty: values.get('difficulty') || 'easy', guests: values.get('guests') || '5', event: values.get('event') || 'family_gathering',
        diet: values.get('diet') || 'none', allergies: values.getAll('allergies[]')
      };
      sessionStorage.setItem(PARTY_KEY, JSON.stringify({ settings, recipes: buildPartyRecipes(settings) }));
      window.location.assign('/party-planing-result');
    });
  };

  const renderPartyResults = () => {
    if (!document.body.classList.contains('cooking-planner-blue') || !document.querySelector('.party-planner-regenerate')) return;
    const state = read(PARTY_KEY);
    if (!state.recipes?.length) return;
    const recipes = state.recipes;
    const settings = state.settings || {};
    const labels = {
      christmas: 'Christmas', picnic: 'Picnic', family_gathering: 'Family gathering',
      friends_gathering: 'Friends gathering', birthday_kids: 'Birthday party - Kids',
      birthday_adults: 'Birthday party - Adults', game_night: 'Game night',
      movie_night: 'Movie night', summer_party: 'Summer party', halloween: 'Halloween',
      easy: 'Easy', medium: 'Medium', hard: 'Advanced'
    };
    const summary = [...document.querySelectorAll('.cooking-planner-panel > p.d-flex .fw-light')];
    if (summary[0]) summary[0].textContent = labels[settings.event] || 'Family gathering';
    if (summary[1]) summary[1].textContent = `${settings.guests || 5} people`;
    if (summary[2]) summary[2].textContent = labels[settings.difficulty] || 'Easy';
    const basedOn = document.querySelector('.party-planner-result-based');
    if (basedOn) basedOn.textContent = `Menu based on your ${titleCase(settings.diet || 'balanced')} preference`;
    const cards = [...document.querySelectorAll('.recipes-list-card')];
    cards.forEach((card, index) => {
      const item = recipes[index]; const wrapper = card.closest('.col-12');
      if (!item) { if (wrapper) wrapper.hidden = true; return; }
      card.querySelector('.recipes-list-card-title').textContent = item.name;
      card.querySelector('.recipe-tag').textContent = item.tag;
      const image = card.querySelector('.recipes-list-card-image'); if (image) { image.src = item.image_url; image.alt = item.name; }
      const meta = card.querySelector('.recipes-list-card-meta'); if (meta) meta.replaceChildren(...[`⏱ Prep: ${item.prep_min} min`, `🍳 Cook: ${item.cook_min} min`, `🔥 ${item.calories} kcal`].map((value) => { const li = document.createElement('li'); li.textContent = value; return li; }));
      const trigger = card.querySelector('[data-recipe-index]'); if (trigger) trigger.dataset.recipeIndex = index;
    });
    document.addEventListener('click', (event) => {
      const trigger = event.target.closest('[data-recipe-index]');
      if (!trigger) return;
      event.preventDefault(); event.stopImmediatePropagation(); fillRecipeModal(recipes[Number(trigger.dataset.recipeIndex) || 0]);
    }, true);
    document.querySelector('.party-planner-regenerate')?.addEventListener('click', (event) => {
      event.preventDefault(); state.recipes = [...recipes.slice(1), recipes[0]]; sessionStorage.setItem(PARTY_KEY, JSON.stringify(state)); window.location.reload();
    });
  };

  const initFasting = () => {
    const fastingPages = new Set([
      '/home', '/home-activate-fasting', '/home-fasting-active', '/home-fasting-in-progress',
      '/home-fasting-paused', '/home-fasting-goal-achieved', '/home-fasting-completed', '/edit-fasting'
    ]);
    if (!fastingPages.has(window.location.pathname)) return;

    const hoursFrom = (value) => Math.max(1, Number.parseInt(String(value || ''), 10) || 16);
    const defaultHours = hoursFrom(onboarding.fasting_goal || onboarding.plan?.fasting || 16);
    let fasting = { goalHours: defaultHours, status: 'off', elapsedMs: 0, startedAt: null, ...read(FASTING_KEY) };
    fasting.goalHours = hoursFrom(fasting.goalHours);
    fasting.elapsedMs = Math.max(0, Number(fasting.elapsedMs) || 0);
    const persistFasting = () => save(FASTING_KEY, fasting);
    const saveGoalToProfile = () => {
      const next = { ...read(ONBOARDING_KEY), fasting_goal: `${fasting.goalHours}h` };
      next.plan = { ...(next.plan || {}), fasting: fasting.goalHours };
      save(ONBOARDING_KEY, next); Object.assign(onboarding, next);
    };
    const totalMs = () => fasting.goalHours * 60 * 60 * 1000;
    const elapsedMs = () => fasting.status === 'active' && fasting.startedAt
      ? fasting.elapsedMs + Math.max(0, Date.now() - Number(fasting.startedAt)) : fasting.elapsedMs;
    const clock = (milliseconds) => {
      const seconds = Math.floor(milliseconds / 1000);
      const hours = Math.floor(seconds / 3600); const minutes = Math.floor((seconds % 3600) / 60); const rest = seconds % 60;
      return [hours, minutes, rest].map((part) => String(part).padStart(2, '0')).join(':');
    };
    const caption = () => `Goal: ${fasting.goalHours} h fast • eating window ${Math.max(0, 24 - fasting.goalHours)} h`;
    const render = () => {
      const elapsed = elapsedMs(); const complete = elapsed >= totalMs();
      if (complete && fasting.status === 'active') {
        fasting = { ...fasting, status: 'completed', elapsedMs: totalMs(), startedAt: null }; persistFasting();
        if (window.location.pathname === '/home-fasting-in-progress') window.location.assign('/home-fasting-goal-achieved');
        return;
      }
      const displayElapsed = fasting.status === 'completed' ? totalMs() : elapsed;
      document.querySelectorAll('.home-fasting-timer').forEach((timer) => { timer.textContent = clock(displayElapsed); });
      document.querySelectorAll('.home-fasting-caption').forEach((element) => {
        element.textContent = fasting.status === 'completed' ? `Completed ${fasting.goalHours}h 00m` : caption();
      });
      const percent = Math.min(100, Math.round((displayElapsed / totalMs()) * 100));
      document.querySelectorAll('.fasting-progress').forEach((progress) => { progress.style.setProperty('--fp-percent', String(percent)); });
      document.querySelectorAll('input[name="fasting_goal"]').forEach((input) => { input.checked = hoursFrom(input.value) === fasting.goalHours; });
      document.querySelectorAll('[data-fasting-helper]').forEach((helper) => { helper.classList.toggle('d-none', helper.dataset.fastingHelper !== `${fasting.goalHours}h`); });

      const offCard = document.querySelector('.home-fasting-card-off');
      if (offCard && ['ready', 'active', 'paused'].includes(fasting.status)) {
        offCard.querySelector('.home-card-label')?.replaceChildren(document.createTextNode('Fasting'));
        const heading = offCard.querySelector('.home-fasting-off-heading');
        if (heading) heading.textContent = fasting.status === 'active' ? 'Your fasting is in progress' : 'Your fasting is ready';
        const link = offCard.querySelector('a[href="/home-activate-fasting"]');
        if (link) { link.href = fasting.status === 'active' ? '/home-fasting-in-progress' : '/home-fasting-active'; link.textContent = fasting.status === 'active' ? 'Continue' : 'Start Fasting'; }
      }
    };

    document.querySelectorAll('[data-fasting-goal] input[name="fasting_goal"]').forEach((input) => {
      input.addEventListener('change', () => { fasting.goalHours = hoursFrom(input.value); saveGoalToProfile(); persistFasting(); render(); });
    });
    const goalForm = document.querySelector('form[action="/home-fasting-active"], form[action="/profile"]');
    if (goalForm) goalForm.addEventListener('submit', (event) => {
      const choice = goalForm.querySelector('input[name="fasting_goal"]:checked');
      if (!choice) return;
      event.preventDefault();
      fasting = { goalHours: hoursFrom(choice.value), status: window.location.pathname === '/edit-fasting' ? fasting.status : 'ready', elapsedMs: 0, startedAt: null };
      saveGoalToProfile(); persistFasting();
      window.location.assign(goalForm.action);
    });

    const start = () => {
      fasting = { ...fasting, status: 'active', startedAt: Date.now() }; persistFasting();
      window.location.assign('/home-fasting-in-progress');
    };
    if (window.location.pathname === '/home-fasting-active') {
      document.querySelectorAll('a[href="/home-fasting-in-progress"]').forEach((button) => button.addEventListener('click', (event) => { event.preventDefault(); start(); }, true));
    }
    if (window.location.pathname === '/home-fasting-paused') {
      document.querySelectorAll('a[href="/home-fasting-in-progress"]').forEach((button) => button.addEventListener('click', (event) => { event.preventDefault(); start(); }, true));
    }
    document.querySelectorAll('#fasting-ended-sheet a[href="/home-fasting-completed"]').forEach((button) => button.addEventListener('click', (event) => {
      event.preventDefault(); fasting = { ...fasting, status: 'off', elapsedMs: 0, startedAt: null }; persistFasting(); window.location.assign('/home-fasting-completed');
    }, true));
    // The designed Start links all lead here. Entering this state begins the
    // clock as well, so the demo remains reliable even if a page navigation is
    // handled by the prototype's existing scripts.
    if (window.location.pathname === '/home-fasting-in-progress' && fasting.status === 'ready') {
      fasting = { ...fasting, status: 'active', startedAt: Date.now() }; persistFasting();
    }
    if (window.location.pathname === '/home-fasting-paused' && fasting.status === 'active') { fasting.status = 'paused'; fasting.elapsedMs = elapsedMs(); fasting.startedAt = null; persistFasting(); }
    if (window.location.pathname === '/home-fasting-goal-achieved') { fasting = { ...fasting, status: 'completed', elapsedMs: totalMs(), startedAt: null }; persistFasting(); }
    if (window.location.pathname === '/home-fasting-completed') { fasting = { ...fasting, status: 'off', elapsedMs: 0, startedAt: null }; persistFasting(); }
    render();
    if (fasting.status === 'active') window.setInterval(render, 1000);
  };

  const initWeeklyStats = () => {
    if (!document.title.includes('Stats')) return;
    let tracker = { meals: [] };
    try { tracker = JSON.parse(localStorage.getItem('yumetics-calorie-tracker-v1') || '{"meals":[]}'); } catch (_) { /* Empty stats are valid for a new demo. */ }
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6);
    const inThisWeek = (tracker.meals || []).filter((meal) => {
      const date = new Date(meal.loggedAt || 0); date.setHours(0, 0, 0, 0);
      return Number.isFinite(date.getTime()) && date >= weekStart && date <= weekEnd;
    });
    const days = Array.from({ length: 7 }, (_, index) => ({ calories: 0, carbs: 0, fats: 0, proteins: 0 }));
    inThisWeek.forEach((meal) => {
      const index = new Date(meal.loggedAt).getDay(); const day = days[index];
      day.calories += Number(meal.calories) || 0; day.carbs += Number(meal.carbs) || 0; day.fats += Number(meal.fats) || 0; day.proteins += Number(meal.proteins) || 0;
    });
    const total = days.reduce((sum, day) => sum + day.calories, 0);
    const totalMacros = days.reduce((sum, day) => ({ carbs: sum.carbs + day.carbs, fats: sum.fats + day.fats, proteins: sum.proteins + day.proteins }), { carbs: 0, fats: 0, proteins: 0 });
    const label = (date) => `${date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()} ${date.getDate()}`;
    const weekLabel = `${label(weekStart)}-${weekEnd.getDate()}`;
    document.querySelectorAll('.stats-calendar-label, [data-weekly-stats-label]').forEach((element) => { element.textContent = weekLabel; });
    const goal = Number(onboarding.plan?.calories) || 0;
    const max = Math.max(goal || 1, ...days.map((day) => day.calories), 1);
    document.querySelectorAll('.calories-chart-value > span:last-child').forEach((element) => { element.innerHTML = `${Math.round(total).toLocaleString('en-US')}<span class="calories-chart-unit">kcal</span>`; });
    document.querySelectorAll('.calories-chart-bar').forEach((bar, index) => {
      const calories = Math.round(days[index]?.calories || 0); bar.style.height = `${Math.min(100, (calories / max) * 100)}%`; bar.setAttribute('aria-label', `${['S', 'M', 'T', 'W', 'T', 'F', 'S'][index]}: ${calories} kcal`);
    });
    const axis = document.querySelectorAll('.calories-chart-y-label');
    if (axis[0]) axis[0].textContent = Math.round(max).toLocaleString('en-US');
    if (axis[1]) axis[1].textContent = Math.round(max / 2).toLocaleString('en-US');
    if (axis[2]) axis[2].textContent = '0';
    const macroTotal = totalMacros.carbs + totalMacros.fats + totalMacros.proteins;
    const macroValues = [totalMacros.carbs, totalMacros.fats, totalMacros.proteins].map((value) => macroTotal ? Math.round((value / macroTotal) * 100) : 0);
    document.querySelectorAll('.weekly-macros-summary-value').forEach((element, index) => { element.textContent = `${macroValues[index] || 0}%`; });
    document.querySelectorAll('.weekly-macros-bars .weekly-macros-bar').forEach((bar, index) => {
      const day = days[index] || {}; const values = [day.carbs || 0, day.fats || 0, day.proteins || 0];
      bar.querySelectorAll('span').forEach((part, partIndex) => { part.style.flex = String(values[partIndex]); });
    });
    const ring = document.querySelector('.progress-ring');
    if (ring) ring.style.setProperty('--ring-arc-percent', String(goal ? Math.min(100, Math.round((total / (goal * 7)) * 100)) : 0));
    document.querySelectorAll('.progress-ring-value').forEach((element) => { element.textContent = Math.round(total).toLocaleString('en-US'); });
    let empty = document.querySelector('[data-weekly-empty]');
    if (!empty) {
      empty = document.createElement('p'); empty.dataset.weeklyEmpty = 'true'; empty.className = 'text-center text-body-muted mt-3 mb-0';
      document.querySelector('.stats-content')?.append(empty);
    }
    empty.textContent = inThisWeek.length ? `${inThisWeek.length} meal${inThisWeek.length === 1 ? '' : 's'} logged this week.` : 'No meals logged this week yet.';
  };

  const renderWeeklyStats = (selectedWeekStart = null) => {
    if (!document.title.includes('Stats')) return;
    const tracker = read('yumetics-calorie-tracker-v1');
    const plan = onboarding.plan || {};
    const dailyGoal = Number(plan.calories) || 1400;
    const now = new Date();
    const currentWeekStart = new Date(now);
    currentWeekStart.setHours(0, 0, 0, 0);
    currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
    const weekStart = selectedWeekStart ? new Date(Number(selectedWeekStart)) : new Date(currentWeekStart);
    weekStart.setHours(0, 0, 0, 0);
    const dayStart = (offset) => {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + offset);
      return date;
    };
    const sameLocalDay = (first, second) => first.getFullYear() === second.getFullYear()
      && first.getMonth() === second.getMonth() && first.getDate() === second.getDate();
    const days = Array.from({ length: 7 }, (_, index) => ({ date: dayStart(index), calories: 0, carbs: 0, fats: 0, proteins: 0 }));
    (Array.isArray(tracker.meals) ? tracker.meals : []).forEach((meal) => {
      if (!meal.loggedAt) return; // Ignore the old demo meals that predate date tracking.
      const loggedAt = new Date(meal.loggedAt);
      if (Number.isNaN(loggedAt.getTime())) return;
      const day = days.find((item) => sameLocalDay(item.date, loggedAt));
      if (!day) return;
      day.calories += Number(meal.calories) || 0;
      day.carbs += Number(meal.carbs) || 0;
      day.fats += Number(meal.fats) || 0;
      day.proteins += Number(meal.proteins) || 0;
    });
    const total = (key) => days.reduce((sum, day) => sum + day[key], 0);
    const totalCalories = total('calories');
    const formatWeek = () => {
      const end = dayStart(6);
      const month = new Intl.DateTimeFormat('en-US', { month: 'short' });
      const startMonth = month.format(weekStart).toUpperCase();
      const endMonth = month.format(end).toUpperCase();
      return `${startMonth} ${weekStart.getDate()}-${endMonth === startMonth ? '' : `${endMonth} `}${end.getDate()}`;
    };
    const weekLabel = formatWeek();
    const number = (value) => Math.round(value).toLocaleString('en-US');

    document.querySelectorAll('.stats-calendar-label, [data-weekly-stats-label]').forEach((label) => { label.textContent = weekLabel; });
    document.querySelectorAll('.progress-ring').forEach((ring) => {
      ring.style.setProperty('--ring-arc-percent', String(Math.min(100, Math.round((totalCalories / (dailyGoal * 7)) * 100))));
    });
    document.querySelectorAll('.progress-ring-value').forEach((ringValue) => { ringValue.textContent = number(totalCalories); });

    const maxValue = Math.max(dailyGoal, ...days.map((day) => day.calories), 1);
    document.querySelectorAll('.calories-chart-graph').forEach((graph) => {
      graph.dataset.minCal = '0'; graph.dataset.maxCal = String(maxValue);
    });
    document.querySelectorAll('.calories-chart').forEach((chart) => {
      const calorieTotal = chart.querySelector('.calories-chart-value > span:last-child');
      if (calorieTotal) calorieTotal.replaceChildren(document.createTextNode(number(totalCalories)), Object.assign(document.createElement('span'), { className: 'calories-chart-unit', textContent: 'kcal' }));
      const axisLabels = chart.querySelectorAll('.calories-chart-y-label');
      if (axisLabels[0]) axisLabels[0].textContent = number(maxValue);
      if (axisLabels[1]) axisLabels[1].textContent = number(maxValue / 2);
      if (axisLabels[2]) axisLabels[2].textContent = '0';
      chart.querySelectorAll('.calories-chart-bar').forEach((bar, index) => {
        const value = days[index]?.calories || 0;
        bar.style.height = `${(value / maxValue) * 100}%`;
        bar.setAttribute('aria-label', `${['S', 'M', 'T', 'W', 'T', 'F', 'S'][index]}: ${number(value)} kcal`);
      });
    });

    const macroCalories = { carbs: total('carbs') * 4, fats: total('fats') * 9, proteins: total('proteins') * 4 };
    const macroTotal = macroCalories.carbs + macroCalories.fats + macroCalories.proteins;
    const macroPercentages = ['carbs', 'fats', 'proteins'].map((key) => macroTotal ? Math.round((macroCalories[key] / macroTotal) * 100) : 0);
    document.querySelectorAll('.weekly-macros').forEach((chart) => {
      chart.querySelectorAll('.weekly-macros-summary-value').forEach((value, index) => { value.textContent = `${macroPercentages[index]}%`; });
      chart.querySelectorAll('.weekly-macros-bar').forEach((bar, index) => {
        const day = days[index] || { carbs: 0, fats: 0, proteins: 0 };
        const values = [day.carbs, day.fats, day.proteins];
        const hasData = values.some(Boolean);
        bar.style.height = hasData ? '100%' : '0%';
        ['carbs', 'fat', 'protein'].forEach((key, valueIndex) => {
          const segment = bar.querySelector(`.macro-balance-bar-${key}`);
          if (segment) segment.style.flex = Math.max(1, values[valueIndex]);
        });
      });
    });

    const oldData = document.querySelector('#weekly-stats-data');
    if (oldData) oldData.textContent = '[]';
    const weekList = document.querySelector('[data-weekly-stats-carousel] .swiper-wrapper');
    if (weekList) {
      weekList.replaceChildren();
      const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short' });
      const selectedTime = weekStart.getTime();
      // Keep the familiar selector design, but fill it with real calendar weeks
      // instead of the prototype's old January/February demo data.
      Array.from({ length: 5 }, (_, index) => {
        const start = new Date(currentWeekStart); start.setDate(start.getDate() - (4 - index) * 7);
        const end = new Date(start); end.setDate(end.getDate() + 6);
        const slide = document.createElement('div'); slide.className = 'swiper-slide weekly-stats-week-slide';
        const button = document.createElement('button'); button.type = 'button';
        button.className = `weekly-stats-week d-flex flex-column align-items-center justify-content-center border-0${start.getTime() === selectedTime ? ' active' : ''}`;
        button.dataset.weekStart = String(start.getTime());
        const month = document.createElement('span'); month.className = 'weekly-stats-week-month'; month.textContent = monthFormatter.format(start);
        const range = document.createElement('span'); range.className = 'weekly-stats-week-range'; range.textContent = `${start.getDate()}-${end.getDate()}`;
        button.append(month, range); slide.append(button); weekList.append(slide);
        button.addEventListener('click', (event) => {
          event.preventDefault(); event.stopPropagation();
          renderWeeklyStats(button.dataset.weekStart);
        }, true);
      });
      const carousel = weekList.closest('[data-weekly-stats-carousel]');
      if (carousel) carousel.dataset.currentWeekIndex = '4';
    }
    const statsSection = document.querySelector('.stats-content');
    const existingNotice = document.querySelector('[data-weekly-stats-empty]');
    if (!totalCalories && statsSection && !existingNotice) {
      const notice = document.createElement('p');
      notice.dataset.weeklyStatsEmpty = 'true';
      notice.className = 'text-center text-body-muted mt-3 mb-0';
      notice.textContent = 'No meals logged this week yet.';
      statsSection.querySelector('.row.g-3')?.before(notice);
    }
    const statsModal = document.querySelector('#weekly-stats-modal');
    if (statsModal && !statsModal.dataset.liveWeeksBound) {
      statsModal.dataset.liveWeeksBound = 'true';
      statsModal.addEventListener('shown.bs.modal', () => window.setTimeout(() => renderWeeklyStats(), 0));
    }
  };

  applySelectedPet();
  initPetSaving();
  document.querySelectorAll('#ai-meal-analyzing-modal .text-blue-800').forEach((element) => { element.textContent = 'Analyzing your photo'; });
  updateProfileFromPlan();
  initSnapAndCook();
  initPartyPlanner();
  renderPlannerResults();
  renderPartyResults();
  initFasting();
  renderWeeklyStats();
})();
