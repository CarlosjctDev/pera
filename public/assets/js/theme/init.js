(function () {
  try {
    var stored = localStorage.getItem('app-theme');
    var pref =
      stored === 'light' || stored === 'dark' || stored === 'system'
        ? stored
        : 'system';

    var dark =
      pref === 'dark' ||
      (pref === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  } catch (e) {}
})();