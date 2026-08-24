(() => {
  'use strict';
  const KEY = 'yumetics-onboarding-v1';
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (_) { return {}; } };
  const save = (data) => localStorage.setItem(KEY, JSON.stringify(data));
  const answers = read();

  const renderSummary = () => {
    if (!document.title.includes('Your plan')) return;
    const age = Number(answers.age) || 30;
    const height = Number(answers.height) || 170;
    const weight = Number(answers.weight) || 75;
    const targetWeight = Number(answers.target_weight) || weight;
    const activity = { highly_active: 1.725, moderately_active: 1.55, lightly_active: 1.375, not_active: 1.2 }[answers.activity] || 1.375;
    const genderOffset = answers.gender === 'male' ? 5 : answers.gender === 'female' ? -161 : -78;
    const tdee = (10 * weight + 6.25 * height - 5 * age + genderOffset) * activity;
    const goalCalories = Math.round(Math.max(1200, Math.min(3200, tdee + (targetWeight < weight ? -500 : targetWeight > weight ? 300 : -200))));
    const protein = Math.round(targetWeight * 1.6);
    const fats = Math.round(targetWeight * 0.8);
    const carbs = Math.max(0, Math.round((goalCalories - protein * 4 - fats * 9) / 4));
    const water = Math.round(weight * 35 / 50) * 50;
    const fasting = Number.parseInt(answers.fasting_goal, 10) || 14;
    const weeks = Math.max(1, Math.ceil(Math.abs(weight - targetWeight) / 0.5));
    const targetDate = new Date(); targetDate.setDate(targetDate.getDate() + weeks * 7);
    const formattedDate = targetDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const text = (selector, value) => { const element = document.querySelector(selector); if (element) element.textContent = value; };
    text('.onboarding-step-title', `Reach ${targetWeight} kg by ${formattedDate}`);
    text('.trajectory-pill-start', `${weight} KG`); text('.trajectory-pill-target', `${targetWeight} KG`);
    const trajectoryPath = document.querySelector('.trajectory-path');
    const trajectoryChart = document.querySelector('.trajectory-chart');
    const direction = Math.sign(targetWeight - weight);
    if (trajectoryPath) {
      // Maintain is horizontal; a gain goal rises towards the target, while a loss goal falls.
      const path = direction === 0
        ? 'M2.9126 38.5 L244.156 38.5'
        : direction > 0
          ? 'M2.9126 74.7715 C60 74.6097 145 38 244.156 2.93521'
          : 'M2.9126 2.93521 C60 38 145 74.6097 244.156 74.7715';
      trajectoryPath.setAttribute('d', path);
    }
    if (trajectoryChart) {
      trajectoryChart.classList.toggle('trajectory-chart-maintain', direction === 0);
      trajectoryChart.classList.toggle('trajectory-chart-gain', direction > 0);
      trajectoryChart.setAttribute('aria-label', direction === 0
        ? `Weight maintained at ${weight} kg`
        : `Weight trajectory from ${weight} kg to ${targetWeight} kg`);
    }
    // A maintenance plan has one value, so retain the original clean chart style
    // instead of showing a second, identical target marker.
    ['.trajectory-vline-target', '.trajectory-pill-target', '.trajectory-dot-target'].forEach((selector) => {
      const element = document.querySelector(selector);
      if (element) element.hidden = direction === 0;
    });
    text('.trajectory-axis-mid', targetDate.toLocaleDateString('en-US', { month: 'long' }));
    text('.trajectory-axis-end', direction === 0 ? 'Maintain' : `Goal: ${targetWeight} kg`);
    text('.summary-card-nutrition .summary-metric-value', goalCalories.toLocaleString('en-US'));
    text('.summary-card-hydration .summary-metric-value', water);
    const fastingValues = document.querySelectorAll('.fasting-summary-value');
    if (fastingValues[0]) fastingValues[0].textContent = fasting;
    if (fastingValues[1]) fastingValues[1].textContent = 24 - fasting;
    const macroValues = document.querySelectorAll('.summary-card-nutrition .macro-balance-legend-value');
    [carbs, fats, protein].forEach((value, index) => { if (macroValues[index]) macroValues[index].innerHTML = `${value}<span class="macro-balance-legend-unit">g</span>`; });
    const macroBars = document.querySelectorAll('.summary-card-nutrition .segmented-bar > span');
    [carbs, fats, protein].forEach((value, index) => { if (macroBars[index]) macroBars[index].style.flex = Math.max(1, value); });
    const labels = {
      gender: { female: 'Female', male: 'Male', non_binary: 'Non-binary' },
      activity: { highly_active: 'Highly active', moderately_active: 'Moderately active', lightly_active: 'Lightly active', not_active: 'Not active' },
      diet: { balanced: 'Balanced', ketogenic: 'Ketogenic', vegetarian: 'Vegetarian', high_protein: 'High protein', vegan: 'Vegan', low_carb: 'Low carb', paleo: 'Paleo' },
      allergies: { meat: 'Meat', eggs: 'Eggs', animal_products: 'Animal products', nuts: 'Nuts', dairy: 'Dairy', seafood: 'Seafood' },
      habits: { reduce_sugar: 'Less sugar', reduce_stress: 'Reduce stress', less_processed: 'Less processed food', cook_home: 'Cook at home', stop_binge: 'Avoid binge eating', more_veggies: 'More vegetables' },
      pet: { pot: 'Pot', carrot: 'Carrot', banana: 'Banana' }
    };
    const list = (key) => [...new Set(Array.isArray(answers[key]) ? answers[key] : answers[key] ? [answers[key]] : [])]
      .map((value) => labels[key]?.[value] || value).join(', ') || 'Not selected';
    // Keep the original summary layout: its existing four design rows now carry
    // the user's choices instead of appending a separate card below it.
    const planRows = [
      `Goal: ${weight} kg → ${targetWeight} kg`,
      `Focus: ${list('habits')}`,
      `Activity: ${labels.activity[answers.activity] || 'Not selected'} · ${answers.fasting_goal ? `${fasting}:${24 - fasting}` : 'No fasting goal'}`,
      `Food style: ${list('diet')}${answers.allergies?.length ? ` · Avoiding ${list('allergies')}` : ''}`
    ];
    document.querySelectorAll('.summary-card-plan .summary-plan-item').forEach((row, index) => {
      const icon = row.querySelector('img');
      row.replaceChildren();
      if (icon) row.append(icon);
      row.append(document.createTextNode(` ${planRows[index] || ''}`));
    });
    const planDescription = document.querySelector('.summary-card-plan .summary-card-desc');
    if (planDescription) planDescription.textContent = `Created from your profile: ${labels.gender[answers.gender] || '—'}, ${age} years, ${height} cm. Your selected character will support your plan.`;
    answers.plan = { calories: goalCalories, carbs, fats, proteins: protein, water, weight, targetWeight, fasting, petName: answers.pet_name || 'Pepi', pet: answers.pet || 'pot' };
    answers.completed = true; save(answers); localStorage.removeItem('yumetics-calorie-tracker-v1');
  };

  document.querySelectorAll('input, select, textarea').forEach((field) => {
    const saved = answers[field.name];
    if (saved == null) return;
    if (field.type === 'checkbox') field.checked = Array.isArray(saved) && saved.includes(field.value);
    else if (field.type === 'radio') field.checked = saved === field.value;
    else field.value = saved;
  });

  document.querySelectorAll('form[action^="/onboarding/"]').forEach((form) => {
    const nextButton = document.querySelector(`[form="${form.id}"]`);
    const refreshButton = () => { if (nextButton) nextButton.disabled = !form.checkValidity(); };
    form.addEventListener('input', refreshButton); form.addEventListener('change', refreshButton); refreshButton();
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!form.checkValidity()) return form.reportValidity();
      const nextAnswers = read();
      [...new Set([...form.querySelectorAll('[name$="[]"]')].map((field) => field.name.replace(/\[\]$/, '')))]
        .forEach((name) => { delete nextAnswers[name]; });
      new FormData(form).forEach((value, name) => {
        const normalized = name.replace(/\[\]$/, '');
        if (name.endsWith('[]')) nextAnswers[normalized] = [...(nextAnswers[normalized] || []), value];
        else nextAnswers[name] = value;
      });
      save(nextAnswers);
      window.location.assign(form.action);
    });
  });

  const loader = document.querySelector('[data-personalizing]');
  if (loader) {
    const percent = loader.querySelector('[data-loader-percent]');
    let progress = 0;
    const timer = window.setInterval(() => { progress += 10; if (percent) percent.textContent = `${progress}%`; if (progress >= 100) { clearInterval(timer); window.location.assign(loader.dataset.nextUrl); } }, 150);
  }
  renderSummary();
})();
