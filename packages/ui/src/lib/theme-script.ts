// Inline script to prevent flash of wrong theme on SSR
// Inject as raw <script> in <head> before React hydrates
export const themeScript = `
(function() {
  try {
    var t = localStorage.getItem('theme') || 'light';
    var d = t === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : t === 'dark';
    if (d) document.documentElement.classList.add('dark');
  } catch(e) {}
})();
`
