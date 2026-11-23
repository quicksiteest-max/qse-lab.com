import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import pages from './netlify/edge-functions/generated/pages.js';
const require=createRequire(process.execPath);
const {chromium}=require('playwright');
const {server}=await import('./local-preview.mjs');
const browser=await chromium.launch({headless:true,channel:'msedge'});
const base='http://127.0.0.1:'+(process.env.QSE_PREVIEW_PORT||4173);
const results=[],errors=[];
const interactionsOnly=process.argv.includes('--interactions');
for(const width of interactionsOnly?[390]:[360,768,1440]){
 const context=await browser.newContext({viewport:{width,height:900}});
 await context.addInitScript(()=>{
   window.__vitals={lcp:0,cls:0};
   new PerformanceObserver(list=>{for(const e of list.getEntries())window.__vitals.lcp=e.startTime;}).observe({type:'largest-contentful-paint',buffered:true});
   new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)window.__vitals.cls+=e.value;}).observe({type:'layout-shift',buffered:true});
 });
 const page=await context.newPage();
 await page.route('https://subtle-pothos-f050bf.netlify.app/**',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Existing quiz destination</title>'}));
 page.on('pageerror',error=>errors.push(error.message));
 for(const route of interactionsOnly?['/','/services','/portfolio','/services/wordpress-development','/services/quizzes-calculators','/contact']:Object.keys(pages))for(const lang of ['ru','et','en']){
   const langQuery=lang==='ru'?'':'?lang='+lang;
   const url=base+route+langQuery;
   const response=await page.goto(url,{waitUntil:'load'});assert.equal(response.status(),200);
   assert.equal(await page.locator('html').getAttribute('lang'),lang);
   assert.equal(await page.locator('h1').count(),1);
   assert.ok(await page.locator('h1').isVisible());
   if(lang==='ru'&&!interactionsOnly&&['/','/services','/services/custom-crm-ai','/portfolio','/contact'].includes(route))
     await page.screenshot({path:`output/qa-${route==='/'?'home':route.slice(1).replaceAll('/','-')}-${width}.png`});
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
   assert.ok(overflow<=1,`${width} ${route} ${lang}: horizontal overflow ${overflow}`);
   const metadata=await page.evaluate(()=>({title:document.title,canonical:document.querySelector('link[rel="canonical"]').href,description:document.querySelector('meta[name="description"]').content,vitals:window.__vitals}));
   assert.equal(metadata.canonical,'https://qse-lab.com'+route+(lang==='ru'?'':'?lang='+lang));
   const broken=await page.locator('img').evaluateAll(images=>images.filter(i=>!i.closest('dialog')&&i.loading!=='lazy'&&(!i.complete||!i.naturalWidth)).map(i=>i.src));assert.deepEqual(broken,[]);
   if(route==='/'){
     assert.equal(await page.locator('#portfolio, #contact, dialog, .qse-extras').count(),0);
     assert.equal(await page.locator('.qse-plans + #ai-solutions').count(),1);
     assert.equal(await page.locator('.qse-plan-price').allTextContents().then(prices=>prices.map(p=>p.match(/€\d+/)[0]).join()),'€350,€700,€1500');
     await page.locator('#faq summary').first().click();
     assert.ok(await page.locator('#faq details[open]').count());
     assert.equal(await page.locator('#faq a[href^="/terms"]').count(),0);
     assert.equal(await page.locator('[aria-labelledby="transparency-title"] a').count(),2);
     await page.locator('[data-footer-contact]').click();
     assert.equal(page.url(),base+'/contact'+langQuery);
     await page.goto(url);
     await page.locator('#ai-solutions a').click();
     assert.equal(page.url(),base+'/services'+langQuery);
     await page.goto(url);
     const menu=page.locator('.qse-site-services');
     await menu.locator('summary').click();
     assert.equal(await menu.locator('a:visible').count(),4);
     assert.ok(await menu.locator('.qse-service-menu').evaluate(element=>{
       const rect=element.getBoundingClientRect();
       return rect.left>=0 && rect.right<=innerWidth+1;
     }));
     await page.keyboard.press('Escape');
     assert.ok(!(await menu.locator('.qse-service-menu').isVisible()));
     await menu.locator('summary').click();
     await menu.locator('a[href^="/services/custom-crm-ai"]').click();
     assert.equal(new URL(page.url()).pathname,'/services/custom-crm-ai');
     assert.equal(await page.locator('html').getAttribute('lang'),lang);
     await page.locator('.qse-page-actions--top .qse-page-button--primary').click();
     await page.waitForLoadState('domcontentloaded');
     assert.equal(await page.locator('[name="project_type"]').inputValue(),'crm');
     assert.equal(await page.locator('[data-form-language]').inputValue(),lang.toUpperCase());
     await page.goto(url);
     await page.locator('[data-plan="starter"]').click();
     await page.waitForLoadState('domcontentloaded');
     assert.equal(await page.locator('[name="project_type"]').inputValue(),'starter');
     assert.equal(await page.locator('[name="budget"]').inputValue(),'starter');
   }else if(route==='/services'){
     assert.ok(await page.locator('.qse-extras').isVisible());
     const accent=page.locator('.qse-service-card.qse-accent-quiz');
     for(const selector of ['h2','.qse-page-link'])
       assert.equal(await accent.locator(selector).evaluate(el=>getComputedStyle(el).color),'rgb(167, 139, 250)');
   }else if(route==='/portfolio'){
     assert.equal(await page.locator('.qse-project-card').count(),6);
     const portrait=page.locator('.qse-project-card--consultant img');
     assert.equal(await portrait.evaluate(img=>getComputedStyle(img).objectPosition),'50% 2%');
     if(lang==='ru'&&!interactionsOnly){
       await portrait.scrollIntoViewIfNeeded();
       await portrait.evaluate(img=>img.decode());
       await portrait.screenshot({path:`output/qa-portfolio-portrait-${width}.png`});
     }
     for(const key of ['beauty','consultant','clinic','wordpress']){
       await page.locator(`.qse-project-card--${key} a`).first().click();
       await page.waitForLoadState('domcontentloaded');
       const back=page.locator(key==='wordpress'?'.demo-bar [data-qse-demo-return]':'.qse-demo-navigation a');
       if(key!=='wordpress'){
         assert.equal(await page.locator('.qse-demo-context').count(),0);
         assert.equal(await page.locator('footer a[href^="/portfolio"]').getAttribute('href'),'/portfolio'+langQuery);
       }
       await back.click();
       assert.equal(page.url(),url);
     }
   }else if(route.startsWith('/services/')){
     const video=page.locator('video');
     assert.equal(await video.count(),1);
     if(lang==='en'){
       const source=await video.locator('source').getAttribute('src');
       const segment=await page.request.get(base+source,{headers:{Range:'bytes=0-63'}});
       assert.equal(segment.status(),206);
       assert.equal(segment.headers()['content-type'],'video/mp4');
       assert.equal((await segment.body()).length,64);
       await page.locator('.language-switcher a[data-language="et"]').click();
       assert.equal(new URL(page.url()).pathname,route);
       assert.equal(await page.locator('html').getAttribute('lang'),'et');
     }
     if(route==='/services/wordpress-development'){
       await page.goto(url);
       await page.locator('.qse-page-actions--top a[href^="/demos/"]').click();
       await page.waitForLoadState('domcontentloaded');
       const alternate=page.locator(`.language-switch a[lang="${lang==='ru'?'en':'ru'}"]`);
       await alternate.click();
       await page.waitForLoadState('domcontentloaded');
       await page.locator('.demo-bar [data-qse-demo-return]').click();
       assert.equal(page.url(),url);
     }
     if(route==='/services/quizzes-calculators'){
       await page.goto(url);
       await page.locator('.qse-page-actions--top a[href^="/demos/ai-business-audit/"]').click();
       await page.waitForLoadState('domcontentloaded');
       assert.equal(await page.locator('html').getAttribute('lang'),lang);
       assert.equal(new URL(await page.locator('#quiz').getAttribute('src')).searchParams.get('lang'),lang);
       const back=page.locator('#quiz-back');
       assert.equal(await back.innerText(),{ru:'← Вернуться к услугам',en:'← Back to services',et:'← Tagasi teenuste juurde'}[lang]);
       assert.ok(await back.evaluate(el=>el.getBoundingClientRect().height>=44 && el.getBoundingClientRect().right<=innerWidth));
       await back.click();
       assert.equal(page.url(),url);
     }
   }
   results.push({width,route,lang,...metadata});
 }
 // Check a real language navigation after storage has been set to another language.
 await page.goto(base+'/?lang=en');await page.locator('a[data-language="et"]').click();assert.equal(await page.locator('html').getAttribute('lang'),'et');
 await page.goto(base+'/');assert.equal(await page.locator('html').getAttribute('lang'),'ru');
 await page.goto(base+'/contact?project=starter&lang=en');
 await page.locator('[name="name"]').fill('Local test');
 await page.locator('[name="email"]').fill('local@example.com');
 await page.locator('[name="message"]').fill('Local form submission check');
 let payload;
 await page.route(base+'/thank-you',async route=>{
   if(route.request().method()!=='POST')return route.continue();
   payload=new URLSearchParams(route.request().postData());
   await route.fulfill({status:303,headers:{Location:base+'/thank-you'}});
 },{times:1});
 await Promise.all([page.waitForURL(base+'/thank-you'),page.locator('button[type="submit"]').click()]);
 assert.equal(payload.get('form-name'),'project-request');
 assert.equal(payload.get('project_type'),'starter');
 assert.equal(payload.get('budget'),'starter');
 assert.equal(payload.get('language'),'EN');
 assert.equal(payload.get('email'),'local@example.com');
 assert.equal(await page.locator('html').getAttribute('lang'),'en');
 await context.close();
}
await browser.close();server.close();assert.deepEqual(errors,[],'browser JavaScript errors');
if(!interactionsOnly)fs.writeFileSync('output/qse-browser-check-results.json',JSON.stringify(results,null,2));
console.log(`Browser checks passed: ${results.length} pages at ${interactionsOnly?'390':'360/768/1440'}px, menus, language navigation, project demos, media range and intercepted form submit. No JS errors or horizontal overflow. No message sent.`);
