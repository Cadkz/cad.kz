// @ts-check
export const THEME_STORAGE_KEY = 'cad-site-theme'

/** Выполняется синхронно до первого кадра; недоступный localStorage не ломает страницу. */
export const THEME_INIT_SCRIPT = `(() => {
  let preference;
  try { preference = localStorage.getItem('${THEME_STORAGE_KEY}'); } catch {}
  const dark = preference === 'dark' || (preference !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.siteTheme = dark ? 'dark' : 'light';
})();`
