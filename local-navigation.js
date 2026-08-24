(() => {
  if (document.body.classList.contains('app-page')) {
    document.querySelectorAll('a[href="/"]').forEach((link) => { link.href = '/home'; });
  }
  if (document.title.includes('Your plan')) {
    document.querySelectorAll('a[href="/qa"]').forEach((link) => { link.href = '/home'; });
  }
  document.querySelectorAll('a[href^="/"]').forEach((link) => {
    const href = link.getAttribute('href');
    if (href && href !== '#' && !link.hasAttribute('data-add-meal')) link.href = href;
  });
})();
