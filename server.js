const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const localStyles = `
  <style>
    .store-slide { transition: transform .2s ease, filter .2s ease; }
    .store-slide.is-selected { transform: translateY(-8px); }
    .store-slide.is-selected .store-card {
      border: 4px solid var(--selected-pet-color, #ff4c2c) !important;
      background: linear-gradient(180deg, rgba(255,255,255,.12) 0%, var(--selected-pet-color, #ff4c2c) 100%) !important;
      box-shadow: 0 14px 30px rgba(26, 35, 55, .24);
    }
    .store-slide.is-selected .store-card::after {
      content: 'Selected';
      position: absolute;
      z-index: 2;
      bottom: 12px;
      left: 50%;
      transform: translateX(-50%);
      padding: 5px 12px;
      border-radius: 999px;
      color: #1b2538;
      background: rgba(255,255,255,.96);
      font-size: 12px;
      font-weight: 700;
      line-height: 1;
      pointer-events: none;
    }
    .store-slide.is-selected .store-pet-img { filter: drop-shadow(0 8px 8px rgba(26, 35, 55, .2)); }
    .store-swatch { transition: transform .18s ease, box-shadow .18s ease; }
    .store-swatch.is-selected {
      transform: translateY(-4px);
      outline: 3px solid #1b2538;
      outline-offset: 3px;
    }
    .entry-continue {
      display: block;
      width: 100%;
      padding: .85rem 1.25rem;
      border-radius: 999px;
      background: #17181b;
      color: #fff !important;
      font-weight: 700;
      line-height: 1.2;
      text-align: center;
      text-decoration: none;
    }
    .view-recipe-save.is-saved { background: #fff !important; color: #17181b !important; box-shadow: 0 3px 10px rgba(20, 25, 35, .16); }
    .view-recipe-save.is-saved [data-view-recipe-save-icon] { color: #17181b !important; }
    .home-card-calories.is-goal-complete .calories-intake-remaining { color: #49b96c !important; }
    .home-card-calories.is-goal-over .calories-intake-bar-fill { background: #ff5142 !important; }
    .home-card-calories.is-goal-over .calories-intake-remaining { color: #ff5142 !important; }
  </style>`;
const port = Number(process.env.PORT) || 4174;
const maxRequestBytes = 12 * 1024 * 1024;
const routes = {
  '/': 'lp.html', '/home': 'home.html', '/qa': 'qa.html', '/lp': 'lp.html', '/pin': 'entry-pin.html',
  '/wifi': 'wifi.html', '/wifi-operator-country-selector': 'wifi-operator-country-selector.html', '/wifi-no-number': 'wifi-no-number.html', '/onboarding': 'onboarding.html',
  '/sad-pot': 'sad-pot.html', '/happy-carrot': 'happy-carrot.html', '/sad-carrot': 'sad-carrot.html', '/happy-banana': 'happy-banana.html', '/sad-banana': 'sad-banana.html',
  '/home-activate-fasting': 'home-activate-fasting.html', '/home-fasting-active': 'home-fasting-active.html', '/home-fasting-in-progress': 'home-fasting-in-progress.html', '/home-fasting-paused': 'home-fasting-paused.html', '/home-fasting-goal-achieved': 'home-fasting-goal-achieved.html', '/home-fasting-completed': 'home-fasting-completed.html', '/home-recommendation': 'home-recommendation.html',
  '/terms': 'terms.html', '/faq': 'faq.html', '/contact': 'contact.html',
  '/profile': 'profile.html', '/profile-few': 'profile-few.html', '/profile-empty': 'profile-empty.html', '/profile-long': 'profile-long.html', '/stats': 'stats.html', '/cooking-planner': 'cooking-planner.html',
  '/snap-and-cook': 'snap-and-cook.html', '/snap-and-cook-result': 'snap-and-cook-result.html', '/party-planner': 'party-planner.html', '/party-planing-result': 'party-planing-result.html',
  '/edit-diet': 'edit-diet.html', '/edit-fasting': 'edit-fasting.html', '/edit-restrictions': 'edit-restrictions.html', '/edit-weight': 'edit-weight.html',
  '/home/edit-weight': 'home--edit-weight.html', '/onboarding/features': 'onboarding--features.html', '/charts': 'charts.html', '/error/404': 'error--404.html', '/error/500': 'error--500.html', '/error/subscription': 'error--subscription.html'
};

const sendJson = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
};
const readJson = (req) => new Promise((resolve, reject) => {
  let size = 0; let body = '';
  req.setEncoding('utf8');
  req.on('data', (chunk) => {
    size += Buffer.byteLength(chunk);
    if (size > maxRequestBytes) { reject(Object.assign(new Error('Image is too large.'), { status: 413 })); req.destroy(); return; }
    body += chunk;
  });
  req.on('end', () => { try { resolve(JSON.parse(body || '{}')); } catch (_) { reject(Object.assign(new Error('Invalid request.'), { status: 400 })); } });
  req.on('error', reject);
});
const outputText = (response) => response.output_text || response.output?.flatMap((item) => item.content || []).filter((item) => item.type === 'output_text').map((item) => item.text).join('') || '';
const parseModelJson = (value) => {
  const json = value.match(/\{[\s\S]*\}/)?.[0];
  if (!json) throw new Error('The food analysis did not return a usable result.');
  return JSON.parse(json);
};
const finite = (value, fallback = 0, maximum = 5000) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(0, Math.min(maximum, Math.round(numeric))) : fallback;
};
const text = (value, fallback = '') => String(value || fallback).replace(/[<>]/g, '').trim().slice(0, 120);
const cleanMeal = (data) => ({
  name: text(data.name, 'Unidentified meal'), calories: finite(data.calories), carbs: finite(data.carbs, 0, 1000), fats: finite(data.fats, 0, 1000), proteins: finite(data.proteins, 0, 1000),
  confidence: Math.min(1, Math.max(0, Number(data.confidence) || 0)), needsClarification: Boolean(data.needsClarification),
  ingredients: Array.isArray(data.ingredients) ? data.ingredients.slice(0, 6).map((item) => ({ name: text(item.name, 'Ingredient'), grams: finite(item.grams, 0, 2000) })) : []
});
const cleanPantry = (data) => ({
  detectedItems: Array.isArray(data.detectedItems) ? data.detectedItems.slice(0, 8).map((item) => text(item)).filter(Boolean) : [], preparedDish: Boolean(data.preparedDish), dishName: text(data.dishName),
  confidence: Math.min(1, Math.max(0, Number(data.confidence) || 0)),
  recipes: Array.isArray(data.recipes) ? data.recipes.slice(0, 3).map((item) => ({
    name: text(item.name, 'Recipe'), tag: text(item.tag, 'Based on your photo'), calories: finite(item.calories), prep_min: finite(item.prep_min, 10, 180), cook_min: finite(item.cook_min, 10, 240),
    ingredients: Array.isArray(item.ingredients) ? item.ingredients.slice(0, 8).map((ingredient) => text(ingredient)).filter(Boolean) : [], description: text(item.description),
    instructions: Array.isArray(item.instructions) ? item.instructions.slice(0, 5).map((step) => ({ title: text(step.title, 'Step'), description: text(step.description) })) : []
  })) : []
});
const titleFromLabel = (label) => String(label || 'Unidentified meal').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const pantryFallback = () => ({
  detectedItems: ['Ingredients from your photo'], preparedDish: false, dishName: '', confidence: 0, recipes: []
});
const hfMealFromLabel = (label, score) => {
  const normalised = String(label || '').toLowerCase().replaceAll('_', ' ');
  const profiles = [
    [/tiramisu/, { name: 'Tiramisu', calories: 480, carbs: 43, fats: 30, proteins: 7, ingredients: [{ name: 'Mascarpone cream', grams: 85 }, { name: 'Ladyfingers', grams: 45 }, { name: 'Cocoa powder', grams: 5 }] }],
    [/pizza/, { name: 'Pizza', calories: 540, carbs: 66, fats: 20, proteins: 24, ingredients: [{ name: 'Pizza base', grams: 110 }, { name: 'Cheese', grams: 55 }, { name: 'Tomato sauce', grams: 35 }] }],
    [/salad/, { name: 'Salad', calories: 220, carbs: 17, fats: 14, proteins: 7, ingredients: [{ name: 'Salad vegetables', grams: 180 }, { name: 'Dressing', grams: 20 }] }],
    [/pasta|spaghetti|lasagna|macaroni/, { name: titleFromLabel(label), calories: 520, carbs: 76, fats: 14, proteins: 20, ingredients: [{ name: 'Cooked pasta', grams: 180 }, { name: 'Sauce', grams: 120 }, { name: 'Cheese', grams: 18 }] }],
    [/chicken|steak|salmon|ribs|burger/, { name: titleFromLabel(label), calories: 470, carbs: 30, fats: 22, proteins: 38, ingredients: [{ name: titleFromLabel(label), grams: 170 }, { name: 'Side dish', grams: 130 }] }]
  ];
  const match = profiles.find(([pattern]) => pattern.test(normalised))?.[1];
  return { ...(match || { name: titleFromLabel(label), calories: 450, carbs: 48, fats: 19, proteins: 20, ingredients: [{ name: titleFromLabel(label), grams: 180 }] }), confidence: Math.min(1, Math.max(0, Number(score) || 0)), needsClarification: Number(score) < 0.55 };
};
const analyzeWithHuggingFace = async ({ image, mode }) => {
  const [, meta = '', encoded = ''] = image.match(/^data:([^;]+);base64,(.+)$/i) || [];
  const response = await fetch(`https://router.huggingface.co/hf-inference/models/${process.env.HF_FOOD_MODEL || 'nateraw/food'}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.HF_TOKEN}`, 'Content-Type': meta || 'image/jpeg' },
    body: Buffer.from(encoded, 'base64')
  });
  if (!response.ok) {
    const detail = await response.text();
    console.error('Hugging Face food analysis error:', response.status, detail.slice(0, 500));
    throw Object.assign(new Error('The Hugging Face food model is temporarily unavailable.'), { status: 502 });
  }
  const predictions = await response.json();
  const best = Array.isArray(predictions) ? predictions[0] : null;
  if (!best?.label) throw new Error('The food model did not return a dish.');
  const meal = hfMealFromLabel(best.label, best.score);
  if (mode === 'meal') return meal;
  const isPreparedDessert = /tiramisu|cake|cheesecake|mousse|donut|ice cream|creme brulee/.test(String(best.label).toLowerCase());
  return isPreparedDessert
    ? { detectedItems: [meal.name], preparedDish: true, dishName: meal.name, confidence: meal.confidence, recipes: [] }
    : { detectedItems: [meal.name], preparedDish: false, dishName: '', confidence: meal.confidence, recipes: [] };
};
const promptFor = (mode) => mode === 'pantry'
  ? `Analyze this food, pantry, or fridge photo. Return JSON only, with this exact shape: {"detectedItems":["..."],"preparedDish":false,"dishName":"","confidence":0.0,"recipes":[{"name":"","tag":"","calories":0,"prep_min":0,"cook_min":0,"ingredients":[""],"description":"","instructions":[{"title":"","description":""}]}]}. Identify food by visual evidence, not colours. If it is already a prepared dish (for example tiramisu), set preparedDish true and state its precise name; do not invent vegetables. Give three practical recipes only when visible ingredients support them. Use English names and conservative nutrition estimates.`
  : `Analyze this meal photo. Return JSON only, with this exact shape: {"name":"","calories":0,"carbs":0,"fats":0,"proteins":0,"confidence":0.0,"needsClarification":false,"ingredients":[{"name":"","grams":0}]}. Identify the dish by visual evidence, not colours. Be specific: if it is tiramisu, call it tiramisu, never a vegetable bowl. Estimate one visible serving conservatively. If the dish or portion cannot be identified confidently, set needsClarification true and do not guess ingredients.`;

const analyzeFood = async ({ image, mode }) => {
  if (!['meal', 'pantry'].includes(mode) || typeof image !== 'string' || !/^data:image\/(jpeg|jpg|png|webp);base64,/i.test(image)) throw Object.assign(new Error('Send a JPG, PNG, or WebP image.'), { status: 400 });
  if (process.env.HF_TOKEN) {
    try { return await analyzeWithHuggingFace({ image, mode }); }
    catch (error) {
      if (mode === 'pantry') return pantryFallback();
      throw error;
    }
  }
  if (!process.env.OPENAI_API_KEY) {
    if (mode === 'pantry') return pantryFallback();
    throw Object.assign(new Error('Food analysis is not configured. Add HF_TOKEN or OPENAI_API_KEY on the server.'), { status: 503 });
  }
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-5.6-terra', store: false, max_output_tokens: 900, input: [{ role: 'user', content: [{ type: 'input_text', text: promptFor(mode) }, { type: 'input_image', image_url: image, detail: 'high' }] }] })
  });
  if (!response.ok) {
    const detail = await response.text();
    console.error('OpenAI food analysis error:', response.status, detail.slice(0, 500));
    throw Object.assign(new Error('The image analysis service is temporarily unavailable.'), { status: 502 });
  }
  const result = parseModelJson(outputText(await response.json()));
  return mode === 'meal' ? cleanMeal(result) : cleanPantry(result);
};

http.createServer(async (req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  // Keep old prototype URLs working, but expose only the two intended entry
  // journeys: LP → PIN and the Wi-Fi flow → PIN.
  if (['/login', '/otp'].includes(pathname)) {
    res.writeHead(302, { Location: '/lp' }); return res.end();
  }
  if (['/demo-code', '/lp-confirm', '/otp-pin', '/wifi-pin'].includes(pathname)) {
    const query = new URL(req.url, 'http://localhost').search;
    res.writeHead(302, { Location: `/pin${query}` }); return res.end();
  }
  if (pathname === '/api/food-analysis' && req.method === 'POST') {
    try { return sendJson(res, 200, await analyzeFood(await readJson(req))); }
    catch (error) { return sendJson(res, error.status || 500, { error: error.message || 'Unable to analyze this image.' }); }
  }
  // The prototype pages contain a few regular forms. Serve their result pages on submit
  // instead of exposing a technical 405 message while no database is involved.
  const staticFormSubmit = req.method === 'POST' && Boolean(routes[pathname]);
  if (req.method !== 'GET' && req.method !== 'HEAD' && !staticFormSubmit) return sendJson(res, 405, { error: 'Method not allowed.' });
  const onboardingFile = pathname === '/onboarding' ? 'onboarding.html' : pathname.startsWith('/onboarding/') ? `onboarding--${pathname.slice('/onboarding/'.length).replaceAll('/', '--')}.html` : null;
  const scripts = new Set(['calorie-tracker.js', 'local-navigation.js', 'onboarding.js', 'app-experience.js', 'onboarding-pet.js']);
  const recipeAsset = /^\/assets\/recipes\/[a-z0-9-]+\.png$/i.test(pathname) ? pathname.slice(1) : null;
  const file = recipeAsset || (scripts.has(pathname.slice(1)) ? pathname.slice(1) : onboardingFile || routes[pathname]);
  if (!file) { res.writeHead(404); return res.end('Not found'); }
  const contentType = file.endsWith('.js') ? 'text/javascript; charset=utf-8' : file.endsWith('.png') ? 'image/png' : 'text/html; charset=utf-8';
  fs.readFile(path.join(root, file), (error, data) => {
    if (error) { res.writeHead(500); return res.end('Unable to load page'); }
    res.writeHead(200, { 'Content-Type': contentType });
    if (req.method === 'HEAD') return res.end();
    if (!file.endsWith('.html')) return res.end(data);
    const page = data.toString();
    const tracker = page.includes('src="/calorie-tracker.js"') ? '' : '    <script src="/calorie-tracker.js" defer></script>\n';
    res.end(page.replace('</head>', `${localStyles}\n</head>`).replace('</body>', `${tracker}    <script src="/local-navigation.js" defer></script>\n    <script src="/onboarding.js" defer></script>\n    <script src="/app-experience.js" defer></script>\n</body>`));
  });
}).listen(port, () => console.log(`Yumetics is ready at http://localhost:${port}`));
