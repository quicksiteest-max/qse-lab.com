import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const read = file => fs.readFileSync(file, 'utf8');
const home = read('index.html');
const inline = home.match(/<script>\s*\(\(\) => \{[\s\S]*?<\/script>/);
assert.ok(inline, 'homepage script exists');
new Function(inline[0].slice(8, -9));

const context = { window: {} };
vm.runInNewContext(read('site-copy.js'), context);
vm.runInNewContext(read('legal-content.js'), context);
const translations = context.window.qseContent.home;
for (const [source, languages] of Object.entries(translations)) {
  for (const language of ['ru', 'en', 'et']) assert.ok(languages[language], `missing ${language}: ${source}`);
}

const plans = home.match(/<article class="qse-plan[^>]*>/g) ?? [];
assert.equal(plans.length, 3, 'three website plans');
for (const [name, price] of [['STARTER', '€350'], ['BUSINESS', '€700'], ['PREMIUM', '€1500']]) {
  assert.ok(home.includes(`<p class="qse-plan-name">${name}</p>`));
  assert.ok(home.includes(`</span> ${price}</p>`));
}
assert.ok(home.indexOf('qse-plan-name">PREMIUM') < home.indexOf('class="qse-extras"'));
assert.ok(home.indexOf('class="qse-extras"') < home.indexOf('AI Инструменты &amp; Автоматизация'));
assert.ok(home.includes('lg:grid-cols-2 lg:gap-8'), 'AI card layout wrapper remains separate');
assert.ok(home.includes('Выбрать AI Решения</a>'), 'AI card button remains');
assert.ok(home.includes('href="#contact" class="mt-9 inline-flex'), 'AI card link remains');

const form = home.match(/<form name="project-request"[\s\S]*?<\/form>/)?.[0];
assert.ok(form);
for (const value of ['method="POST"', 'action="/thank-you"', 'data-netlify="true"', 'netlify-honeypot="bot-field"', 'name="form-name" value="project-request"', 'name="language"', 'name="bot-field"', 'name="name"', 'name="email"', 'name="phone"', 'name="project_type"', 'name="budget"', 'name="message"']) assert.ok(form.includes(value), `form contract: ${value}`);
for (const value of ['starter', 'business', 'premium', 'ai-solutions']) {
  assert.ok(form.includes(`<option value="${value}">`), `budget/project option ${value}`);
  assert.equal((form.match(new RegExp(`<option value="${value}">`, 'g')) ?? []).length, 2);
}

for (const kind of ['terms', 'warranty']) {
  const file = `${kind}.html`;
  const html = read(file);
  const count = kind === 'terms' ? 11 : 3;
  assert.equal((html.match(/<section id="section-/g) ?? []).length, count, `${kind} static Russian content`);
  for (const language of ['ru', 'en', 'et']) {
    assert.equal(context.window.qseLegal[kind][language].sections.length, count, `${kind} ${language} sections`);
  }
  assert.ok(html.includes('legal-content.js') && html.includes('legal-page.js'));
}

for (const file of ['index.html', 'terms.html', 'warranty.html']) {
  const html = read(file);
  for (const match of html.matchAll(/href="([^"]+)"/g)) {
    const href = match[1];
    if (href.startsWith('#') || href.startsWith('/') || /^[a-z]+:/i.test(href)) continue;
    assert.ok(fs.existsSync(href.split(/[?#]/)[0]), `${file}: broken local link ${href}`);
  }
}
assert.ok(home.includes('assets/qse-lab-social-1200x630.jpg'), 'social preview retained');
assert.ok(!/href="[^"]*privacy/i.test(home), 'no active link to unapproved privacy policy');
console.log(`Local checks passed: 3 plans, ${Object.keys(translations).length} translated new strings, RU/EN/ET terms and warranty, form fields, internal links, social preview metadata.`);
