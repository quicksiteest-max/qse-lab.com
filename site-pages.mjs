import { copy } from './site-pages-copy.mjs';

export const servicePaths = {
  wordpress: '/services/wordpress-development',
  crm: '/services/custom-crm-ai',
  quiz: '/services/quizzes-calculators'
};

export const projectOptions = {
  ru: { wordpress: 'WordPress', crm: 'CRM и AI-автоматизация', quiz: 'Квиз или калькулятор', chooseBudget: 'Выберите бюджет', discuss: 'Нужно обсудить' },
  en: { wordpress: 'WordPress', crm: 'CRM and AI automation', quiz: 'Quiz or calculator', chooseBudget: 'Select a budget', discuss: 'Let’s discuss' },
  et: { wordpress: 'WordPress', crm: 'CRM ja AI-automatiseerimine', quiz: 'Küsimustik või kalkulaator', chooseBudget: 'Valige eelarve', discuss: 'Vajab arutamist' }
};

const landingPages = {
  '/services': 'services',
  '/portfolio': 'portfolio',
  '/contact': 'contact',
  ...Object.fromEntries(Object.entries(servicePaths).map(([key, route]) => [route, key]))
};

export const pageMetadata = Object.fromEntries(Object.entries(landingPages).map(([route, key]) => [
  route,
  Object.fromEntries(Object.entries(copy).map(([lang, ui]) => [
    lang, {
      title: (ui[key].title ?? ui[key]) + ' — QSE Lab',
      description: ui[key].description ?? ui[key + 'Description']
    }
  ]))
]));

const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const brand = '<a class="qse-brand" href="/"><span aria-hidden="true"></span>QSE Lab</a>';
const link = (href, label, className = '') => `<a${className ? ` class="${className}"` : ''} href="${escape(href)}">${escape(label)}</a>`;
const formDemo = (lang, from) => `/demos/digital-agency/${lang === 'ru' ? 'ru/' : ''}?from=${from}&lang=${lang}`;
const quizDemo = lang => '/demos/ai-business-audit/' + (lang === 'ru' ? '' : '?lang=' + lang);
const contacts = project => '/contact' + (project ? '?project=' + project : '');

function siteHeader(route, lang) {
  const ui = copy[lang];
  const navLink = (href, label, className = '') =>
    `<a class="qse-nav-link ${className}" href="${href}"${href === route ? ' aria-current="page"' : ''}>${escape(label)}</a>`;
  return `<header class="qse-site-header">
    ${brand}
    <nav class="qse-site-nav" aria-label="${ui.nav}">
      ${navLink('/', ui.home)}
      <details class="qse-site-services">
        <summary${route.startsWith('/services') ? ' class="qse-nav-section-active"' : ''}>${ui.services} <span aria-hidden="true"></span></summary>
        <div class="qse-service-menu">
          ${navLink('/services', ui.allServices)}
          ${Object.entries(servicePaths).map(([key, href]) => navLink(href, ui[key].title)).join('')}
        </div>
      </details>
      ${navLink('/portfolio', ui.portfolio)}
      ${navLink('/contact', ui.contact, 'qse-nav-contact')}
    </nav>
    <div class="language-switcher" role="group" aria-label="${ui.language}">
      ${['ru', 'et', 'en'].map(code => `<a data-language="${code}" href="${route}${code === 'ru' ? '' : '?lang=' + code}" hreflang="${code}" lang="${code}">${code.toUpperCase()}</a>`).join('')}
    </div>
  </header>`;
}

const media = '/assets/project-media/';
const images = {
  wordpress: ['/assets/form-first-screen.webp', 1409, 884],
  editor: [media + 'form-gutenberg.jpg', 1600, 1200],
  crm: [media + 'qse-clients-nikita.png', 1600, 1200],
  quiz: [media + 'ai-business-audit.png', 1600, 1200],
  beauty: ['/assets/beauty-hero.webp', 1023, 1537],
  consultant: ['/assets/consultant-max-orlov.jpg', 1024, 1536],
  clinic: ['/assets/clinic-hero.jpg', 1774, 887]
};
const image = (key, alt) => {
  const [src, width, height] = images[key];
  return `<img src="${src}" width="${width}" height="${height}" alt="${escape(alt)}" loading="lazy">`;
};
const video = (file, poster, label) =>
  `<video class="qse-project-video" controls playsinline preload="none" poster="${images[poster][0]}" aria-label="${escape(label)}"><source src="${media}${file}.mp4" type="video/mp4"></video>`;

function servicesPage(ui, extras) {
  return `<div class="qse-page-grid qse-page-grid--services">${Object.entries(servicePaths).map(([key, route]) =>
    `<article class="qse-page-card qse-service-card qse-accent-${key}">
      <h2>${escape(ui[key].title)}</h2><p>${escape(ui[key].intro)}</p>
      ${link(route, ui.more, 'qse-page-link')}
    </article>`).join('')}</div>
    ${extras}
    <div class="qse-page-actions">${link('/#services', ui.pricing, 'qse-page-button')}${link('/contact', ui.discuss, 'qse-page-button qse-page-button--primary')}</div>`;
}

function servicePage(key, lang) {
  const ui = copy[lang];
  const service = ui[key];
  const mediaLabel = ui.watchDemo + ' · ' + service.example;
  const actions = [link(contacts(key), service.cta, 'qse-page-button qse-page-button--primary')];
  const topActions = key === 'crm' ? [link('#demo', ui.watchDemo, 'qse-page-button')] : [];
  let demo;
  if (key === 'wordpress') {
    actions.unshift(link(formDemo(lang, 'wordpress'), ui.formDemo, 'qse-page-button'));
    demo = `<div class="qse-page-grid qse-page-grid--pair qse-project-figures">
      <figure>${image('wordpress', service.siteView)}<figcaption>${escape(service.siteView)}</figcaption></figure>
      <figure>${image('editor', service.editorView)}<figcaption>${escape(service.editorView)}</figcaption></figure>
    </div>
    ${video('form', 'wordpress', mediaLabel)}`;
  } else if (key === 'crm') {
    demo = video('qse-clients-nikita', 'crm', mediaLabel);
  } else {
    actions.unshift(link(quizDemo(lang), ui.quizDemo, 'qse-page-button'));
    demo = video('ai-business-audit', 'quiz', mediaLabel);
  }
  return `<div class="qse-page-actions qse-page-actions--top">${topActions.concat(actions).join('')}</div>
    <div class="qse-page-grid qse-page-grid--pair">${service.details.map(([title, body]) =>
      `<section class="qse-page-card qse-service-card qse-accent-${key}"><h2>${escape(title)}</h2><p>${escape(body)}</p></section>`).join('')}</div>
    <section id="demo" class="qse-page-section qse-case-study">
      <h2>${escape(service.example)}</h2>
      <p>${escape(service.exampleText)}</p>
      ${service.result ? `<p>${escape(service.result)}</p>` : ''}
      ${key === 'wordpress' ? `<p class="qse-media-note">${ui.formLanguage}</p>` : ''}
      ${service.mediaNote ? `<p class="qse-media-note">${service.mediaNote}</p>` : ''}
      ${demo}
      <div class="qse-page-actions">${actions.join('')}</div>
    </section>
    <nav class="qse-related" aria-label="${ui.related}">${Object.entries(servicePaths).filter(([other]) => other !== key).map(([other, href]) => link(href, ui[other].title)).join('')}
      ${link('/portfolio', ui.seeWork)}
    </nav>`;
}

function portfolioPage(lang) {
  const ui = copy[lang];
  const projects = [
    ['crm', [[servicePaths.crm + '#demo', ui.watchDemo]]],
    ['quiz', [[quizDemo(lang), ui.quizDemo], [servicePaths.quiz + '#demo', ui.watchDemo]]],
    ['wordpress', [[formDemo(lang, 'portfolio'), ui.openDemo], [servicePaths.wordpress + '#demo', ui.watchDemo]], lang === 'et' ? ui.formLanguage : ''],
    ['beauty', [['/beauty', ui.openDemo]]],
    ['consultant', [['/consultant-demo', ui.openDemo]]],
    ['clinic', [['/clinic-demo', ui.openDemo]]]
  ];
  const cards = projects.map(([key, links, note], index) => {
    const [title, text] = ui.projects[index];
    return `<article class="qse-page-card qse-project-card qse-project-card--${key}">
      <div class="qse-project-image">${image(key, title)}</div>
      <div class="qse-project-content"><h3>${escape(title)}</h3><p>${escape(text)}</p>
        ${note ? `<p class="qse-media-note">${note}</p>` : ''}
        <div class="qse-project-links">${links.map(([href, label]) => link(href, label, 'qse-page-link')).join('')}</div>
      </div>
    </article>`;
  });
  return `<section class="qse-page-section"><h2>${ui.live}</h2><div class="qse-page-grid qse-page-grid--pair">${cards.slice(0, 2).join('')}</div></section>
    <section class="qse-page-section"><h2>${ui.demos}</h2><div class="qse-page-grid qse-page-grid--portfolio">${cards.slice(2).join('')}</div></section>
    <div class="qse-page-actions">${link('/services', ui.allServices, 'qse-page-button')}${link('/contact', ui.discuss, 'qse-page-button qse-page-button--primary')}</div>`;
}

export function renderSitePage(route, lang, { form, footer, extras }) {
  const ui = copy[lang];
  const key = landingPages[route];
  const isService = Object.hasOwn(servicePaths, key);
  const title = isService ? ui[key].title : ui[key];
  const intro = isService ? ui[key].intro : ui[key === 'contact' ? 'contactsIntro' : key + 'Intro'];
  const body = isService ? servicePage(key, lang)
    : key === 'services' ? servicesPage(ui, extras)
    : key === 'portfolio' ? portfolioPage(lang) : form;
  return `<!doctype html><html lang="${lang}"><head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#020617">
    <meta property="og:image" content="https://qse-lab.com/assets/qse-lab-social-1200x630.jpg">
    <link rel="icon" href="/assets/favicon.svg"><link rel="canonical">
    <link rel="stylesheet" href="/assets/site-pages.css"><script src="/assets/site-pages.js" defer></script>
    <title></title>
  </head><body class="qse-subpage">
    ${siteHeader(route, lang)}
    <main class="qse-page qse-accent-${key}${key === 'contact' ? ' qse-contact-page' : ''}">
      <div class="qse-page-heading">
        ${isService ? link('/services', '‹ ' + ui.allServices, 'qse-back') : ''}
        <h1>${escape(title)}</h1><p>${escape(intro)}</p>
      </div>
      ${body}
    </main>
    ${footer}
  </body></html>`;
}

export function enhanceHome(document, lang) {
  const ui = copy[lang];
  const header = document.querySelector('header[data-site-header]');
  header.outerHTML = siteHeader('/', lang);
  document.querySelector('head').insertAdjacentHTML('beforeend',
    '<link rel="stylesheet" href="/assets/site-pages.css"><script src="/assets/site-pages.js" defer></script>');
  document.querySelector('#services-title').insertAdjacentHTML('afterend',
    `<div class="qse-home-page-link">${link('/services', ui.allServices, 'qse-page-button')}</div>`);
}
