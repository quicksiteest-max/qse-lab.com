import fs from 'node:fs';
import assert from 'node:assert/strict';
import { parseHTML } from 'linkedom';
import pages from './netlify/edge-functions/generated/pages.js';
import edge from './netlify/edge-functions/social-preview.js';
const origin='https://qse-lab.com',langs=['ru','et','en'];
const titles=new Set(),descriptions=new Set(),headings=new Set();
for(const [route,versions] of Object.entries(pages))for(const lang of langs){
 const canonical=origin+route+(lang==='ru'?'':'?lang='+lang);
 const response=await edge(new Request(canonical),{next:()=>{throw Error('Unexpected fallback');}});
 assert.equal(response.status,200);assert.equal(response.headers.get('content-language'),lang);
 const html=await response.text(),{document:d}=parseHTML(html);
 assert.equal(d.documentElement.lang,lang);assert.equal(d.querySelectorAll('h1').length,1,`${canonical}: one H1`);
 assert.ok(!headings.has(d.querySelector('h1').textContent));headings.add(d.querySelector('h1').textContent);
 assert.ok(!titles.has(d.title),`unique title ${canonical}`);titles.add(d.title);
 const description=d.querySelector('meta[name="description"]').content;
 assert.ok(description&&!descriptions.has(description),`unique description ${canonical}`);descriptions.add(description);
 assert.equal(d.querySelector('link[rel="canonical"]').href,canonical);
 assert.ok(!d.querySelector('meta[name="robots"]').content.includes('noindex'));
 for(const code of [...langs,'x-default'])assert.equal(d.querySelector(`link[hreflang="${code}"]`).href,origin+route+(['ru','x-default'].includes(code)?'':'?lang='+code));
 const graph=JSON.parse(d.querySelector('script[type="application/ld+json"]').textContent)['@graph'];
 assert.equal(graph.find(x=>x['@type']==='WebPage').inLanguage,lang);
 assert.ok(!html.includes('src="https://cdn.tailwindcss.com"')&&!html.includes('@tailwindcss/browser'));
 for(const script of d.querySelectorAll('script:not([src]):not([type="application/ld+json"])'))new Function(script.textContent);
 for(const img of d.querySelectorAll('img')){assert.ok(img.getAttribute('alt'));assert.ok(img.hasAttribute('width')&&img.hasAttribute('height'));assert.ok(fs.existsSync('dist/'+img.getAttribute('src')));}
 for(const a of d.querySelectorAll('a[href]')){
   const target=new URL(a.getAttribute('href'),canonical);if(target.origin!==origin)continue;
   if(target.pathname===route&&target.hash)assert.ok(d.getElementById(decodeURIComponent(target.hash.slice(1))),`${canonical}: broken anchor ${target.hash}`);
   if(Object.hasOwn(pages,target.pathname)){
     if(!a.hasAttribute('data-language')&&!a.hasAttribute('data-lang')&&!a.getAttribute('href').startsWith('#'))assert.equal(target.searchParams.get('lang'),lang==='ru'?null:lang,`${canonical}: language link ${a.href}`);
   }
 }
 if(route==='/'){
   const text=d.querySelector('h1').textContent;
   assert.ok(text.includes({ru:'Эстонии',et:'Eestis',en:'Estonia'}[lang]));
   assert.equal(d.querySelector('form[name="project-request"]').getAttribute('action'),'/thank-you');
   assert.equal(d.querySelector('[data-form-language]').getAttribute('value'),lang.toUpperCase());
   assert.equal(d.querySelector('.ai-audit-frame').getAttribute('src'),'about:blank');
 } else if(route.includes('demo')||route==='/beauty'){
   assert.ok(d.querySelector('.qse-demo-context'));assert.ok(d.querySelector('[data-qse-services]').href.includes('#services'));
   assert.equal(graph.filter(x=>['Dentist','MedicalClinic','BeautySalon','Review','AggregateRating'].includes(x['@type'])).length,0);
 }
 const head=await edge(new Request(canonical,{method:'HEAD'}),{next:()=>null});assert.equal(await head.text(),'');
 for(const alias of [route==='/'?'/index.html':route+'.html',route==='/'?'/?lang=ru':route+'/?lang='+lang]){
   const res=await edge(new Request(origin+alias),{next:()=>null});assert.equal(res.status,301,alias);assert.ok(res.headers.get('location'));
 }
}
let forwarded=false;await edge(new Request(origin+'/',{method:'POST',body:'form-name=project-request'}),{next:()=>{forwarded=true;return new Response('form');}});assert.ok(forwarded,'Netlify form POST forwarded');
const sitemap=parseHTML(fs.readFileSync('sitemap.xml','utf8').replaceAll(' />','></xhtml:link>')).document;
assert.equal(sitemap.querySelectorAll('url > loc').length,18);
assert.equal(sitemap.querySelectorAll('url > xhtml\\:link').length,72);
assert.ok(!fs.readFileSync('robots.txt','utf8').includes('Disallow: /thank-you'));
assert.ok(fs.readFileSync('dist/thank-you.html','utf8').includes('noindex'));
console.log('SEO checks passed: 18 HTML responses, unique metadata, one H1, self-canonical, reciprocal hreflang, schema, links, assets, redirects, HEAD, form POST and sitemap.');
