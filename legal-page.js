(() => {
  const kind = document.body.dataset.page;
  const copy = window.qseLegal[kind];
  const languages = ['ru', 'et', 'en'];
  const labels = { ru: { home: 'На главную', contents: 'На этой странице', terms: 'Условия сотрудничества', warranty: 'Техническая гарантия', eyebrow: 'QSE LAB · ИНФОРМАЦИЯ' }, en: { home: 'Back to home', contents: 'On this page', terms: 'Terms of cooperation', warranty: 'Technical warranty', eyebrow: 'QSE LAB · INFORMATION' }, et: { home: 'Avalehele', contents: 'Sellel lehel', terms: 'Koostöötingimused', warranty: 'Tehniline garantii', eyebrow: 'QSE LAB · TEAVE' } };
  const escape = s => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
  const rich = s => escape(s).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  const localUrl = (path, lang) => `${path}${lang === 'ru' ? '' : '?lang=' + lang}`;
  const render = lang => {
    if (!languages.includes(lang)) lang = 'ru';
    const data = copy[lang], ui = labels[lang];
    document.documentElement.lang = lang;
    document.title = kind === 'terms' ? data.title : `${data.title} — QSE Lab`;
    document.querySelector('meta[name="description"]').content = data.intro[0];
    document.querySelector('link[rel="canonical"]').href = `https://qse-lab.com/${kind === 'terms' ? 'terms' : 'warranty'}${lang === 'ru' ? '' : '?lang=' + lang}`;
    document.querySelectorAll('[data-home]').forEach(a => { a.textContent = ui.home; a.href = localUrl('index.html', lang); });
    document.querySelector('.brand').href = localUrl('index.html', lang);
    document.querySelector('[data-eyebrow]').textContent = ui.eyebrow;
    document.querySelector('[data-title]').textContent = data.title;
    document.querySelector('[data-intro]').innerHTML = data.intro.map(p => `<p>${rich(p)}</p>`).join('');
    document.querySelector('[data-contents-label]').textContent = ui.contents;
    document.querySelector('[data-contents]').innerHTML = data.sections.map((s, i) => `<a href="#section-${i+1}">${escape(s[0])}</a>`).join('');
    document.querySelector('[data-sections]').innerHTML = data.sections.map((s, i) => `<section id="section-${i+1}"><h2>${escape(s[0])}</h2>${s.slice(1).map(p => `<p>${rich(p)}</p>`).join('')}</section>`).join('') + `<div class="ending"><p>${rich(data.ending)}</p></div>`;
    document.querySelectorAll('[data-terms-link]').forEach(a => { a.textContent = ui.terms; a.href = localUrl('terms.html', lang); });
    document.querySelectorAll('[data-warranty-link]').forEach(a => { a.textContent = ui.warranty; a.href = localUrl('warranty.html', lang); });
    document.querySelectorAll('[data-language]').forEach(b => { b.setAttribute('aria-pressed', String(b.dataset.language === lang)); b.title = {ru:'Русский',en:'English',et:'Eesti'}[b.dataset.language]; });
    try { localStorage.setItem('quicksite-language', lang); } catch {}
    try {
      const url = new URL(window.location.href);
      if (lang === 'ru') url.searchParams.delete('lang'); else url.searchParams.set('lang', lang);
      history.replaceState(history.state, '', url.href);
    } catch { /* Language switching still works when opened directly as a file. */ }
  };
  let initial = 'ru';
  try { const query = new URLSearchParams(location.search).get('lang'); const saved = localStorage.getItem('quicksite-language'); initial = languages.includes(query) ? query : languages.includes(saved) ? saved : 'ru'; } catch {}
  document.querySelectorAll('[data-language]').forEach(b => b.addEventListener('click', () => render(b.dataset.language)));
  render(initial);
})();
