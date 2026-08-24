(() => {
  'use strict';

  const KEY = 'yumetics-onboarding-v1';
  const pets = new Set(['pot', 'carrot', 'banana']);

  const read = () => {
    try { return JSON.parse(localStorage.getItem(KEY) || sessionStorage.getItem(KEY) || '{}'); }
    catch (_) { return {}; }
  };

  const save = (updates) => {
    try {
      const next = { ...read(), ...updates };
      next.plan = { ...(next.plan || {}), pet: next.pet || 'pot', petName: next.pet_name || next.plan?.petName || 'Pepi' };
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch (_) { /* The onboarding can still continue if browser storage is unavailable. */ }
  };

  const form = document.querySelector('#onboarding-form');
  const petOptions = [...document.querySelectorAll('#onboarding-form input[name="pet"]')];
  const nameInput = document.querySelector('#onboarding-form input[name="pet_name"]');
  const stored = read();

  if (petOptions.length) {
    const savedOption = petOptions.find((option) => option.value === stored.pet);
    if (savedOption) {
      savedOption.checked = true;
      // The original carousel also keeps its visual slide in sync through a label click.
      queueMicrotask(() => savedOption.closest('label')?.click());
    }
    petOptions.forEach((option) => option.addEventListener('change', () => {
      if (option.checked && pets.has(option.value)) save({ pet: option.value });
    }));
  }

  if (nameInput) {
    if (stored.pet_name) nameInput.value = stored.pet_name;
    nameInput.addEventListener('input', () => {
      const petName = nameInput.value.trim();
      if (petName) save({ pet_name: petName });
    });
  }

  form?.addEventListener('submit', () => {
    const pet = petOptions.find((option) => option.checked)?.value;
    const petName = nameInput?.value.trim();
    const updates = {};
    if (pets.has(pet)) updates.pet = pet;
    if (petName) updates.pet_name = petName;
    if (Object.keys(updates).length) save(updates);
  }, true);
})();
