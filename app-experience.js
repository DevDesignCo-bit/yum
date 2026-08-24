(() => {
  'use strict';

  const ONBOARDING_KEY = 'yumetics-onboarding-v1';
  const PLANNER_KEY = 'yumetics-local-planner-v1';
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
  const recipeImages = ['/assets/recipes/chickpea-skillet.png', '/assets/recipes/vegetable-curry.png', '/assets/recipes/quinoa-bowl.png'];
  const petColors = { pot: '#ff4c2c', carrot: '#ffb15f', banana: '#97d7ff' };

  const savePet = (pet, petName) => {
    const next = { ...read(ONBOARDING_KEY), pet };
    if (petName != null) next.pet_name = petName;
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
    const profileImage = document.querySelector('.app-page-illustration');
    if (profileImage) profileImage.alt = `${onboarding.pet_name || titleCase(pet)} the ${titleCase(pet)}`;
    document.querySelectorAll('img[src*="/images/pets/pot/"]').forEach((image) => {
      const originalSrc = image.currentSrc || image.src;
      const selectedSrc = originalSrc.replace('/images/pets/pot/', `/images/pets/${pet}/`);
      if (selectedSrc === originalSrc) return;
      image.addEventListener('error', () => { image.src = originalSrc; }, { once: true });
      image.src = selectedSrc;
    });
  };

  const initPetSaving = () => {
    const storeForm = document.querySelector('[data-store-form]');
    if (storeForm) {
      const updateStoreSelection = () => {
        storeForm.querySelectorAll('[data-store-slide]').forEach((slide) => {
          const option = slide.querySelector('input[name="pet"]');
          const selected = Boolean(option?.checked);
          slide.classList.toggle('is-selected', selected);
          if (selected) slide.style.setProperty('--selected-pet-color', petColors[option.value] || petColors.pot);
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
      updateStoreSelection();
      storeForm.addEventListener('change', updateStoreSelection);
      storeForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const pet = storeForm.querySelector('input[name="pet"]:checked')?.value;
        if (!pet) return;
        savePet(pet);
        updateStoreSelection();
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

  const recipe = (name, tag, calories, prep, cook, ingredients, description, imageIndex = 0) => ({
    name, tag, calories, prep_min: prep, cook_min: cook, ingredients,
    description: `${description} Approx. ${Math.round(calories * .11)}g protein · ${Math.round(calories * .12)}g carbs · ${Math.round(calories * .045)}g fat per serving.`,
    instructions: [
      { title: 'Prep', description: `Wash and prepare ${ingredients.slice(0, 2).join(' and ')}.` },
      { title: 'Cook', description: 'Cook in a pan or oven until tender and hot throughout.' },
      { title: 'Serve', description: 'Plate, season to taste, and enjoy while warm.' }
    ],
    image_url: recipeImages[imageIndex % recipeImages.length]
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
        const recipes = (profile.recipes?.length ? profile.recipes : buildRecipes({ type: 'light' }, preferences)).map((item, index) => ({ ...item, image_url: item.image_url || recipeImages[index % recipeImages.length] }));
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
    if (!document.title.includes('Snap & Cook')) return;
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

  applySelectedPet();
  initPetSaving();
  document.querySelectorAll('#ai-meal-analyzing-modal .text-blue-800').forEach((element) => { element.textContent = 'Analyzing your photo'; });
  updateProfileFromPlan();
  initSnapAndCook();
  renderPlannerResults();
})();
