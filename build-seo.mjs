import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { parseHTML } from 'linkedom';
const read=f=>fs.readFileSync(f,'utf8');
const write=(f,s)=>{fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,s);};
const context=vm.createContext({window:{}});
for(const f of ['seo-data.js','site-copy.js','legal-content.js','consultant-et.js'])vm.runInContext(read(f),context);
const seo=context.qseSeo;
const routes={'/':'index.html','/beauty':'beauty.html','/clinic-demo':'clinic-demo.html','/consultant-demo':'consultant-demo.html','/terms':'terms.html','/warranty':'warranty.html'};
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const rich=s=>escape(s).replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>');
const url=(route,lang)=>seo.origin+route+(lang==='ru'?'':'?lang='+lang);
const dictionary=(html,start,end,name)=>{vm.runInContext(`globalThis.${name} = (() => { ${html.slice(html.indexOf(start),html.indexOf(end))} return translations; })();`,context);return context[name];};
const home=dictionary(read('index.html'),'const translations =','const translate =','homeTranslations');
const beauty=dictionary(read('beauty.html'),'const translations =','const metaDescription =','beautyTranslations');
const clinic=dictionary(read('clinic-demo.html'),'const translations =','const pageMeta =','clinicTranslations');
const legalLabels={ru:{home:'На главную',contents:'На этой странице',terms:'Условия сотрудничества',warranty:'Техническая гарантия',eyebrow:'QSE LAB · ИНФОРМАЦИЯ'},et:{home:'Avalehele',contents:'Sellel lehel',terms:'Koostöötingimused',warranty:'Tehniline garantii',eyebrow:'QSE LAB · TEAVE'},en:{home:'Back to home',contents:'On this page',terms:'Terms of cooperation',warranty:'Technical warranty',eyebrow:'QSE LAB · INFORMATION'}};
function visitText(node,fn){for(const c of [...node.childNodes]){if(c.nodeType===3)fn(c);else if(c.nodeType===1&&!['SCRIPT','STYLE'].includes(c.tagName))visitText(c,fn);}}
function setMeta(d,key,value,property=false){let el=d.querySelector(`meta[${property?'property':'name'}="${key}"]`);if(!el){el=d.createElement('meta');el.setAttribute(property?'property':'name',key);d.head.append(el);}el.content=value;}
function render(route,lang){
 const {document:d}=parseHTML(read(routes[route]));
 d.body.normalize();
 if(route==='/'){
   const formCard=d.querySelector('.qse-wordpress-card');if(formCard)formCard.href='/demos/digital-agency/'+(lang==='ru'?'ru/':'');
   const formPill=d.querySelector('[data-form-demo-link]');if(formPill)formPill.href='/demos/digital-agency/'+(lang==='ru'?'ru/':'');
   visitText(d.body,n=>{const key=n.nodeValue.trim(),text=home.strings[key]?.[lang];if(text)n.nodeValue=n.nodeValue.replace(key,text);});
   for(const el of d.querySelectorAll('[aria-label],[alt],[placeholder],[title]'))for(const a of ['aria-label','alt','placeholder','title']){const value=home.strings[el.getAttribute(a)]?.[lang];if(value)el.setAttribute(a,value);}
   d.querySelector('[data-form-language]').setAttribute('value',lang.toUpperCase());
   d.querySelector('.ai-audit-frame').dataset.language=lang;
   d.querySelector('.ai-audit-frame').setAttribute('src','about:blank');
 }else if(route==='/beauty'||route==='/clinic-demo'){
   const dict=(route==='/beauty'?beauty:clinic)[lang];
   for(const [attr,target] of [['data-i18n','text'],['data-i18n-html','html'],['data-i18n-placeholder','placeholder'],['data-i18n-aria','aria-label'],['data-i18n-alt','alt']])for(const el of d.querySelectorAll(`[${attr}]`)){const v=dict[el.getAttribute(attr)];if(v===undefined)throw Error(`${route} ${lang}: missing ${attr} ${el.getAttribute(attr)}`);if(target==='text')el.textContent=v;else if(target==='html')el.innerHTML=v;else el.setAttribute(target,v);}
 }else if(route==='/consultant-demo'){
   for(const el of d.querySelectorAll('[data-ru][data-en]')){const text=lang==='et'?context.qseConsultantEt[el.dataset.en]:el.dataset[lang];if(!text)throw Error(`Missing consultant translation: ${el.dataset.en}`);el.textContent=text;}
   for(const el of d.querySelectorAll('[data-en-placeholder]'))el.setAttribute('placeholder',lang==='et'?(context.qseConsultantEt[el.dataset.enPlaceholder]||el.dataset.enPlaceholder):el.dataset[lang+'Placeholder']);
   visitText(d.body,n=>{if(n.nodeValue.trim()==='Максим Орлов')n.nodeValue=n.nodeValue.replace('Максим Орлов',lang==='et'?'Maksim Orlov':lang==='en'?'Maxim Orlov':'Максим Орлов');});
 }else{
   const kind=route.slice(1),data=context.window.qseLegal[kind][lang],ui=legalLabels[lang];
   for(const el of d.querySelectorAll('[data-home]')){el.textContent=ui.home;el.href='/';}
   d.querySelector('.brand').href='/';d.querySelector('[data-eyebrow]').textContent=ui.eyebrow;d.querySelector('[data-title]').textContent=data.title;
   d.querySelector('[data-intro]').innerHTML=data.intro.map(p=>`<p>${rich(p)}</p>`).join('');
   d.querySelector('[data-contents-label]').textContent=ui.contents;
   d.querySelector('[data-contents]').innerHTML=data.sections.map((s,i)=>`<a href="#section-${i+1}">${escape(s[0])}</a>`).join('');
   d.querySelector('[data-sections]').innerHTML=data.sections.map((s,i)=>`<section id="section-${i+1}"><h2>${escape(s[0])}</h2>${s.slice(1).map(p=>`<p>${rich(p)}</p>`).join('')}</section>`).join('')+`<div class="ending"><p>${rich(data.ending)}</p></div>`;
   for(const el of d.querySelectorAll('[data-terms-link]')){el.textContent=ui.terms;el.href='/terms';}for(const el of d.querySelectorAll('[data-warranty-link]')){el.textContent=ui.warranty;el.href='/warranty';}
 }
 const demo=d.querySelector('.qse-demo-context');
 if(demo){const c=seo.demo[lang];demo.querySelector('h1').textContent=seo.pages[route][lang].title;demo.querySelector('p').textContent=c.text;demo.querySelector('[data-qse-services]').textContent=c.services;demo.querySelector('[data-qse-contact]').textContent=c.contact;}
 const attributes={
   'Выбор языка':{et:'Keele valik',en:'Language selection'},'Основная навигация':{et:'Põhinavigatsioon',en:'Main navigation'},'Мобильная навигация':{et:'Mobiilinavigatsioon',en:'Mobile navigation'},'Ключевые показатели':{et:'Põhinäitajad',en:'Key figures'},'Разделы':{et:'Jaotised',en:'Sections'},'Открыть меню':{et:'Ava menüü',en:'Open menu'},'5 звёзд':{et:'5 tärni',en:'5 stars'},
   'AERIS Clinic — на главную':{et:'AERIS Clinic — avalehele',en:'AERIS Clinic — home'},'Максим Орлов — на главную':{et:'Maksim Orlov — avalehele',en:'Maxim Orlov — home'},
   'Консультация пациента в современной стоматологической клинике AERIS':{et:'Patsiendi konsultatsioon QSE Labi AERIS Clinicu veebilehe näidisel',en:'Patient consultation in the QSE Lab AERIS Clinic website demo'},
   'Команда врачей клиники AERIS':{et:'Meeskonna esitlus AERIS Clinicu veebilehe näidisel',en:'Team presentation in the AERIS Clinic website concept'},
   'Бизнес-консультант Максим Орлов':{et:'Konsultandi portree QSE Labi veebilehe näidisel',en:'Consultant portrait in the QSE Lab website demo'},
   'Максим Орлов, консультант по стратегии бизнеса':{et:'Maksim Orlovi portree konsultandi veebilehe näidisel',en:'Maxim Orlov portrait in the consultant website concept'}
 };
 if(lang!=='ru')for(const el of d.querySelectorAll('[alt],[aria-label]'))for(const attr of ['alt','aria-label']){const text=attributes[el.getAttribute(attr)]?.[lang];if(text)el.setAttribute(attr,text);}
 d.documentElement.lang=lang;
 const meta=seo.pages[route][lang],canonical=url(route,lang);
 d.title=meta.title;setMeta(d,'description',meta.description);setMeta(d,'robots','index, follow, max-image-preview:large');d.querySelector('link[rel="canonical"]').href=canonical;
 for(const el of d.querySelectorAll('link[hreflang]'))el.remove();
 for(const code of [...seo.languages,'x-default']){const el=d.createElement('link');el.rel='alternate';el.setAttribute('hreflang',code);el.href=url(route,code==='x-default'?'ru':code);d.head.append(el);}
 const locale={ru:'ru_RU',et:'et_EE',en:'en_US'};
 for(const el of d.querySelectorAll('meta[property="og:locale:alternate"]'))el.remove();
 for(const [k,v] of Object.entries({'og:title':meta.title,'og:description':meta.description,'og:url':canonical,'og:locale':locale[lang],'og:site_name':'QSE Lab'}))setMeta(d,k,v,true);
 for(const other of seo.languages.filter(x=>x!==lang)){const el=d.createElement('meta');el.setAttribute('property','og:locale:alternate');el.content=locale[other];d.head.append(el);}
 setMeta(d,'twitter:title',meta.title);setMeta(d,'twitter:description',meta.description);
 const graph=[{'@type':'Organization','@id':seo.origin+'/#business',name:'QSE Lab',alternateName:'QUICKSITE EST',url:seo.origin+'/',logo:seo.origin+'/assets/q-mark.svg',email:'quicksite.est@gmail.com'},{'@type':'WebSite','@id':seo.origin+'/#website',url:seo.origin+'/',name:'QSE Lab',publisher:{'@id':seo.origin+'/#business'},inLanguage:seo.languages},{'@type':'WebPage','@id':canonical+'#webpage',url:canonical,name:meta.title,description:meta.description,inLanguage:lang,isPartOf:{'@id':seo.origin+'/#website'},about:{'@id':seo.origin+'/#business'},...(demo?{creator:{'@id':seo.origin+'/#business'},genre:'Website design demonstration'}:{})}];
 if(route==='/')graph.push({'@type':'Service','@id':seo.origin+'/#website-development',name:{ru:'Разработка сайтов в Эстонии',et:'Kodulehe loomine Eestis',en:'Website development in Estonia'}[lang],provider:{'@id':seo.origin+'/#business'},areaServed:{'@type':'Country',name:'Estonia'},url:canonical+'#services',serviceType:'Website development'});
 const schema=d.createElement('script');schema.type='application/ld+json';schema.textContent=JSON.stringify({'@context':'https://schema.org','@graph':graph});d.head.append(schema);
 for(const el of d.querySelectorAll('[data-language],[data-lang]')){const code=el.dataset.language||el.dataset.lang;el.setAttribute('aria-pressed',String(code===lang));if(code===lang)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');}
 for(const el of d.querySelectorAll('a[href]')){const href=el.getAttribute('href');if(!href.startsWith('/')&&!/^(?:index|terms|warranty)\.html/.test(href))continue;const t=new URL(href,seo.origin);t.pathname=t.pathname.replace('/index.html','/').replace(/\.html$/,'');if(!Object.hasOwn(routes,t.pathname))continue;if(!el.hasAttribute('data-language')&&!el.hasAttribute('data-lang')){if(lang==='ru')t.searchParams.delete('lang');else t.searchParams.set('lang',lang);}el.href=t.pathname+t.search+t.hash;}
 for(const img of d.querySelectorAll('img')){img.setAttribute('decoding','async');if(img.getAttribute('src')==='assets/beauty-hero-v2.png'){img.src='assets/beauty-hero.webp';img.setAttribute('srcset','assets/beauty-hero-480.webp 480w, assets/beauty-hero.webp 1024w');img.setAttribute('sizes','(max-width: 640px) 100vw, 50vw');}if(img.closest('dialog'))img.loading='lazy';}
 for(const el of d.querySelectorAll('script[src*="tailwindcss"]'))el.remove();
 if(['/', '/clinic-demo','/consultant-demo'].includes(route)){const css=d.createElement('link');css.rel='stylesheet';css.href=route==='/'?'/assets/home.css':'/assets/demos.css';d.head.prepend(css);}
 return d.toString();
}
const pages={};for(const route of Object.keys(routes)){pages[route]={};for(const lang of seo.languages)pages[route][lang]=render(route,lang);}
write('netlify/edge-functions/generated/pages.js','// Generated by build-seo.mjs.\nexport default '+JSON.stringify(pages)+';\n');
for(const [route,file] of Object.entries(routes))write('dist/'+file,pages[route].ru);
for(const f of ['seo-data.js','site-copy.js','consultant-et.js','legal-content.js','legal-page.js','legal-page.css','thank-you.html','_redirects','robots.txt'])write('dist/'+f,read(f));
fs.cpSync('assets','dist/assets',{recursive:true});
// Persistent WordPress demo source lives outside dist and survives every rebuild.
if(!fs.existsSync('demos/digital-agency/index.html'))throw Error('Digital Agency static source is missing. Restore demos/digital-agency before building.');
fs.cpSync('demos','dist/demos',{recursive:true});
const sitemap='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'+Object.keys(routes).flatMap(route=>seo.languages.map(lang=>'  <url>\n    <loc>'+escape(url(route,lang))+'</loc>\n'+[...seo.languages,'x-default'].map(code=>'    <xhtml:link rel="alternate" hreflang="'+code+'" href="'+escape(url(route,code==='x-default'?'ru':code))+'" />').join('\n')+'\n  </url>')).join('\n')+'\n</urlset>\n';
write('sitemap.xml',sitemap);write('dist/sitemap.xml',sitemap);
write('seo-home.css','@import "tailwindcss" source(none);\n@source "./index.html";\n');
execFileSync(process.execPath,['node_modules/@tailwindcss/cli/dist/index.mjs','-i','seo-home.css','-o','dist/assets/home.css','--minify'],{stdio:'inherit'});
write('seo-demos.css','@tailwind base;\n@tailwind components;\n@tailwind utilities;\n');
execFileSync(process.execPath,['node_modules/tailwindcss-v3/lib/cli.js','-i','seo-demos.css','-o','dist/assets/demos.css','--content','./clinic-demo.html,./consultant-demo.html','--minify'],{stdio:'inherit'});
console.log('Built 18 indexable RU/ET/EN HTML responses, localized sitemap and static Tailwind CSS.');
