(() => {
  'use strict';

  const STORAGE_KEY = 'yumetics-calorie-tracker-v1';
  const onboarding = (() => { try { return JSON.parse(localStorage.getItem('yumetics-onboarding-v1')) || {}; } catch (_) { return {}; } })();
  // Fasting can be configured before the complete onboarding plan exists.
  // Merge partial plans with safe defaults so the Home card never renders NaN.
  const GOALS = { calories: 1400, carbs: 185, fats: 71, proteins: 128, ...(onboarding.plan || {}) };
  const DEFAULT_STATE = {
    calories: 0,
    carbs: 0,
    fats: 0,
    proteins: 0,
    day: '',
    meals: []
  };

  const mealCatalog = {
    'margherita-pizza': { name: 'Margherita pizza', calories: 540, carbs: 66, fats: 20, proteins: 24 },
    'garden-salad': { name: 'Garden salad', calories: 220, carbs: 17, fats: 14, proteins: 7 },
    'grilled-chicken': { name: 'Grilled chicken', calories: 410, carbs: 2, fats: 15, proteins: 57 },
    'french-fries': { name: 'French fries', calories: 380, carbs: 50, fats: 18, proteins: 5 },
    'pasta-bowl': { name: 'Pasta bowl', calories: 520, carbs: 81, fats: 15, proteins: 19 },
    'tomato-soup': { name: 'Tomato soup', calories: 180, carbs: 28, fats: 6, proteins: 5 }
  };
  const correctionCatalog = {
    tiramisu: { name: 'Tiramisu', calories: 480, carbs: 43, fats: 30, proteins: 7, ingredients: [{ name: 'Mascarpone cream', grams: 85 }, { name: 'Ladyfingers', grams: 45 }, { name: 'Cocoa powder', grams: 5 }] },
    pizza: { name: 'Pizza slice', calories: 540, carbs: 66, fats: 20, proteins: 24, ingredients: [{ name: 'Pizza base', grams: 110 }, { name: 'Cheese', grams: 55 }, { name: 'Tomato sauce', grams: 35 }] },
    pasta: { name: 'Pasta plate', calories: 520, carbs: 81, fats: 15, proteins: 19, ingredients: [{ name: 'Cooked pasta', grams: 180 }, { name: 'Tomato sauce', grams: 110 }, { name: 'Cheese', grams: 20 }] },
    salad: { name: 'Salad bowl', calories: 220, carbs: 17, fats: 14, proteins: 7, ingredients: [{ name: 'Salad vegetables', grams: 180 }, { name: 'Dressing', grams: 20 }, { name: 'Toppings', grams: 35 }] },
    chicken: { name: 'Grilled chicken plate', calories: 410, carbs: 2, fats: 15, proteins: 57, ingredients: [{ name: 'Grilled chicken', grams: 170 }, { name: 'Vegetables', grams: 130 }, { name: 'Olive oil', grams: 10 }] }
  };

  const localDay = (date = new Date()) => {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
    const offset = date.getTimezoneOffset() * 60 * 1000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 10);
  };

  const dailyTotals = (meals, day) => meals
    .filter((meal) => localDay(new Date(meal.loggedAt)) === day)
    .reduce((totals, meal) => ({
      calories: totals.calories + (Number(meal.calories) || 0),
      carbs: totals.carbs + (Number(meal.carbs) || 0),
      fats: totals.fats + (Number(meal.fats) || 0),
      proteins: totals.proteins + (Number(meal.proteins) || 0)
    }), { calories: 0, carbs: 0, fats: 0, proteins: 0 });

  const stateForToday = (saved) => {
    const day = localDay();
    const meals = Array.isArray(saved.meals) ? saved.meals : [];
    const totals = dailyTotals(meals, day);
    const hasTodayMeals = meals.some((meal) => localDay(new Date(meal.loggedAt)) === day);
    const legacySameDay = saved.day === day && !hasTodayMeals;
    return {
      ...DEFAULT_STATE,
      ...totals,
      ...(legacySameDay ? {
        calories: Math.max(0, Number(saved.calories) || 0),
        carbs: Math.max(0, Number(saved.carbs) || 0),
        fats: Math.max(0, Number(saved.fats) || 0),
        proteins: Math.max(0, Number(saved.proteins) || 0)
      } : {}),
      day,
      meals
    };
  };

  const safeState = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && ['calories', 'carbs', 'fats', 'proteins', 'meals'].every((key) => key in saved)) {
        // Previous builds started every new profile with prototype nutrition data.
        // Discard only that untouched mock record; genuine logged meals stay intact.
        const isPrototypeState = !saved.meals?.length
          && Number(saved.calories) === 450 && Number(saved.carbs) === 120
          && Number(saved.fats) === 43 && Number(saved.proteins) === 100;
        return isPrototypeState ? { ...DEFAULT_STATE, meals: [] } : stateForToday(saved);
      }
    } catch (_) { /* A fresh session is enough if storage is unavailable. */ }
    return { ...DEFAULT_STATE, day: localDay(), meals: [] };
  };

  let state = safeState();
  let selectedMeal = null;
  let analyzedMeal = null;
  let selectedPhoto = '';

  const persist = () => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) { /* Keep the page usable without storage. */ }
  };

  // Keep a timestamp with each entry so Weekly Stats can report real calendar weeks.
  const logMeal = (meal) => {
    state.meals.push({ ...meal, loggedAt: new Date().toISOString() });
  };

  const number = (value) => Math.round(value).toLocaleString('en-US');
  const percentage = (value, goal) => Math.min(100, Math.max(0, (value / goal) * 100));

  const updateMacro = (className, value, goal) => {
    const macro = document.querySelector(`.${className}`);
    if (!macro) return;
    const item = macro.closest('.calories-intake-macro');
    const num = item?.querySelector('.calories-intake-macro-num');
    const goalValue = item?.querySelector('.calories-intake-macro-goal');
    const fill = item?.querySelector('.calories-intake-macro-fill');
    if (num) num.textContent = number(value);
    if (goalValue) goalValue.textContent = `/${number(goal)} g`;
    if (fill) fill.style.width = `${percentage(value, goal)}%`;
  };

  const renderMeals = () => {
    const list = document.querySelector('.home-meals');
    if (!list) return;
    const todaysMeals = state.meals.filter((meal) => localDay(new Date(meal.loggedAt)) === state.day);
    if (!todaysMeals.length) { list.replaceChildren(); return; }
    list.innerHTML = todaysMeals.slice(-6).map((meal) => `
      <li class="home-meal" title="${meal.name}: ${number(meal.calories)} kcal">
        <img src="${meal.image || 'https://yumetics-store-cdn-dev.s3.eu-west-1.amazonaws.com/cme-1306/ltr/images/food/burger.jpg'}" alt="${meal.name}" width="75" height="75">
      </li>`).join('');
  };

  const renderRecentMeals = () => {
    const wrapper = document.querySelector('.recent-meals-carousel .swiper-wrapper');
    const useButton = document.querySelector('.recent-meals-use');
    if (!wrapper) return;
    selectedMeal = null;
    if (useButton) useButton.disabled = true;
    wrapper.replaceChildren();
    const recentMeals = state.meals.slice(-12).reverse();
    if (!recentMeals.length) {
      const slide = document.createElement('div');
      slide.className = 'swiper-slide text-center text-body-muted py-4';
      slide.textContent = 'No recent meals yet.';
      wrapper.append(slide);
      return;
    }
    recentMeals.forEach((meal, index) => {
      const slide = document.createElement('div'); slide.className = 'swiper-slide';
      const label = document.createElement('label'); label.className = 'recent-meal-item mt-1';
      const input = document.createElement('input');
      input.type = 'radio'; input.name = 'recent-meal'; input.value = String(index); input.className = 'visually-hidden';
      input.addEventListener('change', () => {
        selectedMeal = meal;
        if (useButton) useButton.disabled = false;
      });
      const photo = document.createElement('span'); photo.className = 'recent-meal-photo';
      const image = document.createElement('img');
      image.src = meal.image || 'https://yumetics-store-cdn-dev.s3.eu-west-1.amazonaws.com/cme-1306/ltr/images/food/burger.jpg';
      image.alt = meal.name || 'Meal'; image.width = 95; image.height = 94;
      const name = document.createElement('span'); name.className = 'recent-meal-name fw-extrabold fs-7'; name.textContent = meal.name || 'Meal';
      const calories = document.createElement('span'); calories.className = 'recent-meal-kcal fw-medium text-body-muted'; calories.textContent = `${number(meal.calories || 0)} kcal`;
      photo.append(image); label.append(input, photo, name, calories); slide.append(label); wrapper.append(slide);
    });
  };

  const updatePetMood = (overGoal) => {
    const pet = onboarding.pet || onboarding.plan?.pet || 'pot';
    const selectedPet = ['pot', 'carrot', 'banana'].includes(pet) ? pet : 'pot';
    const mood = overGoal ? 'sad' : 'happy';
    const baseUrl = 'https://yumetics-store-cdn-dev.s3.eu-west-1.amazonaws.com/cme-1306/ltr/images/pets';
    document.querySelectorAll('.home-hero-pet img').forEach((image) => {
      image.src = `${baseUrl}/${selectedPet}/animations/${mood}.webp`;
      image.alt = onboarding.pet_name || onboarding.plan?.petName || 'Your pet';
    });
    // Going above the daily goal makes the character sad and costs one heart.
    document.querySelectorAll('.home-hero-lives .icon-heart').forEach((heart, index) => {
      heart.classList.toggle('icon-heart-filled', index < (overGoal ? 2 : 3));
    });
  };

  const render = () => {
    const intake = document.querySelector('.calories-intake');
    if (!intake) return;
    if (state.day !== localDay()) { state = stateForToday(state); persist(); }
    const value = intake.querySelector('.calories-intake-value > span:last-child');
    const fill = intake.querySelector('.calories-intake-bar-fill');
    const remaining = intake.querySelector('.calories-intake-remaining');
    const goalLabel = intake.querySelector('.calories-intake-goal');
    const card = intake.closest('.home-card-calories');
    if (value) value.innerHTML = `${number(state.calories)}<span class="calories-intake-unit text-neutral-300">kcal</span>`;
    if (goalLabel) goalLabel.textContent = `${number(GOALS.calories)} GOAL`;
    if (fill) fill.style.width = `${percentage(state.calories, GOALS.calories)}%`;
    const reachedGoal = Number(GOALS.calories) > 0 && state.calories >= Number(GOALS.calories);
    const overGoal = Number(GOALS.calories) > 0 && state.calories > Number(GOALS.calories);
    if (card) {
      // Keep the original clean card and red intake bar at every level.
      card.classList.remove('is-goal-reached');
      card.classList.toggle('is-goal-complete', reachedGoal && !overGoal);
      card.classList.toggle('is-goal-over', overGoal);
    }
    if (remaining) {
      const difference = GOALS.calories - state.calories;
      remaining.textContent = overGoal
        ? `+${number(Math.abs(difference))} kcal above your goal`
        : reachedGoal
        ? 'Completed!'
        : difference >= 0
        ? `${number(difference)} kcal under your goal`
        : `${number(Math.abs(difference))} kcal over your goal`;
    }
    updateMacro('calories-intake-macro-fill-carbs', state.carbs, GOALS.carbs);
    updateMacro('calories-intake-macro-fill-fats', state.fats, GOALS.fats);
    updateMacro('calories-intake-macro-fill-proteins', state.proteins, GOALS.proteins);
    updatePetMood(overGoal);
    renderMeals();
    renderRecentMeals();
    const petName = document.querySelector('.home-hero-name');
    if (petName && onboarding.plan?.petName) petName.textContent = onboarding.plan.petName;
  };

  const modalElement = document.getElementById('recent-meals-modal');
  const showMealPicker = () => {
    renderRecentMeals();
    if (window.bootstrap?.Modal && modalElement) window.bootstrap.Modal.getOrCreateInstance(modalElement).show();
    else if (modalElement) { modalElement.classList.add('show'); modalElement.style.display = 'block'; }
  };
  const hideMealPicker = () => {
    if (window.bootstrap?.Modal && modalElement) window.bootstrap.Modal.getOrCreateInstance(modalElement).hide();
    else if (modalElement) { modalElement.classList.remove('show'); modalElement.style.display = 'none'; }
  };

  const showModal = (id) => {
    const element = document.getElementById(id);
    if (window.bootstrap?.Modal && element) window.bootstrap.Modal.getOrCreateInstance(element).show();
    else if (element) { element.classList.add('show'); element.style.display = 'block'; }
  };
  const hideModal = (id) => {
    const element = document.getElementById(id);
    if (window.bootstrap?.Modal && element) window.bootstrap.Modal.getOrCreateInstance(element).hide();
    else if (element) { element.classList.remove('show'); element.style.display = 'none'; }
  };

  const setResult = (meal) => {
    document.querySelector('#ai-meal-result-title').textContent = meal.name;
    const photo = document.querySelector('.ai-meal-result-photo');
    if (photo && selectedPhoto) { photo.src = selectedPhoto; photo.alt = meal.name; }
    const calories = document.querySelector('.ai-meal-result .icon-flame')?.parentElement;
    if (calories) calories.innerHTML = `<span class="icon-flame"></span> ${number(meal.calories)} <span class="fs-7 fw-medium text-body-muted">kcal</span>`;
    const legend = document.querySelectorAll('.macro-balance-legend-value');
    [meal.carbs, meal.fats, meal.proteins].forEach((value, index) => { if (legend[index]) legend[index].innerHTML = `${number(value)}<span class="macro-balance-legend-unit">g</span>`; });
    const bars = document.querySelectorAll('.segmented-bar > span');
    [meal.carbs, meal.fats, meal.proteins].forEach((value, index) => { if (bars[index]) bars[index].style.flex = Math.max(1, value); });
    const grid = document.querySelector('.ai-meal-result .row.g-3');
    if (grid && meal.ingredients.length) grid.innerHTML = meal.ingredients.map((ingredient) => `<div class="col-12 col-md-6"><div class="d-flex align-items-center justify-content-between bg-white rounded-3 ps-4 pe-2 py-3"><span class="fw-medium text-body-muted">${ingredient.name}</span><span class="d-inline-flex align-items-center bg-white shadow-sm rounded-3 px-3 py-2 fw-semibold">${number(ingredient.grams)}g</span></div></div>`).join('');
    let correction = document.querySelector('#meal-correction');
    if (!correction) {
      correction = document.createElement('div');
      correction.id = 'meal-correction'; correction.className = 'mt-2 fs-8 text-body-muted';
      const label = document.createElement('label'); label.htmlFor = 'meal-correction-select'; label.textContent = 'Is this not right? ';
      const select = document.createElement('select'); select.id = 'meal-correction-select'; select.className = 'form-select form-select-sm d-inline-block w-auto ms-1';
      select.append(new Option('Choose the food', ''), ...Object.entries(correctionCatalog).map(([key, item]) => new Option(item.name, key)));
      select.addEventListener('change', () => {
        const replacement = correctionCatalog[select.value];
        if (!replacement) return;
        analyzedMeal = { ...replacement, image: analyzedMeal?.image || '' };
        setResult(analyzedMeal);
      });
      correction.append(label, select);
      document.querySelector('.ai-meal-result-title')?.closest('.col-12')?.append(correction);
    }
    const correctionSelect = document.querySelector('#meal-correction-select');
    const matched = Object.entries(correctionCatalog).find(([, item]) => item.name === meal.name)?.[0] || '';
    if (correctionSelect) correctionSelect.value = matched;
  };

  const makeThumbnail = (dataUrl) => new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 120;
      const context = canvas.getContext('2d');
      const side = Math.min(image.width, image.height);
      context.drawImage(image, (image.width - side) / 2, (image.height - side) / 2, side, side, 0, 0, 120, 120);
      resolve(canvas.toDataURL('image/jpeg', .72));
    };
    image.onerror = () => resolve('');
    image.src = dataUrl;
  });

  const estimateMealFromPhoto = async (dataUrl) => {
    const response = await fetch('/api/food-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: dataUrl, mode: 'meal' })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'We could not analyze this photo.');
    if (result.needsClarification) {
      result.name = `${result.name} (please verify)`;
    }
    return result;
  };

  const choosePhoto = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/jpeg,image/png,image/webp'; input.hidden = true;
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      input.remove();
      if (!file) return;
      if (file.size > 8 * 1024 * 1024) return window.alert('Choose an image smaller than 8 MB.');
      const reader = new FileReader();
      reader.onload = async () => {
        selectedPhoto = String(reader.result);
        document.querySelector('[data-analyzing-photo]').src = selectedPhoto;
        showModal('ai-meal-analyzing-modal');
        try {
          const [meal, thumbnail] = await Promise.all([estimateMealFromPhoto(selectedPhoto, file.name), makeThumbnail(selectedPhoto)]);
          analyzedMeal = { ...meal, image: thumbnail };
          setResult(analyzedMeal);
          hideModal('ai-meal-analyzing-modal');
          showModal('ai-meal-result-modal');
        } catch (error) {
          hideModal('ai-meal-analyzing-modal');
          window.alert(error.message);
        }
      };
      reader.readAsDataURL(file);
    });
    document.body.append(input); input.click();
  };

  document.addEventListener('click', (event) => {
    const addButton = event.target.closest('[data-add-meal]');
    if (addButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      choosePhoto();
    }
  }, true);

  document.querySelector('.recent-meals-use')?.addEventListener('click', (event) => {
    event.preventDefault();
    if (!selectedMeal) return;
    state.calories += selectedMeal.calories;
    state.carbs += selectedMeal.carbs;
    state.fats += selectedMeal.fats;
    state.proteins += selectedMeal.proteins;
    logMeal(selectedMeal);
    persist();
    render();
    hideMealPicker();
  });

  document.querySelector('[data-ai-meal-confirm]')?.addEventListener('click', (event) => {
    event.preventDefault(); event.stopImmediatePropagation();
    if (!analyzedMeal) return;
    const servings = Math.max(1, Number(document.querySelector('.ai-meal-result-input')?.value) || 1);
    const meal = Object.fromEntries(Object.entries(analyzedMeal).map(([key, value]) => [key, typeof value === 'number' ? Math.round(value * servings) : value]));
    state.calories += meal.calories; state.carbs += meal.carbs; state.fats += meal.fats; state.proteins += meal.proteins;
    logMeal(meal); persist(); render(); hideModal('ai-meal-result-modal');
    const message = document.querySelector('[data-meal-success-message]');
    if (message) message.textContent = `${meal.name} added to today.`;
    showModal('ai-meal-success-sheet');
  }, true);

  render();
})();
